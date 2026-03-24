import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
    FormsModule,
    RouterLink,
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
            <div class="search-box">
              <span class="material-icons-outlined">search</span>
              <input type="text" placeholder="Search cases..." [(ngModel)]="searchQuery" (input)="applySearch()" />
            </div>
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

        <!-- ═══ Recent Documents ═══ -->
        <div class="section-panel animate-in">
          <div class="section-title-row">
            <h3><span class="material-icons-outlined">description</span> Recent Documents</h3>
            <a routerLink="/files" class="see-all">View All</a>
          </div>
          <div class="doc-list">
            <div class="doc-item" *ngFor="let d of recentDocs">
              <div class="doc-icon" [ngClass]="d.type">
                <span class="material-icons-outlined">{{ d.icon }}</span>
              </div>
              <div class="doc-info">
                <span class="doc-name">{{ d.name }}</span>
                <span class="doc-meta">{{ d.child }} · {{ d.date }}</span>
              </div>
              <span class="doc-size">{{ d.size }}</span>
            </div>
          </div>
        </div>

        <!-- ═══ Children Placement History ═══ -->
        <div class="section-panel animate-in">
          <div class="section-title-row">
            <h3><span class="material-icons-outlined">history</span> Placement History</h3>
          </div>
          <div class="history-list">
            <div class="history-item" *ngFor="let h of placementHistory">
              <div class="history-dot" [ngClass]="h.type"></div>
              <div class="history-content">
                <span class="history-title">{{ h.title }}</span>
                <span class="history-meta">{{ h.child }} · {{ h.date }}</span>
              </div>
              <span class="history-badge" [ngClass]="h.type">{{ h.type | titlecase }}</span>
            </div>
          </div>
        </div>
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
    .header-actions { display: flex; align-items: center; gap: 10px; }

    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-full);
      padding: 8px 14px;
    }
    .search-box .material-icons-outlined { font-size: 18px; color: var(--text-light); }
    .search-box input {
      border: none; outline: none; background: transparent; font-size: 15px;
      font-family: var(--font); width: 200px;
    }

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
    .stat-label { font-size: 16px; color: var(--text-secondary); display: block; }
    .stat-value { font-size: 24px; font-weight: 800; display: block; margin-top: 2px; }
    .stat-trend {
      margin-left: auto; display: flex; align-items: center; gap: 3px;
      font-size: 15px; font-weight: 600; padding: 3px 8px;
      border-radius: var(--radius-full);
    }
    .stat-trend.up { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .stat-trend.down { background: rgba(229,62,62,0.1); color: #e53e3e; }
    .stat-trend .material-icons-outlined { font-size: 16px; }

    .tab-bar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light);
    }
    .tab-bar-left h2 { font-size: 17px; font-weight: 700; }
    .tab-subtitle { font-size: 16px; color: var(--text-light); }
    .tabs { display: flex; gap: 4px; }
    .tab {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 14px; border-radius: var(--radius-full);
      border: 1px solid var(--border); background: transparent;
      font-size: 16px; font-weight: 600; color: var(--text-secondary);
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
      border-radius: var(--radius-full); font-size: 14px;
    }

    @media (max-width: 1200px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
    }

    /* ═══ Documents & Placement History Sections ═══ */
    .section-panel {
      margin-top: 24px; background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: 20px;
    }
    .section-title-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border-light);
    }
    .section-title-row h3 {
      display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700;
    }
    .section-title-row h3 .material-icons-outlined { font-size: 18px; color: var(--primary); }
    .see-all {
      font-size: 16px; font-weight: 600; color: var(--primary); text-decoration: none;
      transition: opacity var(--transition-fast);
    }
    .see-all:hover { opacity: 0.7; }

    /* Doc list */
    .doc-list { display: flex; flex-direction: column; gap: 8px; }
    .doc-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border-radius: var(--radius-md); transition: background var(--transition-fast);
    }
    .doc-item:hover { background: rgba(139,92,246,0.04); }
    .doc-icon {
      width: 36px; height: 36px; border-radius: var(--radius-md); display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .doc-icon .material-icons-outlined { font-size: 18px; color: white; }
    .doc-icon.medical { background: linear-gradient(135deg, #e53e3e, #c53030); }
    .doc-icon.school { background: linear-gradient(135deg, #38b2ac, #319795); }
    .doc-icon.legal { background: linear-gradient(135deg, #667eea, #764ba2); }
    .doc-icon.report { background: linear-gradient(135deg, #ed8936, #dd6b20); }
    .doc-info { flex: 1; min-width: 0; }
    .doc-name { font-size: 15px; font-weight: 600; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-meta { font-size: 15px; color: var(--text-light); }
    .doc-size { font-size: 15px; color: var(--text-light); flex-shrink: 0; }

    /* History list */
    .history-list { display: flex; flex-direction: column; gap: 10px; }
    .history-item {
      display: flex; align-items: center; gap: 12px; padding: 8px 12px;
      border-radius: var(--radius-md);
    }
    .history-item:hover { background: rgba(139,92,246,0.04); }
    .history-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .history-dot.entry { background: #38b2ac; }
    .history-dot.transfer { background: #667eea; }
    .history-dot.exit { background: #e53e3e; }
    .history-content { flex: 1; }
    .history-title { font-size: 15px; font-weight: 600; display: block; }
    .history-meta { font-size: 15px; color: var(--text-light); }
    .history-badge {
      font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 3px 9px; border-radius: var(--radius-full);
    }
    .history-badge.entry { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .history-badge.transfer { background: rgba(102,126,234,0.1); color: #667eea; }
    .history-badge.exit { background: rgba(229,62,62,0.1); color: #e53e3e; }
  `],
})
export class DashboardComponent implements OnInit {
  today = new Date();
  stats: DashboardStats | null = null;
  flaggedCases: FlaggedCaseSummary[] = [];
  allCases: CaseSummary[] = [];
  selectedCaseId: number | null = null;
  activeTab = 'flagged';
  searchQuery = '';

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

    this.dashboardService.getFlaggedCases().subscribe((c) => {
      this._allFlagged = c;
      this.flaggedCases = c;
    });
    this.caseService.getCases().subscribe((c) => {
      this._allCases = c;
      this.allCases = c;
    });
  }

  private _allFlagged: FlaggedCaseSummary[] = [];
  private _allCases: CaseSummary[] = [];

  applySearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.flaggedCases = this._allFlagged;
      this.allCases = this._allCases;
      return;
    }
    this.flaggedCases = this._allFlagged.filter(
      (c) => c.child_name.toLowerCase().includes(q) || c.case_number.toLowerCase().includes(q)
    );
    this.allCases = this._allCases.filter(
      (c) => c.child_name.toLowerCase().includes(q) || c.case_number.toLowerCase().includes(q)
    );
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  onCaseSelected(id: number): void {
    this.selectedCaseId = id;
  }

  recentDocs = [
    { name: 'Medical Exam Report — Maya Johnson', child: 'Maya J.', date: 'Mar 12, 2026', size: '2.4 MB', type: 'medical', icon: 'medical_services' },
    { name: 'IEP Progress Report — Ethan Rodriguez', child: 'Ethan R.', date: 'Mar 10, 2026', size: '1.3 MB', type: 'school', icon: 'school' },
    { name: 'Court Hearing Summary — Aisha Williams', child: 'Aisha W.', date: 'Mar 8, 2026', size: '0.8 MB', type: 'legal', icon: 'gavel' },
    { name: 'Behavioral Assessment — Liam Thompson', child: 'Liam T.', date: 'Mar 5, 2026', size: '1.6 MB', type: 'report', icon: 'psychology' },
    { name: 'Suspension Report — Caleb Washington', child: 'Caleb W.', date: 'Mar 2, 2026', size: '0.4 MB', type: 'school', icon: 'school' },
    { name: 'Asthma Care Plan — Isla Moreno', child: 'Isla M.', date: 'Feb 28, 2026', size: '0.7 MB', type: 'medical', icon: 'medical_services' },
    { name: 'Adoption Profile — Jayden Carter', child: 'Jayden C.', date: 'Feb 25, 2026', size: '1.9 MB', type: 'legal', icon: 'gavel' },
    { name: 'Vaccination Record — Sofia Nguyen', child: 'Sofia N.', date: 'Feb 22, 2026', size: '0.5 MB', type: 'medical', icon: 'medical_services' },
    { name: 'School Report Card — Emma Martinez', child: 'Emma M.', date: 'Feb 18, 2026', size: '1.1 MB', type: 'school', icon: 'school' },
    { name: 'Therapy Progress Notes — Noah Lee', child: 'Noah L.', date: 'Feb 15, 2026', size: '1.8 MB', type: 'report', icon: 'psychology' },
  ];

  placementHistory = [
    { title: 'Foster Home Placement — Thompson Family', child: 'Liam Thompson', date: 'Mar 2, 2026', type: 'entry' },
    { title: 'Placement Transfer — Group Home to Foster', child: 'Maya Johnson', date: 'Feb 20, 2026', type: 'transfer' },
    { title: 'Group Home — Beacon', child: 'Jayden Carter', date: 'Feb 18, 2026', type: 'entry' },
    { title: 'Foster Home — Okafor Family', child: 'Caleb Washington', date: 'Jan 30, 2026', type: 'transfer' },
    { title: 'Foster Home — Garcia Family', child: 'Emma Martinez', date: 'Jan 28, 2026', type: 'entry' },
    { title: 'Foster Home — Sullivan Family', child: 'Isla Moreno', date: 'Jan 5, 2026', type: 'entry' },
    { title: 'Residential Care Placement', child: 'Aisha Williams', date: 'Dec 20, 2025', type: 'entry' },
    { title: 'Transfer — Residential to Foster', child: 'Noah Lee', date: 'Dec 18, 2025', type: 'transfer' },
    { title: 'Foster Home — Rodriguez Family', child: 'Ethan Rodriguez', date: 'Dec 5, 2025', type: 'entry' },
  ];
}
