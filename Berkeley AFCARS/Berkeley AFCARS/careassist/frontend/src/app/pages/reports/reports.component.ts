import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FosterParentService, FosterChild } from '../../services/foster-parent.service';
import { CaseService } from '../../services/case.service';

interface ChildReport {
  childName: string;
  workerName?: string;
  sections: { label: string; icon: string; items: string[] }[];
}

interface MonthlyReport {
  month: string;
  workerName?: string;
  totalCases: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  newPlacements: number;
  closedCases: number;
  courtHearings: number;
  homeVisits: number;
  highlights: string[];
}

interface WorkerProfile {
  name: string;
  initials: string;
  caseCount: number;
  children: FosterChild[];
  childReports: ChildReport[];
  monthlyReports: MonthlyReport[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page">
      <div class="page-header animate-in">
        <div>
          <h2>{{ pageTitle }}</h2>
          <p class="subtitle">{{ headerSub }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline"><span class="material-icons-outlined">print</span> Print</button>
          <button class="btn btn-outline"><span class="material-icons-outlined">download</span> Export PDF</button>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar animate-in">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search reports by child name, worker, or keyword..." class="search-input" />
        <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- ═══ STATS CARDS (worker / supervisor) ═══ -->
      <div class="stats-row animate-in" *ngIf="!isFosterParent && caseStats">
        <div class="scard"><span class="scard-val">{{ caseStats.total }}</span><span class="scard-lbl">Total Cases</span></div>
        <div class="scard high"><span class="scard-val">{{ caseStats.high }}</span><span class="scard-lbl">High Risk</span></div>
        <div class="scard med"><span class="scard-val">{{ caseStats.medium }}</span><span class="scard-lbl">Medium Risk</span></div>
        <div class="scard low"><span class="scard-val">{{ caseStats.low }}</span><span class="scard-lbl">Low Risk</span></div>
      </div>

      <!-- ═══ SUPERVISOR — Grouped by Social Worker ═══ -->
      <ng-container *ngIf="isSupervisor">
        <div class="rpt-card animate-in" *ngFor="let w of getFilteredWorkers(); let wi = index" style="margin-bottom: 12px;">
          <div class="rc-header clickable" (click)="toggleWorker(wi)">
            <div class="rc-left">
              <div class="rc-avatar">{{ w.initials }}</div>
              <div>
                <h3 class="rc-title">{{ w.name }}</h3>
                <span class="rc-sub">{{ w.caseCount }} active cases &middot; {{ w.childReports.length }} children</span>
              </div>
            </div>
            <span class="material-icons-outlined rc-chev" [class.open]="expandedWorkers.has(wi)">expand_more</span>
          </div>
          <div class="rc-body" *ngIf="expandedWorkers.has(wi)">
            <div class="child-row" *ngFor="let cr of w.childReports; let ci = index">
              <div class="cr-header" (click)="toggleWorkerChild(wi, ci)">
                <span class="material-icons-outlined cr-icon">person</span>
                <span class="cr-name">{{ cr.childName }}</span>
                <span class="material-icons-outlined cr-chev" [class.open]="isWorkerChildOpen(wi, ci)">chevron_right</span>
              </div>
              <div class="cr-detail" *ngIf="isWorkerChildOpen(wi, ci)">
                <div class="sec" *ngFor="let s of cr.sections">
                  <div class="sec-head">
                    <span class="material-icons-outlined">{{ s.icon }}</span>
                    <h4>{{ s.label }}</h4>
                  </div>
                  <ul><li *ngFor="let item of s.items">{{ item }}</li></ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ═══ WORKER / FOSTER PARENT — All Children ═══ -->
      <ng-container *ngIf="!isSupervisor">
        <div class="rpt-card animate-in">
          <div class="rc-header">
            <div class="rc-left">
              <span class="material-icons-outlined" style="font-size: 24px; color: var(--primary);">folder_shared</span>
              <h3 class="rc-title">Child Reports</h3>
            </div>
            <span class="rc-sub" style="margin-right: 8px;">{{ reports.length }} children</span>
          </div>
          <div class="rc-body">
            <div class="child-row" *ngFor="let rpt of getFilteredReports(); let i = index">
              <div class="cr-header" (click)="toggleChild(i)">
                <span class="material-icons-outlined cr-icon">person</span>
                <span class="cr-name">{{ rpt.childName }}</span>
                <span class="cr-worker" *ngIf="rpt.workerName">{{ rpt.workerName }}</span>
                <span class="material-icons-outlined cr-chev" [class.open]="expandedChildren.has(i)">chevron_right</span>
              </div>
              <div class="cr-detail" *ngIf="expandedChildren.has(i)">
                <div class="sec" *ngFor="let s of rpt.sections">
                  <div class="sec-head">
                    <span class="material-icons-outlined">{{ s.icon }}</span>
                    <h4>{{ s.label }}</h4>
                  </div>
                  <ul><li *ngFor="let item of s.items">{{ item }}</li></ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ═══ MONTHLY OVERVIEW (worker / supervisor) ═══ -->
      <div class="rpt-card animate-in" *ngIf="!isFosterParent && displayMonthly.length" style="margin-top: 16px;">
        <div class="rc-header">
          <div class="rc-left">
            <span class="material-icons-outlined" style="font-size: 24px; color: var(--primary);">assessment</span>
            <h3 class="rc-title">{{ isSupervisor ? 'Team Monthly Overview' : 'Monthly Caseload' }}</h3>
          </div>
          <div class="month-pills">
            <button class="mp" *ngFor="let m of displayMonthly; let i = index"
                    [class.active]="selectedMonthIdx === i" (click)="selectedMonthIdx = i">{{ m.month }}</button>
          </div>
        </div>
        <div class="rc-body" *ngIf="displayMonthly[selectedMonthIdx] as mr">
          <div class="mini-stats">
            <div class="ms-item"><span class="ms-val">{{ mr.totalCases }}</span><span class="ms-lbl">Active</span></div>
            <div class="ms-item high"><span class="ms-val">{{ mr.highRisk }}</span><span class="ms-lbl">High Risk</span></div>
            <div class="ms-item med"><span class="ms-val">{{ mr.mediumRisk }}</span><span class="ms-lbl">Medium</span></div>
            <div class="ms-item low"><span class="ms-val">{{ mr.lowRisk }}</span><span class="ms-lbl">Low Risk</span></div>
          </div>
          <div class="monthly-section">
            <h4 class="mt-title"><span class="material-icons-outlined">trending_up</span> Activity</h4>
            <div class="act-grid">
              <div class="act-cell"><span class="material-icons-outlined">add_circle_outline</span><strong>{{ mr.newPlacements }}</strong> New Placements</div>
              <div class="act-cell"><span class="material-icons-outlined">check_circle_outline</span><strong>{{ mr.closedCases }}</strong> Closed</div>
              <div class="act-cell"><span class="material-icons-outlined">gavel</span><strong>{{ mr.courtHearings }}</strong> Hearings</div>
              <div class="act-cell"><span class="material-icons-outlined">home</span><strong>{{ mr.homeVisits }}</strong> Home Visits</div>
            </div>
          </div>
          <div class="monthly-section">
            <h4 class="mt-title"><span class="material-icons-outlined">stars</span> Key Highlights</h4>
            <ul class="hl-list"><li *ngFor="let h of mr.highlights">{{ h }}</li></ul>
          </div>
        </div>
      </div>

      <p class="gen-date animate-in">Report generated {{ today }}</p>
    </div>
  `,
  styles: [`
    .reports-page { max-width: 100%; padding-bottom: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h2 { font-size: 24px; font-weight: 700; }
    .subtitle { font-size: 15px; color: var(--text-light); margin-top: 4px; }
    .header-actions { display: flex; gap: 8px; }

    /* Search */
    .search-bar {
      display: flex; align-items: center; gap: 10px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 10px 16px;
      margin-bottom: 20px; transition: border-color var(--transition-fast);
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

    /* Stats row */
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
    .scard { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 20px; text-align: center; }
    .scard-val { display: block; font-size: 30px; font-weight: 800; color: var(--text-primary); }
    .scard-lbl { font-size: 13px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 4px; display: block; }
    .scard.high .scard-val { color: #e53e3e; }
    .scard.med .scard-val { color: #dd6b20; }
    .scard.low .scard-val { color: #38a169; }

    /* Report card containers */
    .rpt-card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; }
    .rc-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid var(--border); background: rgba(139,92,246,0.03); }
    .rc-header.clickable { cursor: pointer; }
    .rc-header.clickable:hover { background: rgba(139,92,246,0.06); }
    .rc-left { display: flex; align-items: center; gap: 14px; }
    .rc-avatar { width: 44px; height: 44px; border-radius: 12px; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .rc-title { font-size: 17px; font-weight: 700; margin: 0; }
    .rc-sub { font-size: 14px; color: var(--text-light); margin-top: 2px; }
    .rc-chev { font-size: 22px; color: var(--text-light); transition: transform 0.2s ease; }
    .rc-chev.open { transform: rotate(180deg); }
    .rc-body { padding: 0; }

    /* Child rows */
    .child-row { border-bottom: 1px solid var(--border-light); }
    .child-row:last-child { border-bottom: none; }
    .cr-header { display: flex; align-items: center; gap: 12px; padding: 14px 24px; cursor: pointer; transition: background 0.15s ease; }
    .cr-header:hover { background: rgba(139,92,246,0.03); }
    .cr-icon { font-size: 20px; color: var(--primary); opacity: 0.6; }
    .cr-name { font-size: 15px; font-weight: 600; flex: 1; }
    .cr-worker { font-size: 13px; color: var(--text-light); margin-right: 8px; }
    .cr-chev { font-size: 18px; color: var(--text-light); transition: transform 0.2s ease; }
    .cr-chev.open { transform: rotate(90deg); }

    /* Expanded child detail */
    .cr-detail { padding: 0 24px 16px 56px; border-left: 3px solid var(--primary); margin-left: 24px; background: rgba(139,92,246,0.015); }
    .sec { padding: 12px 0; border-bottom: 1px solid var(--border-light); }
    .sec:last-child { border-bottom: none; }
    .sec-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .sec-head .material-icons-outlined { font-size: 20px; color: var(--primary); }
    .sec-head h4 { font-size: 15px; font-weight: 700; margin: 0; }
    .sec ul { list-style: none; padding: 0; margin: 0; }
    .sec li { position: relative; padding: 4px 0 4px 20px; font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
    .sec li::before { content: ''; position: absolute; left: 0; top: 13px; width: 6px; height: 6px; border-radius: 50%; background: var(--primary); opacity: 0.4; }

    /* Month pills */
    .month-pills { display: flex; gap: 6px; }
    .mp { padding: 7px 16px; border-radius: var(--radius-full); border: 1px solid var(--border); background: transparent; font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font); color: var(--text-secondary); transition: all 0.15s ease; }
    .mp:hover { border-color: var(--primary); color: var(--primary); }
    .mp.active { background: var(--primary); color: white; border-color: var(--primary); }

    /* Mini stats inside monthly section */
    .mini-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 20px 24px; }
    .ms-item { background: rgba(139,92,246,0.04); border-radius: var(--radius-md); padding: 14px; text-align: center; border: 1px solid var(--border-light); }
    .ms-val { display: block; font-size: 26px; font-weight: 800; color: var(--text-primary); }
    .ms-lbl { font-size: 12px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .ms-item.high .ms-val { color: #e53e3e; }
    .ms-item.med .ms-val { color: #dd6b20; }
    .ms-item.low .ms-val { color: #38a169; }

    /* Monthly sections */
    .monthly-section { padding: 16px 24px; border-top: 1px solid var(--border-light); }
    .mt-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; margin: 0 0 12px; }
    .mt-title .material-icons-outlined { font-size: 20px; color: var(--primary); }
    .act-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .act-cell { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary); padding: 12px; background: rgba(139,92,246,0.02); border-radius: var(--radius-md); border: 1px solid var(--border-light); }
    .act-cell .material-icons-outlined { font-size: 20px; color: var(--primary); }
    .act-cell strong { color: var(--text-primary); }
    .hl-list { list-style: none; padding: 0; margin: 0; }
    .hl-list li { position: relative; padding: 5px 0 5px 20px; font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
    .hl-list li::before { content: ''; position: absolute; left: 0; top: 14px; width: 6px; height: 6px; border-radius: 50%; background: var(--primary); opacity: 0.5; }

    /* Footer */
    .gen-date { font-size: 13px; color: var(--text-light); text-align: right; margin-top: 16px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: var(--radius-md); font-weight: 600; font-size: 14px; border: none; cursor: pointer; font-family: var(--font); transition: all 0.15s ease; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
    .btn .material-icons-outlined { font-size: 18px; }
  `],
})
export class ReportsComponent implements OnInit {
  isFosterParent = false;
  isWorker = false;
  isSupervisor = false;
  pageTitle = 'Reports';
  headerSub = '';
  searchQuery = '';

  children: FosterChild[] = [];
  reports: ChildReport[] = [];
  monthlyReports: MonthlyReport[] = [];
  selectedMonthIdx = 0;
  workers: WorkerProfile[] = [];
  teamMonthlyReports: MonthlyReport[] = [];
  displayMonthly: MonthlyReport[] = [];

  expandedWorkers = new Set<number>();
  expandedChildren = new Set<number>();
  expandedWorkerChildren = new Set<string>();
  caseStats: { total: number; high: number; medium: number; low: number } | null = null;

  today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  constructor(
    private auth: AuthService,
    private fosterService: FosterParentService,
    private caseService: CaseService,
  ) {}

  ngOnInit(): void {
    const role = this.auth.getUserRole();
    this.isFosterParent = role === 'foster_parent';
    this.isSupervisor = role === 'supervisor';
    this.isWorker = !this.isFosterParent && !this.isSupervisor;

    if (this.isFosterParent) {
      this.pageTitle = 'Child Reports';
      this.headerSub = 'Progress summaries and milestones for each child in your care';
      const user = this.auth.getCurrentUser();
      if (user) {
        this.fosterService.getMyChildren(user.id).subscribe((c) => {
          this.children = c;
          this.buildChildReports(this.children);
        });
      }
    } else if (this.isWorker) {
      this.pageTitle = 'My Reports';
      this.headerSub = 'Child reports and monthly caseload analytics';
      this.caseService.getCases().subscribe((cases) => {
        this.children = this.casesToChildren(cases);
        this.buildChildReports(this.children);
        this.monthlyReports = this.generateMonthlyReports(cases.length, 'Jessica Hawkins');
        this.displayMonthly = this.monthlyReports;
        this.setCaseStats(this.monthlyReports[0]);
      });
    } else {
      this.pageTitle = 'Team Reports';
      this.headerSub = 'Comprehensive reports across all social workers and cases';
      this.caseService.getCases().subscribe((cases) => {
        this.children = this.casesToChildren(cases);
        this.buildChildReports(this.children, true);
        this.buildWorkerProfiles(cases.length);
        this.teamMonthlyReports = this.generateMonthlyReports(cases.length * 3, undefined, true);
        this.displayMonthly = this.teamMonthlyReports;
        this.setCaseStats(this.teamMonthlyReports[0]);
        if (this.workers.length) this.expandedWorkers.add(0);
      });
    }
  }

  private setCaseStats(mr: MonthlyReport): void {
    this.caseStats = { total: mr.totalCases, high: mr.highRisk, medium: mr.mediumRisk, low: mr.lowRisk };
  }

  toggleWorker(i: number): void {
    this.expandedWorkers.has(i) ? this.expandedWorkers.delete(i) : this.expandedWorkers.add(i);
  }

  toggleChild(i: number): void {
    this.expandedChildren.has(i) ? this.expandedChildren.delete(i) : this.expandedChildren.add(i);
  }

  getFilteredReports(): ChildReport[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.reports;
    return this.reports.filter(r =>
      r.childName.toLowerCase().includes(q) ||
      (r.workerName && r.workerName.toLowerCase().includes(q)) ||
      r.sections.some(s => s.label.toLowerCase().includes(q) || s.items.some(item => item.toLowerCase().includes(q)))
    );
  }

  getFilteredWorkers(): WorkerProfile[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.workers;
    return this.workers.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.childReports.some(cr => cr.childName.toLowerCase().includes(q))
    );
  }

  toggleWorkerChild(wi: number, ci: number): void {
    const key = `${wi}-${ci}`;
    this.expandedWorkerChildren.has(key) ? this.expandedWorkerChildren.delete(key) : this.expandedWorkerChildren.add(key);
  }

  isWorkerChildOpen(wi: number, ci: number): boolean {
    return this.expandedWorkerChildren.has(`${wi}-${ci}`);
  }

  /* ── Helpers ── */

  private casesToChildren(cases: any[]): FosterChild[] {
    return cases.map((cs: any) => {
      const parts = cs.child_name.split(' ');
      return {
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' ') || '',
        placement_type: cs.placement_type,
        permanency_goal: null,
        months_in_care: cs.months_in_care,
        has_medical_needs: false,
        has_behavioral_needs: false,
        has_disability: false,
      } as FosterChild;
    });
  }

  private buildChildReports(kids: FosterChild[], withWorker = false): void {
    const workerNames = ['Jessica Hawkins', 'Priya Patel', 'Marcus Williams'];
    this.reports = kids.map((c, i) => ({
      childName: c.first_name + ' ' + c.last_name,
      workerName: withWorker ? workerNames[i % workerNames.length] : undefined,
      sections: [
        {
          label: 'Placement Summary',
          icon: 'home',
          items: [
            'Placement type: ' + (c.placement_type || 'N/A'),
            'Permanency goal: ' + (c.permanency_goal || 'N/A'),
            'Months in current placement: ' + (c.months_in_care ?? 'N/A'),
            'Assigned social worker: ' + (withWorker ? workerNames[i % workerNames.length] : 'Jessica Hawkins'),
          ],
        },
        {
          label: 'Health & Wellness',
          icon: 'favorite',
          items: [
            c.has_medical_needs ? 'Active medical needs flagged — keep medical records up to date' : 'No active medical flags',
            c.has_behavioral_needs ? 'Behavioral support plan in place — next review in 30 days' : 'No behavioral concerns noted',
            c.has_disability ? 'Disability accommodations documented' : 'No disability accommodations required',
            'Last medical check-up: within the past 90 days',
          ],
        },
        {
          label: 'Education',
          icon: 'school',
          items: [
            'School enrollment status: Active',
            c.has_behavioral_needs ? 'IEP or behavioral plan on file' : 'No special education plan required',
            'Last report card uploaded: see Documents tab',
            'Parent-teacher conference: scheduled this quarter',
          ],
        },
        {
          label: 'Upcoming Milestones',
          icon: 'event',
          items: [
            'Next court hearing: see Calendar tab',
            'Placement review: within next 60 days',
            'Social worker visit: scheduled this month',
            'Document update reminder: upload any new medical or school records',
          ],
        },
      ],
    }));
  }

  private buildWorkerProfiles(myCaseCount: number): void {
    const workerDefs = [
      { name: 'Jessica Hawkins', cases: myCaseCount },
      { name: 'Priya Patel', cases: Math.max(3, myCaseCount - 1) },
      { name: 'Marcus Williams', cases: Math.max(2, myCaseCount - 2) },
    ];

    this.workers = workerDefs.map(wd => {
      const initials = wd.name.split(' ').map(w => w[0]).join('');
      const fakeCases = wd.cases;

      /* Generate fake children for this worker */
      const kidNames: string[][] = {
        'Jessica Hawkins': this.children.map(c => [c.first_name, c.last_name]),
        'Priya Patel': [['Sofia', 'Nguyen'], ['Jordan', 'Davis'], ['Emma', 'Martinez']],
        'Marcus Williams': [['Noah', 'Lee'], ['Zoe', 'Brown']],
      }[wd.name] || this.children.map(c => [c.first_name, c.last_name]);

      const kids: FosterChild[] = kidNames.map(([fn, ln]) => ({
        first_name: fn,
        last_name: ln,
        placement_type: 'Foster Home',
        permanency_goal: null,
        months_in_care: Math.floor(Math.random() * 24) + 3,
        has_medical_needs: Math.random() > 0.7,
        has_behavioral_needs: Math.random() > 0.6,
        has_disability: Math.random() > 0.85,
      } as FosterChild));

      const childReports: ChildReport[] = kids.map(c => ({
        childName: c.first_name + ' ' + c.last_name,
        workerName: wd.name,
        sections: [
          {
            label: 'Placement Summary',
            icon: 'home',
            items: [
              'Placement type: ' + (c.placement_type || 'N/A'),
              'Permanency goal: ' + (c.permanency_goal || 'N/A'),
              'Months in current placement: ' + (c.months_in_care ?? 'N/A'),
              'Assigned social worker: ' + wd.name,
            ],
          },
          {
            label: 'Health & Wellness',
            icon: 'favorite',
            items: [
              c.has_medical_needs ? 'Active medical needs flagged — keep medical records up to date' : 'No active medical flags',
              c.has_behavioral_needs ? 'Behavioral support plan in place — next review in 30 days' : 'No behavioral concerns noted',
              c.has_disability ? 'Disability accommodations documented' : 'No disability accommodations required',
              'Last medical check-up: within the past 90 days',
            ],
          },
          {
            label: 'Education',
            icon: 'school',
            items: [
              'School enrollment status: Active',
              c.has_behavioral_needs ? 'IEP or behavioral plan on file' : 'No special education plan required',
              'Last report card uploaded: see Documents tab',
              'Parent-teacher conference: scheduled this quarter',
            ],
          },
          {
            label: 'Upcoming Milestones',
            icon: 'event',
            items: [
              'Next court hearing: see Calendar tab',
              'Placement review: within next 60 days',
              'Social worker visit: scheduled this month',
              'Document update reminder: upload any new medical or school records',
            ],
          },
        ],
      }));

      const monthlyReports = this.generateMonthlyReports(fakeCases, wd.name);

      return {
        name: wd.name,
        initials,
        caseCount: fakeCases,
        children: kids,
        childReports,
        monthlyReports,
      };
    });
  }

  private generateMonthlyReports(total: number, workerName?: string, isTeam = false): MonthlyReport[] {
    const high = Math.max(1, Math.round(total * 0.2));
    const med = Math.max(1, Math.round(total * 0.35));
    const low = total - high - med;
    const prefix = isTeam ? 'Team' : (workerName || 'Worker');

    return [
      {
        month: 'March 2026',
        workerName: isTeam ? undefined : workerName,
        totalCases: total,
        highRisk: high,
        mediumRisk: med,
        lowRisk: low,
        newPlacements: isTeam ? 5 : 2,
        closedCases: isTeam ? 3 : 1,
        courtHearings: isTeam ? 11 : 4,
        homeVisits: total,
        highlights: [
          'All scheduled home visits completed on time',
          high + ' high-risk case' + (high > 1 ? 's' : '') + ' flagged — reviews in progress',
          (isTeam ? '5' : '2') + ' new placements initiated this month',
          isTeam ? 'AFCARS quarterly data submission deadline: March 31' : 'Case documentation fully up to date',
          isTeam ? 'Average caseload per worker: ' + Math.round(total / 3) + ' cases' : 'All client check-ins completed',
        ],
      },
      {
        month: 'February 2026',
        workerName: isTeam ? undefined : workerName,
        totalCases: total,
        highRisk: high + 1,
        mediumRisk: med,
        lowRisk: Math.max(0, low - 1),
        newPlacements: isTeam ? 7 : 3,
        closedCases: isTeam ? 4 : 2,
        courtHearings: isTeam ? 14 : 5,
        homeVisits: total - 1,
        highlights: [
          (isTeam ? '7' : '3') + ' new children placed in foster care during the month',
          (isTeam ? '4' : '2') + ' cases successfully closed — permanency achieved',
          (isTeam ? '14' : '5') + ' court hearings attended with positive outcomes',
          isTeam ? 'Training completed: Trauma-informed care refresher for all workers' : '1 home visit rescheduled — completed the following week',
          isTeam ? 'No overdue case reviews across the team' : 'Completed annual case review for all active cases',
        ],
      },
      {
        month: 'January 2026',
        workerName: isTeam ? undefined : workerName,
        totalCases: total - (isTeam ? 2 : 1),
        highRisk: high,
        mediumRisk: Math.max(0, med - 1),
        lowRisk: low,
        newPlacements: isTeam ? 3 : 1,
        closedCases: isTeam ? 2 : 1,
        courtHearings: isTeam ? 8 : 3,
        homeVisits: total - (isTeam ? 2 : 1),
        highlights: [
          'Annual case review cycle completed for all active cases',
          'Risk assessment model (CareAssist v4) deployed — accuracy improved to 92%',
          isTeam ? '3 emergency placements processed within 24 hours' : '1 emergency placement processed within 24 hours',
          'All documentation up to date for upcoming AFCARS reporting period',
          isTeam ? 'New team member onboarded: orientation and case shadowing completed' : 'Completed 12 hours continuing education credits',
        ],
      },
    ];
  }
}
