import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface WorkerCase {
  case_id: number;
  case_number: string;
  child_name: string;
  priority_score: number;
  status: string;
  placement_type: string | null;
  months_in_care: number;
  flag_count: number;
}

interface WorkerOverview {
  worker_id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_cases: number;
  flagged_cases: number;
  avg_priority: number;
  high_risk_count: number;
  cases: WorkerCase[];
}

interface TeamStats {
  total_workers: number;
  total_cases: number;
  total_flagged: number;
  avg_cases_per_worker: number;
  highest_risk_score: number;
  avg_priority: number;
}

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="supervisor-page">
      <!-- Header -->
      <div class="page-header animate-in">
        <div>
          <h2>Supervisor Dashboard</h2>
          <p class="subtitle">Team overview &amp; caseload management</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline btn-sm" (click)="refreshData()">
            <span class="material-icons-outlined">refresh</span> Refresh
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar animate-in">
        <span class="material-icons-outlined search-icon">search</span>
        <input class="search-input" type="text" placeholder="Search workers, cases, documents…"
               [(ngModel)]="searchQuery" />
        <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- Team Stats Row -->
      <div class="stat-grid stagger" *ngIf="stats">
        <div class="stat-card animate-in" *ngFor="let s of statCards">
          <div class="stat-icon-wrap" [style.background]="s.gradient">
            <span class="material-icons-outlined">{{ s.icon }}</span>
          </div>
          <div class="stat-info">
            <span class="stat-label">{{ s.label }}</span>
            <span class="stat-value">{{ s.value }}</span>
          </div>
        </div>
      </div>

      <!-- Team Overview by Worker -->
      <div class="section-header animate-in">
        <h3>Team Caseload by Worker</h3>
        <span class="section-sub">{{ getFilteredWorkers().length }} social workers</span>
      </div>

      <div class="worker-cards stagger">
        <div class="worker-card animate-in" *ngFor="let w of getFilteredWorkers()"
             [class.expanded]="expandedWorker === w.worker_id">
          <!-- Worker Header -->
          <div class="worker-header" (click)="toggleWorker(w.worker_id)">
            <div class="worker-avatar">{{ getInitials(w) }}</div>
            <div class="worker-info">
              <span class="worker-name">{{ w.first_name }} {{ w.last_name }}</span>
              <span class="worker-email">{{ w.email }}</span>
            </div>
            <div class="worker-metrics">
              <div class="metric">
                <span class="metric-value">{{ w.total_cases }}</span>
                <span class="metric-label">Cases</span>
              </div>
              <div class="metric flagged" *ngIf="w.flagged_cases > 0">
                <span class="metric-value">{{ w.flagged_cases }}</span>
                <span class="metric-label">Flagged</span>
              </div>
              <div class="metric risk" *ngIf="w.high_risk_count > 0">
                <span class="metric-value">{{ w.high_risk_count }}</span>
                <span class="metric-label">High Risk</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ (w.avg_priority * 100).toFixed(0) }}%</span>
                <span class="metric-label">Avg Score</span>
              </div>
            </div>
            <div class="worker-status-bar">
              <div class="status-fill" [style.width.%]="getWorkloadPercent(w)"
                   [ngClass]="getWorkloadClass(w)"></div>
            </div>
            <span class="material-icons-outlined expand-icon">
              {{ expandedWorker === w.worker_id ? 'expand_less' : 'expand_more' }}
            </span>
          </div>

          <!-- Expanded Case List -->
          <div class="worker-cases" *ngIf="expandedWorker === w.worker_id">
            <table class="cases-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Child</th>
                  <th>Disruption Risk</th>
                  <th>Status</th>
                  <th>Placement</th>
                  <th>Months</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of w.cases" (click)="goToCase(c.case_id)" class="case-row">
                  <td class="case-num">{{ c.case_number }}</td>
                  <td>{{ c.child_name }}</td>
                  <td>
                    <div class="score-cell">
                      <div class="score-bar-bg">
                        <div class="score-bar-fill" [style.width.%]="c.priority_score * 100"
                             [ngClass]="getScoreClass(c.priority_score)"></div>
                      </div>
                      <span class="score-text" [ngClass]="getScoreClass(c.priority_score)">
                        {{ (c.priority_score * 100).toFixed(0) }}%
                      </span>
                    </div>
                  </td>
                  <td><span class="status-badge" [ngClass]="c.status">{{ c.status | titlecase }}</span></td>
                  <td>{{ c.placement_type || '—' }}</td>
                  <td>{{ c.months_in_care }}</td>
                  <td>
                    <span class="flag-badge" *ngIf="c.flag_count > 0">
                      <span class="material-icons-outlined">flag</span>
                      {{ c.flag_count }}
                    </span>
                    <span *ngIf="c.flag_count === 0" class="no-flags">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Upcoming Weekly Check-Ins -->
      <div class="section-header animate-in" style="margin-top: 32px;">
        <h3>Weekly Check-Ins</h3>
        <span class="section-sub">Scheduled supervision sessions</span>
      </div>

      <div class="checkin-grid stagger">
        <div class="checkin-card animate-in" *ngFor="let ci of getFilteredCheckIns()"
             [class.today]="ci.isToday" [class.past]="ci.isPast">
          <div class="ci-date-badge" [class.today]="ci.isToday">
            <span class="ci-day">{{ ci.dayName }}</span>
            <span class="ci-date">{{ ci.dateStr }}</span>
          </div>
          <div class="ci-info">
            <span class="ci-worker">{{ ci.workerName }}</span>
            <span class="ci-time">
              <span class="material-icons-outlined">schedule</span>
              {{ ci.time }}
            </span>
            <span class="ci-topics">{{ ci.topics }}</span>
          </div>
          <div class="ci-status-icon">
            <span class="material-icons-outlined" *ngIf="ci.isPast" style="color: var(--success)">check_circle</span>
            <span class="material-icons-outlined" *ngIf="ci.isToday" style="color: var(--primary)">radio_button_checked</span>
            <span class="material-icons-outlined" *ngIf="!ci.isPast && !ci.isToday" style="color: var(--text-light)">radio_button_unchecked</span>
          </div>
        </div>
      </div>

      <!-- ═══ Recent Documents ═══ -->
      <div class="section-panel animate-in" style="margin-top: 32px;">
        <div class="section-title-row">
          <h3><span class="material-icons-outlined">description</span> Recent Documents</h3>
        </div>
        <div class="doc-list">
          <div class="doc-item" *ngFor="let d of getFilteredDocs()">
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
      <div class="section-panel animate-in" style="margin-top: 20px;">
        <div class="section-title-row">
          <h3><span class="material-icons-outlined">history</span> Children Placement History</h3>
        </div>
        <div class="history-list">
          <div class="history-item" *ngFor="let h of getFilteredHistory()">
            <div class="history-dot" [ngClass]="h.type"></div>
            <div class="history-content">
              <span class="history-title">{{ h.title }}</span>
              <span class="history-meta">{{ h.child }} · {{ h.date }} · Worker: {{ h.worker }}</span>
            </div>
            <span class="history-badge" [ngClass]="h.type">{{ h.type | titlecase }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .supervisor-page { max-width: 100%; }

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

    .page-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
    .page-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 15px; color: var(--text-light); margin-top: 2px; }

    /* Stat Cards */
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
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

    /* Section Headers */
    .section-header {
      display: flex; align-items: baseline; gap: 12px;
      margin-bottom: 16px; padding-bottom: 10px;
      border-bottom: 1px solid var(--border-light);
    }
    .section-header h3 { font-size: 17px; font-weight: 700; }
    .section-sub { font-size: 16px; color: var(--text-light); }

    /* Worker Cards */
    .worker-cards { display: flex; flex-direction: column; gap: 12px; }
    .worker-card {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden;
      transition: all var(--transition-med);
    }
    .worker-card:hover { box-shadow: var(--shadow-md); }
    .worker-card.expanded { border-color: var(--primary); box-shadow: var(--shadow-primary); }

    .worker-header {
      display: flex; align-items: center; gap: 16px;
      padding: 18px 20px; cursor: pointer;
      transition: background var(--transition-fast);
    }
    .worker-header:hover { background: rgba(139,92,246,0.03); }

    .worker-avatar {
      width: 42px; height: 42px; border-radius: 12px;
      background: var(--gradient-primary); display: flex;
      align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 16px; flex-shrink: 0;
    }
    .worker-info { flex: 1; min-width: 0; }
    .worker-name { font-size: 16px; font-weight: 700; display: block; }
    .worker-email { font-size: 15px; color: var(--text-light); }

    .worker-metrics { display: flex; gap: 20px; }
    .metric { text-align: center; }
    .metric-value { font-size: 18px; font-weight: 800; display: block; }
    .metric-label { font-size: 14px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; }
    .metric.flagged .metric-value { color: #dd6b20; }
    .metric.risk .metric-value { color: var(--danger); }

    .worker-status-bar {
      width: 80px; height: 6px; border-radius: 3px;
      background: var(--border-light); overflow: hidden; flex-shrink: 0;
    }
    .status-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
    .status-fill.low { background: var(--success); }
    .status-fill.medium { background: #dd6b20; }
    .status-fill.high { background: var(--danger); }

    .expand-icon { font-size: 22px; color: var(--text-light); flex-shrink: 0; }

    /* Expanded Cases Table */
    .worker-cases {
      border-top: 1px solid var(--border-light);
      padding: 16px 20px 20px;
      background: rgba(139,92,246,0.02);
    }
    .cases-table { width: 100%; border-collapse: collapse; }
    .cases-table th {
      text-align: left; font-size: 14px; text-transform: uppercase;
      letter-spacing: 0.5px; color: var(--text-light); font-weight: 700;
      padding: 8px 12px; border-bottom: 1px solid var(--border);
    }
    .cases-table td {
      padding: 10px 12px; font-size: 15px; border-bottom: 1px solid var(--border-light);
    }
    .case-row { cursor: pointer; transition: background var(--transition-fast); }
    .case-row:hover { background: rgba(139,92,246,0.06); }
    .case-num { font-weight: 600; font-family: var(--font-mono, monospace); font-size: 16px; }

    /* Score bar */
    .score-cell { display: flex; align-items: center; gap: 8px; }
    .score-bar-bg { width: 60px; height: 5px; border-radius: 3px; background: var(--border-light); overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 3px; }
    .score-bar-fill.low { background: var(--success); }
    .score-bar-fill.medium { background: #dd6b20; }
    .score-bar-fill.high { background: var(--danger); }
    .score-text { font-size: 16px; font-weight: 700; }
    .score-text.low { color: var(--success); }
    .score-text.medium { color: #dd6b20; }
    .score-text.high { color: var(--danger); }

    /* Status badge */
    .status-badge {
      font-size: 15px; font-weight: 600; padding: 3px 10px;
      border-radius: var(--radius-full);
    }
    .status-badge.open { background: rgba(56,178,172,0.12); color: #38b2ac; }
    .status-badge.in_progress { background: rgba(139,92,246,0.12); color: var(--primary); }
    .status-badge.closed { background: rgba(160,174,192,0.2); color: #a0aec0; }

    /* Flag badge */
    .flag-badge {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 16px; font-weight: 700; color: var(--danger);
    }
    .flag-badge .material-icons-outlined { font-size: 16px; }
    .no-flags { color: var(--text-light); }

    /* Check-in cards */
    .checkin-grid { display: flex; flex-direction: column; gap: 10px; }
    .checkin-card {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 20px; background: var(--surface);
      border-radius: var(--radius-lg); border: 1px solid var(--border);
      transition: all var(--transition-med);
    }
    .checkin-card:hover { box-shadow: var(--shadow-sm); }
    .checkin-card.today { border-color: var(--primary); background: rgba(139,92,246,0.04); }
    .checkin-card.past { opacity: 0.6; }

    .ci-date-badge {
      width: 56px; padding: 8px 0; border-radius: var(--radius-md);
      background: var(--bg); text-align: center; flex-shrink: 0;
    }
    .ci-date-badge.today { background: var(--gradient-primary); }
    .ci-date-badge.today .ci-day, .ci-date-badge.today .ci-date { color: white; }
    .ci-day { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-light); display: block; }
    .ci-date { font-size: 16px; font-weight: 800; display: block; }

    .ci-info { flex: 1; }
    .ci-worker { font-size: 16px; font-weight: 700; display: block; }
    .ci-time {
      display: flex; align-items: center; gap: 4px;
      font-size: 16px; color: var(--text-light); margin-top: 2px;
    }
    .ci-time .material-icons-outlined { font-size: 16px; }
    .ci-topics { font-size: 15px; color: var(--text-secondary); margin-top: 3px; display: block; }
    .ci-status-icon .material-icons-outlined { font-size: 22px; }

    @media (max-width: 1200px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .worker-metrics { gap: 12px; }
    }

    /* ═══ Documents & Placement History ═══ */
    .section-panel {
      background: var(--surface); border-radius: var(--radius-lg);
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
export class SupervisorDashboardComponent implements OnInit {
  searchQuery = '';
  workers: WorkerOverview[] = [];
  stats: TeamStats | null = null;
  statCards: { label: string; value: string | number; icon: string; gradient: string }[] = [];
  expandedWorker: number | null = null;
  checkIns: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
    this.buildCheckIns();
  }

  loadData(): void {
    this.http.get<TeamStats>('/api/supervisor/team/stats').subscribe(s => {
      this.stats = s;
      this.statCards = [
        { label: 'Social Workers', value: s.total_workers, icon: 'groups', gradient: 'var(--gradient-primary)' },
        { label: 'Total Cases', value: s.total_cases, icon: 'folder_open', gradient: 'var(--gradient-info)' },
        { label: 'Flagged Cases', value: s.total_flagged, icon: 'flag', gradient: 'var(--gradient-danger)' },
        { label: 'Avg Cases/Worker', value: s.avg_cases_per_worker, icon: 'equalizer', gradient: 'var(--gradient-warning)' },
      ];
    });

    this.http.get<WorkerOverview[]>('/api/supervisor/team').subscribe(w => {
      this.workers = w;
      if (w.length > 0) {
        this.expandedWorker = w[0].worker_id;
      }
    });
  }

  refreshData(): void {
    this.loadData();
  }

  buildCheckIns(): void {
    const today = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const workerNames = ['Jessica Hawkins', 'Priya Patel', 'Marcus Williams'];
    const times = ['9:00 AM', '10:30 AM', '2:00 PM'];
    const topicSets = [
      'Caseload review (7 cases), Maya J. court prep, Jayden C. adoption matching, Caleb W. behavioral plan',
      'Sofia N. medical follow-up, Diego R. placement stability, Aria K. school enrollment, Nadia H. kinship review',
      'Tyler J. emancipation planning, Lily C. medical compliance, Noah L. behavioral plan, Owen M. initial assessment',
    ];

    // Generate check-ins: one per worker this week
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Monday of this week

    for (let i = 0; i < 3; i++) {
      const d = new Date(monday.getTime() + i * 2 * dayMs); // Mon, Wed, Fri
      const isToday = d.toDateString() === today.toDateString();
      const isPast = d < today && !isToday;
      this.checkIns.push({
        workerName: workerNames[i],
        time: times[i],
        topics: topicSets[i],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday,
        isPast,
      });
    }
  }

  toggleWorker(id: number): void {
    this.expandedWorker = this.expandedWorker === id ? null : id;
  }

  getInitials(w: WorkerOverview): string {
    return (w.first_name[0] + w.last_name[0]).toUpperCase();
  }

  getWorkloadPercent(w: WorkerOverview): number {
    // Max reasonable caseload is ~8
    return Math.min((w.total_cases / 8) * 100, 100);
  }

  getWorkloadClass(w: WorkerOverview): string {
    if (w.total_cases <= 3) return 'low';
    if (w.total_cases <= 5) return 'medium';
    return 'high';
  }

  getScoreClass(score: number): string {
    if (score < 0.4) return 'low';
    if (score < 0.7) return 'medium';
    return 'high';
  }

  goToCase(id: number): void {
    this.router.navigate(['/cases', id]);
  }

  getFilteredWorkers(): WorkerOverview[] {
    if (!this.searchQuery.trim()) return this.workers;
    const q = this.searchQuery.toLowerCase();
    return this.workers.filter(w =>
      w.first_name.toLowerCase().includes(q) ||
      w.last_name.toLowerCase().includes(q) ||
      w.email.toLowerCase().includes(q) ||
      w.cases.some(c => c.child_name.toLowerCase().includes(q) || c.case_number.toLowerCase().includes(q))
    );
  }

  getFilteredCheckIns(): any[] {
    if (!this.searchQuery.trim()) return this.checkIns;
    const q = this.searchQuery.toLowerCase();
    return this.checkIns.filter((ci: any) =>
      ci.workerName.toLowerCase().includes(q) || ci.topics.toLowerCase().includes(q)
    );
  }

  getFilteredDocs(): any[] {
    if (!this.searchQuery.trim()) return this.recentDocs;
    const q = this.searchQuery.toLowerCase();
    return this.recentDocs.filter(d =>
      d.name.toLowerCase().includes(q) || d.child.toLowerCase().includes(q)
    );
  }

  getFilteredHistory(): any[] {
    if (!this.searchQuery.trim()) return this.placementHistory;
    const q = this.searchQuery.toLowerCase();
    return this.placementHistory.filter(h =>
      h.title.toLowerCase().includes(q) || h.child.toLowerCase().includes(q) || h.worker.toLowerCase().includes(q)
    );
  }

  recentDocs = [
    { name: 'Medical Exam Report — Maya Johnson', child: 'Maya J.', date: 'Mar 12, 2026', size: '2.4 MB', type: 'medical', icon: 'medical_services' },
    { name: 'IEP Progress Report — Ethan Rodriguez', child: 'Ethan R.', date: 'Mar 10, 2026', size: '1.3 MB', type: 'school', icon: 'school' },
    { name: 'Court Hearing Summary — Aisha Williams', child: 'Aisha W.', date: 'Mar 8, 2026', size: '0.8 MB', type: 'legal', icon: 'gavel' },
    { name: 'Behavioral Assessment — Liam Thompson', child: 'Liam T.', date: 'Mar 5, 2026', size: '1.6 MB', type: 'report', icon: 'psychology' },
    { name: 'Vaccination Record — Sofia Nguyen', child: 'Sofia N.', date: 'Mar 3, 2026', size: '0.5 MB', type: 'medical', icon: 'medical_services' },
    { name: 'Permanency Plan — Jordan Davis', child: 'Jordan D.', date: 'Feb 28, 2026', size: '2.1 MB', type: 'legal', icon: 'gavel' },
    { name: 'School Report Card — Emma Martinez', child: 'Emma M.', date: 'Feb 25, 2026', size: '1.1 MB', type: 'school', icon: 'school' },
    { name: 'Therapy Progress Notes — Noah Lee', child: 'Noah L.', date: 'Feb 22, 2026', size: '1.8 MB', type: 'report', icon: 'psychology' },
    { name: 'Dental Exam Report — Zoe Brown', child: 'Zoe B.', date: 'Feb 18, 2026', size: '0.6 MB', type: 'medical', icon: 'medical_services' },
    { name: 'Suspension Report — Caleb Washington', child: 'Caleb W.', date: 'Feb 15, 2026', size: '0.4 MB', type: 'school', icon: 'school' },
    { name: 'Asthma Care Plan — Isla Moreno', child: 'Isla M.', date: 'Feb 12, 2026', size: '0.7 MB', type: 'medical', icon: 'medical_services' },
    { name: 'Adoption Profile — Jayden Carter', child: 'Jayden C.', date: 'Feb 10, 2026', size: '1.9 MB', type: 'legal', icon: 'gavel' },
    { name: 'Pediatric Checkup — Aria Kim', child: 'Aria K.', date: 'Feb 8, 2026', size: '1.0 MB', type: 'medical', icon: 'medical_services' },
    { name: 'Group Home Progress — Diego Ramirez', child: 'Diego R.', date: 'Feb 5, 2026', size: '1.3 MB', type: 'report', icon: 'psychology' },
    { name: 'Kinship Assessment — Nadia Hassan', child: 'Nadia H.', date: 'Feb 2, 2026', size: '1.5 MB', type: 'report', icon: 'psychology' },
    { name: 'Emancipation Plan — Tyler Jackson', child: 'Tyler J.', date: 'Jan 28, 2026', size: '2.2 MB', type: 'legal', icon: 'gavel' },
    { name: 'Asthma Treatment Log — Lily Chen', child: 'Lily C.', date: 'Jan 25, 2026', size: '0.8 MB', type: 'medical', icon: 'medical_services' },
    { name: 'School Enrollment — Owen Murphy', child: 'Owen M.', date: 'Jan 22, 2026', size: '0.5 MB', type: 'school', icon: 'school' },
  ];

  placementHistory = [
    { title: 'Kinship Care — Murphy Grandparents', child: 'Owen Murphy', date: 'Feb 10, 2026', type: 'entry', worker: 'Marcus Williams' },
    { title: 'Foster Home — Thompson Family', child: 'Liam Thompson', date: 'Mar 2, 2026', type: 'entry', worker: 'Jessica Hawkins' },
    { title: 'Transfer — Group Home to Foster', child: 'Maya Johnson', date: 'Feb 20, 2026', type: 'transfer', worker: 'Jessica Hawkins' },
    { title: 'Group Home — Beacon', child: 'Jayden Carter', date: 'Feb 18, 2026', type: 'entry', worker: 'Jessica Hawkins' },
    { title: 'Kinship Care — Grandmother', child: 'Zoe Brown', date: 'Feb 15, 2026', type: 'entry', worker: 'Marcus Williams' },
    { title: 'Foster Home — Wu Family', child: 'Lily Chen', date: 'Feb 12, 2026', type: 'transfer', worker: 'Marcus Williams' },
    { title: 'Independent Living Program', child: 'Jordan Davis', date: 'Feb 10, 2026', type: 'exit', worker: 'Priya Patel' },
    { title: 'Group Home — Valley Youth', child: 'Diego Ramirez', date: 'Feb 5, 2026', type: 'transfer', worker: 'Priya Patel' },
    { title: 'Foster Home — Okafor Family', child: 'Caleb Washington', date: 'Jan 30, 2026', type: 'transfer', worker: 'Jessica Hawkins' },
    { title: 'Foster Home — Garcia Family', child: 'Emma Martinez', date: 'Jan 28, 2026', type: 'entry', worker: 'Priya Patel' },
    { title: 'Foster Home — Patel Family', child: 'Aria Kim', date: 'Jan 20, 2026', type: 'entry', worker: 'Priya Patel' },
    { title: 'Residential Care — Lakeside', child: 'Tyler Jackson', date: 'Jan 15, 2026', type: 'transfer', worker: 'Marcus Williams' },
    { title: 'Kinship Care — Hassan Uncle', child: 'Nadia Hassan', date: 'Jan 10, 2026', type: 'entry', worker: 'Priya Patel' },
    { title: 'Foster Home — Sullivan Family', child: 'Isla Moreno', date: 'Jan 5, 2026', type: 'entry', worker: 'Jessica Hawkins' },
    { title: 'Foster Home — Garcia Family', child: 'Sofia Nguyen', date: 'Dec 20, 2025', type: 'entry', worker: 'Priya Patel' },
    { title: 'Transfer — Residential to Foster', child: 'Noah Lee', date: 'Dec 18, 2025', type: 'transfer', worker: 'Marcus Williams' },
  ];
}
