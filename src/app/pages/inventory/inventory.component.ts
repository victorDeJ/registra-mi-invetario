import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { ProductDialogComponent } from '../../components/product-dialog/product-dialog.component';
import { TotalsDialogComponent } from '../../components/totals-dialog/totals-dialog.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatPaginatorModule,
    MatCheckboxModule,
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit {
  protected Math = Math;
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // ── Estado general ──────────────────────────────────────────────────────────
  loading = signal(true);
  isMobile = signal(window.innerWidth < 768);
  searchOpen = signal(false);
  backups = signal<any[]>([]);

  // ── Datos en memoria ─────────────────────────────────────────────────────────
  /** Todos los productos descargados de Firestore (una sola vez). */
  allProducts = signal<Product[]>([]);

  // ── Búsqueda ─────────────────────────────────────────────────────────────────
  searchTerm = signal('');

  // ── Ordenamiento (en memoria, sin consultas extra) ───────────────────────────
  sortProperty = signal<keyof Product>('nombre' as keyof Product);
  sortOrder = signal<'asc' | 'desc' | 'none'>('none');

  // ── Paginación (en memoria) ──────────────────────────────────────────────────
  currentPage = signal(0); // pageIndex base 0 para mat-paginator
  pageSize = 100;

  // ── Computed ─────────────────────────────────────────────────────────────────

  /** Filtra y ordena en memoria según búsqueda y criterio de orden actual. */
  filteredAndSorted = computed(() => {
    let result = this.allProducts();
    const term = this.searchTerm().toLowerCase().trim();

    if (term) {
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.marca?.toLowerCase().includes(term) ||
          p.descripcion?.toLowerCase().includes(term) ||
          p.idInterno?.toString().includes(term)
      );
    }

    // Ordenamiento local (none = sin orden aplicado)
    const prop = this.sortProperty();
    const dir = this.sortOrder();

    if (dir !== 'none') {
      result = [...result].sort((a, b) => {
        const rawA = (a as any)[prop];
        const rawB = (b as any)[prop];

        // Elementos sin valor siempre al final
        const emptyA = rawA === null || rawA === undefined || rawA === '' || rawA === 0;
        const emptyB = rawB === null || rawB === undefined || rawB === '' || rawB === 0;
        if (emptyA && emptyB) return 0;
        if (emptyA) return 1;
        if (emptyB) return -1;

        if (typeof rawA === 'string') {
          return dir === 'asc'
            ? rawA.localeCompare(rawB, 'es')
            : rawB.localeCompare(rawA, 'es');
        }
        return dir === 'asc' ? rawA - rawB : rawB - rawA;
      });
    }

    return result;
  });

  /** Corta la lista para mostrar solo la página actual (máx. 100 en pantalla). */
  pagedProducts = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.filteredAndSorted().slice(start, start + this.pageSize);
  });

  // ── Selección múltiple ────────────────────────────────────────────────────
  selection = new SelectionModel<Product>(true, []);

  displayedColumns: string[] = [
    'select',
    'idInterno',
    'nombre',
    'marca',
    'descripcion',
    'cantidad',
    'costo',
    'precio',
    'margen',
    'acciones',
  ];

  // ── Ciclo de vida ────────────────────────────────────────────────────────────

  async ngOnInit() {
    await this.loadAllProducts();
    this.productService.getBackupRegistry().subscribe({
      next: (b) => this.backups.set(b),
      error: (e) => console.error('[InventoryComponent] Backup registry:', e),
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
    if (!this.isMobile()) this.searchOpen.set(false);
  }

  // ── Selección Múltiple ───────────────────────────────────────────────────────

  isAllSelected(): boolean {
    return (
      this.selection.selected.length === this.pagedProducts().length &&
      this.pagedProducts().length > 0
    );
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.pagedProducts().forEach((p) => this.selection.select(p));
    }
  }

  async deleteSelected(): Promise<void> {
    const count = this.selection.selected.length;
    if (count === 0) return;

    const confirmed = confirm(
      `¿Estás seguro de eliminar los ${count} productos seleccionados? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    this.loading.set(true);
    let errorCount = 0;
    const idsToDelete = this.selection.selected.map((p) => p.id!);

    for (const id of idsToDelete) {
      if (!id) continue;
      try {
        await this.productService.deleteProduct(id);
      } catch (err) {
        console.error(err);
        errorCount++;
      }
    }

    // Actualizar cache local omitiendo los borrados
    this.allProducts.update((prev) => prev.filter((p) => !idsToDelete.includes(p.id!)));
    this.selection.clear();
    this.loading.set(false);

    if (errorCount === 0) {
      this.showSnack(`✅ ${count} productos eliminados`, 'success');
    } else {
      this.showSnack(
        `⚠️ Se eliminaron ${count - errorCount} productos. ${errorCount} fallaron.`,
        'error'
      );
    }
  }

  // ── Carga de datos ───────────────────────────────────────────────────────────

  async loadAllProducts(restorePage = false) {
    this.loading.set(true);
    const savedPage = this.currentPage();
    try {
      const all = await this.productService.getAllProducts();
      this.allProducts.set(all);
      this.currentPage.set(restorePage ? savedPage : 0);
    } catch (err) {
      console.error(err);
      this.showSnack('Error al cargar productos', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Ordenamiento ─────────────────────────────────────────────────────────────

  setSort(property: keyof Product) {
    if (this.sortProperty() === property) {
      // Ciclo: none → asc → desc → none
      const next: Record<string, 'asc' | 'desc' | 'none'> = {
        none: 'asc',
        asc: 'desc',
        desc: 'none',
      };
      this.sortOrder.set(next[this.sortOrder()]);
    } else {
      this.sortProperty.set(property);
      this.sortOrder.set('asc');
    }
    this.currentPage.set(0);
  }

  // ── Paginación ───────────────────────────────────────────────────────────────

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage.set(event.pageIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Búsqueda ─────────────────────────────────────────────────────────────────

  toggleSearch(): void {
    this.searchOpen.set(!this.searchOpen());
    if (!this.searchOpen()) this.searchTerm.set('');
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(0); // volver a la primera página al buscar
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(0);
  }

  // ── Diálogos CRUD ────────────────────────────────────────────────────────────

  openAddDialog(): void {
    const isMob = this.isMobile();
    const ref = this.dialog.open(ProductDialogComponent, {
      data: { mode: 'add' },
      width: isMob ? '100vw' : '500px',
      maxWidth: '100vw',
      maxHeight: isMob ? '100dvh' : '90vh',
      height: isMob ? '100dvh' : 'auto',
      panelClass: isMob ? 'fullscreen-dialog' : '',
    });
    ref.afterClosed().subscribe(async (result: Partial<Product>) => {
      if (result) {
        try {
          await this.productService.addProduct(
            result as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
          );
          await this.loadAllProducts(true); // preservar página actual
          this.showSnack('✅ Producto agregado correctamente', 'success');
        } catch (e) {
          this.showSnack('❌ Error al agregar producto', 'error');
        }
      }
    });
  }

  openEditDialog(product: Product): void {
    const isMob = this.isMobile();
    const ref = this.dialog.open(ProductDialogComponent, {
      data: { mode: 'edit', product },
      width: isMob ? '100vw' : '500px',
      maxWidth: '100vw',
      maxHeight: isMob ? '100dvh' : '90vh',
      height: isMob ? '100dvh' : 'auto',
      panelClass: isMob ? 'fullscreen-dialog' : '',
    });
    ref.afterClosed().subscribe(async (result: Partial<Product>) => {
      if (result && product.id) {
        try {
          await this.productService.updateProduct(product.id, result);
          // Actualizar solo ese producto en memoria para evitar recargar todo
          this.allProducts.update((prev) =>
            prev.map((p) => (p.id === product.id ? { ...p, ...result } : p))
          );
          this.showSnack('✅ Producto actualizado correctamente', 'success');
        } catch (e) {
          this.showSnack('❌ Error al actualizar producto', 'error');
        }
      }
    });
  }

  openDeleteDialog(product: Product): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { productName: product.nombre },
      width: this.isMobile() ? '90vw' : '380px',
    });
    ref.afterClosed().subscribe(async (confirmed: boolean) => {
      if (confirmed && product.id) {
        try {
          await this.productService.deleteProduct(product.id);
          // Quitar de memoria sin recargar todo
          this.allProducts.update((prev) => prev.filter((p) => p.id !== product.id));
          this.showSnack('🗑️ Producto eliminado', 'success');
        } catch (e) {
          this.showSnack('❌ Error al eliminar producto', 'error');
        }
      }
    });
  }

  openTotalsDialog(): void {
    const isMob = this.isMobile();
    this.dialog.open(TotalsDialogComponent, {
      data: { products: this.allProducts() },
      width: isMob ? '100vw' : '600px',
      maxWidth: '100vw',
      maxHeight: isMob ? '100dvh' : '90vh',
      panelClass: isMob ? 'fullscreen-dialog' : '',
    });
  }

  // ── Utilidades ───────────────────────────────────────────────────────────────

  calcMargen(costo?: number, precio?: number): number | null {
    if (costo && precio && costo > 0) {
      return Math.round(((precio - costo) / costo) * 100);
    }
    return null;
  }

  formatCurrency(value?: number): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(value);
  }

  downloadCSV(): void {
    const data = [...this.filteredAndSorted()];
    if (!data.length) {
      this.showSnack('No hay datos para exportar', 'error');
      return;
    }

    const headers = ['idInterno', 'nombre', 'descripcion', 'marca', 'cantidad', 'costo', 'precio'];
    let csvContent = headers.join(',') + '\r\n';

    data.forEach((p) => {
      const row = headers.map((header) => {
        let val = (p as any)[header];
        if (val === null || val === undefined) val = '';
        let valStr = String(val);
        if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n')) {
          valStr = '"' + valStr.replace(/"/g, '""') + '"';
        }
        return valStr;
      });
      csvContent += row.join(',') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showSnack('Descarga iniciada', 'success');
  }

  async onImportFile(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      this.showSnack('❌ Por favor selecciona un archivo JSON', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const content = e.target.result;
        const products = JSON.parse(content);

        if (!Array.isArray(products)) {
          this.showSnack('❌ El formato del JSON debe ser un array', 'error');
          return;
        }

        this.loading.set(true);
        this.showSnack('📦 Respaldando, limpiando e importando datos...', 'success');

        const backupName = await this.productService.backupCollection();
        await this.productService.clearCollection();
        await this.productService.importProducts(products);

        this.showSnack(`✅ Importación completada. Respaldo: ${backupName}`, 'success');
        await this.loadAllProducts();
      } catch (err) {
        console.error('[InventoryComponent] Error al importar:', err);
        this.showSnack('❌ Error al procesar el archivo o subir a base de datos', 'error');
      } finally {
        this.loading.set(false);
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      this.showSnack('❌ Error al leer el archivo', 'error');
      this.loading.set(false);
    };
    reader.readAsText(file);
  }

  private showSnack(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'center',
      verticalPosition: this.isMobile() ? 'bottom' : 'top',
    });
  }
}
