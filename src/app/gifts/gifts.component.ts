
import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';



export interface Gift {
  number: number;
  name: string;
}
@Component({
  selector: 'app-gifts',
  templateUrl: './gifts.component.html',
  styleUrls: ['./gifts.component.scss'],
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule]
})
export class GiftsComponent {

  resetGifts(): void {
    this.dataSource.data = [];
    localStorage.removeItem('gifts');
  }
  displayedColumns: string[] = ['number', 'name'];
  dataSource = new MatTableDataSource<Gift>([]);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  importCSV(): void {
    this.fileInput.nativeElement.click();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const gifts: Gift[] = lines.map(line => {
        const [number, name] = line.split(',');
        return { number: Number(number), name: name?.trim() };
      });
      this.dataSource.data = gifts;
      localStorage.setItem('gifts', JSON.stringify(gifts));
    };
    reader.readAsText(file);
  }

  ngOnInit(): void {
    const saved = localStorage.getItem('gifts');
    if (saved) {
      this.dataSource.data = JSON.parse(saved);
    }
  }
}
