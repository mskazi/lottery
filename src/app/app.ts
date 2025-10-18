import { CommonModule } from '@angular/common';
import { Component, InjectionToken, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { RouterOutlet, Router } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
@Component({
  selector: 'app-root',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatTabsModule, MatTableModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  tabIndex = 0;
  tabRoutes = ['/form', '/parents', '/gifts'];

  animatedTitle = Array.from('1 Δημοτικό Σχολείο Κηφισιάς');
  private colors = [
    '#e57373', '#f06292', '#ba68c8', '#64b5f6', '#4dd0e1', '#81c784', '#ffd54f', '#ffb74d', '#a1887f', '#90a4ae',
    '#f44336', '#e91e63', '#9c27b0', '#2196f3', '#00bcd4', '#4caf50', '#ffeb3b', '#ff9800', '#795548', '#607d8b'
  ];
  getColorAnim(i: number) {
    // Cycle through 3 different color keyframes for variety
    const anims = ['colorCycle1', 'colorCycle2', 'colorCycle3'];
    const anim = anims[i % anims.length];
    const delay = (i * 0.13 + Math.random() * 0.18).toFixed(2);
    return `${anim} 2.2s ${delay}s infinite alternate`;
  }

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      const idx = this.tabRoutes.findIndex(route => currentRoute.startsWith(route));
      this.tabIndex = idx !== -1 ? idx : 0;
    });
  }

  onTabChange(index: number) {
    this.router.navigate([this.tabRoutes[index]]);
  }
}
