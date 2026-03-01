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
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.scss'],
})
export class ProductDialogComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData
  ) {}

  ngOnInit(): void {
    const p = this.data.product;
    this.form = this.fb.group({
      idInterno: [p?.idInterno ?? null, [Validators.pattern('^[0-9]+$')]],
      nombre: [p?.nombre ?? '', [Validators.required, Validators.minLength(2)]],
      descripcion: [p?.descripcion ?? ''],
      marca: [p?.marca ?? ''],
      cantidad: [p?.cantidad ?? null, [Validators.min(0)]],
      costo: [p?.costo ?? null, [Validators.min(0)]],
      precio: [p?.precio ?? null, [Validators.min(0)]],
    });
  }

  onSave(): void {
    if (this.form.valid) {
      const value = this.form.value;
      // Remove nulls/empty optional fields
      const product: Partial<Product> = { nombre: value.nombre };
      if (value.idInterno !== null && value.idInterno !== '')
        product.idInterno = Number(value.idInterno);
      if (value.descripcion) product.descripcion = value.descripcion;
      if (value.marca) product.marca = value.marca;
      if (value.cantidad !== null && value.cantidad !== '')
        product.cantidad = Number(value.cantidad);
      if (value.costo !== null && value.costo !== '') product.costo = Number(value.costo);
      if (value.precio !== null && value.precio !== '') product.precio = Number(value.precio);
      this.dialogRef.close(product);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
