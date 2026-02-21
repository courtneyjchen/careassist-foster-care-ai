import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>

      <div class="main-wrapper">
        <!-- Floating Particles Background -->
        <div class="particle-field" [style.transform]="'translateY(' + scrollOffset + 'px)'">
          <div *ngFor="let p of particles"
               class="particle"
               [style.left.%]="p.x"
               [style.top.%]="p.y"
               [style.width.px]="p.size"
               [style.height.px]="p.size"
               [style.opacity]="p.opacity"
               [style.animation-duration.s]="p.duration"
               [style.animation-delay.s]="p.delay">
          </div>
        </div>

        <!-- Gradient Mesh Blobs -->
        <div class="mesh-bg">
          <div class="blob blob-1" [style.transform]="'translate(' + (scrollOffset * 0.08) + 'px, ' + (scrollOffset * -0.05) + 'px)'"></div>
          <div class="blob blob-2" [style.transform]="'translate(' + (scrollOffset * -0.06) + 'px, ' + (scrollOffset * 0.04) + 'px)'"></div>
          <div class="blob blob-3" [style.transform]="'translate(' + (scrollOffset * 0.04) + 'px, ' + (scrollOffset * 0.07) + 'px)'"></div>
        </div>

        <!-- Grid Pattern Overlay -->
        <div class="grid-overlay" [style.background-position-y.px]="scrollOffset * 0.15"></div>

        <!-- Header -->
        <header class="top-header">
          <div class="header-left">
            <h1 class="greeting">Welcome back, <span class="greeting-name">Samantha</span></h1>
            <p class="greeting-sub">{{ today | date:'EEEE, MMMM d, y' }} · Alameda County DCFS</p>
          </div>
          <div class="header-right">
            <div class="header-stat">
              <span class="material-icons-outlined">notifications_none</span>
              <span class="notif-dot"></span>
            </div>
            <div class="header-stat">
              <span class="material-icons-outlined">help_outline</span>
            </div>
            <div class="header-avatar">ST</div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="main-content" (scroll)="onScroll($event)">
          <router-outlet></router-outlet>

          <!-- Footer -->
          <footer class="app-footer">
            <div class="footer-left">
              <div class="footer-logo">
                <span class="material-icons-outlined">volunteer_activism</span>
                <span class="footer-brand">CareAssist</span>
              </div>
              <span class="footer-copy">&copy; 2026 Berkeley MIDS · Capstone Project</span>
            </div>
            <div class="footer-links">
              <a href="#">Privacy Policy</a>
              <span class="footer-sep">·</span>
              <a href="#">Documentation</a>
              <span class="footer-sep">·</span>
              <a href="#">Support</a>
            </div>
            <div class="footer-right">
              <span class="footer-version">v1.0.0</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      background: linear-gradient(145deg, #f0eeff 0%, #f7f8fc 30%, #eee8ff 60%, #f7f8fc 100%);
    }

    .particle-field {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      will-change: transform;
    }

    .particle {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.08) 70%, transparent 100%);
      animation: particleFloat linear infinite;
    }

    @keyframes particleFloat {
      0%   { transform: translateY(0) scale(1); opacity: var(--p-opacity, 0.3); }
      25%  { transform: translateY(-15px) scale(1.05); }
      50%  { transform: translateY(-8px) scale(0.95); opacity: calc(var(--p-opacity, 0.3) * 1.5); }
      75%  { transform: translateY(-20px) scale(1.02); }
      100% { transform: translateY(0) scale(1); opacity: var(--p-opacity, 0.3); }
    }

    .mesh-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      will-change: transform;
      transition: transform 0.1s linear;
    }

    .blob-1 { width: 500px; height: 500px; background: rgba(102, 126, 234, 0.07); top: -10%; right: -5%; }
    .blob-2 { width: 400px; height: 400px; background: rgba(118, 75, 162, 0.06); bottom: 10%; left: -8%; }
    .blob-3 { width: 300px; height: 300px; background: rgba(192, 132, 252, 0.05); top: 40%; right: 20%; }

    .grid-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background-image:
        linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      will-change: background-position;
    }

    .top-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 28px;
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.55);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(102, 126, 234, 0.08);
    }

    .greeting { font-size: 20px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px; }
    .greeting-name {
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .greeting-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

    .header-right { display: flex; align-items: center; gap: 8px; }
    .header-stat {
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
      border-radius: 10px; cursor: pointer; transition: all var(--transition-fast);
      position: relative; color: var(--text-secondary);
    }
    .header-stat:hover { background: var(--primary-light); color: var(--primary); }
    .header-stat .material-icons-outlined { font-size: 20px; }
    .notif-dot {
      position: absolute; top: 8px; right: 8px; width: 8px; height: 8px;
      background: var(--danger); border-radius: 50%; border: 2px solid white;
    }
    .header-avatar {
      width: 36px; height: 36px; border-radius: 10px; background: var(--gradient-primary);
      color: white; font-weight: 700; font-size: 13px; display: flex; align-items: center;
      justify-content: center; margin-left: 6px; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .main-content { flex: 1; overflow-y: auto; padding: 24px 28px; position: relative; z-index: 1; }

    .app-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 0; margin-top: 40px; border-top: 1px solid rgba(102, 126, 234, 0.1);
      position: relative; z-index: 1;
    }
    .footer-left { display: flex; align-items: center; gap: 16px; }
    .footer-logo { display: flex; align-items: center; gap: 6px; color: var(--primary); }
    .footer-logo .material-icons-outlined { font-size: 18px; }
    .footer-brand {
      font-weight: 700; font-size: 13px;
      background: var(--gradient-primary); -webkit-background-clip: text;
      -webkit-text-fill-color: transparent; background-clip: text;
    }
    .footer-copy { font-size: 12px; color: var(--text-light); }
    .footer-links { display: flex; align-items: center; gap: 6px; }
    .footer-links a { font-size: 12px; color: var(--text-secondary); transition: color var(--transition-fast); }
    .footer-links a:hover { color: var(--primary); }
    .footer-sep { color: var(--text-light); font-size: 10px; }
    .footer-right { display: flex; align-items: center; }
    .footer-version {
      font-size: 11px; color: var(--text-light); padding: 3px 10px;
      background: rgba(102, 126, 234, 0.06); border-radius: var(--radius-full); font-weight: 600;
    }
  `],
})
export class AppComponent {
  title = 'CareAssist';
  today = new Date();
  scrollOffset = 0;

  particles = Array.from({ length: 35 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 18,
    opacity: 0.08 + Math.random() * 0.2,
    duration: 8 + Math.random() * 14,
    delay: Math.random() * -10,
  }));

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.scrollOffset = el.scrollTop * 0.4;
  }
}
