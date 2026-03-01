import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FosterParentService, FosterChild } from '../../services/foster-parent.service';

interface ChildReport {
  childName: string;
  sections: { label: string; icon: string; items: string[] }[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Foster Parent Reports -->
    <div class="reports-page" *ngIf="isFosterParent; else workerReports">
      <div class="page-header animate-in">
        <div>
          <h2>Child Reports</h2>
          <p class="subtitle">Summaries and progress updates for each child</p>
        </div>
      </div>

      <!-- Child selector pills -->
      <div class="pill-row animate-in">
        <button class="pill" *ngFor="let c of children; let i = index"
                [class.active]="selectedIdx === i" (click)="selectedIdx = i">
          {{ c.first_name }} {{ c.last_name }}
        </button>
      </div>

      <!-- Report card -->
      <div class="report-card animate-in" *ngIf="reports[selectedIdx] as rpt">
        <div class="rpt-header">
          <span class="material-icons-outlined">person</span>
          <h3>{{ rpt.childName }}</h3>
          <span class="rpt-date">Report generated {{ today }}</span>
        </div>

        <div class="rpt-section" *ngFor="let s of rpt.sections">
          <div class="rpt-section-head">
            <span class="material-icons-outlined">{{ s.icon }}</span>
            <h4>{{ s.label }}</h4>
          </div>
          <ul>
            <li *ngFor="let item of s.items">{{ item }}</li>
          </ul>
        </div>

        <div class="rpt-footer">
          <button class="btn btn-outline btn-sm">
            <span class="material-icons-outlined">print</span> Print
          </button>
          <button class="btn btn-outline btn-sm">
            <span class="material-icons-outlined">download</span> Download PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Social Worker placeholder -->
    <ng-template #workerReports>
      <div class="placeholder-page animate-in">
        <div class="placeholder-icon">
          <span class="material-icons-outlined">assessment</span>
        </div>
        <h2>Reports</h2>
        <p>Analytics and reporting dashboard coming soon. Generate AFCARS-compliant reports and caseload analytics.</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .reports-page { max-width: 100%; }
    .page-header { margin-bottom: 20px; }
    .page-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 13px; color: var(--text-light); margin-top: 2px; }

    .pill-row { display: flex; gap: 8px; margin-bottom: 20px; }
    .pill {
      padding: 8px 18px; border-radius: var(--radius-full); border: 1px solid var(--border);
      background: transparent; font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: var(--font); transition: all var(--transition-fast);
      color: var(--text-secondary);
    }
    .pill:hover { border-color: var(--primary); color: var(--primary); }
    .pill.active { background: var(--primary); color: white; border-color: var(--primary); }

    .report-card {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden;
    }
    .rpt-header {
      display: flex; align-items: center; gap: 10px; padding: 16px 24px;
      border-bottom: 1px solid var(--border); background: rgba(139,92,246,0.03);
    }
    .rpt-header .material-icons-outlined { font-size: 22px; color: var(--primary); }
    .rpt-header h3 { font-size: 16px; font-weight: 700; flex: 1; }
    .rpt-date { font-size: 11px; color: var(--text-light); }

    .rpt-section { padding: 16px 24px; border-bottom: 1px solid var(--border-light); }
    .rpt-section:last-of-type { border-bottom: none; }
    .rpt-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .rpt-section-head .material-icons-outlined { font-size: 18px; color: var(--primary); }
    .rpt-section-head h4 { font-size: 14px; font-weight: 700; }
    .rpt-section ul { list-style: none; padding: 0; margin: 0; }
    .rpt-section li {
      position: relative; padding: 4px 0 4px 18px; font-size: 13px;
      color: var(--text-secondary); line-height: 1.5;
    }
    .rpt-section li::before {
      content: ''; position: absolute; left: 0; top: 12px;
      width: 6px; height: 6px; border-radius: 50%; background: var(--primary); opacity: 0.4;
    }

    .rpt-footer {
      display: flex; justify-content: flex-end; gap: 8px; padding: 12px 24px;
      border-top: 1px solid var(--border);
    }

    .btn { padding: 8px 16px; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; font-family: var(--font); }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
    .btn-sm { padding: 7px 14px; font-size: 12px; }

    .placeholder-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; }
    .placeholder-icon { width: 72px; height: 72px; border-radius: var(--radius-lg); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .placeholder-icon .material-icons-outlined { font-size: 36px; color: white; }
    h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: var(--text-secondary); max-width: 400px; line-height: 1.6; }
  `],
})
export class ReportsComponent implements OnInit {
  isFosterParent = false;
  children: FosterChild[] = [];
  selectedIdx = 0;
  reports: ChildReport[] = [];
  today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  constructor(
    private auth: AuthService,
    private fosterService: FosterParentService,
  ) {}

  ngOnInit(): void {
    const role = this.auth.getUserRole();
    this.isFosterParent = role === 'foster_parent';

    if (this.isFosterParent) {
      const user = this.auth.getCurrentUser();
      if (user) {
        this.fosterService.getMyChildren(user.id).subscribe((c) => {
          this.children = c;
          this.buildReports();
        });
      }
    }
  }

  private buildReports(): void {
    this.reports = this.children.map((c) => ({
      childName: c.first_name + ' ' + c.last_name,
      sections: [
        {
          label: 'Placement Summary',
          icon: 'home',
          items: [
            'Placement type: ' + (c.placement_type || 'N/A'),
            'Permanency goal: ' + (c.permanency_goal || 'N/A'),
            'Months in current placement: ' + (c.months_in_care ?? 'N/A'),
            'Assigned social worker: Samantha Townsend',
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
}
