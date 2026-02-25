import { Injectable } from '@angular/core';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly collectionName = 'productos';

  // Obtiene la instancia de Firestore desde la app Firebase ya inicializada
  private get db() {
    return getFirestore(getApp());
  }

  getProducts(): Observable<Product[]> {
    return new Observable<Product[]>((observer) => {
      const colRef = collection(this.db, this.collectionName);
      let unsubscribe: Unsubscribe;

      try {
        unsubscribe = onSnapshot(
          colRef,
          { includeMetadataChanges: false },
          (snapshot) => {
            const products: Product[] = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as Product[];

            // Ordenar por nombre localmente para evitar necesidad de índice
            products.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

            console.log('[ProductService] Productos cargados:', products.length);
            observer.next(products);
          },
          (error) => {
            console.error('[ProductService] Error en onSnapshot:', error);
            observer.error(error);
          },
        );
      } catch (err) {
        console.error('[ProductService] Error creando listener:', err);
        observer.error(err);
      }

      // Cleanup cuando se destruye el componente
      return () => {
        if (unsubscribe) unsubscribe();
      };
    });
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const colRef = collection(this.db, this.collectionName);
    const docRef = await addDoc(colRef, {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[ProductService] Producto guardado con ID:', docRef.id);
  }

  async updateProduct(
    id: string,
    product: Partial<Omit<Product, 'id' | 'createdAt'>>,
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
}
