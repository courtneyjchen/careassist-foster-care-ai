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
      <!-- ☀️  Mouse-following SUN -->
      <div class="sun-cursor"
           [style.left.px]="mouseX"
           [style.top.px]="mouseY"
           [style.opacity]="mouseActive ? 1 : 0">
        <svg viewBox="0 0 120 120" class="sun-svg">
          <!-- rays -->
          <g class="sun-rays">
            <line *ngFor="let r of sunRays"
                  [attr.x1]="60 + 32 * cos(r)" [attr.y1]="60 + 32 * sin(r)"
                  [attr.x2]="60 + 52 * cos(r)" [attr.y2]="60 + 52 * sin(r)"
                  stroke="#FFD54F" stroke-width="4" stroke-linecap="round"/>
          </g>
          <!-- face circle -->
          <circle cx="60" cy="60" r="28" fill="#FFD54F" stroke="#FBC02D" stroke-width="3"/>
          <!-- eyes -->
          <circle cx="50" cy="55" r="3.5" fill="#5D4037"/>
          <circle cx="70" cy="55" r="3.5" fill="#5D4037"/>
          <!-- smile -->
          <path d="M48 66 Q60 78 72 66" fill="none" stroke="#5D4037" stroke-width="3" stroke-linecap="round"/>
          <!-- cheeks -->
          <circle cx="44" cy="63" r="4" fill="#FFAB91" opacity="0.6"/>
          <circle cx="76" cy="63" r="4" fill="#FFAB91" opacity="0.6"/>
        </svg>
      </div>

      <!-- 🎨  Child-drawing background scene -->
      <div class="drawing-bg">
        <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" class="drawing-svg">
          <!-- SKY -->
          <rect width="1920" height="1080" fill="#E3F2FD"/>

          <!-- CLOUDS (crayon style — moved down so visible) -->
          <g class="cloud cloud-1">
            <ellipse cx="300" cy="280" rx="80" ry="40" fill="white" stroke="#B0BEC5" stroke-width="2" stroke-dasharray="6 4"/>
            <ellipse cx="340" cy="260" rx="50" ry="30" fill="white" stroke="#B0BEC5" stroke-width="2" stroke-dasharray="6 4"/>
            <ellipse cx="260" cy="265" rx="45" ry="28" fill="white" stroke="#B0BEC5" stroke-width="2" stroke-dasharray="6 4"/>
          </g>
          <g class="cloud cloud-2">
            <ellipse cx="1400" cy="310" rx="90" ry="42" fill="white" stroke="#B0BEC5" stroke-width="2" stroke-dasharray="6 4"/>
            <ellipse cx="1450" cy="288" rx="55" ry="32" fill="white" stroke="#B0BEC5" stroke-width="2" stroke-dasharray="6 4"/>
            <ellipse cx="1360" cy="292" rx="48" ry="30" fill="white" stroke="#B0BEC5" stroke-width="2" stroke-dasharray="6 4"/>
          </g>
          <g class="cloud cloud-3">
            <ellipse cx="800" cy="250" rx="70" ry="35" fill="white" stroke="#B0BEC5" stroke-width="2" stroke-dasharray="6 4"/>
            <ellipse cx="840" cy="232" rx="45" ry="25" fill="white" stroke="#B0BEC5" stroke-width="2" stroke-dasharray="6 4"/>
          </g>

          <!-- BIRDS (V-shapes — moved down so visible) -->
          <path d="M600 360 Q610 350 620 360 Q630 350 640 360" fill="none" stroke="#546E7A" stroke-width="2.5" stroke-linecap="round" class="bird bird-1"/>
          <path d="M1100 320 Q1108 312 1116 320 Q1124 312 1132 320" fill="none" stroke="#546E7A" stroke-width="2" stroke-linecap="round" class="bird bird-2"/>
          <path d="M1600 380 Q1607 373 1614 380 Q1621 373 1628 380" fill="none" stroke="#546E7A" stroke-width="2" stroke-linecap="round" class="bird bird-3"/>

          <!-- HILLS / GROUND -->
          <ellipse cx="500" cy="1080" rx="900" ry="380" fill="#A5D6A7"/>
          <ellipse cx="1500" cy="1080" rx="750" ry="340" fill="#81C784"/>
          <rect x="0" y="880" width="1920" height="200" fill="#66BB6A"/>

          <!-- GRASS TUFTS (crayon scribbles) -->
          <g stroke="#388E3C" stroke-width="2.5" stroke-linecap="round" fill="none">
            <path d="M100 880 Q105 850 110 880"/>
            <path d="M108 880 Q115 845 122 880"/>
            <path d="M250 890 Q256 858 262 890"/>
            <path d="M258 890 Q266 855 274 890"/>
            <path d="M500 878 Q506 848 512 878"/>
            <path d="M508 878 Q516 842 524 878"/>
            <path d="M750 885 Q756 855 762 885"/>
            <path d="M758 885 Q766 850 774 885"/>
            <path d="M1050 882 Q1056 850 1062 882"/>
            <path d="M1350 888 Q1356 858 1362 888"/>
            <path d="M1600 880 Q1606 848 1612 880"/>
            <path d="M1800 885 Q1806 855 1812 885"/>
          </g>

          <!-- SMALL RAINBOW (upper-left, gentle) -->
          <g opacity="0.22">
            <path d="M60 420 C60 220 450 220 450 420" fill="none" stroke="#EF5350" stroke-width="8" stroke-linecap="round"/>
            <path d="M74 420 C74 234 436 234 436 420" fill="none" stroke="#FF9800" stroke-width="8" stroke-linecap="round"/>
            <path d="M88 420 C88 248 422 248 422 420" fill="none" stroke="#FDD835" stroke-width="8" stroke-linecap="round"/>
            <path d="M102 420 C102 262 408 262 408 420" fill="none" stroke="#66BB6A" stroke-width="8" stroke-linecap="round"/>
            <path d="M116 420 C116 276 394 276 394 420" fill="none" stroke="#42A5F5" stroke-width="8" stroke-linecap="round"/>
            <path d="M130 420 C130 290 380 290 380 420" fill="none" stroke="#7E57C2" stroke-width="8" stroke-linecap="round"/>
          </g>

          <!-- TREE (far left) -->
          <rect x="50" y="680" width="30" height="200" rx="6" fill="#8D6E63" stroke="#6D4C41" stroke-width="2"/>
          <circle cx="65" cy="650" r="70" fill="#66BB6A" stroke="#43A047" stroke-width="3" stroke-dasharray="8 5"/>
          <circle cx="30" cy="680" r="50" fill="#81C784" stroke="#43A047" stroke-width="2.5" stroke-dasharray="6 4"/>
          <circle cx="100" cy="675" r="52" fill="#81C784" stroke="#43A047" stroke-width="2.5" stroke-dasharray="6 4"/>
          <!-- apples -->
          <circle cx="40" cy="640" r="8" fill="#EF5350" stroke="#C62828" stroke-width="1.5"/>
          <circle cx="90" cy="660" r="7" fill="#EF5350" stroke="#C62828" stroke-width="1.5"/>

          <!-- TREE (far right) -->
          <rect x="1840" y="700" width="28" height="180" rx="6" fill="#8D6E63" stroke="#6D4C41" stroke-width="2"/>
          <circle cx="1854" cy="670" r="65" fill="#66BB6A" stroke="#43A047" stroke-width="3" stroke-dasharray="8 5"/>
          <circle cx="1820" cy="695" r="48" fill="#81C784" stroke="#43A047" stroke-width="2.5" stroke-dasharray="6 4"/>
          <circle cx="1890" cy="690" r="50" fill="#81C784" stroke="#43A047" stroke-width="2.5" stroke-dasharray="6 4"/>

          <!-- FLOWERS (far left & far right margins only) -->
          <g class="flower">
            <line x1="160" y1="880" x2="160" y2="840" stroke="#388E3C" stroke-width="3"/>
            <circle cx="160" cy="833" r="10" fill="#F48FB1" stroke="#EC407A" stroke-width="2"/>
            <circle cx="160" cy="833" r="4" fill="#FFF176"/>
            <circle cx="151" cy="828" r="4.5" fill="#F48FB1" opacity="0.5"/>
            <circle cx="169" cy="828" r="4.5" fill="#F48FB1" opacity="0.5"/>
            <circle cx="155" cy="839" r="4.5" fill="#F48FB1" opacity="0.5"/>
            <circle cx="165" cy="839" r="4.5" fill="#F48FB1" opacity="0.5"/>
          </g>
          <g class="flower">
            <line x1="310" y1="880" x2="310" y2="843" stroke="#388E3C" stroke-width="3"/>
            <circle cx="310" cy="836" r="9" fill="#CE93D8" stroke="#AB47BC" stroke-width="2"/>
            <circle cx="310" cy="836" r="3.5" fill="#FFF176"/>
            <circle cx="302" cy="831" r="4" fill="#CE93D8" opacity="0.5"/>
            <circle cx="318" cy="831" r="4" fill="#CE93D8" opacity="0.5"/>
            <circle cx="305" cy="842" r="4" fill="#CE93D8" opacity="0.5"/>
            <circle cx="315" cy="842" r="4" fill="#CE93D8" opacity="0.5"/>
          </g>
          <g class="flower">
            <line x1="1640" y1="880" x2="1640" y2="838" stroke="#388E3C" stroke-width="3"/>
            <circle cx="1640" cy="831" r="10" fill="#90CAF9" stroke="#42A5F5" stroke-width="2"/>
            <circle cx="1640" cy="831" r="4" fill="#FFF176"/>
            <circle cx="1631" cy="826" r="4.5" fill="#90CAF9" opacity="0.5"/>
            <circle cx="1649" cy="826" r="4.5" fill="#90CAF9" opacity="0.5"/>
            <circle cx="1635" cy="837" r="4.5" fill="#90CAF9" opacity="0.5"/>
            <circle cx="1645" cy="837" r="4.5" fill="#90CAF9" opacity="0.5"/>
          </g>
          <g class="flower">
            <line x1="1750" y1="880" x2="1750" y2="842" stroke="#388E3C" stroke-width="3"/>
            <circle cx="1750" cy="835" r="9" fill="#FFAB91" stroke="#FF7043" stroke-width="2"/>
            <circle cx="1750" cy="835" r="3.5" fill="#FFF176"/>
            <circle cx="1742" cy="830" r="4" fill="#FFAB91" opacity="0.5"/>
            <circle cx="1758" cy="830" r="4" fill="#FFAB91" opacity="0.5"/>
            <circle cx="1745" cy="841" r="4" fill="#FFAB91" opacity="0.5"/>
            <circle cx="1755" cy="841" r="4" fill="#FFAB91" opacity="0.5"/>
          </g>
          <g class="flower">
            <line x1="460" y1="880" x2="460" y2="845" stroke="#388E3C" stroke-width="3"/>
            <circle cx="460" cy="838" r="8" fill="#FFF176" stroke="#F9A825" stroke-width="2"/>
            <circle cx="460" cy="838" r="3" fill="#FF8A65"/>
            <circle cx="453" cy="834" r="3.5" fill="#FFF176" opacity="0.5"/>
            <circle cx="467" cy="834" r="3.5" fill="#FFF176" opacity="0.5"/>
            <circle cx="456" cy="843" r="3.5" fill="#FFF176" opacity="0.5"/>
            <circle cx="464" cy="843" r="3.5" fill="#FFF176" opacity="0.5"/>
          </g>

          <!-- THREE CHILDREN HOLDING HANDS (far left, feet on ground) -->
          <!-- Child 1 — Girl, light skin, pigtails, pink dress -->
          <g class="family-member family-bounce-1">
            <line x1="230" y1="855" x2="218" y2="878" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="230" y1="855" x2="242" y2="878" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="216" cy="879" rx="6" ry="3" fill="#E91E63"/>
            <ellipse cx="244" cy="879" rx="6" ry="3" fill="#E91E63"/>
            <path d="M218 855 L230 818 L242 855 Z" fill="#F48FB1" stroke="#EC407A" stroke-width="2"/>
            <line x1="230" y1="828" x2="205" y2="840" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="230" y1="828" x2="268" y2="835" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="230" cy="803" r="16" fill="#FFCC80" stroke="#5D4037" stroke-width="2.5"/>
            <path d="M223 808 Q230 815 237 808" fill="none" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
            <circle cx="224" cy="800" r="2" fill="#5D4037"/>
            <circle cx="236" cy="800" r="2" fill="#5D4037"/>
            <!-- pigtails (on sides, above ears) -->
            <circle cx="212" cy="790" r="7" fill="#8D6E63" stroke="#6D4C41" stroke-width="1.5"/>
            <circle cx="248" cy="790" r="7" fill="#8D6E63" stroke="#6D4C41" stroke-width="1.5"/>
            <!-- hair band across top of head only -->
            <path d="M216 794 Q222 783 230 785 Q238 783 244 794" fill="#8D6E63" stroke="none"/>
          </g>

          <!-- Child 2 — Boy, medium-brown skin, short curly hair, blue shirt -->
          <g class="family-member family-bounce-2">
            <line x1="310" y1="855" x2="298" y2="878" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="310" y1="855" x2="322" y2="878" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="296" cy="879" rx="6" ry="3" fill="#1976D2"/>
            <ellipse cx="324" cy="879" rx="6" ry="3" fill="#1976D2"/>
            <rect x="300" y="818" width="20" height="37" rx="4" fill="#42A5F5" stroke="#1E88E5" stroke-width="2"/>
            <line x1="310" y1="828" x2="268" y2="835" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="310" y1="828" x2="348" y2="835" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="310" cy="803" r="16" fill="#C68642" stroke="#5D4037" stroke-width="2.5"/>
            <path d="M303 808 Q310 815 317 808" fill="none" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
            <circle cx="304" cy="800" r="2" fill="#3E2723"/>
            <circle cx="316" cy="800" r="2" fill="#3E2723"/>
            <!-- short curly hair (sits on top of head, above eyes) -->
            <path d="M296 794 Q298 783 306 786 Q310 780 314 786 Q322 783 324 794" fill="#3E2723" stroke="none"/>
            <circle cx="300" cy="787" r="4" fill="#3E2723"/>
            <circle cx="310" cy="783" r="4.5" fill="#3E2723"/>
            <circle cx="320" cy="787" r="4" fill="#3E2723"/>
          </g>

          <!-- Child 3 — Girl, dark-brown skin, braids, purple dress -->
          <g class="family-member family-bounce-3">
            <line x1="390" y1="855" x2="378" y2="878" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="390" y1="855" x2="402" y2="878" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <ellipse cx="376" cy="879" rx="6" ry="3" fill="#7B1FA2"/>
            <ellipse cx="404" cy="879" rx="6" ry="3" fill="#7B1FA2"/>
            <path d="M378 855 L390 818 L402 855 Z" fill="#CE93D8" stroke="#AB47BC" stroke-width="2"/>
            <line x1="390" y1="828" x2="348" y2="835" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="390" y1="828" x2="418" y2="840" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="390" cy="803" r="16" fill="#8D5524" stroke="#5D4037" stroke-width="2.5"/>
            <path d="M383 808 Q390 815 397 808" fill="none" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
            <circle cx="384" cy="800" r="2" fill="#3E2723"/>
            <circle cx="396" cy="800" r="2" fill="#3E2723"/>
            <!-- hair cap on top, sits just above eyes -->
            <path d="M375 797 Q378 784 390 786 Q402 784 405 797" fill="#1B1010" stroke="none"/>
            <line x1="377" y1="798" x2="372" y2="818" stroke="#1B1010" stroke-width="4" stroke-linecap="round"/>
            <line x1="403" y1="798" x2="408" y2="818" stroke="#1B1010" stroke-width="4" stroke-linecap="round"/>
            <circle cx="372" cy="819" r="2.5" fill="#FFF176"/>
            <circle cx="408" cy="819" r="2.5" fill="#FFF176"/>
          </g>

          <!-- Hand-holding connectors -->
          <circle cx="268" cy="835" r="4" fill="#FFCC80" stroke="#5D4037" stroke-width="1.5"/>
          <circle cx="348" cy="835" r="4" fill="#C68642" stroke="#5D4037" stroke-width="1.5"/>

          <!-- Little hearts above children -->
          <g class="hearts">
            <text x="255" y="780" font-size="18" fill="#F48FB1" class="heart heart-1">&#x2665;</text>
            <text x="300" y="772" font-size="14" fill="#CE93D8" class="heart heart-2">&#x2665;</text>
            <text x="345" y="778" font-size="16" fill="#EF9A9A" class="heart heart-3">&#x2665;</text>
          </g>

          <!-- HOUSE (right side) -->
          <rect x="1360" y="720" width="170" height="160" rx="4" fill="#FFCC80" stroke="#F57C00" stroke-width="3"/>
          <polygon points="1345,720 1445,635 1545,720" fill="#EF5350" stroke="#C62828" stroke-width="3" stroke-linejoin="round"/>
          <rect x="1420" y="800" width="48" height="80" rx="4" fill="#8D6E63" stroke="#5D4037" stroke-width="2"/>
          <circle cx="1458" cy="842" r="4" fill="#FFD54F"/>
          <rect x="1375" y="745" width="36" height="36" rx="4" fill="#BBDEFB" stroke="#42A5F5" stroke-width="2"/>
          <line x1="1393" y1="745" x2="1393" y2="781" stroke="#42A5F5" stroke-width="1.5"/>
          <line x1="1375" y1="763" x2="1411" y2="763" stroke="#42A5F5" stroke-width="1.5"/>
          <rect x="1480" y="745" width="36" height="36" rx="4" fill="#BBDEFB" stroke="#42A5F5" stroke-width="2"/>
          <line x1="1498" y1="745" x2="1498" y2="781" stroke="#42A5F5" stroke-width="1.5"/>
          <line x1="1480" y1="763" x2="1516" y2="763" stroke="#42A5F5" stroke-width="1.5"/>
          <rect x="1490" y="650" width="22" height="48" rx="3" fill="#EF5350" stroke="#C62828" stroke-width="2"/>
          <!-- Animated chimney smoke -->
          <g class="chimney-smoke">
            <circle cx="1501" cy="640" r="6" fill="#B0BEC5" opacity="0.4" class="smoke-puff smoke-1"/>
            <circle cx="1505" cy="625" r="8" fill="#B0BEC5" opacity="0.3" class="smoke-puff smoke-2"/>
            <circle cx="1498" cy="608" r="10" fill="#B0BEC5" opacity="0.2" class="smoke-puff smoke-3"/>
            <circle cx="1503" cy="588" r="12" fill="#B0BEC5" opacity="0.15" class="smoke-puff smoke-4"/>
          </g>

          <!-- BUTTERFLY (near children) -->
          <g class="butterfly" transform="translate(170, 810)">
            <ellipse cx="-10" cy="0" rx="10" ry="7" fill="#CE93D8" stroke="#AB47BC" stroke-width="1.5" class="wing-l"/>
            <ellipse cx="10" cy="0" rx="10" ry="7" fill="#FFAB91" stroke="#FF7043" stroke-width="1.5" class="wing-r"/>
            <ellipse cx="0" cy="0" rx="2.5" ry="7" fill="#5D4037"/>
          </g>
        </svg>
      </div>

      <div class="login-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="logo-group">
            <div class="logo-icon">
              <img src="assets/logo-icon.svg" alt="CareAssist" class="login-logo-svg" />
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
              <span class="hero-stat-num">92.1%</span>
              <span class="hero-stat-label">Model Accuracy</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
              <span class="hero-stat-num">92%</span>
              <span class="hero-stat-label">Risk Recall</span>
            </div>
            <div class="hero-stat-sep"></div>
            <div class="hero-stat">
              <span class="hero-stat-num">4</span>
              <span class="hero-stat-label">Ensemble Models</span>
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
          <div class="footer-top">
            <div class="footer-logo">
              <span class="material-icons-outlined">school</span>
              <span>UC Berkeley MIDS · Capstone 2025</span>
            </div>
            <span class="footer-sep">·</span>
            <span>Powered by XGBoost + SHAP Explainability</span>
          </div>
          <div class="footer-credits">Created by: Samantha Townsend, Courtney Chen, Helin Yilmaz, and Priscilla Sio</div>
          <div class="footer-credits">In collaboration with social workers, foster parents, and foster children</div>
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
      background: #E3F2FD;
      color: #2d3748;
      cursor: none;
    }

    /* ── Sun cursor ── */
    .sun-cursor {
      position: fixed;
      width: 120px;
      height: 120px;
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
      will-change: left, top;
      filter: drop-shadow(0 0 30px rgba(255, 213, 79, 0.7))
              drop-shadow(0 0 60px rgba(255, 183, 77, 0.3));
    }

    .sun-svg {
      width: 100%;
      height: 100%;
    }

    .sun-rays {
      animation: sunSpin 12s linear infinite;
      transform-origin: 60px 60px;
    }

    @keyframes sunSpin {
      to { transform: rotate(360deg); }
    }

    /* Light glow around the sun that illuminates the scene */
    .sun-cursor::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 400px;
      height: 400px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 241, 118, 0.25) 0%, rgba(255, 213, 79, 0.10) 40%, transparent 70%);
      pointer-events: none;
      z-index: -1;
    }

    /* ── Child-drawing background ── */
    .drawing-bg {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .drawing-svg {
      width: 100%;
      height: 100%;
    }

    /* Cloud float */
    .cloud-1 { animation: cloudDrift1 35s ease-in-out infinite; }
    .cloud-2 { animation: cloudDrift2 42s ease-in-out infinite; }
    .cloud-3 { animation: cloudDrift3 30s ease-in-out infinite; }

    @keyframes cloudDrift1 {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(80px); }
    }

    @keyframes cloudDrift2 {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(-60px); }
    }

    @keyframes cloudDrift3 {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(50px); }
    }

    /* Bird bob */
    .bird-1 { animation: birdFly1 4s ease-in-out infinite; }
    .bird-2 { animation: birdFly2 3.5s ease-in-out infinite; }
    .bird-3 { animation: birdFly1 4.5s ease-in-out infinite 0.5s; }

    /* Chimney smoke rising */
    .smoke-puff { transform-origin: center; }
    .smoke-1 { animation: smokeRise 3s ease-out infinite; }
    .smoke-2 { animation: smokeRise 3s ease-out infinite 0.6s; }
    .smoke-3 { animation: smokeRise 3s ease-out infinite 1.2s; }
    .smoke-4 { animation: smokeRise 3s ease-out infinite 1.8s; }

    @keyframes smokeRise {
      0%   { transform: translateY(0) scale(1); opacity: 0.4; }
      50%  { transform: translateY(-30px) translateX(8px) scale(1.4); opacity: 0.2; }
      100% { transform: translateY(-60px) translateX(15px) scale(1.8); opacity: 0; }
    }

    @keyframes birdFly1 {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(15px, -8px); }
      50% { transform: translate(30px, 0); }
      75% { transform: translate(15px, 5px); }
    }

    @keyframes birdFly2 {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(-20px, -6px); }
    }

    /* Family bounce */
    .family-bounce-1 { animation: gentleBounce 3s ease-in-out infinite; }
    .family-bounce-2 { animation: gentleBounce 2.5s ease-in-out infinite 0.4s; }
    .family-bounce-3 { animation: gentleBounce 3s ease-in-out infinite 0.8s; }

    @keyframes gentleBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    /* Hearts float */
    .heart-1 { animation: heartFloat 3s ease-in-out infinite; }
    .heart-2 { animation: heartFloat 2.8s ease-in-out infinite 0.5s; }
    .heart-3 { animation: heartFloat 3.2s ease-in-out infinite 1s; }

    @keyframes heartFloat {
      0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
      50% { transform: translateY(-10px) scale(1.15); opacity: 1; }
    }

    /* Butterfly */
    .butterfly {
      animation: butterflyPath 8s ease-in-out infinite;
    }

    .wing-l { animation: wingFlap 0.3s ease-in-out infinite alternate; transform-origin: 0 0; }
    .wing-r { animation: wingFlap 0.3s ease-in-out infinite alternate-reverse; transform-origin: 0 0; }

    @keyframes wingFlap {
      from { transform: scaleY(1); }
      to { transform: scaleY(0.4); }
    }

    @keyframes butterflyPath {
      0%   { transform: translate(170px, 810px) rotate(0deg); }
      25%  { transform: translate(190px, 790px) rotate(5deg); }
      50%  { transform: translate(155px, 800px) rotate(-5deg); }
      75%  { transform: translate(180px, 815px) rotate(3deg); }
      100% { transform: translate(170px, 810px) rotate(0deg); }
    }

    /* ── Container ── */
    .login-container {
      position: relative;
      z-index: 1;
      max-width: 1100px;
      margin: 0 auto;
      padding: 50px 40px 60px;
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
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-logo-svg {
      width: 80px;
      height: 80px;
      filter: drop-shadow(0 8px 32px rgba(124, 58, 237, 0.35));
    }

    .brand {
      font-size: 48px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5a4f9e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 16px;
      color: #8b8fa3;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .hero-tagline {
      font-size: 19px;
      color: #6b7280;
      max-width: 640px;
      margin: 0 auto 32px;
      line-height: 1.6;
    }

    .hero-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 32px;
      padding: 20px 40px;
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 18px;
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
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-stat-label {
      font-size: 16px;
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
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 6px;
      color: #2d3748;
    }

    .section-sub {
      text-align: center;
      font-size: 16px;
      color: #8b8fa3;
      margin-bottom: 32px;
    }

    /* ── Role Grid ── */
    .role-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      max-width: 820px;
      margin: 0 auto;
    }

    .role-card {
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 20px;
      padding: 32px 28px;
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
      width: 58px;
      height: 58px;
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
      font-size: 30px;
      color: white;
    }

    .role-card-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #2d3748;
      position: relative;
      z-index: 1;
    }

    .role-card-desc {
      font-size: 15px;
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
      font-size: 15px;
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
      font-size: 15px;
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
      font-size: 15px;
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
      font-size: 16px;
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
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: auto;
      padding-top: 40px;
      font-size: 16px;
      color: #4a5568;
    }

    .footer-top {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-credits {
      font-size: 13px;
      color: #4a5568;
      text-align: center;
      max-width: 600px;
      line-height: 1.4;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer-logo .material-icons-outlined {
      font-size: 16px;
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
      email: 'jessica.hawkins@careassist.org',
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

  sunRays = [0, 45, 90, 135, 180, 225, 270, 315];

  cos(deg: number): number { return Math.cos(deg * Math.PI / 180); }
  sin(deg: number): number { return Math.sin(deg * Math.PI / 180); }

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
