import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FosterParentService, FosterChild } from '../../services/foster-parent.service';

@Component({
  selector: 'app-foster-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="foster-dash">
      <!-- Header -->
      <div class="dash-header animate-in">
        <div>
          <h2>My Children</h2>
          <p class="subtitle">Track progress, upload documents, and stay connected</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats stagger">
        <div class="qs-card animate-in">
          <div class="qs-icon" style="background: var(--gradient-primary)">
            <span class="material-icons-outlined">family_restroom</span>
          </div>
          <div class="qs-info">
            <span class="qs-label">Children in Care</span>
            <span class="qs-value">{{ children.length }}</span>
          </div>
        </div>
        <div class="qs-card animate-in">
          <div class="qs-icon" style="background: var(--gradient-success)">
            <span class="material-icons-outlined">description</span>
          </div>
          <div class="qs-info">
            <span class="qs-label">Documents</span>
            <span class="qs-value">{{ docCount }}</span>
          </div>
        </div>
        <div class="qs-card animate-in">
          <div class="qs-icon" style="background: var(--gradient-warning)">
            <span class="material-icons-outlined">event</span>
          </div>
          <div class="qs-info">
            <span class="qs-label">Upcoming Events</span>
            <span class="qs-value">{{ upcomingCount }}</span>
          </div>
        </div>
        <div class="qs-card animate-in">
          <div class="qs-icon" style="background: var(--gradient-info)">
            <span class="material-icons-outlined">chat_bubble_outline</span>
          </div>
          <div class="qs-info">
            <span class="qs-label">Messages</span>
            <span class="qs-value">3</span>
          </div>
        </div>
      </div>

      <!-- Children Cards -->
      <div class="section-header animate-in">
        <h3>Children in Your Care</h3>
      </div>

      <!-- Search -->
      <div class="search-bar animate-in">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search children..." class="search-input" />
        <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <div class="children-grid stagger" *ngIf="getFilteredChildren().length > 0">
        <div class="child-card animate-in" *ngFor="let child of getFilteredChildren(); let i = index"
             (click)="selectedChild = child">
          <div class="child-card-top" [style.background]="childColors[i % childColors.length]">
            <div class="child-avatar-lg">{{ getInitials(child) }}</div>
            <div class="child-name-block">
              <span class="child-name">{{ child.first_name }} {{ child.last_name }}</span>
              <span class="child-age">Age {{ getAge(child.date_of_birth) }} · {{ child.gender }}</span>
            </div>
          </div>
          <div class="child-card-body">
            <div class="child-detail-row">
              <span class="material-icons-outlined">home</span>
              <span>{{ child.placement_type || 'Foster Home' }}</span>
            </div>
            <div class="child-detail-row">
              <span class="material-icons-outlined">flag</span>
              <span>Goal: {{ child.permanency_goal || 'N/A' }}</span>
            </div>
            <div class="child-detail-row">
              <span class="material-icons-outlined">schedule</span>
              <span>{{ child.months_in_care }} months in care</span>
            </div>
            <div class="child-needs" *ngIf="child.has_medical_needs || child.has_behavioral_needs || child.has_disability">
              <span class="need-tag medical" *ngIf="child.has_medical_needs">
                <span class="material-icons-outlined">medical_services</span> Medical
              </span>
              <span class="need-tag behavioral" *ngIf="child.has_behavioral_needs">
                <span class="material-icons-outlined">psychology</span> Behavioral
              </span>
              <span class="need-tag disability" *ngIf="child.has_disability">
                <span class="material-icons-outlined">accessible</span> Disability
              </span>
            </div>
            <div class="child-actions">
              <a [routerLink]="['/files']" class="child-action-btn">
                <span class="material-icons-outlined">upload_file</span>
                Upload Document
              </a>
              <a [routerLink]="['/messages']" class="child-action-btn secondary">
                <span class="material-icons-outlined">chat</span>
                Message Social Worker
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="loading">
        <span class="material-icons-outlined spin">autorenew</span>
        <p>Loading your children...</p>
      </div>

      <!-- Selected Child Detail Panel -->
      <div class="detail-panel animate-in" *ngIf="selectedChild">
        <div class="dp-header">
          <h3>{{ selectedChild.first_name }} {{ selectedChild.last_name }}</h3>
          <button class="dp-close" (click)="selectedChild = null">
            <span class="material-icons-outlined">close</span>
          </button>
        </div>
        <div class="dp-body">
          <div class="dp-section">
            <h4>Personal Information</h4>
            <div class="dp-grid">
              <div class="dp-item">
                <span class="dp-label">Date of Birth</span>
                <span class="dp-value">{{ selectedChild.date_of_birth }}</span>
              </div>
              <div class="dp-item">
                <span class="dp-label">Gender</span>
                <span class="dp-value">{{ selectedChild.gender }}</span>
              </div>
              <div class="dp-item">
                <span class="dp-label">Ethnicity</span>
                <span class="dp-value">{{ selectedChild.ethnicity }}</span>
              </div>
              <div class="dp-item">
                <span class="dp-label">Case Number</span>
                <span class="dp-value">{{ selectedChild.case_number }}</span>
              </div>
            </div>
          </div>

          <div class="dp-section">
            <h4>Placement Details</h4>
            <div class="dp-grid">
              <div class="dp-item">
                <span class="dp-label">Placement Type</span>
                <span class="dp-value">{{ selectedChild.placement_type }}</span>
              </div>
              <div class="dp-item">
                <span class="dp-label">Permanency Goal</span>
                <span class="dp-value">{{ selectedChild.permanency_goal }}</span>
              </div>
              <div class="dp-item">
                <span class="dp-label">Months in Care</span>
                <span class="dp-value">{{ selectedChild.months_in_care }}</span>
              </div>
              <div class="dp-item">
                <span class="dp-label">Status</span>
                <span class="dp-value status-badge">{{ selectedChild.status }}</span>
              </div>
            </div>
          </div>

          <div class="dp-section">
            <h4>Quick Actions</h4>
            <div class="dp-actions">
              <a [routerLink]="['/files']" class="dp-action-btn">
                <span class="material-icons-outlined">upload_file</span>
                Upload Medical Report
              </a>
              <a [routerLink]="['/files']" class="dp-action-btn">
                <span class="material-icons-outlined">school</span>
                Upload School Report Card
              </a>
              <a [routerLink]="['/calendar']" class="dp-action-btn">
                <span class="material-icons-outlined">event</span>
                View Court Dates
              </a>
              <a [routerLink]="['/messages']" class="dp-action-btn">
                <span class="material-icons-outlined">chat</span>
                Contact Social Worker
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .foster-dash { max-width: 100%; }

    /* Search */
    .search-bar {
      display: flex; align-items: center; gap: 10px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 10px 16px;
      margin-bottom: 16px; transition: border-color var(--transition-fast);
    }
    .search-bar:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
    .search-icon { font-size: 20px; color: var(--text-light); flex-shrink: 0; }
    .search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 15px; font-family: var(--font); color: var(--text-primary);
    }
    .search-input::placeholder { color: var(--text-light); }
    .search-clear {
      border: none; background: transparent; cursor: pointer; padding: 2px;
      color: var(--text-light); display: flex; align-items: center;
      border-radius: var(--radius-full); transition: all var(--transition-fast);
    }
    .search-clear:hover { background: rgba(139,92,246,0.08); color: var(--primary); }
    .search-clear .material-icons-outlined { font-size: 18px; }

    .dash-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
    .dash-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 15px; color: var(--text-light); margin-top: 2px; }

    /* Quick Stats */
    .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .qs-card {
      display: flex; align-items: center; gap: 14px; padding: 18px;
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); transition: all var(--transition-med);
    }
    .qs-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .qs-icon {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .qs-icon .material-icons-outlined { font-size: 22px; color: white; }
    .qs-label { font-size: 16px; color: var(--text-secondary); display: block; }
    .qs-value { font-size: 24px; font-weight: 800; display: block; margin-top: 2px; }

    /* Section Header */
    .section-header { margin-bottom: 16px; }
    .section-header h3 { font-size: 17px; font-weight: 700; }

    /* Children Grid */
    .children-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 28px; }

    .child-card {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden; cursor: pointer;
      transition: all var(--transition-med);
      display: flex; flex-direction: column;
    }
    .child-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }

    .child-card-top {
      padding: 20px; display: flex; align-items: center; gap: 14px;
    }
    .child-avatar-lg {
      width: 52px; height: 52px; border-radius: 50%;
      background: rgba(255,255,255,0.25); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px; color: white;
      border: 2px solid rgba(255,255,255,0.3); flex-shrink: 0;
    }
    .child-name { font-size: 16px; font-weight: 700; color: white; display: block; }
    .child-age { font-size: 16px; color: rgba(255,255,255,0.8); }

    .child-card-body { padding: 16px 20px 20px; flex: 1; display: flex; flex-direction: column; }
    .child-detail-row {
      display: flex; align-items: center; gap: 8px; font-size: 15px;
      color: var(--text-secondary); padding: 5px 0;
    }
    .child-detail-row .material-icons-outlined { font-size: 16px; color: var(--text-light); }

    .child-needs { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
    .need-tag {
      display: flex; align-items: center; gap: 4px; padding: 3px 10px;
      border-radius: var(--radius-full); font-size: 15px; font-weight: 600;
    }
    .need-tag .material-icons-outlined { font-size: 15px; }
    .need-tag.medical { background: rgba(229,62,62,0.1); color: #e53e3e; }
    .need-tag.behavioral { background: rgba(237,137,54,0.1); color: #dd6b20; }
    .need-tag.disability { background: rgba(66,153,225,0.1); color: #4299e1; }

    .child-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 14px; }
    .child-action-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 8px 12px; border-radius: var(--radius-md);
      font-size: 16px; font-weight: 600; cursor: pointer;
      transition: all var(--transition-fast); text-decoration: none;
      background: var(--primary); color: white;
    }
    .child-action-btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .child-action-btn.secondary {
      background: transparent; color: var(--primary);
      border: 1px solid var(--primary);
    }
    .child-action-btn.secondary:hover { background: rgba(139,92,246,0.06); }
    .child-action-btn .material-icons-outlined { font-size: 15px; }

    /* Loading */
    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 200px; color: var(--text-light);
    }
    .spin { animation: spin 1s linear infinite; font-size: 32px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* Detail Panel */
    .detail-panel {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: 24px; margin-top: 20px;
    }
    .dp-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--border-light);
    }
    .dp-header h3 { font-size: 18px; font-weight: 700; }
    .dp-close {
      border: none; background: transparent; cursor: pointer; color: var(--text-light);
      padding: 4px; border-radius: var(--radius-sm);
    }
    .dp-close:hover { background: rgba(229,62,62,0.1); color: #e53e3e; }

    .dp-section { margin-bottom: 20px; }
    .dp-section h4 {
      font-size: 15px; font-weight: 700; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;
    }
    .dp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .dp-item { display: flex; flex-direction: column; gap: 3px; }
    .dp-label { font-size: 15px; color: var(--text-light); }
    .dp-value { font-size: 16px; font-weight: 600; }
    .status-badge {
      display: inline-block; padding: 2px 10px; border-radius: var(--radius-full);
      background: rgba(56,178,172,0.12); color: #38b2ac; font-size: 16px;
    }

    .dp-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .dp-action-btn {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      border-radius: var(--radius-md); background: var(--bg);
      border: 1px solid var(--border); font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast);
      color: var(--text-primary); text-decoration: none;
    }
    .dp-action-btn:hover {
      border-color: var(--primary); color: var(--primary);
      background: rgba(139,92,246,0.04);
    }
    .dp-action-btn .material-icons-outlined { font-size: 18px; color: var(--primary); }

    @media (max-width: 1200px) {
      .quick-stats { grid-template-columns: repeat(2, 1fr); }
      .children-grid { grid-template-columns: repeat(2, 1fr); }
      .dp-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .children-grid { grid-template-columns: 1fr; }
      .dp-actions { grid-template-columns: 1fr; }
    }
  `],
})
export class FosterDashboardComponent implements OnInit {
  children: FosterChild[] = [];
  selectedChild: FosterChild | null = null;
  loading = true;
  searchQuery = '';
  docCount = 0;
  upcomingCount = 3;

  childColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
    'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
  ];

  constructor(
    private auth: AuthService,
    private fosterService: FosterParentService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.fosterService.getMyChildren(user.id).subscribe({
        next: (children) => {
          this.children = children;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  getFilteredChildren(): FosterChild[] {
    if (!this.searchQuery.trim()) return this.children;
    const q = this.searchQuery.toLowerCase();
    return this.children.filter(c =>
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.placement_type?.toLowerCase().includes(q)
    );
  }

  getInitials(child: FosterChild): string {
    return (child.first_name[0] + child.last_name[0]).toUpperCase();
  }

  getAge(dob: string): number {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}
