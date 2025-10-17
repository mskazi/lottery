

import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';


@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTableModule, MatDialogModule, MatIconModule],
})
export class FormComponent implements OnInit {
  rangeForm: FormGroup;

  displayedColumns: string[] = ['index', 'selectedNumber', 'giftNumber', 'parentName', 'giftName'];
  resultTable: any[] = [];
  showGiftAnimation = false;
  animatingRows: any[] = [];

  constructor(private fb: FormBuilder, private dialog: MatDialog) {
    this.rangeForm = this.fb.group({
      startRange: [null, [Validators.required, Validators.min(0)]],
      endRange: [null, [Validators.required, Validators.min(0)]],
      totalGifts: [null, [Validators.required, Validators.min(1)]]
    });

    this.rangeForm.valueChanges.subscribe((values: any) => {
      const start = values.startRange;
      const end = values.endRange;
      const gifts = values.totalGifts;

      // Start Range: cannot be greater than end, must be >= 0
      if (start != null && end != null && start > end) {
        this.rangeForm.get('startRange')?.setErrors({ startGreaterThanEnd: true });
      } else if (start != null && start < 0) {
        this.rangeForm.get('startRange')?.setErrors({ min: true });
      } else {
        const errors = this.rangeForm.get('startRange')?.errors;
        if (errors) {
          delete errors['startGreaterThanEnd'];
          delete errors['min'];
          if (Object.keys(errors).length === 0) this.rangeForm.get('startRange')?.setErrors(null);
        }
      }

      // End Range: cannot be negative, cannot be smaller than start
      if (end != null && start != null && end < start) {
        this.rangeForm.get('endRange')?.setErrors({ endSmallerThanStart: true });
      } else if (end != null && end < 0) {
        this.rangeForm.get('endRange')?.setErrors({ min: true });
      } else {
        const errors = this.rangeForm.get('endRange')?.errors;
        if (errors) {
          delete errors['endSmallerThanStart'];
          delete errors['min'];
          if (Object.keys(errors).length === 0) this.rangeForm.get('endRange')?.setErrors(null);
        }
      }

      // Total Gifts: cannot be negative, cannot be greater than end
      if (gifts != null && end != null && gifts > end) {
        this.rangeForm.get('totalGifts')?.setErrors({ giftsGreaterThanEnd: true });
      } else if (gifts != null && gifts < 0) {
        this.rangeForm.get('totalGifts')?.setErrors({ min: true });
      } else {
        const errors = this.rangeForm.get('totalGifts')?.errors;
        if (errors) {
          delete errors['giftsGreaterThanEnd'];
          delete errors['min'];
          if (Object.keys(errors).length === 0) this.rangeForm.get('totalGifts')?.setErrors(null);
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadResultTable();
  }

  onSubmit() {
    if (this.rangeForm.valid) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          message: 'Are you sure you want to continue?'
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.showGiftAnimation = true;
          this.resultTable = [];
          setTimeout(() => {
            this.showGiftAnimation = false;
            this.executeAssignment();
          }, environment.giftRevealDelayMs);
        }
      });
    }
  }

  executeAssignment() {
    const { startRange, endRange, totalGifts } = this.rangeForm.value;
    // Generate range of numbers
    const numbers: number[] = [];
    for (let i = startRange; i <= endRange; i++) {
      numbers.push(i);
    }
    // Shuffle numbers and pick totalGifts
    const shuffledNumbers = this.shuffleArray(numbers).slice(0, totalGifts);

    // Get gifts from localStorage
    let gifts: { number: number, name: string }[] = [];
    const giftsRaw = localStorage.getItem('gifts');
    if (giftsRaw) {
      gifts = JSON.parse(giftsRaw);
    }
    // Shuffle gifts and pick totalGifts
    const shuffledGifts = this.shuffleArray(gifts).slice(0, totalGifts);

    // Get parents from localStorage
    let parents: { number: string, name: string }[] = [];
    const parentsRaw = localStorage.getItem('parentsList');
    if (parentsRaw) {
      parents = JSON.parse(parentsRaw);
    }

    // Build result
    const resultTable = shuffledNumbers.map((num, idx) => {
      const gift = shuffledGifts[idx];
      const parent = parents.find(p => Number(p.number) === num);
      return {
        index: idx + 1,
        selectedNumber: num,
        giftNumber: gift?.number ?? null,
        parentName: parent ? parent.name : '',
        giftName: gift ? gift.name : ''
      };
    });
    localStorage.setItem('resultTable', JSON.stringify(resultTable));
    this.resultTable = resultTable;
    this.animatingRows = resultTable;
  }

  loadResultTable() {
    const stored = localStorage.getItem('resultTable');
    if (stored) {
      this.resultTable = JSON.parse(stored);
    } else {
      this.resultTable = [];
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    // Fisher-Yates shuffle
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  exportToCSV(): void {
    if (!this.resultTable || !this.resultTable.length) return;
    const header = ['#', 'Selected Number', 'Gift Number', 'Parent Name', 'Gift Name'];
    const rows = this.resultTable.map((row: any) => [
      row.index,
      row.selectedNumber,
      row.giftNumber,
      row.parentName || '',
      row.giftName || ''
    ]);
    const csvContent = [header, ...rows]
      .map((e: any[]) => e.map((v: any) => '"' + String(v).replace(/"/g, '""') + '"').join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lottery-results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
