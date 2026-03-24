import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CaseSummary } from '../../models/interfaces';

@Component({
  selector: 'app-case-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="table-wrap card animate-in">
      <table class="case-table">
        <thead>
          <tr>
            <th>Case #</th>
            <th>Child</th>
            <th>Status</th>
            <th>Placement</th>
            <th>Months</th>
            <th>Flags</th>
            <th>Disruption Risk</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of cases" (click)="caseSelected.emit(c.id)"
              [class.selected]="c.id === selectedCaseId" class="clickable">
            <td class="case-num">{{ c.case_number }}</td>
            <td class="child-name">{{ c.child_name }}</td>
            <td><span class="badge" [class]="'status-' + c.status">{{ formatStatus(c.status) }}</span></td>
            <td>{{ c.placement_type || '—' }}</td>
            <td>{{ c.months_in_care }}</td>
            <td>
              <span class="flag-pill" *ngIf="c.flag_count">
                <span class="material-icons-outlined">flag</span> {{ c.flag_count }}
              </span>
              <span *ngIf="!c.flag_count" class="no-flags">—</span>
            </td>
            <td>
              <div class="priority-cell">
                <div class="mini-bar">
                  <div class="mini-fill" [style.width.%]="c.priority_score * 100"
                       [class]="getScoreClass(c.priority_score)"></div>
                </div>
                <span>{{ (c.priority_score * 100).toFixed(0) }}%</span>
              </div>
            </td>
            <td>
              <a [routerLink]="['/cases', c.id]" class="explore-btn" (click)="$event.stopPropagation()">
                <span class="material-icons-outlined">psychology</span>
                Explore
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrap { overflow-x: auto; }
    .case-table {
      width: 100%; border-collapse: collapse; font-size: 15px;
    }
    .case-table th {
      text-align: left; padding: 12px 16px; font-weight: 600; font-size: 15px;
      text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-light);
      border-bottom: 1px solid var(--border);
    }
    .case-table td {
      padding: 12px 16px; border-bottom: 1px solid var(--border-light);
    }
    tr.clickable { cursor: pointer; transition: background var(--transition-fast); }
    tr.clickable:hover { background: rgba(102,126,234,0.03); }
    tr.selected { background: rgba(102,126,234,0.06); }
    .case-num { font-weight: 600; color: var(--primary); font-size: 16px; }
    .child-name { font-weight: 600; }
    .flag-pill {
      display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px;
      background: rgba(229,62,62,0.08); color: var(--danger); border-radius: var(--radius-full);
      font-size: 15px; font-weight: 600;
    }
    .flag-pill .material-icons-outlined { font-size: 15px; }
    .no-flags { color: var(--text-light); }
    .priority-cell { display: flex; align-items: center; gap: 8px; }
    .mini-bar { width: 60px; height: 4px; background: var(--border-light); border-radius: 2px; overflow: hidden; }
    .mini-fill { height: 100%; border-radius: 2px; }
    .mini-fill.high { background: var(--danger); }
    .mini-fill.mid { background: var(--warning); }
    .mini-fill.low { background: var(--success); }
    .priority-cell span { font-size: 16px; font-weight: 600; color: var(--text-secondary); }
    .explore-btn {
      display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark, #5a6fd6));
      color: #fff; border-radius: var(--radius-full, 20px); font-size: 13px; font-weight: 600;
      text-decoration: none; white-space: nowrap; transition: opacity var(--transition-fast, 0.15s);
    }
    .explore-btn:hover { opacity: 0.85; }
    .explore-btn .material-icons-outlined { font-size: 15px; }
  `],
})
export class CaseTableComponent {
  @Input() cases: CaseSummary[] = [];
  @Input() selectedCaseId: number | null = null;
  @Output() caseSelected = new EventEmitter<number>();

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  getScoreClass(score: number): string {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'mid';
    return 'low';
  }
}
