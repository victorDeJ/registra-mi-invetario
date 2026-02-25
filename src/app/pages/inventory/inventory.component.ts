import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
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
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductDialogComponent } from '../../components/product-dialog/product-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

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
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  products = signal<Product[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  isMobile = signal(window.innerWidth < 768);
  searchOpen = signal(false);

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
    if (!this.isMobile()) this.searchOpen.set(false);
  }

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.products();
    return this.products().filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.marca?.toLowerCase().includes(term) ||
        p.descripcion?.toLowerCase().includes(term),
    );
  });

  displayedColumns: string[] = [
    'nombre',
    'marca',
    'descripcion',
    'costo',
    'precio',
    'margen',
    'acciones',
  ];

  private sub: Subscription | null = null;

  ngOnInit(): void {
    this.sub = this.productService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showSnack('Error al cargar productos', 'error');
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleSearch(): void {
    this.searchOpen.set(!this.searchOpen());
    if (!this.searchOpen()) this.searchTerm.set('');
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

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
            result as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
          );
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
          this.showSnack('🗑️ Producto eliminado', 'success');
        } catch (e) {
          this.showSnack('❌ Error al eliminar producto', 'error');
        }
      }
    });
  }

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

  private showSnack(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
      panelClass: type === 'error' ? ['snack-error'] : ['snack-success'],
      horizontalPosition: 'center',
      verticalPosition: this.isMobile() ? 'bottom' : 'top',
    });
  }
}
