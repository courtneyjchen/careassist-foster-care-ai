import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CaseService } from '../../services/case.service';
import { CaseDetail } from '../../models/interfaces';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="case-detail-page" *ngIf="caseData">
      <div class="page-header animate-in">
        <div class="header-left">
          <a routerLink="/cases" class="back-link">
            <span class="material-icons-outlined">arrow_back</span>
            Back to Cases
          </a>
          <h2>{{ caseData.child.first_name }} {{ caseData.child.last_name }}</h2>
          <span class="case-num">{{ caseData.case_number }}</span>
        </div>
        <span class="status-badge" [ngClass]="caseData.status">{{ caseData.status | titlecase }}</span>
      </div>

      <div class="detail-grid animate-in">
        <div class="detail-card">
          <h4>Priority Score</h4>
          <div class="score-display">
            <span class="score-big">{{ caseData.priority_score }}</span>
            <div class="score-bar"><div class="score-fill" [style.width.%]="caseData.priority_score"
                 [style.background]="caseData.priority_score >= 80 ? 'var(--gradient-danger)' : caseData.priority_score >= 60 ? 'var(--gradient-warning)' : 'var(--gradient-success)'"></div></div>
          </div>
        </div>
        <div class="detail-card">
          <h4>Placement</h4>
          <p class="detail-val">{{ caseData.placement_type | titlecase }}</p>
        </div>
        <div class="detail-card">
          <h4>Months in Care</h4>
          <p class="detail-val">{{ caseData.months_in_care }}</p>
        </div>
        <div class="detail-card">
          <h4>Permanency Goal</h4>
          <p class="detail-val">{{ caseData.permanency_goal | titlecase }}</p>
        </div>
      </div>

      <div class="section animate-in" *ngIf="caseData.flags.length > 0">
        <h3>Flags ({{ caseData.flags.length }})</h3>
        <div class="flag-cards">
          <div class="flag-card" *ngFor="let f of caseData.flags" [ngClass]="f.severity">
            <span class="flag-sev">{{ f.severity | uppercase }}</span>
            <strong>{{ f.flag_type | titlecase }}</strong>
            <p>{{ f.description }}</p>
          </div>
        </div>
      </div>

      <div class="section animate-in" *ngIf="caseData.notes.length > 0">
        <h3>Notes ({{ caseData.notes.length }})</h3>
        <div class="note-cards">
          <div class="note-card" *ngFor="let n of caseData.notes">
            <span class="note-type" [ngClass]="n.note_type">{{ n.note_type | titlecase }}</span>
            <p>{{ n.content }}</p>
            <span class="note-date">{{ n.created_at | date:'MM/dd/yyyy h:mm a' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .case-detail-page { max-width: 900px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 4px; }
    .back-link { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--primary); text-decoration: none; font-weight: 600; margin-bottom: 4px; }
    .back-link:hover { text-decoration: underline; }
    .back-link .material-icons-outlined { font-size: 16px; }
    h2 { font-size: 22px; font-weight: 700; }
    .case-num { font-size: 12px; color: var(--text-light); }
    .status-badge { padding: 4px 12px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-badge.active { background: rgba(56,178,172,0.12); color: #38b2ac; }
    .status-badge.under_review { background: rgba(236,201,75,0.12); color: #d69e2e; }

    .detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .detail-card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 16px; }
    .detail-card h4 { font-size: 11px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .detail-val { font-size: 20px; font-weight: 800; }
    .score-big { font-size: 28px; font-weight: 800; }
    .score-bar { width: 100%; height: 6px; background: var(--border); border-radius: var(--radius-full); margin-top: 6px; }
    .score-fill { height: 100%; border-radius: var(--radius-full); }

    .section { margin-bottom: 24px; }
    .section h3 { font-size: 15px; font-weight: 700; margin-bottom: 12px; }
    .flag-cards { display: flex; flex-direction: column; gap: 10px; }
    .flag-card { padding: 12px; border-radius: var(--radius-md); border-left: 3px solid; }
    .flag-card.critical { background: rgba(229,62,62,0.05); border-color: var(--danger); }
    .flag-card.high { background: rgba(237,137,54,0.05); border-color: var(--warning); }
    .flag-card.medium { background: rgba(236,201,75,0.05); border-color: #ecc94b; }
    .flag-sev { font-size: 9px; font-weight: 800; letter-spacing: 0.5px; }
    .flag-card p { font-size: 12px; margin-top: 4px; color: var(--text-secondary); }

    .note-cards { display: flex; flex-direction: column; gap: 8px; }
    .note-card { padding: 12px; background: var(--bg); border-radius: var(--radius-md); }
    .note-type { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); text-transform: uppercase; }
    .note-type.general { background: rgba(139,92,246,0.12); color: var(--primary); }
    .note-type.visit { background: rgba(56,178,172,0.12); color: #38b2ac; }
    .note-type.court { background: rgba(237,137,54,0.12); color: var(--warning); }
    .note-card p { font-size: 13px; margin-top: 6px; line-height: 1.5; }
    .note-date { font-size: 10px; color: var(--text-light); margin-top: 4px; display: block; }
  `],
})
export class CaseDetailComponent implements OnInit {
  caseData: CaseDetail | null = null;

  constructor(private route: ActivatedRoute, private caseService: CaseService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.caseService.getCaseDetail(id).subscribe((c) => (this.caseData = c));
    }
  }
}
