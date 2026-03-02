import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Resource {
  title: string;
  description: string;
  category: string;
  icon: string;
  phone?: string;
  url?: string;
}

@Component({
  selector: 'app-youth-resources',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resources-page">
      <div class="page-header animate-in">
        <div>
          <h2>Resources & Support</h2>
          <p class="subtitle">Programs and services available to help you succeed</p>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="cat-tabs animate-in">
        <button class="cat-tab" [class.active]="activeCat === 'all'" (click)="activeCat = 'all'">
          <span class="material-icons-outlined">apps</span> All
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'housing'" (click)="activeCat = 'housing'">
          <span class="material-icons-outlined">home</span> Housing
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'employment'" (click)="activeCat = 'employment'">
          <span class="material-icons-outlined">work</span> Employment
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'education'" (click)="activeCat = 'education'">
          <span class="material-icons-outlined">school</span> Education
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'health'" (click)="activeCat = 'health'">
          <span class="material-icons-outlined">favorite</span> Health
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'mentorship'" (click)="activeCat = 'mentorship'">
          <span class="material-icons-outlined">people</span> Mentorship
        </button>
      </div>

      <!-- Resource Cards -->
      <div class="resource-grid stagger">
        <div class="resource-card animate-in" *ngFor="let r of getFiltered()">
          <div class="rc-head">
            <div class="rc-icon" [ngClass]="r.category">
              <span class="material-icons-outlined">{{ r.icon }}</span>
            </div>
            <span class="rc-cat" [ngClass]="r.category">{{ r.category | titlecase }}</span>
          </div>
          <h4>{{ r.title }}</h4>
          <p>{{ r.description }}</p>
          <div class="rc-footer">
            <span class="rc-contact" *ngIf="r.phone">
              <span class="material-icons-outlined">phone</span> {{ r.phone }}
            </span>
            <a class="rc-link" *ngIf="r.url" [href]="r.url" target="_blank">
              <span class="material-icons-outlined">open_in_new</span> Learn More
            </a>
          </div>
        </div>
      </div>

      <div class="empty-state animate-in" *ngIf="getFiltered().length === 0">
        <span class="material-icons-outlined">search_off</span>
        <p>No resources found in this category.</p>
      </div>
    </div>
  `,
  styles: [`
    .resources-page { max-width: 100%; }
    .page-header { margin-bottom: 20px; }
    .page-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 13px; color: var(--text-light); margin-top: 2px; }

    .cat-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
    .cat-tab {
      display: flex; align-items: center; gap: 5px; padding: 8px 16px;
      border-radius: var(--radius-full); border: 1px solid var(--border);
      background: transparent; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast); font-family: var(--font);
      color: var(--text-secondary);
    }
    .cat-tab .material-icons-outlined { font-size: 16px; }
    .cat-tab:hover { border-color: var(--primary); color: var(--primary); }
    .cat-tab.active { background: var(--primary); color: white; border-color: var(--primary); }

    .resource-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

    .resource-card {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: 20px;
      transition: all var(--transition-med); display: flex; flex-direction: column;
    }
    .resource-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .rc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .rc-icon {
      width: 40px; height: 40px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .rc-icon .material-icons-outlined { font-size: 20px; color: white; }
    .rc-icon.housing { background: linear-gradient(135deg, #667eea, #764ba2); }
    .rc-icon.employment { background: linear-gradient(135deg, #ed8936, #dd6b20); }
    .rc-icon.education { background: linear-gradient(135deg, #38b2ac, #319795); }
    .rc-icon.health { background: linear-gradient(135deg, #e53e3e, #c53030); }
    .rc-icon.mentorship { background: linear-gradient(135deg, #9f7aea, #805ad5); }

    .rc-cat {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 3px 10px; border-radius: var(--radius-full);
    }
    .rc-cat.housing { background: rgba(102,126,234,0.1); color: #667eea; }
    .rc-cat.employment { background: rgba(237,137,54,0.1); color: #dd6b20; }
    .rc-cat.education { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .rc-cat.health { background: rgba(229,62,62,0.1); color: #e53e3e; }
    .rc-cat.mentorship { background: rgba(159,122,234,0.1); color: #805ad5; }

    .resource-card h4 { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
    .resource-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.5; flex: 1; }

    .rc-footer {
      display: flex; align-items: center; gap: 16px; margin-top: 14px;
      padding-top: 12px; border-top: 1px solid var(--border-light);
    }
    .rc-contact {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: var(--text-light);
    }
    .rc-contact .material-icons-outlined { font-size: 14px; }
    .rc-link {
      display: flex; align-items: center; gap: 4px; font-size: 12px;
      font-weight: 600; color: var(--primary); text-decoration: none;
      margin-left: auto;
    }
    .rc-link:hover { text-decoration: underline; }
    .rc-link .material-icons-outlined { font-size: 14px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; padding: 60px;
      color: var(--text-light); text-align: center;
    }
    .empty-state .material-icons-outlined { font-size: 48px; opacity: 0.3; margin-bottom: 12px; }

    @media (max-width: 1200px) { .resource-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .resource-grid { grid-template-columns: 1fr; } }
  `],
})
export class YouthResourcesComponent {
  activeCat = 'all';

  resources: Resource[] = [
    {
      title: 'Transitional Housing Program',
      description: 'Subsidized housing for youth aged 18-24 aging out of foster care. Includes case management and life skills training.',
      category: 'housing', icon: 'home',
      phone: '1-800-555-HOME', url: 'https://example.com/housing',
    },
    {
      title: 'Independent Living Stipend',
      description: 'Monthly financial assistance of up to $1,000 for rent, utilities, and basic needs while pursuing education or employment.',
      category: 'housing', icon: 'payments',
      phone: '1-800-555-4357',
    },
    {
      title: 'Youth Job Training Program',
      description: 'Free vocational training, resume workshops, and job placement assistance specifically for former foster youth.',
      category: 'employment', icon: 'work',
      url: 'https://example.com/jobs',
    },
    {
      title: 'Workforce Innovation Center',
      description: 'Paid internships, apprenticeships, and career counseling. Partnered with local employers for direct placement.',
      category: 'employment', icon: 'engineering',
      phone: '1-800-555-WORK',
    },
    {
      title: 'Chafee Education & Training Grant',
      description: 'Up to $5,000/year for post-secondary education and vocational training for current and former foster youth.',
      category: 'education', icon: 'school',
      url: 'https://example.com/chafee',
    },
    {
      title: 'Tuition Waiver Program',
      description: 'Full tuition waiver at state universities and community colleges for youth who aged out of foster care.',
      category: 'education', icon: 'menu_book',
      url: 'https://example.com/tuition',
    },
    {
      title: 'Extended Medicaid Coverage',
      description: 'Healthcare coverage until age 26 for former foster youth. Covers medical, dental, vision, and mental health services.',
      category: 'health', icon: 'local_hospital',
      phone: '1-800-555-MED1',
    },
    {
      title: 'Mental Health Support Line',
      description: '24/7 counseling and crisis support specifically for foster care alumni. Free and confidential.',
      category: 'health', icon: 'psychology',
      phone: '1-800-555-HELP',
    },
    {
      title: 'Therapy & Counseling Services',
      description: 'Free individual and group therapy sessions. Trauma-informed care specialists experienced with foster care youth.',
      category: 'health', icon: 'healing',
      phone: '1-800-555-CARE',
    },
    {
      title: 'Foster Care Alumni Mentors',
      description: 'Connect with adults who successfully transitioned out of foster care. One-on-one mentoring and peer support groups.',
      category: 'mentorship', icon: 'people',
      url: 'https://example.com/mentors',
    },
    {
      title: 'Life Skills Workshop Series',
      description: 'Free workshops covering budgeting, cooking, car maintenance, apartment hunting, and navigating benefits systems.',
      category: 'mentorship', icon: 'lightbulb',
      phone: '1-800-555-LIFE',
    },
    {
      title: 'Legal Aid for Foster Alumni',
      description: 'Free legal assistance for housing disputes, employment issues, record expungement, and accessing entitled benefits.',
      category: 'mentorship', icon: 'gavel',
      url: 'https://example.com/legal-aid',
    },
  ];

  getFiltered(): Resource[] {
    if (this.activeCat === 'all') return this.resources;
    return this.resources.filter(r => r.category === this.activeCat);
  }
}
