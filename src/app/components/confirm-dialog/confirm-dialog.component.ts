import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-container">
      <div class="confirm-header">
        <mat-icon class="warn-icon">warning</mat-icon>
        <h2 mat-dialog-title>Eliminar Producto</h2>
      </div>
      <mat-dialog-content>
        <p>
          ¿Estás seguro de que deseas eliminar <strong>{{ data.productName }}</strong
          >?
        </p>
        <p class="warn-text">Esta acción no se puede deshacer.</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()">
          <mat-icon>delete</mat-icon>
          Eliminar
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .confirm-container {
        min-width: 320px;
      }
      .confirm-header {
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #c62828, #e53935);
        margin: -24px -24px 0 -24px;
        padding: 18px 24px;
        border-radius: 4px 4px 0 0;
      }
      .warn-icon {
        color: white;
        font-size: 26px;
        width: 26px;
        height: 26px;
        margin-left: 10px;
        margin-top: 10px;
      }
      h2[mat-dialog-title] {
        color: white;
        margin: 0;
        font-size: 1.2rem;
      }
      mat-dialog-content p {
        margin: 12px 0 0;
        color: #333;
      }
      .warn-text {
        color: #e53935;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { productName: string },
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }
  onCancel(): void {
    this.dialogRef.close(false);
  }
}
