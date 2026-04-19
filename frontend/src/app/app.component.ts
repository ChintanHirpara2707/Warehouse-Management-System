import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, Renderer2, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly title = 'AnantaWare';
  protected isLightTheme = false;
  protected togglePosition = { x: 18, y: 18 };

  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);
  private dragOffset = { x: 0, y: 0 };
  private isDragging = false;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = window.localStorage.getItem('aw-theme');
    this.isLightTheme = savedTheme === 'light';
    this.loadTogglePosition();
    this.applyTheme();
  }

  protected toggleTheme(): void {
    if (this.isDragging) {
      return;
    }

    this.isLightTheme = !this.isLightTheme;
    this.applyTheme();
  }

  protected startDragging(event: PointerEvent): void {
    const toggleElement = event.currentTarget as HTMLElement | null;
    if (!toggleElement) {
      return;
    }

    this.isDragging = false;
    this.dragOffset = {
      x: event.clientX - this.togglePosition.x,
      y: event.clientY - this.togglePosition.y
    };

    toggleElement.setPointerCapture(event.pointerId);
  }

  protected dragToggle(event: PointerEvent): void {
    const toggleElement = event.currentTarget as HTMLElement | null;
    if (!toggleElement || !toggleElement.hasPointerCapture(event.pointerId)) {
      return;
    }

    const maxX = Math.max(window.innerWidth - toggleElement.offsetWidth, 0);
    const maxY = Math.max(window.innerHeight - toggleElement.offsetHeight, 0);
    const nextX = Math.min(Math.max(event.clientX - this.dragOffset.x, 0), maxX);
    const nextY = Math.min(Math.max(event.clientY - this.dragOffset.y, 0), maxY);

    if (Math.abs(nextX - this.togglePosition.x) > 2 || Math.abs(nextY - this.togglePosition.y) > 2) {
      this.isDragging = true;
    }

    this.togglePosition = { x: nextX, y: nextY };
  }

  protected stopDragging(event: PointerEvent): void {
    const toggleElement = event.currentTarget as HTMLElement | null;
    if (toggleElement?.hasPointerCapture(event.pointerId)) {
      toggleElement.releasePointerCapture(event.pointerId);
    }

    this.saveTogglePosition();

    window.setTimeout(() => {
      this.isDragging = false;
    }, 0);
  }

  private applyTheme(): void {
    const themeName = this.isLightTheme ? 'light' : 'dark';
    const method = this.isLightTheme ? 'addClass' : 'removeClass';

    this.renderer[method](document.body, 'light-theme');
    document.body.setAttribute('data-theme', themeName);
    window.localStorage.setItem('aw-theme', themeName);
  }

  private loadTogglePosition(): void {
    const savedPosition = window.localStorage.getItem('aw-toggle-position');
    if (!savedPosition) {
      return;
    }

    try {
      const parsedPosition = JSON.parse(savedPosition) as { x?: number; y?: number };
      if (typeof parsedPosition.x === 'number' && typeof parsedPosition.y === 'number') {
        this.togglePosition = {
          x: Math.max(parsedPosition.x, 0),
          y: Math.max(parsedPosition.y, 0)
        };
      }
    } catch {
      window.localStorage.removeItem('aw-toggle-position');
    }
  }

  private saveTogglePosition(): void {
    window.localStorage.setItem('aw-toggle-position', JSON.stringify(this.togglePosition));
  }
}
