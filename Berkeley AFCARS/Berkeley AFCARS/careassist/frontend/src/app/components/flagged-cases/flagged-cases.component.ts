import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlaggedCaseSummary } from '../../models/interfaces';

@Component({
  selector: 'app-flagged-cases',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flagged-grid stagger">
      <div class="flagged-card card animate-in" *ngFor="let c of cases"
           (click)="caseSelected.emit(c.case_id)">
        <div class="flagged-header">
          <span class="badge" [class]="'badge-' + (c.top_flag_severity || 'medium')">
            {{ c.top_flag_severity || 'N/A' }}
          </span>
          <span class="flag-count">
            <span class="material-icons-outlined">flag</span>
            {{ c.flag_count }}
          </span>
        </div>
        <div class="flagged-body">
          <h4>{{ c.child_name }}</h4>
          <p class="case-num">{{ c.case_number }}</p>
          <p class="flag-type" *ngIf="c.top_flag_type">{{ c.top_flag_type }}</p>
        </div>
        <div class="flagged-footer">
          <div class="score-bar">
            <div class="score-fill" [style.width.%]="c.priority_score * 100"
                 [class]="getScoreClass(c.priority_score)"></div>
          </div>
          <span class="score-label">{{ (c.priority_score * 100).toFixed(0) }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flagged-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .flagged-card {
      padding: 16px;
      cursor: pointer;
      transition: all var(--transition-med);
    }
    .flagged-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .flagged-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .flag-count {
      display: flex; align-items: center; gap: 4px;
      font-size: 16px; color: var(--text-secondary);
    }
    .flag-count .material-icons-outlined { font-size: 16px; }
    .flagged-body h4 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .case-num { font-size: 16px; color: var(--text-secondary); }
    .flag-type { font-size: 16px; color: var(--primary); margin-top: 6px; font-weight: 500; }
    .flagged-footer { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
    .score-bar {
      flex: 1; height: 4px; background: var(--border-light); border-radius: 2px; overflow: hidden;
    }
    .score-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
    .score-fill.high { background: var(--danger); }
    .score-fill.mid { background: var(--warning); }
    .score-fill.low { background: var(--success); }
    .score-label { font-size: 16px; font-weight: 700; color: var(--text-secondary); min-width: 32px; text-align: right; }
  `],
})
export class FlaggedCasesComponent {
  @Input() cases: FlaggedCaseSummary[] = [];
  @Output() caseSelected = new EventEmitter<number>();

  getScoreClass(score: number): string {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'mid';
    return 'low';
  }
}
