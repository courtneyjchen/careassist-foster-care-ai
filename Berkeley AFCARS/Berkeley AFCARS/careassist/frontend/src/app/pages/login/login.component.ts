import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface RoleCard {
  role: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  gradient: string;
  email: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page" (mousemove)="onMouseMove($event)">
      <!-- Mouse-following gradient -->
      <div class="mouse-glow"
           [style.left.px]="mouseX"
           [style.top.px]="mouseY"
           [style.opacity]="mouseActive ? 1 : 0">
      </div>

      <!-- Animated Background -->
      <div class="bg-particles">
        <div *ngFor="let p of particles"
             class="bg-particle"
             [style.left.%]="p.x"
             [style.top.%]="p.y"
             [style.width.px]="p.size"
             [style.height.px]="p.size"
             [style.opacity]="p.opacity"
             [style.animation-duration.s]="p.duration"
             [style.animation-delay.s]="p.delay">
        </div>
      </div>

      <div class="bg-mesh">
        <div class="bg-blob bg-blob-1"></div>
        <div class="bg-blob bg-blob-2"></div>
        <div class="bg-blob bg-blob-3"></div>
        <div class="bg-blob bg-blob-4"></div>
      </div>

      <div class="login-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="logo-group">
            <div class="logo-icon">
              <span class="material-icons-outlined">volunteer_activism</span>
            </div>
            <div class="logo-text">
              <h1 class="brand">CareAssist</h1>
              <p class="brand-sub">AI-Powered Foster Care Case Management</p>
            </div>
          </div>

          <p class="hero-tagline">
            Empowering better outcomes for children, families, and communities
            through intelligent case management and predictive analytics.
          </p>

          <div class="hero-stats">
            <div class="hero-stat">
              <span class="hero-stat-num">5.76M+</span>
              <span class="hero-stat-label">Records Analyzed</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
              <span class="hero-stat-num">90.6%</span>
              <span class="hero-stat-label">Model Accuracy</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
              <span class="hero-stat-num">91%</span>
              <span class="hero-stat-label">Risk Recall</span>
            </div>
          </div>
        </div>

        <!-- Role Selection or Login Form -->
        <div class="auth-section" *ngIf="!selectedRole">
          <h2 class="section-title">Select Your Role</h2>
          <p class="section-sub">Choose your role to access your personalized dashboard</p>

          <div class="role-grid">
            <div *ngFor="let card of roleCards"
                 class="role-card"
                 [style.--card-color]="card.color"
                 [style.--card-gradient]="card.gradient"
                 (click)="selectRole(card)">
              <div class="role-card-icon">
                <span class="material-icons-outlined">{{ card.icon }}</span>
              </div>
              <h3 class="role-card-title">{{ card.label }}</h3>
              <p class="role-card-desc">{{ card.description }}</p>
              <div class="role-card-arrow">
                <span class="material-icons-outlined">arrow_forward</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Login Form -->
        <div class="auth-section login-form-section" *ngIf="selectedRole">
          <button class="back-btn" (click)="goBack()">
            <span class="material-icons-outlined">arrow_back</span>
            <span>Back to roles</span>
          </button>

          <div class="login-role-header">
            <div class="login-role-icon" [style.--card-color]="selectedRole.color" [style.--card-gradient]="selectedRole.gradient">
              <span class="material-icons-outlined">{{ selectedRole.icon }}</span>
            </div>
            <div>
              <h2 class="section-title">{{ selectedRole.label }}</h2>
              <p class="section-sub">Sign in to access your dashboard</p>
            </div>
          </div>

          <form class="login-form" (ngSubmit)="onLogin()">
            <div class="form-group">
              <label class="form-label">
                <span class="material-icons-outlined">email</span>
                Email Address
              </label>
              <input
                type="email"
                class="form-input"
                [(ngModel)]="email"
                name="email"
                placeholder="Enter your email"
                [class.error]="loginError"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="material-icons-outlined">lock</span>
                Password
              </label>
              <input
                type="password"
                class="form-input"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter your password"
                [class.error]="loginError"
              />
            </div>

            <div class="login-error" *ngIf="loginError">
              <span class="material-icons-outlined">error_outline</span>
              {{ loginError }}
            </div>

            <button type="submit" class="login-btn" [disabled]="isLoading" [style.--card-gradient]="selectedRole.gradient">
              <span *ngIf="!isLoading">Sign In</span>
              <span *ngIf="isLoading" class="spinner"></span>
            </button>
          </form>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          <div class="footer-logo">
            <span class="material-icons-outlined">school</span>
            <span>UC Berkeley MIDS · Capstone 2025</span>
          </div>
          <span class="footer-sep">·</span>
          <span>Powered by XGBoost + SHAP Explainability</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    .login-page {
      height: 100vh;
      overflow-y: auto;
      position: relative;
      background:
        radial-gradient(ellipse at 20% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 15%, rgba(102, 126, 234, 0.10) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 85%, rgba(167, 139, 250, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 10% 65%, rgba(118, 75, 162, 0.06) 0%, transparent 40%),
        linear-gradient(160deg, #e8e0f5 0%, #ddd5f0 25%, #e2daf2 50%, #dfd6ef 75%, #e5ddf4 100%);
      color: #2d3748;
      cursor: default;
    }

    .mouse-glow {
      position: fixed;
      width: 350px;
      height: 350px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      background: radial-gradient(
        circle,
        rgba(102, 126, 234, 0.20) 0%,
        rgba(139, 92, 246, 0.12) 30%,
        rgba(118, 75, 162, 0.05) 55%,
        transparent 70%
      );
      transition: opacity 0.4s ease;
      will-change: left, top;
      filter: blur(8px);
    }

    /* ── Animated Background ── */
    .bg-particles {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .bg-particle {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, rgba(139, 92, 246, 0.08) 60%, transparent 100%);
      animation: particleDrift linear infinite;
    }

    .bg-particle:nth-child(3n) {
      background: radial-gradient(circle, rgba(167, 139, 250, 0.18) 0%, rgba(118, 75, 162, 0.06) 60%, transparent 100%);
    }

    .bg-particle:nth-child(5n) {
      background: radial-gradient(circle, rgba(192, 132, 252, 0.15) 0%, rgba(102, 126, 234, 0.06) 60%, transparent 100%);
    }

    @keyframes particleDrift {
      0%   { transform: translateY(0) scale(1); }
      25%  { transform: translateY(-20px) scale(1.08); }
      50%  { transform: translateY(-10px) scale(0.92); }
      75%  { transform: translateY(-25px) scale(1.04); }
      100% { transform: translateY(0) scale(1); }
    }

    .bg-mesh {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .bg-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      animation: blobFloat 20s ease-in-out infinite;
    }

    .bg-blob-1 { width: 550px; height: 550px; background: rgba(102, 126, 234, 0.12); top: -12%; right: -8%; animation-delay: 0s; }
    .bg-blob-2 { width: 450px; height: 450px; background: rgba(118, 75, 162, 0.10); bottom: -8%; left: -6%; animation-delay: -5s; }
    .bg-blob-3 { width: 380px; height: 380px; background: rgba(167, 139, 250, 0.10); top: 45%; left: 25%; animation-delay: -10s; }
    .bg-blob-4 { width: 320px; height: 320px; background: rgba(192, 132, 252, 0.08); top: 8%; left: 55%; animation-delay: -15s; }

    @keyframes blobFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -20px) scale(1.05); }
      66% { transform: translate(-20px, 15px) scale(0.95); }
    }

    /* ── Container ── */
    .login-container {
      position: relative;
      z-index: 1;
      max-width: 960px;
      margin: 0 auto;
      padding: 60px 32px 40px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Hero ── */
    .hero-section {
      text-align: center;
      margin-bottom: 48px;
      animation: fadeSlideUp 0.8s ease-out;
    }

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .logo-icon {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.35);
    }

    .logo-icon .material-icons-outlined {
      font-size: 32px;
      color: white;
    }

    .brand {
      font-size: 36px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5a4f9e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 14px;
      color: #8b8fa3;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .hero-tagline {
      font-size: 16px;
      color: #6b7280;
      max-width: 560px;
      margin: 0 auto 28px;
      line-height: 1.6;
    }

    .hero-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 16px 32px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 16px;
      backdrop-filter: blur(12px);
      display: inline-flex;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    }

    .hero-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .hero-stat-num {
      font-size: 22px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-stat-label {
      font-size: 11px;
      color: #8b8fa3;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hero-stat-sep {
      width: 1px;
      height: 32px;
      background: rgba(0, 0, 0, 0.08);
    }

    /* ── Auth Section ── */
    .auth-section {
      animation: fadeSlideUp 0.6s ease-out 0.2s both;
    }

    .section-title {
      font-size: 22px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 4px;
      color: #2d3748;
    }

    .section-sub {
      text-align: center;
      font-size: 14px;
      color: #8b8fa3;
      margin-bottom: 28px;
    }

    /* ── Role Grid ── */
    .role-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      max-width: 700px;
      margin: 0 auto;
    }

    .role-card {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 20px;
      padding: 28px 24px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(12px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .role-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--card-gradient);
      opacity: 0;
      transition: opacity 0.3s;
      border-radius: 20px;
    }

    .role-card:hover {
      border-color: var(--card-color);
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px var(--card-color);
    }

    .role-card:hover::before {
      opacity: 0.06;
    }

    .role-card-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: var(--card-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      position: relative;
      z-index: 1;
    }

    .role-card-icon .material-icons-outlined {
      font-size: 26px;
      color: white;
    }

    .role-card-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #2d3748;
      position: relative;
      z-index: 1;
    }

    .role-card-desc {
      font-size: 13px;
      color: #8b8fa3;
      line-height: 1.5;
      position: relative;
      z-index: 1;
    }

    .role-card-arrow {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: translateX(-8px);
      transition: all 0.3s;
      z-index: 1;
    }

    .role-card-arrow .material-icons-outlined {
      font-size: 18px;
      color: var(--card-color);
    }

    .role-card:hover .role-card-arrow {
      opacity: 1;
      transform: translateX(0);
    }

    /* ── Login Form ── */
    .login-form-section {
      max-width: 460px;
      margin: 0 auto;
      width: 100%;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 10px;
      color: #6b7280;
      padding: 8px 16px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 28px;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.85);
      color: #2d3748;
    }

    .back-btn .material-icons-outlined { font-size: 18px; }

    .login-role-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
      justify-content: center;
    }

    .login-role-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: var(--card-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }

    .login-role-icon .material-icons-outlined {
      font-size: 24px;
      color: white;
    }

    .login-role-header .section-title {
      text-align: left;
      margin-bottom: 0;
    }

    .login-role-header .section-sub {
      text-align: left;
      margin-bottom: 0;
    }

    .login-form {
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 20px;
      padding: 32px;
      backdrop-filter: blur(16px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .form-label .material-icons-outlined {
      font-size: 16px;
      color: #9ca3af;
    }

    .form-input {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      color: #2d3748;
      font-size: 15px;
      font-family: inherit;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
    }

    .form-input::placeholder {
      color: #b0b5c3;
    }

    .form-input:focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    }

    .form-input.error {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.04);
    }

    .login-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.15);
      border-radius: 10px;
      color: #dc2626;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .login-error .material-icons-outlined {
      font-size: 18px;
      color: #ef4444;
    }

    .login-btn {
      width: 100%;
      padding: 16px;
      background: var(--card-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
      border: none;
      border-radius: 14px;
      color: white;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      font-family: inherit;
    }

    .login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
    }

    .login-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .demo-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px 16px;
      background: rgba(102, 126, 234, 0.06);
      border: 1px solid rgba(102, 126, 234, 0.12);
      border-radius: 10px;
      font-size: 12px;
      color: #8b8fa3;
    }

    .demo-hint .material-icons-outlined {
      font-size: 16px;
      color: #667eea;
    }

    .demo-hint strong {
      color: #4a5568;
      font-weight: 600;
    }

    /* ── Footer ── */
    .login-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: auto;
      padding-top: 40px;
      font-size: 12px;
      color: #b0b5c3;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer-logo .material-icons-outlined {
      font-size: 14px;
    }

    .footer-sep {
      color: #d1d5db;
    }

    /* ── Responsive ── */
    @media (max-width: 700px) {
      .role-grid {
        grid-template-columns: 1fr;
      }

      .login-container {
        padding: 40px 20px 30px;
      }

      .hero-stats {
        flex-direction: column;
        gap: 12px;
      }

      .hero-stat-sep {
        width: 32px;
        height: 1px;
      }

      .brand { font-size: 28px; }
    }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loginError = '';
  isLoading = false;
  selectedRole: RoleCard | null = null;

  roleCards: RoleCard[] = [
    {
      role: 'social_worker',
      label: 'Social Worker',
      icon: 'person',
      description: 'Manage caseloads, track child outcomes, view AI-powered risk assessments and recommendations.',
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      email: 'samantha.townsend@careassist.org',
    },
    {
      role: 'supervisor',
      label: 'Supervisor',
      icon: 'supervisor_account',
      description: 'Oversee team performance, review flagged cases, approve permanency plans and case decisions.',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      email: 'james.chen@careassist.org',
    },
    {
      role: 'foster_parent',
      label: 'Foster Parent',
      icon: 'family_restroom',
      description: 'View your foster child\'s progress, access resources, communicate with the case team.',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      email: 'maria.garcia@careassist.org',
    },
    {
      role: 'aged_out_youth',
      label: 'Aged-Out Youth (18+)',
      icon: 'school',
      description: 'Access your transition plan, find housing and employment resources, connect with support services.',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      email: 'jordan.davis@careassist.org',
    },
  ];

  mouseX = 0;
  mouseY = 0;
  mouseActive = false;

  particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 16,
    opacity: 0.05 + Math.random() * 0.15,
    duration: 10 + Math.random() * 18,
    delay: Math.random() * -12,
  }));

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    // If already logged in, redirect
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  onMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    if (!this.mouseActive) {
      this.mouseActive = true;
    }
  }

  selectRole(card: RoleCard): void {
    this.selectedRole = card;
    this.email = card.email;
    this.password = 'demo1234';
    this.loginError = '';
  }

  goBack(): void {
    this.selectedRole = null;
    this.email = '';
    this.password = '';
    this.loginError = '';
  }

  onLogin(): void {
    if (!this.email || !this.password) {
      this.loginError = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading = false;
        this.loginError = err.error?.detail || 'Invalid email or password. Please try again.';
      },
    });
  }
}
