import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Resource {
  title: string;
  description: string;
  category: string;
  icon: string;
  phone?: string;
  url?: string;
}

@Component({
  selector: 'app-foster-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="resources-page">
      <div class="page-header animate-in">
        <div>
          <h2>Foster Parent Resources</h2>
          <p class="subtitle">Support services, training, and guidance for foster families</p>
        </div>
      </div>

      <!-- Search -->
      <div class="search-bar animate-in">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search resources..." class="search-input" />
        <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- Category Tabs -->
      <div class="cat-tabs animate-in">
        <button class="cat-tab" [class.active]="activeCat === 'all'" (click)="activeCat = 'all'">
          <span class="material-icons-outlined">apps</span> All
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'training'" (click)="activeCat = 'training'">
          <span class="material-icons-outlined">school</span> Training
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'support'" (click)="activeCat = 'support'">
          <span class="material-icons-outlined">support_agent</span> Support
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'financial'" (click)="activeCat = 'financial'">
          <span class="material-icons-outlined">payments</span> Financial
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'health'" (click)="activeCat = 'health'">
          <span class="material-icons-outlined">favorite</span> Health
        </button>
        <button class="cat-tab" [class.active]="activeCat === 'legal'" (click)="activeCat = 'legal'">
          <span class="material-icons-outlined">gavel</span> Legal
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
    .page-header h2 { font-size: 24px; font-weight: 700; }
    .subtitle { font-size: 15px; color: var(--text-light); margin-top: 4px; }

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

    .cat-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
    .cat-tab {
      display: flex; align-items: center; gap: 5px; padding: 8px 16px;
      border-radius: var(--radius-full); border: 1px solid var(--border);
      background: transparent; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast); font-family: var(--font);
      color: var(--text-secondary);
    }
    .cat-tab .material-icons-outlined { font-size: 18px; }
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
      width: 42px; height: 42px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .rc-icon .material-icons-outlined { font-size: 22px; color: white; }
    .rc-icon.training { background: linear-gradient(135deg, #667eea, #764ba2); }
    .rc-icon.support { background: linear-gradient(135deg, #38b2ac, #319795); }
    .rc-icon.financial { background: linear-gradient(135deg, #ed8936, #dd6b20); }
    .rc-icon.health { background: linear-gradient(135deg, #e53e3e, #c53030); }
    .rc-icon.legal { background: linear-gradient(135deg, #9f7aea, #805ad5); }

    .rc-cat {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 3px 10px; border-radius: var(--radius-full);
    }
    .rc-cat.training { background: rgba(102,126,234,0.1); color: #667eea; }
    .rc-cat.support { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .rc-cat.financial { background: rgba(237,137,54,0.1); color: #dd6b20; }
    .rc-cat.health { background: rgba(229,62,62,0.1); color: #e53e3e; }
    .rc-cat.legal { background: rgba(159,122,234,0.1); color: #805ad5; }

    .resource-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .resource-card p { font-size: 14px; color: var(--text-secondary); line-height: 1.6; flex: 1; }

    .rc-footer {
      display: flex; align-items: center; gap: 16px; margin-top: 14px;
      padding-top: 12px; border-top: 1px solid var(--border-light);
    }
    .rc-contact {
      display: flex; align-items: center; gap: 4px;
      font-size: 14px; color: var(--text-light);
    }
    .rc-contact .material-icons-outlined { font-size: 16px; }
    .rc-link {
      display: flex; align-items: center; gap: 4px; font-size: 14px;
      font-weight: 600; color: var(--primary); text-decoration: none;
      margin-left: auto;
    }
    .rc-link:hover { text-decoration: underline; }
    .rc-link .material-icons-outlined { font-size: 16px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; padding: 60px;
      color: var(--text-light); text-align: center;
    }
    .empty-state .material-icons-outlined { font-size: 48px; opacity: 0.3; margin-bottom: 12px; }

    @media (max-width: 1200px) { .resource-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .resource-grid { grid-template-columns: 1fr; } }
  `],
})
export class FosterResourcesComponent {
  activeCat = 'all';
  searchQuery = '';

  resources: Resource[] = [
    {
      title: 'Pre-Service Foster Parent Training',
      description: 'Required foundational training covering trauma-informed care, child development, and working with the child welfare system. Available in person and online.',
      category: 'training', icon: 'school',
      url: 'https://example.com/preservice',
    },
    {
      title: 'Trauma-Informed Parenting Course',
      description: 'Learn evidence-based strategies for supporting children who have experienced trauma, abuse, or neglect. 8-week online program with live Q&A sessions.',
      category: 'training', icon: 'psychology',
      url: 'https://example.com/trauma-informed',
    },
    {
      title: 'Managing Challenging Behaviors',
      description: 'Workshops on de-escalation techniques, positive reinforcement strategies, and creating structured routines for children with behavioral needs.',
      category: 'training', icon: 'self_improvement',
      phone: '1-800-555-3456',
    },
    {
      title: 'Foster Parent Support Groups',
      description: 'Weekly peer support meetings — connect with other foster families, share experiences, and get advice from experienced foster parents in your area.',
      category: 'support', icon: 'groups',
      phone: '1-800-555-7890',
    },
    {
      title: '24/7 Foster Family Crisis Line',
      description: 'Immediate phone support for foster families in crisis. Trained counselors available around the clock for emergency guidance and intervention.',
      category: 'support', icon: 'support_agent',
      phone: '1-800-555-HELP',
    },
    {
      title: 'Respite Care Services',
      description: 'Temporary relief care for foster parents. Licensed respite providers can care for your foster children for up to 14 days per year at no cost.',
      category: 'support', icon: 'volunteer_activism',
      phone: '1-800-555-REST',
    },
    {
      title: 'Monthly Foster Care Stipend',
      description: 'Financial assistance to cover clothing, food, school supplies, and daily needs. Rates vary by age and level of care. Contact your agency for current rates.',
      category: 'financial', icon: 'payments',
      phone: '1-800-555-4357',
    },
    {
      title: 'Special Needs Supplemental Payment',
      description: 'Additional financial support for children with medical, behavioral, or developmental needs requiring specialized care or equipment.',
      category: 'financial', icon: 'account_balance',
      phone: '1-800-555-CARE',
    },
    {
      title: 'Foster Child Health Insurance (Medicaid)',
      description: 'All foster children are covered by Medicaid. Includes medical, dental, vision, mental health, and prescription drug coverage at no cost to foster parents.',
      category: 'health', icon: 'local_hospital',
      phone: '1-800-555-MED1',
    },
    {
      title: 'Child Therapy & Counseling Referrals',
      description: 'Free referrals to licensed therapists specializing in foster care, attachment disorders, grief, and childhood trauma. Covered under Medicaid.',
      category: 'health', icon: 'healing',
      phone: '1-800-555-THER',
    },
    {
      title: 'Foster Parent Rights & Responsibilities',
      description: 'Comprehensive guide to your legal rights as a foster parent, including court participation, notice requirements, and the Foster Parents\' Bill of Rights.',
      category: 'legal', icon: 'gavel',
      url: 'https://example.com/foster-rights',
    },
    {
      title: 'Adoption from Foster Care Guide',
      description: 'Step-by-step information about adopting a child currently in your foster care. Covers legal process, timelines, subsidies, and post-adoption support.',
      category: 'legal', icon: 'family_restroom',
      url: 'https://example.com/adoption-guide',
    },
  ];

  getFiltered(): Resource[] {
    let result = this.resources;
    if (this.activeCat !== 'all') result = result.filter(r => r.category === this.activeCat);
    const q = this.searchQuery.toLowerCase().trim();
    if (q) result = result.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
    return result;
  }
}
