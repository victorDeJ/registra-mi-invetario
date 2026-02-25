import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';

export interface ProductDialogData {
  product?: Product;
  mode: 'add' | 'edit';
}

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon class="dialog-icon">
          {{ data.mode === 'add' ? 'add_box' : 'edit' }}
        </mat-icon>
        <h2 mat-dialog-title>
          {{ data.mode === 'add' ? 'Agregar Producto' : 'Editar Producto' }}
        </h2>
        <span class="header-spacer"></span>
        <button mat-icon-button class="close-btn" 
        (click)="onCancel()" 
        aria-label="Cerrar"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="product-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre *</mat-label>
            <input
              matInput
              formControlName="nombre"
              placeholder="Ej: Martillo de carpintero"
              autocomplete="off"
            />
            <mat-icon matSuffix>inventory_2</mat-icon>
            <mat-error *ngIf="form.get('nombre')?.hasError('required')">
              El nombre es obligatorio
            </mat-error>
            <mat-error *ngIf="form.get('nombre')?.hasError('minlength')">
              Mínimo 2 caracteres
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción</mat-label>
            <textarea
              matInput
              formControlName="descripcion"
              rows="2"
              placeholder="Descripción del producto (opcional)"
            ></textarea>
            <mat-icon matSuffix>description</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Marca</mat-label>
            <input
              matInput
              formControlName="marca"
              placeholder="Ej: Stanley, Black&Decker"
              autocomplete="off"
            />
            <mat-icon matSuffix>label</mat-icon>
          </mat-form-field>

          <div class="section-label">Precios (opcionales)</div>

          <div class="price-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Costo</mat-label>
              <input
                matInput
                type="number"
                formControlName="costo"
                placeholder="0.00"
                min="0"
                inputmode="decimal"
              />
              <span matTextPrefix>$&nbsp;</span>
              <mat-error *ngIf="form.get('costo')?.hasError('min')">Valor inválido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Precio venta</mat-label>
              <input
                matInput
                type="number"
                formControlName="precio"
                placeholder="0.00"
                min="0"
                inputmode="decimal"
              />
              <span matTextPrefix>$&nbsp;</span>
              <mat-error *ngIf="form.get('precio')?.hasError('min')">Valor inválido</mat-error>
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button (click)="onCancel()" class="cancel-btn">Cancelar</button>
        <button
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="form.invalid"
          class="save-btn"
        >
          <mat-icon>{{ data.mode === 'add' ? 'add' : 'save' }}</mat-icon>
          {{ data.mode === 'add' ? 'Agregar' : 'Guardar cambios' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        min-width: 360px;
        display: flex;
        flex-direction: column;
      }

      /* ── Header ── */
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
        margin: -24px -24px 0 -24px;
        padding: 20px 24px;
        border-radius: 4px 4px 0 0;
        flex-shrink: 0;
      }

      .header-spacer {
        flex: 1;
      }

      .dialog-icon {
        color: white;
        font-size: 24px;
        width: 24px;
        height: 24px;
        margin-left: 10px;
        margin-top: 10px;
      }

      .close-btn {
        color: rgba(255, 255, 255, 0.85) !important;
        width: 36px !important;
        height: 36px !important;
        margin-right: 5px;
        margin-top: 8px;
      }

      h2[mat-dialog-title] {
        color: white;
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }

      /* ── Form ── */
      mat-dialog-content {
        padding-bottom: 4px !important;
        overflow-y: auto;
      }

      .product-form {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 14px;
      }

      .full-width {
        width: 100%;
      }

      .section-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin: 6px 0 4px;
      }

      .price-row {
        display: flex;
        gap: 12px;
      }

      .half-width {
        flex: 1;
      }

      /* ── Actions ── */
      .dialog-actions {
        flex-shrink: 0;
        display: flex !important;
        justify-content: flex-end;
        gap: 12px;
        padding: 14px 24px 18px !important;
        border-top: 1px solid #eee;
      }

      .cancel-btn {
        color: #555;
        border-color: #ccc !important;
      }

      .save-btn {
        font-weight: 600;
        flex: 1;
      }

      /* ── Mobile ── */
      @media (max-width: 480px) {
        .dialog-container {
          min-width: unset;
          width: 100%;
        }
        .price-row {
          flex-direction: column;
          gap: 0;
        }
        .half-width {
          width: 100%;
        }
        .save-btn {
          min-width: 140px;
        }
        mat-dialog-content {
          max-height: none;
        }
      }
    `,
  ],
})
export class ProductDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData,
  ) {}

  ngOnInit(): void {
    const p = this.data.product;
    this.form = this.fb.group({
      nombre: [p?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
      descripcion: [p?.descripcion ?? ''],
      marca: [p?.marca ?? ''],
      costo: [p?.costo ?? null, [Validators.min(0)]],
      precio: [p?.precio ?? null, [Validators.min(0)]],
    });
  }

  onSave(): void {
    if (this.form.valid) {
      const value = this.form.value;
      // Remove nulls/empty optional fields
      const product: Partial<Product> = { nombre: value.nombre };
      if (value.descripcion) product.descripcion = value.descripcion;
      if (value.marca) product.marca = value.marca;
      if (value.costo !== null && value.costo !== '') product.costo = Number(value.costo);
      if (value.precio !== null && value.precio !== '') product.precio = Number(value.precio);
      this.dialogRef.close(product);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
