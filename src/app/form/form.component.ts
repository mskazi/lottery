

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
  resetResults(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        message: 'Are you sure you want to reset the lottery results?'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        localStorage.removeItem('resultTable');
        this.resultTable = [];
        this.topParents = [];
      }
    });
  }
  topParents: { winners: string[], count: number }[] = [];
  rangeForm: FormGroup;

  displayedColumns: string[] = ['giftNumber', 'selectedNumber', 'parentName', 'giftName'];
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
        //this.rangeForm.get('totalGifts')?.setErrors({ giftsGreaterThanEnd: true });
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
          message: 'Είσαι σίγουρος ότι θέλεις να συνεχίσεις;'
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
    // Generate range of parent numbers
    const numbers: number[] = [];
    for (let i = startRange; i <= endRange; i++) {
      numbers.push(i);
    }

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

    // Build result: assign all gifts randomly to parents in the range
    let resultTable;
    if (gifts.length === 0) {
      // If no gifts, assign sequential gift numbers (1 to totalGifts), leave gift name blank
      resultTable = Array(totalGifts).fill(0).map((_, idx) => {
        // Pick a random parent number
        const randomParentNumber = numbers[Math.floor(Math.random() * numbers.length)];
        const parent = parents.find(p => Number(p.number) === randomParentNumber);
        return {
          index: idx + 1,
          selectedNumber: randomParentNumber,
          giftNumber: idx + 1,
          parentName: parent ? parent.name : '',
          giftName: ''
        };
      });
    } else {
      // Shuffle parent numbers and pick unique ones for each gift
      const shuffledParentNumbers = this.shuffleArray([...numbers]);
      resultTable = [];
      for (let idx = 0; idx < totalGifts; idx++) {
        // Pick a unique parent number (no repeats until all numbers are used)
        const randomParentNumber = shuffledParentNumbers[idx];
        const parent = parents.find(p => Number(p.number) === randomParentNumber);
        let giftNumber = idx + 1;
        let giftName = '';
        if (idx < shuffledGifts.length) {
          const gift = shuffledGifts[idx];
          giftNumber = typeof gift.number === 'number' && !isNaN(gift.number) ? gift.number : giftNumber;
          giftName = gift.name;
        }
        resultTable.push({
          index: idx + 1,
          selectedNumber: randomParentNumber,
          giftNumber: giftNumber,
          parentName: parent ? parent.name : '',
          giftName: giftName
        });
      }
    }
    // Order by gift number ascending
    resultTable = resultTable.sort((a, b) => {
      if (a.giftNumber == null) return 1;
      if (b.giftNumber == null) return -1;
      return a.giftNumber - b.giftNumber;
    });
    localStorage.setItem('resultTable', JSON.stringify(resultTable));
    this.resultTable = resultTable;
    this.animatingRows = resultTable;

    // Calculate top 3 winners by selectedNumber (use parentName if available, else selectedNumber)
    const winnerGiftCount: Record<string, number> = {};
    resultTable.forEach(row => {
      const winnerKey = row.parentName ? row.parentName : String(row.selectedNumber);
      winnerGiftCount[winnerKey] = (winnerGiftCount[winnerKey] || 0) + 1;
    });
    // Convert to array and sort by count desc
    const sorted = Object.entries(winnerGiftCount).sort((a, b) => b[1] - a[1]);
    // Group by count (so ties are together)
    const groups: { winners: string[], count: number }[] = [];
    let prevCount: number | null = null;
    sorted.forEach(([key, count]) => {
      if (prevCount !== count) {
        groups.push({ winners: [key], count });
        prevCount = count;
      } else {
        groups[groups.length - 1].winners.push(key);
      }
    });
    this.topParents = groups.slice(0, 3);
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
    const header = ['Αριθμός Δώρου', 'Λαχνός', 'Όνομα Γονέα', 'Όνομα Δώρου'];
    const rows = this.resultTable.map((row: any) => [
      row.giftNumber,
      row.selectedNumber,
      row.parentName || '',
      row.giftName || ''
    ]);
    const csvContent = [header, ...rows]
      .map((e: any[]) => e.map((v: any) => String(v)).join(','))
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
