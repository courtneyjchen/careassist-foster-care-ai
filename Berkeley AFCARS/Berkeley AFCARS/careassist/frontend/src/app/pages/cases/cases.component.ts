import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CaseService } from '../../services/case.service';
import { CaseDetail, CaseNote } from '../../models/interfaces';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cases-page">
      <!-- Header -->
      <div class="page-header animate-in">
        <div>
          <h2>Cases</h2>
          <p class="subtitle">{{ cases.length }} cases in your caseload</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <span class="material-icons-outlined">search</span>
            <input type="text" placeholder="Search cases..." [(ngModel)]="searchQuery" (input)="filterCases()" />
          </div>
        </div>
      </div>

      <!-- Filter Pills -->
      <div class="filter-bar animate-in">
        <button class="filter-pill" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">
          All <span class="pill-count">{{ cases.length }}</span>
        </button>
        <button class="filter-pill" [class.active]="activeFilter === 'critical'" (click)="setFilter('critical')">
          <span class="dot critical"></span> Critical
        </button>
        <button class="filter-pill" [class.active]="activeFilter === 'high'" (click)="setFilter('high')">
          <span class="dot high"></span> High
        </button>
        <button class="filter-pill" [class.active]="activeFilter === 'medium'" (click)="setFilter('medium')">
          <span class="dot medium"></span> Medium
        </button>
        <button class="filter-pill" [class.active]="activeFilter === 'low'" (click)="setFilter('low')">
          <span class="dot low"></span> Low
        </button>
      </div>

      <!-- Case Cards -->
      <div class="cases-list stagger">
        <div class="case-card animate-in"
             *ngFor="let c of filteredCases; let i = index"
             [class.expanded]="expandedId === c.id"
             [class.critical]="c.priority_score >= 80"
             [class.high]="c.priority_score >= 60 && c.priority_score < 80"
             [class.medium]="c.priority_score >= 40 && c.priority_score < 60"
             [class.low]="c.priority_score < 40"
             [style.animation-delay]="i * 40 + 'ms'">

          <!-- Severity Bar -->
          <div class="severity-bar" [style.background]="getSeverityGradient(c.priority_score)"></div>

          <!-- Card Header (always visible) -->
          <div class="card-header" (click)="toggleExpand(c.id)">
            <div class="header-left">
              <div class="case-avatar" [style.background]="getSeverityGradient(c.priority_score)">
                {{ c.child.first_name[0] }}{{ c.child.last_name[0] }}
              </div>
              <div class="case-meta">
                <h3>{{ c.child.first_name }} {{ c.child.last_name }}</h3>
                <span class="case-number">{{ c.case_number }}</span>
              </div>
            </div>
            <div class="header-right">
              <span class="status-badge" [ngClass]="c.status">{{ c.status | titlecase }}</span>
              <div class="score-mini">
                <span class="score-num">{{ c.priority_score }}</span>
                <div class="score-bar-mini">
                  <div class="score-fill-mini" [style.width.%]="c.priority_score"
                       [style.background]="getSeverityGradient(c.priority_score)"></div>
                </div>
              </div>
              <span class="material-icons-outlined expand-icon">
                {{ expandedId === c.id ? 'expand_less' : 'expand_more' }}
              </span>
            </div>
          </div>

          <!-- Expanded Content -->
          <div class="card-body" *ngIf="expandedId === c.id">
            <!-- Child Info Tags -->
            <div class="info-section">
              <h4><span class="material-icons-outlined">person</span> Child Information</h4>
              <div class="info-tags">
                <span class="info-tag" *ngIf="c.child.date_of_birth">
                  <span class="material-icons-outlined">cake</span>
                  DOB: {{ c.child.date_of_birth | date:'MM/dd/yyyy' }}
                </span>
                <span class="info-tag" *ngIf="c.child.prior_placements !== null">
                  <span class="material-icons-outlined">sync_alt</span>
                  Prior Placements: {{ c.child.prior_placements }}
                </span>
                <span class="info-tag" *ngIf="c.child.prior_adoptions !== null">
                  <span class="material-icons-outlined">family_restroom</span>
                  Prior Adoptions: {{ c.child.prior_adoptions }}
                </span>
                <span class="info-tag" *ngIf="c.child.has_medical_needs">
                  <span class="material-icons-outlined">medical_services</span>
                  Medical Needs
                </span>
                <span class="info-tag" *ngIf="c.child.has_behavioral_needs">
                  <span class="material-icons-outlined">psychology</span>
                  Behavioral Needs
                </span>
                <span class="info-tag" *ngIf="c.child.has_disability">
                  <span class="material-icons-outlined">accessible</span>
                  Disability
                </span>
              </div>
            </div>

            <!-- Risk Assessment -->
            <div class="info-section">
              <h4><span class="material-icons-outlined">assessment</span> Risk Assessment</h4>
              <div class="risk-bar-wrap">
                <div class="risk-score-display">
                  <span class="risk-label">Priority Score</span>
                  <span class="risk-value" [style.color]="getSeverityColor(c.priority_score)">{{ c.priority_score }}%</span>
                </div>
                <div class="risk-bar">
                  <div class="risk-fill" [style.width.%]="c.priority_score"
                       [style.background]="getSeverityGradient(c.priority_score)"></div>
                </div>
              </div>
              <div class="case-details-grid">
                <div class="detail-item">
                  <span class="detail-label">Placement</span>
                  <span class="detail-value">{{ c.placement_type | titlecase }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Months in Care</span>
                  <span class="detail-value">{{ c.months_in_care }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Permanency Goal</span>
                  <span class="detail-value">{{ c.permanency_goal | titlecase }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Removal Reason</span>
                  <span class="detail-value">{{ c.removal_reason | titlecase }}</span>
                </div>
              </div>
            </div>

            <!-- Flags -->
            <div class="info-section" *ngIf="c.flags && c.flags.length > 0">
              <h4><span class="material-icons-outlined">flag</span> Flags ({{ c.flags.length }})</h4>
              <div class="flags-list">
                <div class="flag-item" *ngFor="let f of c.flags" [ngClass]="f.severity">
                  <div class="flag-header">
                    <span class="flag-severity-badge" [ngClass]="f.severity">{{ f.severity | uppercase }}</span>
                    <span class="flag-type">{{ f.flag_type | titlecase }}</span>
                    <span class="flag-confidence">{{ (f.confidence * 100).toFixed(0) }}%</span>
                  </div>
                  <p class="flag-desc">{{ f.description }}</p>
                  <p class="flag-rec" *ngIf="f.recommendation">
                    <span class="material-icons-outlined">lightbulb</span>
                    {{ f.recommendation }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="info-section">
              <h4><span class="material-icons-outlined">sticky_note_2</span> Notes ({{ c.notes?.length || 0 }})</h4>
              <div class="notes-list" *ngIf="c.notes && c.notes.length > 0">
                <div class="note-item" *ngFor="let n of c.notes">
                  <div class="note-header">
                    <span class="note-type-badge" [ngClass]="n.note_type">{{ n.note_type | titlecase }}</span>
                    <span class="note-date">{{ n.created_at | date:'MM/dd/yyyy h:mm a' }}</span>
                  </div>
                  <p class="note-content">{{ n.content }}</p>
                </div>
              </div>
              <p class="empty-notes" *ngIf="!c.notes || c.notes.length === 0">No notes yet.</p>

              <!-- Add Note -->
              <div class="add-note-form">
                <select [(ngModel)]="newNoteType" class="note-type-select">
                  <option value="general">General</option>
                  <option value="visit">Visit</option>
                  <option value="court">Court</option>
                  <option value="medical">Medical</option>
                  <option value="placement">Placement</option>
                </select>
                <div class="note-input-wrap">
                  <textarea [(ngModel)]="newNoteContent" placeholder="Add a note..." rows="2" class="note-input"></textarea>
                  <button class="btn-add-note" (click)="addNote(c.id)" [disabled]="!newNoteContent.trim()">
                    <span class="material-icons-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cases-page { max-width: 100%; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
    .page-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 13px; color: var(--text-light); margin-top: 2px; }

    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-full);
      padding: 8px 14px;
    }
    .search-box .material-icons-outlined { font-size: 18px; color: var(--text-light); }
    .search-box input {
      border: none; outline: none; background: transparent; font-size: 13px;
      font-family: var(--font); width: 200px;
    }

    .filter-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .filter-pill {
      display: flex; align-items: center; gap: 6px; padding: 6px 14px;
      border-radius: var(--radius-full); border: 1px solid var(--border);
      background: transparent; font-size: 12px; font-weight: 600;
      color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast);
      font-family: var(--font);
    }
    .filter-pill:hover { border-color: var(--primary); }
    .filter-pill.active { background: var(--primary); color: white; border-color: var(--primary); }
    .pill-count { font-size: 10px; opacity: 0.7; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .dot.critical { background: var(--danger); }
    .dot.high { background: var(--warning); }
    .dot.medium { background: #ecc94b; }
    .dot.low { background: var(--success); }

    .cases-list { display: flex; flex-direction: column; gap: 12px; }

    .case-card {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden; position: relative;
      transition: all var(--transition-med);
    }
    .case-card:hover { box-shadow: var(--shadow-md); }

    .severity-bar { width: 4px; position: absolute; left: 0; top: 0; bottom: 0; border-radius: 4px 0 0 4px; }

    .card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px 16px 24px; cursor: pointer;
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .case-avatar {
      width: 40px; height: 40px; border-radius: var(--radius-md); display: flex;
      align-items: center; justify-content: center; font-weight: 700; font-size: 14px;
      color: white;
    }
    .case-meta h3 { font-size: 15px; font-weight: 700; }
    .case-number { font-size: 11px; color: var(--text-light); }

    .header-right { display: flex; align-items: center; gap: 14px; }
    .status-badge {
      padding: 3px 10px; border-radius: var(--radius-full); font-size: 10px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-badge.active { background: rgba(56,178,172,0.12); color: #38b2ac; }
    .status-badge.under_review { background: rgba(236,201,75,0.12); color: #d69e2e; }
    .status-badge.archived { background: rgba(160,174,192,0.12); color: #a0aec0; }

    .score-mini { display: flex; align-items: center; gap: 8px; }
    .score-num { font-size: 14px; font-weight: 800; }
    .score-bar-mini { width: 60px; height: 5px; background: var(--border); border-radius: var(--radius-full); }
    .score-fill-mini { height: 100%; border-radius: var(--radius-full); transition: width 0.6s ease; }
    .expand-icon { color: var(--text-light); font-size: 22px; transition: transform 0.2s ease; }

    /* Card Body */
    .card-body { padding: 0 24px 20px; }

    .info-section { margin-top: 18px; }
    .info-section h4 {
      display: flex; align-items: center; gap: 6px; font-size: 13px;
      font-weight: 700; color: var(--text-secondary); margin-bottom: 10px;
    }
    .info-section h4 .material-icons-outlined { font-size: 17px; color: var(--primary); }

    .info-tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .info-tag {
      display: flex; align-items: center; gap: 5px; padding: 5px 12px;
      background: rgba(139,92,246,0.06); border-radius: var(--radius-full);
      font-size: 12px; color: var(--text-secondary);
    }
    .info-tag .material-icons-outlined { font-size: 14px; color: var(--primary); }

    .risk-bar-wrap { margin-bottom: 16px; }
    .risk-score-display { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .risk-label { font-size: 12px; color: var(--text-light); }
    .risk-value { font-size: 16px; font-weight: 800; }
    .risk-bar { width: 100%; height: 8px; background: var(--border); border-radius: var(--radius-full); }
    .risk-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.8s ease; }

    .case-details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .detail-item { background: var(--bg); padding: 10px; border-radius: var(--radius-md); }
    .detail-label { font-size: 10px; color: var(--text-light); display: block; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 14px; font-weight: 700; display: block; margin-top: 4px; }

    /* Flags */
    .flags-list { display: flex; flex-direction: column; gap: 10px; }
    .flag-item {
      padding: 12px; border-radius: var(--radius-md); border-left: 3px solid transparent;
    }
    .flag-item.critical { background: rgba(229,62,62,0.05); border-left-color: var(--danger); }
    .flag-item.high { background: rgba(237,137,54,0.05); border-left-color: var(--warning); }
    .flag-item.medium { background: rgba(236,201,75,0.05); border-left-color: #ecc94b; }
    .flag-item.low { background: rgba(56,178,172,0.05); border-left-color: var(--success); }
    .flag-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .flag-severity-badge {
      padding: 2px 8px; border-radius: var(--radius-full); font-size: 9px;
      font-weight: 800; letter-spacing: 0.5px;
    }
    .flag-severity-badge.critical { background: rgba(229,62,62,0.15); color: var(--danger); }
    .flag-severity-badge.high { background: rgba(237,137,54,0.15); color: var(--warning); }
    .flag-severity-badge.medium { background: rgba(236,201,75,0.15); color: #d69e2e; }
    .flag-severity-badge.low { background: rgba(56,178,172,0.15); color: var(--success); }
    .flag-type { font-size: 13px; font-weight: 700; }
    .flag-confidence { font-size: 11px; color: var(--text-light); margin-left: auto; }
    .flag-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
    .flag-rec {
      display: flex; align-items: flex-start; gap: 5px; font-size: 11px;
      color: var(--primary); margin-top: 6px; font-weight: 600;
    }
    .flag-rec .material-icons-outlined { font-size: 14px; }

    /* Notes */
    .notes-list { display: flex; flex-direction: column; gap: 10px; }
    .note-item { padding: 10px; background: var(--bg); border-radius: var(--radius-md); }
    .note-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .note-type-badge {
      padding: 2px 8px; border-radius: var(--radius-full); font-size: 9px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .note-type-badge.general { background: rgba(139,92,246,0.12); color: var(--primary); }
    .note-type-badge.visit { background: rgba(56,178,172,0.12); color: #38b2ac; }
    .note-type-badge.court { background: rgba(237,137,54,0.12); color: var(--warning); }
    .note-type-badge.medical { background: rgba(229,62,62,0.12); color: var(--danger); }
    .note-type-badge.placement { background: rgba(66,153,225,0.12); color: #4299e1; }
    .note-date { font-size: 10px; color: var(--text-light); }
    .note-content { font-size: 13px; line-height: 1.5; color: var(--text-secondary); }
    .empty-notes { font-size: 12px; color: var(--text-light); font-style: italic; }

    .add-note-form { margin-top: 12px; display: flex; gap: 8px; }
    .note-type-select {
      padding: 8px 10px; border-radius: var(--radius-md); border: 1px solid var(--border);
      font-size: 12px; font-family: var(--font); background: var(--surface); flex-shrink: 0;
    }
    .note-input-wrap { flex: 1; display: flex; gap: 8px; align-items: flex-end; }
    .note-input {
      flex: 1; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border);
      font-size: 12px; font-family: var(--font); resize: none; background: var(--surface);
    }
    .note-input:focus { border-color: var(--primary); outline: none; }
    .btn-add-note {
      width: 36px; height: 36px; border-radius: var(--radius-md); border: none;
      background: var(--primary); color: white; cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: all var(--transition-fast);
    }
    .btn-add-note:hover { background: var(--primary-dark); }
    .btn-add-note:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-add-note .material-icons-outlined { font-size: 18px; }

    @media (max-width: 900px) {
      .case-details-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class CasesComponent implements OnInit {
  cases: CaseDetail[] = [];
  filteredCases: CaseDetail[] = [];
  expandedId: number | null = null;
  searchQuery = '';
  activeFilter = 'all';
  newNoteType: 'general' | 'visit' | 'court' | 'medical' | 'placement' = 'general';
  newNoteContent = '';

  constructor(private caseService: CaseService) {}

  ngOnInit(): void {
    this.caseService.getCases().subscribe((list) => {
      const detailObs = list.map((c) => this.caseService.getCaseDetail(c.id));
      if (detailObs.length === 0) return;
      forkJoin(detailObs).subscribe((details) => {
        this.cases = details;
        this.filterCases();
      });
    });
  }

  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  setFilter(f: string): void {
    this.activeFilter = f;
    this.filterCases();
  }

  filterCases(): void {
    let result = [...this.cases];
    if (this.activeFilter !== 'all') {
      result = result.filter((c) => {
        const s = c.priority_score;
        if (this.activeFilter === 'critical') return s >= 80;
        if (this.activeFilter === 'high') return s >= 60 && s < 80;
        if (this.activeFilter === 'medium') return s >= 40 && s < 60;
        if (this.activeFilter === 'low') return s < 40;
        return true;
      });
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.child.first_name.toLowerCase().includes(q) ||
          c.child.last_name.toLowerCase().includes(q) ||
          c.case_number.toLowerCase().includes(q)
      );
    }
    this.filteredCases = result;
  }

  addNote(caseId: number): void {
    if (!this.newNoteContent.trim()) return;
    this.caseService.addNote(caseId, this.newNoteType, this.newNoteContent).subscribe((note) => {
      const c = this.cases.find((x) => x.id === caseId);
      if (c) {
        c.notes = c.notes || [];
        c.notes.push(note);
      }
      this.newNoteContent = '';
    });
  }

  getSeverityGradient(score: number): string {
    if (score >= 80) return 'var(--gradient-danger)';
    if (score >= 60) return 'var(--gradient-warning)';
    if (score >= 40) return 'linear-gradient(135deg, #ecc94b, #d69e2e)';
    return 'var(--gradient-success)';
  }

  getSeverityColor(score: number): string {
    if (score >= 80) return 'var(--danger)';
    if (score >= 60) return 'var(--warning)';
    if (score >= 40) return '#d69e2e';
    return 'var(--success)';
  }
}
