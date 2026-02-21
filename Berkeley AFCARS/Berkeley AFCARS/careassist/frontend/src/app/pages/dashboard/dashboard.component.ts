import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlaggedCasesComponent } from '../../components/flagged-cases/flagged-cases.component';
import { CaseTableComponent } from '../../components/case-table/case-table.component';
import { CaseDetailPanelComponent } from '../../components/case-detail-panel/case-detail-panel.component';
import { DashboardService } from '../../services/dashboard.service';
import { CaseService } from '../../services/case.service';
import {
  DashboardStats,
  FlaggedCaseSummary,
  CaseSummary,
  CaseDetail,
} from '../../models/interfaces';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FlaggedCasesComponent,
    CaseTableComponent,
    CaseDetailPanelComponent,
  ],
  template: `
    <div class="dashboard-layout">
      <!-- Left: Main Content Area -->
      <div class="dashboard-main">
        <!-- Header -->
        <div class="dashboard-header animate-in">
          <div class="header-greeting">
            <h2>Dashboard</h2>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline btn-sm">
              <span class="material-icons-outlined">download</span>
              Export
            </button>
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="stat-grid stagger">
          <div class="stat-card animate-in" *ngFor="let stat of statCards">
            <div class="stat-icon-wrap" [style.background]="stat.gradient">
              <span class="material-icons-outlined">{{ stat.icon }}</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value">{{ stat.value }}</span>
            </div>
            <div class="stat-trend" *ngIf="stat.trend" [class.up]="stat.trendUp" [class.down]="!stat.trendUp">
              <span class="material-icons-outlined">{{ stat.trendUp ? 'trending_up' : 'trending_down' }}</span>
              {{ stat.trend }}
            </div>
          </div>
        </div>

        <!-- Tab Bar -->
        <div class="tab-bar animate-in">
          <div class="tab-bar-left">
            <h2>Caseload Overview</h2>
            <span class="tab-subtitle">{{ allCases.length }} total cases</span>
          </div>
          <div class="tabs">
            <button class="tab"
                    [class.active]="activeTab === 'flagged'"
                    (click)="setTab('flagged')">
              <span class="material-icons-outlined tab-icon">flag</span>
              Flagged
              <span class="tab-count" *ngIf="stats?.flagged_cases">{{ stats?.flagged_cases }}</span>
            </button>
            <button class="tab"
                    [class.active]="activeTab === 'in_progress'"
                    (click)="setTab('in_progress')">
              <span class="material-icons-outlined tab-icon">pending</span>
              In Progress
            </button>
            <button class="tab"
                    [class.active]="activeTab === 'archived'"
                    (click)="setTab('archived')">
              <span class="material-icons-outlined tab-icon">inventory_2</span>
              Archived
            </button>
          </div>
        </div>

        <!-- Flagged Cases Cards -->
        <app-flagged-cases
          *ngIf="activeTab === 'flagged'"
          [cases]="flaggedCases"
          (caseSelected)="onCaseSelected($event)">
        </app-flagged-cases>

        <!-- Priority Case Table -->
        <app-case-table
          [cases]="allCases"
          [selectedCaseId]="selectedCaseId"
          (caseSelected)="onCaseSelected($event)">
        </app-case-table>
      </div>

      <!-- Right: Detail Panel -->
      <app-case-detail-panel
        *ngIf="selectedCaseId"
        [caseId]="selectedCaseId">
      </app-case-detail-panel>
    </div>
  `,
  styles: [`
    .dashboard-layout { display: flex; gap: 0; min-height: 100%; }
    .dashboard-main { flex: 1; }
    .dashboard-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
    .header-greeting h2 { font-size: 22px; font-weight: 700; }

    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      display: flex; align-items: center; gap: 14px; padding: 18px;
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); transition: all var(--transition-med);
    }
    .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .stat-icon-wrap {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon-wrap .material-icons-outlined { font-size: 22px; color: white; }
    .stat-label { font-size: 12px; color: var(--text-secondary); display: block; }
    .stat-value { font-size: 24px; font-weight: 800; display: block; margin-top: 2px; }
    .stat-trend {
      margin-left: auto; display: flex; align-items: center; gap: 3px;
      font-size: 11px; font-weight: 600; padding: 3px 8px;
      border-radius: var(--radius-full);
    }
    .stat-trend.up { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .stat-trend.down { background: rgba(229,62,62,0.1); color: #e53e3e; }
    .stat-trend .material-icons-outlined { font-size: 14px; }

    .tab-bar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light);
    }
    .tab-bar-left h2 { font-size: 17px; font-weight: 700; }
    .tab-subtitle { font-size: 12px; color: var(--text-light); }
    .tabs { display: flex; gap: 4px; }
    .tab {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 14px; border-radius: var(--radius-full);
      border: 1px solid var(--border); background: transparent;
      font-size: 12px; font-weight: 600; color: var(--text-secondary);
      cursor: pointer; transition: all var(--transition-fast); font-family: var(--font);
    }
    .tab:hover { border-color: var(--primary); color: var(--primary); }
    .tab.active {
      background: var(--primary); color: white; border-color: var(--primary);
      box-shadow: var(--shadow-primary);
    }
    .tab-icon { font-size: 15px; }
    .tab-count {
      background: rgba(255,255,255,0.25); padding: 1px 6px;
      border-radius: var(--radius-full); font-size: 10px;
    }

    @media (max-width: 1200px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class DashboardComponent implements OnInit {
  today = new Date();
  stats: DashboardStats | null = null;
  flaggedCases: FlaggedCaseSummary[] = [];
  allCases: CaseSummary[] = [];
  selectedCaseId: number | null = null;
  activeTab = 'flagged';

  statCards: { label: string; value: string | number; icon: string; gradient: string; trend?: string; trendUp?: boolean }[] = [];

  constructor(
    private dashboardService: DashboardService,
    private caseService: CaseService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe((s) => {
      this.stats = s;
      this.statCards = [
        { label: 'Active Cases', value: s.active_cases, icon: 'folder_open', gradient: 'var(--gradient-primary)', trend: '+2', trendUp: true },
        { label: 'Flagged Cases', value: s.flagged_cases, icon: 'flag', gradient: 'var(--gradient-danger)', trend: '+1', trendUp: false },
        { label: 'Pending Reviews', value: s.pending_reviews, icon: 'schedule', gradient: 'var(--gradient-warning)' },
        { label: 'Avg. Permanency', value: s.avg_permanency_months + ' mo', icon: 'timelapse', gradient: 'var(--gradient-info)' },
      ];
    });

    this.dashboardService.getFlaggedCases().subscribe((c) => (this.flaggedCases = c));
    this.caseService.getCases().subscribe((c) => (this.allCases = c));
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  onCaseSelected(id: number): void {
    this.selectedCaseId = id;
  }
}
