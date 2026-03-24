import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RecordEntry {
  title: string;
  date: string;
  provider: string;
  type: string;
  category: string;
  details?: string;
}

@Component({
  selector: 'app-youth-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="records-page">
      <div class="page-header animate-in">
        <div>
          <h2>My Records</h2>
          <p class="subtitle">Your complete medical and education history</p>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar animate-in">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search records..." class="search-input" />
        <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- Category Tabs -->
      <div class="cat-tabs animate-in">
        <button class="cat-tab" [class.active]="activeCat === 'medical'" (click)="activeCat = 'medical'">
          <span class="material-icons-outlined">medical_services</span> Medical History
          <span class="cat-count">{{ getMedicalCount() }}</span>
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'education'" (click)="activeCat = 'education'">
          <span class="material-icons-outlined">school</span> School Records
          <span class="cat-count">{{ getEducationCount() }}</span>
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'placement'" (click)="activeCat = 'placement'">
          <span class="material-icons-outlined">history</span> Placement History
          <span class="cat-count">{{ getPlacementCount() }}</span>
        </button>
      </div>

      <!-- Timeline -->
      <div class="timeline animate-in">
        <div class="tl-item" *ngFor="let r of getFiltered(); let last = last" [class.last]="last">
          <div class="tl-dot" [ngClass]="r.category"></div>
          <div class="tl-card">
            <div class="tl-head">
              <div class="tl-icon" [ngClass]="r.category">
                <span class="material-icons-outlined">{{ getCatIcon(r.category) }}</span>
              </div>
              <div class="tl-info">
                <h4>{{ r.title }}</h4>
                <span class="tl-meta">{{ r.provider }} · {{ r.date }}</span>
              </div>
              <span class="tl-type" [ngClass]="r.type">{{ r.type | titlecase }}</span>
            </div>
            <p class="tl-details" *ngIf="r.details">{{ r.details }}</p>
          </div>
        </div>
      </div>

      <div class="empty-state animate-in" *ngIf="getFiltered().length === 0">
        <span class="material-icons-outlined">folder_off</span>
        <p>No records found in this category.</p>
      </div>
    </div>
  `,
  styles: [`
    .records-page { max-width: 100%; }
    .page-header { margin-bottom: 20px; }
    .page-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 15px; color: var(--text-light); margin-top: 2px; }

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

    .cat-tabs { display: flex; gap: 6px; margin-bottom: 24px; flex-wrap: wrap; }
    .cat-tab {
      display: flex; align-items: center; gap: 5px; padding: 8px 16px;
      border-radius: var(--radius-full); border: 1px solid var(--border);
      background: transparent; font-size: 16px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast); font-family: var(--font);
      color: var(--text-secondary);
    }
    .cat-tab .material-icons-outlined { font-size: 16px; }
    .cat-tab:hover { border-color: var(--primary); color: var(--primary); }
    .cat-tab.active { background: var(--primary); color: white; border-color: var(--primary); }
    .cat-count {
      background: rgba(255,255,255,0.25); padding: 1px 7px;
      border-radius: var(--radius-full); font-size: 14px;
    }

    /* Timeline */
    .timeline { position: relative; padding-left: 28px; }
    .timeline::before {
      content: ''; position: absolute; left: 9px; top: 6px; bottom: 6px;
      width: 2px; background: var(--border);
    }

    .tl-item { position: relative; margin-bottom: 16px; }
    .tl-item.last { margin-bottom: 0; }
    .tl-dot {
      position: absolute; left: -28px; top: 20px; width: 20px; height: 20px;
      border-radius: 50%; border: 3px solid var(--surface);
      z-index: 1;
    }
    .tl-dot.medical { background: #e53e3e; }
    .tl-dot.education { background: #38b2ac; }
    .tl-dot.placement { background: #667eea; }

    .tl-card {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: 16px 20px;
      transition: all var(--transition-fast);
    }
    .tl-card:hover { box-shadow: var(--shadow-sm); }

    .tl-head { display: flex; align-items: center; gap: 12px; }
    .tl-icon {
      width: 38px; height: 38px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .tl-icon .material-icons-outlined { font-size: 18px; color: white; }
    .tl-icon.medical { background: linear-gradient(135deg, #e53e3e, #c53030); }
    .tl-icon.education { background: linear-gradient(135deg, #38b2ac, #319795); }
    .tl-icon.placement { background: linear-gradient(135deg, #667eea, #764ba2); }

    .tl-info { flex: 1; }
    .tl-info h4 { font-size: 16px; font-weight: 700; }
    .tl-meta { font-size: 16px; color: var(--text-light); }

    .tl-type {
      font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 3px 10px; border-radius: var(--radius-full);
    }
    .tl-type.checkup { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .tl-type.vaccination { background: rgba(102,126,234,0.1); color: #667eea; }
    .tl-type.prescription { background: rgba(237,137,54,0.1); color: #dd6b20; }
    .tl-type.dental { background: rgba(159,122,234,0.1); color: #805ad5; }
    .tl-type.therapy { background: rgba(229,62,62,0.1); color: #e53e3e; }
    .tl-type.vision { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .tl-type.report { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .tl-type.transcript { background: rgba(102,126,234,0.1); color: #667eea; }
    .tl-type.iep { background: rgba(237,137,54,0.1); color: #dd6b20; }
    .tl-type.attendance { background: rgba(159,122,234,0.1); color: #805ad5; }
    .tl-type.transfer { background: rgba(102,126,234,0.1); color: #667eea; }
    .tl-type.entry { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .tl-type.exit { background: rgba(229,62,62,0.1); color: #e53e3e; }

    .tl-details {
      margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-light);
      font-size: 15px; color: var(--text-secondary); line-height: 1.5;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; padding: 60px;
      color: var(--text-light); text-align: center;
    }
    .empty-state .material-icons-outlined { font-size: 48px; opacity: 0.3; margin-bottom: 12px; }
  `],
})
export class YouthRecordsComponent {
  activeCat = 'medical';
  searchQuery = '';

  records: RecordEntry[] = [
    // Medical
    { title: 'Annual Physical Exam', date: 'Jan 15, 2026', provider: 'Dr. Sarah Chen, Valley Medical',
      type: 'checkup', category: 'medical',
      details: 'Height: 5\'10", Weight: 155 lbs. Blood pressure normal. All vitals within range. Recommended annual follow-up.' },
    { title: 'Flu Vaccination', date: 'Oct 20, 2025', provider: 'County Health Dept',
      type: 'vaccination', category: 'medical',
      details: 'Seasonal influenza vaccine administered. No adverse reactions.' },
    { title: 'Dental Cleaning & Exam', date: 'Sep 8, 2025', provider: 'Dr. Rivera, Smile Dental',
      type: 'dental', category: 'medical',
      details: 'Routine cleaning completed. One cavity detected and filled. Next visit in 6 months.' },
    { title: 'COVID-19 Booster', date: 'Aug 5, 2025', provider: 'Walgreens Pharmacy',
      type: 'vaccination', category: 'medical' },
    { title: 'Therapy Session (Final)', date: 'Jul 12, 2025', provider: 'Dr. Lisa Park, Youth Counseling Center',
      type: 'therapy', category: 'medical',
      details: 'Completed 12-session trauma-informed CBT program. Significant improvement in anxiety symptoms. Discharge with self-care plan.' },
    { title: 'Vision Exam', date: 'Jun 1, 2025', provider: 'Dr. Thompson, ClearView Eye Care',
      type: 'vision', category: 'medical',
      details: 'Vision 20/25 in both eyes. Mild astigmatism. Prescription updated for corrective lenses.' },
    { title: 'Tdap Booster', date: 'Mar 22, 2025', provider: 'County Health Dept',
      type: 'vaccination', category: 'medical' },
    { title: 'Annual Physical Exam', date: 'Jan 10, 2025', provider: 'Dr. Sarah Chen, Valley Medical',
      type: 'checkup', category: 'medical',
      details: 'All vitals normal. Growth on track. Recommended continued therapy sessions.' },

    // Education
    { title: 'Senior Year Report Card — Semester 1', date: 'Jan 2026', provider: 'Lincoln High School',
      type: 'report', category: 'education',
      details: 'GPA: 3.1. English: B+, Math: B, History: A-, Science: B, Art: A. Good attendance record.' },
    { title: 'Junior Year Final Transcript', date: 'Jun 2025', provider: 'Lincoln High School',
      type: 'transcript', category: 'education',
      details: 'GPA: 2.9. Completed all required credits. On track for graduation. Recommended for summer internship program.' },
    { title: 'IEP Meeting Notes', date: 'Apr 2025', provider: 'Lincoln High School',
      type: 'iep', category: 'education',
      details: 'IEP goals reviewed and updated. Extended time on tests continued. Counseling support maintained. Social skills group participation noted as beneficial.' },
    { title: 'Sophomore Year Final Transcript', date: 'Jun 2024', provider: 'Lincoln High School',
      type: 'transcript', category: 'education',
      details: 'GPA: 2.7. Attendance improved from prior year. Enrolled in tutoring program for math.' },
    { title: 'Freshman Year Report Card', date: 'Jun 2023', provider: 'Westside High School',
      type: 'report', category: 'education',
      details: 'GPA: 2.4. Adjustment period noted due to school transfer mid-year. Perfect attendance in Q4.' },
    { title: 'School Transfer Documentation', date: 'Nov 2022', provider: 'Westside High School',
      type: 'attendance', category: 'education',
      details: 'Transferred from Jefferson Middle School due to placement change. Records forwarded. Enrolled in transition support program.' },

    // Placement
    { title: 'Aged Out — Transition to Independent Living', date: 'Feb 2026', provider: 'CareAssist System',
      type: 'exit', category: 'placement',
      details: 'Aged out of care at 18. Extended foster care services opted in. Independent living plan in place with housing stipend through June 2027.' },
    { title: 'Residential Care Placement', date: 'Feb 2023', provider: 'Sunrise Youth Center',
      type: 'entry', category: 'placement',
      details: 'Placed in residential care to provide structured environment and therapeutic services. Social worker: Jessica Hawkins.' },
    { title: 'Foster Home — Garcia Household', date: 'Jun 2021', provider: 'Maria Garcia (Foster Parent)',
      type: 'entry', category: 'placement',
      details: 'Placed with licensed foster parent Maria Garcia. Stable placement for 20 months before transition to residential care.' },
    { title: 'Group Home Placement', date: 'Aug 2020', provider: 'Horizons Group Home',
      type: 'entry', category: 'placement',
      details: 'Initial group home placement following removal. Stay duration: 10 months.' },
    { title: 'Removal from Home', date: 'Aug 2020', provider: 'County Child Services',
      type: 'entry', category: 'placement',
      details: 'Removed from biological home due to abandonment. Emergency placement initiated.' },
  ];

  getFiltered(): RecordEntry[] {
    let result = this.records.filter(r => r.category === this.activeCat);
    const q = this.searchQuery.toLowerCase().trim();
    if (q) result = result.filter(r => r.title.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || (r.details && r.details.toLowerCase().includes(q)));
    return result;
  }

  getMedicalCount(): number { return this.records.filter(r => r.category === 'medical').length; }
  getEducationCount(): number { return this.records.filter(r => r.category === 'education').length; }
  getPlacementCount(): number { return this.records.filter(r => r.category === 'placement').length; }

  getCatIcon(cat: string): string {
    const map: Record<string, string> = { medical: 'medical_services', education: 'school', placement: 'home' };
    return map[cat] || 'description';
  }
}
