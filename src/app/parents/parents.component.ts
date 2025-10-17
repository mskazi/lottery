import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTableModule, MatIconModule],
  templateUrl: './parents.component.html',
  styleUrls: ['./parents.component.scss']
})
export class ParentsComponent {
  parentsList: Array<{ number: string, name: string }> = [];


  ngOnInit(): void {
    const storedParents = localStorage.getItem('parentsList');
    if (storedParents) {
      this.parentsList = JSON.parse(storedParents);
    }
  }

  onImportParents(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const parents: Array<{ number: string, name: string }> = [];
      for (const line of lines) {
        const [number, name] = line.split(',');
        if (number && name) {
          parents.push({ number: number.trim(), name: name.trim() });
        }
      }
      this.parentsList = parents;
      localStorage.setItem('parentsList', JSON.stringify(parents));
    };
    reader.readAsText(file);
  }
}
