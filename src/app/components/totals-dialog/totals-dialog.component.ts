import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Product } from '../../models/product.model';

export interface TotalsDialogData {
  products: Product[];
}

interface TotalsResult {
  totalProductos: number;
  totalUnidades: number;
  totalCostos: number;
  totalVentas: number;
  gananciaEstimada: number;
  margenPromedio: number | null;
  productosConPrecio: number;
  productosConCosto: number;
}

@Component({
  selector: 'app-totals-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <div class="totals-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-icon-wrap">
          <mat-icon class="header-icon">assessment</mat-icon>
        </div>
        <div class="header-text">
          <h2 class="header-title">Resumen del Inventario</h2>
          <p class="header-subtitle">Totales calculados sobre {{ totals.totalProductos }} productos</p>
        </div>
        <button mat-icon-button class="close-btn" (click)="close()" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Cards de totales -->
      <div class="totals-content">

        <!-- Fila 1: Unidades y productos -->
        <div class="totals-row">
          <div class="total-card card-neutral">
            <div class="card-icon-wrap neutral-icon">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <div class="card-body">
              <span class="card-label">Total de productos</span>
              <span class="card-value">{{ totals.totalProductos }}</span>
            </div>
          </div>
          <div class="total-card card-neutral">
            <div class="card-icon-wrap neutral-icon">
              <mat-icon>stacked_bar_chart</mat-icon>
            </div>
            <div class="card-body">
              <span class="card-label">Total de unidades</span>
              <span class="card-value">{{ totals.totalUnidades }}</span>
            </div>
          </div>
        </div>

        <!-- Fila 2: Costos y ventas (los protagonistas) -->
        <div class="totals-row">
          <div class="total-card card-cost">
            <div class="card-icon-wrap cost-icon">
              <mat-icon>price_check</mat-icon>
            </div>
            <div class="card-body">
              <span class="card-label">Total en Costos</span>
              <span class="card-value cost-amount">{{ fmt(totals.totalCostos) }}</span>
              <span class="card-sub">{{ totals.productosConCosto }} productos con costo</span>
            </div>
          </div>
          <div class="total-card card-sales">
            <div class="card-icon-wrap sales-icon">
              <mat-icon>sell</mat-icon>
            </div>
            <div class="card-body">
              <span class="card-label">Total en Ventas</span>
              <span class="card-value sales-amount">{{ fmt(totals.totalVentas) }}</span>
              <span class="card-sub">{{ totals.productosConPrecio }} productos con precio</span>
            </div>
          </div>
        </div>

        <!-- Fila 3: Ganancia y margen -->
        <div class="totals-row">
          <div class="total-card card-profit" [class.loss]="totals.gananciaEstimada < 0">
            <div class="card-icon-wrap profit-icon">
              <mat-icon>{{ totals.gananciaEstimada >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
            </div>
            <div class="card-body">
              <span class="card-label">Ganancia Estimada</span>
              <span class="card-value profit-amount" [class.negative]="totals.gananciaEstimada < 0">
                {{ fmt(totals.gananciaEstimada) }}
              </span>
              <span class="card-sub">ventas − costos</span>
            </div>
          </div>
          <div class="total-card card-margin" *ngIf="totals.margenPromedio !== null">
            <div class="card-icon-wrap margin-icon">
              <mat-icon>percent</mat-icon>
            </div>
            <div class="card-body">
              <span class="card-label">Margen Promedio</span>
              <span class="card-value" [class.margen-positive]="totals.margenPromedio! > 0"
                                      [class.margen-negative]="totals.margenPromedio! <= 0">
                {{ totals.margenPromedio }}%
              </span>
              <span class="card-sub">sobre productos con costo y precio</span>
            </div>
          </div>
        </div>

      </div>

      <mat-divider></mat-divider>

      <!-- Footer -->
      <div class="dialog-footer">
        <span class="footer-note">
          <mat-icon>info_outline</mat-icon>
          Cálculo: cantidad × costo / precio por producto
        </span>
        <button mat-flat-button class="close-action-btn" (click)="close()" id="btn-totals-close">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .totals-dialog {
      display: flex;
      flex-direction: column;
      min-width: 340px;
      max-width: 640px;
      font-family: 'Inter', 'Roboto', sans-serif;
    }

    /* ── Header ── */
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 20px 16px;
    }

    .header-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #1565C0, #1976D2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(21,101,192,0.35);
    }

    .header-icon {
      color: white;
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    .header-text { flex: 1; }

    .header-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #1a202c;
      line-height: 1.2;
    }

    .header-subtitle {
      margin: 3px 0 0;
      font-size: 0.8rem;
      color: #718096;
    }

    .close-btn {
      color: #718096 !important;
      flex-shrink: 0;
    }

    /* ── Content ── */
    .totals-content {
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .totals-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    /* ── Cards ── */
    .total-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 14px;
      border: 1.5px solid transparent;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .total-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }

    .card-neutral {
      background: #f7faff;
      border-color: #e2e8f0;
    }

    .card-cost {
      background: #fafafa;
      border-color: #e0e0e0;
    }

    .card-sales {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .card-profit {
      background: #f0fdf4;
      border-color: #86efac;
    }

    .card-profit.loss {
      background: #fff5f5;
      border-color: #feb2b2;
    }

    .card-margin {
      background: #fffbeb;
      border-color: #fde68a;
    }

    /* ── Icon wraps ── */
    .card-icon-wrap {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: white;
      }
    }

    .neutral-icon { background: linear-gradient(135deg, #64748b, #94a3b8); }
    .cost-icon    { background: linear-gradient(135deg, #455a64, #607d8b); }
    .sales-icon   { background: linear-gradient(135deg, #16a34a, #22c55e); }
    .profit-icon  { background: linear-gradient(135deg, #1565C0, #1976D2); }
    .margin-icon  { background: linear-gradient(135deg, #d97706, #f59e0b); }

    .card-profit.loss .profit-icon { background: linear-gradient(135deg, #c53030, #e53e3e); }

    /* ── Card body ── */
    .card-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .card-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #718096;
      white-space: nowrap;
    }

    .card-value {
      font-size: 1.05rem;
      font-weight: 800;
      color: #1a202c;
      line-height: 1.2;
      word-break: break-all;
    }

    .cost-amount  { color: #455a64; }
    .sales-amount { color: #15803d; }
    .profit-amount { color: #1565C0; }
    .profit-amount.negative { color: #c53030; }

    .margen-positive { color: #15803d; }
    .margen-negative { color: #c53030; }

    .card-sub {
      font-size: 0.7rem;
      color: #a0aec0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ── Footer ── */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      gap: 12px;
    }

    .footer-note {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.75rem;
      color: #a0aec0;

      mat-icon {
        font-size: 15px;
        width: 15px;
        height: 15px;
      }
    }

    .close-action-btn {
      background: linear-gradient(135deg, #1565C0, #1976D2) !important;
      color: white !important;
      border-radius: 20px !important;
      padding: 0 24px !important;
      font-weight: 600 !important;
    }

    /* ── Responsive ── */
    @media (max-width: 480px) {
      .totals-dialog { min-width: unset; }

      .totals-row {
        grid-template-columns: 1fr;
      }

      .header-title { font-size: 1rem; }
    }
  `],
})
export class TotalsDialogComponent {
  totals: TotalsResult;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TotalsDialogData,
    private dialogRef: MatDialogRef<TotalsDialogComponent>
  ) {
    this.totals = this.calcTotals(data.products);
  }

  private calcTotals(products: Product[]): TotalsResult {
    let totalUnidades = 0;
    let totalCostos = 0;
    let totalVentas = 0;
    let productosConCosto = 0;
    let productosConPrecio = 0;
    let sumMargen = 0;
    let countMargen = 0;

    for (const p of products) {
      const qty = p.cantidad ?? 0;
      totalUnidades += qty;

      if (p.costo != null && p.costo > 0) {
        totalCostos += p.costo * qty;
        productosConCosto++;
      }

      if (p.precio != null && p.precio > 0) {
        totalVentas += p.precio * qty;
        productosConPrecio++;
      }

      if (p.costo != null && p.costo > 0 && p.precio != null && p.precio > 0) {
        sumMargen += ((p.precio - p.costo) / p.costo) * 100;
        countMargen++;
      }
    }

    return {
      totalProductos: products.length,
      totalUnidades,
      totalCostos,
      totalVentas,
      gananciaEstimada: totalVentas - totalCostos,
      margenPromedio: countMargen > 0 ? Math.round(sumMargen / countMargen) : null,
      productosConPrecio,
      productosConCosto,
    };
  }

  fmt(value: number): string {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(value);
  }

  close(): void {
    this.dialogRef.close();
  }
}
