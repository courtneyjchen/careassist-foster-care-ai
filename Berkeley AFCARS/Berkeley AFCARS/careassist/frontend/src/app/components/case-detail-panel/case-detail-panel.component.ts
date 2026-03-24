import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CaseService } from '../../services/case.service';
import { CaseDetail } from '../../models/interfaces';

@Component({
  selector: 'app-case-detail-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel slide-in" *ngIf="detail">
      <div class="panel-header">
        <h3>{{ detail.child.first_name }} {{ detail.child.last_name }}</h3>
        <span class="case-num">{{ detail.case_number }}</span>
      </div>

      <!-- Disruption Risk -->
      <div class="urgency-section">
        <div class="urgency-label">
          <span>Disruption Risk</span>
          <span class="urgency-value" [class]="getUrgencyClass()">{{ (detail.priority_score * 100).toFixed(0) }}%</span>
        </div>
        <div class="urgency-bar">
          <div class="urgency-fill" [style.width.%]="detail.priority_score * 100"
               [class]="getUrgencyClass()"></div>
        </div>
      </div>

      <!-- Flags -->
      <div class="flags-section" *ngIf="detail.flags.length">
        <h4><span class="material-icons-outlined">flag</span> Flags ({{ detail.flags.length }})</h4>
        <div class="flag-item" *ngFor="let f of detail.flags">
          <div class="flag-header">
            <span class="badge" [class]="'badge-' + f.severity">{{ f.severity }}</span>
            <span class="flag-conf">{{ (f.confidence * 100).toFixed(0) }}%</span>
          </div>
          <p class="flag-type">{{ f.flag_type }}</p>
          <p class="flag-desc" *ngIf="f.description">{{ f.description }}</p>
        </div>
      </div>

      <!-- Case Details -->
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Status</span>
          <span class="badge" [class]="'status-' + detail.status">{{ formatStatus(detail.status) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Placement</span>
          <span>{{ detail.placement_type || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Months in Care</span>
          <span>{{ detail.months_in_care }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Goal</span>
          <span>{{ detail.permanency_goal || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Worker</span>
          <span>{{ detail.assigned_worker || '—' }}</span>
        </div>
      </div>

      <!-- Explore Case Button -->
      <button class="explain-btn" (click)="openExplanation()">
        <span class="material-icons-outlined">psychology</span>
        Explore This Case in Detail
      </button>

      <!-- AI Link -->
      <button class="ai-link" (click)="askAI()">
        <span class="material-icons-outlined">auto_awesome</span>
        Ask AI about this case
      </button>
    </div>
  `,
  styles: [`
    .panel {
      width: 340px; height: 100%; overflow-y: auto;
      background: var(--surface); border-left: 1px solid var(--border);
      padding: 20px;
    }
    .panel-header h3 { font-size: 17px; font-weight: 700; }
    .case-num { font-size: 16px; color: var(--text-secondary); }

    .urgency-section { margin: 16px 0; }
    .urgency-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 16px; color: var(--text-secondary); }
    .urgency-value { font-weight: 700; font-size: 16px; }
    .urgency-bar { height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden; }
    .urgency-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
    .urgency-fill.high, .urgency-value.high { color: var(--danger); background: var(--danger); }
    .urgency-fill.mid, .urgency-value.mid { color: var(--warning); background: var(--warning); }
    .urgency-fill.low, .urgency-value.low { color: var(--success); background: var(--success); }
    .urgency-value.high { background: none; }
    .urgency-value.mid { background: none; }
    .urgency-value.low { background: none; }

    .flags-section { margin: 16px 0; }
    .flags-section h4 { display: flex; align-items: center; gap: 6px; font-size: 15px; margin-bottom: 10px; }
    .flags-section h4 .material-icons-outlined { font-size: 16px; color: var(--danger); }
    .flag-item { padding: 10px; background: var(--bg); border-radius: var(--radius-md); margin-bottom: 8px; }
    .flag-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .flag-conf { font-size: 15px; font-weight: 600; color: var(--text-secondary); }
    .flag-type { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .flag-desc { font-size: 16px; color: var(--text-secondary); line-height: 1.5; }

    .details-grid { display: grid; gap: 12px; margin: 16px 0; }
    .detail-item { display: flex; justify-content: space-between; align-items: center; font-size: 15px; }
    .detail-label { color: var(--text-secondary); font-size: 16px; }

    .ai-link {
      display: flex; align-items: center; gap: 8px; padding: 12px; margin-top: 16px;
      background: rgba(192,132,252,0.06); border: 1px solid rgba(192,132,252,0.15);
      border-radius: var(--radius-md); font-size: 15px; font-weight: 600;
      color: #7c3aed; cursor: pointer; transition: all var(--transition-fast);
    }
    .ai-link:hover { background: rgba(192,132,252,0.12); }
    .ai-link .material-icons-outlined { font-size: 18px; }

    /* Explain Score Button */
    .explain-btn {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 10px 14px; margin-top: 16px;
      border-radius: var(--radius-md); border: 2px solid var(--primary);
      background: rgba(102,126,234,0.06); color: var(--primary);
      font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .explain-btn:hover {
      background: var(--primary); color: white;
      box-shadow: 0 4px 12px rgba(102,126,234,0.3);
    }
    .explain-btn .material-icons-outlined { font-size: 18px; }
  `],
})
export class CaseDetailPanelComponent implements OnChanges {
  @Input() caseId: number | null = null;
  detail: CaseDetail | null = null;

  constructor(private caseService: CaseService, private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['caseId'] && this.caseId) {
      this.caseService.getCaseDetail(this.caseId).subscribe((d) => {
        this.detail = d;
      });
    }
  }

  openExplanation(): void {
    if (!this.detail) return;
    this.router.navigate(['/cases', this.detail.id], { queryParams: { explain: '1' } });
  }

  getUrgencyClass(): string {
    if (!this.detail) return 'low';
    const s = this.detail.priority_score;
    if (s >= 0.7) return 'high';
    if (s >= 0.4) return 'mid';
    return 'low';
  }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  askAI(): void {
    if (!this.detail) return;
    const child = this.detail.child;
    const prompt = `Tell me about case ${this.detail.case_number} for ${child.first_name} ${child.last_name}`;
    this.router.navigate(['/ai-assistant'], { queryParams: { q: prompt } });
  }
}
