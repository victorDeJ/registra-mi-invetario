import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  query,
  onSnapshot,
  where,
  orderBy,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly collectionName = 'productos';

  private get db() {
    return getFirestore(getApp());
  }

  /** Descarga TODA la colección de una vez. La paginación y el ordenamiento se hacen en memoria. */
  async getAllProducts(): Promise<Product[]> {
    const colRef = collection(this.db, this.collectionName);
    const snapshot = await getDocs(query(colRef));
    const products = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as Product[];
    console.log(`[ProductService] ${products.length} productos cargados.`);
    return products;
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const colRef = collection(this.db, this.collectionName);
    await addDoc(colRef, {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async updateProduct(
    id: string,
    product: Partial<Omit<Product, 'id' | 'createdAt'>>
  ): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await updateDoc(docRef, {
      ...product,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    const docRef = doc(this.db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async backupCollection(): Promise<string> {
    const backupName = `respaldo_${Date.now()}`;
    const colRef = collection(this.db, this.collectionName);
    const snapshot = await getDocs(query(colRef));

    if (snapshot.empty) return backupName;

    const backupColRef = collection(this.db, backupName);
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += 500) {
      const batch = writeBatch(this.db);
      docs.slice(i, i + 500).forEach((d) => {
        batch.set(doc(backupColRef), d.data());
      });
      await batch.commit();
    }

    try {
      await addDoc(collection(this.db, 'backup_registry'), {
        name: backupName,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error('[ProductService] Error registrando respaldo:', e);
    }

    return backupName;
  }

  getBackupRegistry(): Observable<any[]> {
    return new Observable((observer) => {
      const colRef = collection(this.db, 'backup_registry');
      const unsubscribe = onSnapshot(
        query(colRef, orderBy('timestamp', 'desc')),
        (snapshot) => {
          observer.next(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => observer.error(error)
      );
      return () => unsubscribe();
    });
  }

  async clearCollection(): Promise<void> {
    const colRef = collection(this.db, this.collectionName);
    const snapshot = await getDocs(query(colRef));
    for (let i = 0; i < snapshot.docs.length; i += 500) {
      const batch = writeBatch(this.db);
      snapshot.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  async deleteCollectionByName(name: string): Promise<void> {
    const colRef = collection(this.db, name);
    const snapshot = await getDocs(query(colRef));
    for (let i = 0; i < snapshot.docs.length; i += 500) {
      const batch = writeBatch(this.db);
      snapshot.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    try {
      const regRef = collection(this.db, 'backup_registry');
      const regSnap = await getDocs(query(regRef, where('name', '==', name)));
      const batch = writeBatch(this.db);
      regSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error('[ProductService] Error eliminando del registro:', e);
    }
  }

  async importProducts(products: any[]): Promise<void> {
    const colRef = collection(this.db, this.collectionName);
    for (let i = 0; i < products.length; i += 500) {
      const batch = writeBatch(this.db);
      products.slice(i, i + 500).forEach((p) => {
        if (!p || typeof p !== 'object' || !p.nombre) return;
        batch.set(doc(colRef), {
          idInterno: Number(p.idInterno) || 0,
          nombre: String(p.nombre).trim(),
          descripcion: String(p.descripcion || '').trim(),
          marca: String(p.marca || '').trim(),
          cantidad: Number(p.cantidad) || 0,
          costo: Number(p.costo) || 0,
          precio: Number(p.precio) || 0,
          createdAt: p.createdAt ? new Date(p.createdAt) : serverTimestamp(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : serverTimestamp(),
        });
      });
      await batch.commit();
    }
    console.log(`[ProductService] ${products.length} productos importados.`);
  }
}
