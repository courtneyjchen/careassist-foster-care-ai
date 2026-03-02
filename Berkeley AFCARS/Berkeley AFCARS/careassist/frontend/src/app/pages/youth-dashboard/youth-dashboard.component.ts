import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-youth-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="youth-dash">
      <div class="dash-header animate-in">
        <div>
          <h2>My Portal</h2>
          <p class="subtitle">Access your records, resources, and support network</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats stagger">
        <div class="qs-card animate-in">
          <div class="qs-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <span class="material-icons-outlined">folder_shared</span>
          </div>
          <div class="qs-info">
            <span class="qs-label">My Records</span>
            <span class="qs-value">4</span>
          </div>
        </div>
        <div class="qs-card animate-in">
          <div class="qs-icon" style="background: linear-gradient(135deg, #38b2ac 0%, #319795 100%)">
            <span class="material-icons-outlined">local_hospital</span>
          </div>
          <div class="qs-info">
            <span class="qs-label">Medical Records</span>
            <span class="qs-value">6</span>
          </div>
        </div>
        <div class="qs-card animate-in">
          <div class="qs-icon" style="background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)">
            <span class="material-icons-outlined">chat_bubble_outline</span>
          </div>
          <div class="qs-info">
            <span class="qs-label">Messages</span>
            <span class="qs-value">2</span>
          </div>
        </div>
        <div class="qs-card animate-in">
          <div class="qs-icon" style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%)">
            <span class="material-icons-outlined">lightbulb</span>
          </div>
          <div class="qs-info">
            <span class="qs-label">Resources</span>
            <span class="qs-value">12</span>
          </div>
        </div>
      </div>

      <!-- Quick Access Cards -->
      <div class="section-header animate-in"><h3>Quick Access</h3></div>
      <div class="access-grid stagger">

        <a routerLink="/records" class="access-card animate-in">
          <div class="ac-icon med"><span class="material-icons-outlined">medical_services</span></div>
          <div class="ac-body">
            <h4>Medical History</h4>
            <p>View your vaccination records, checkup history, prescriptions, and health summaries.</p>
          </div>
          <span class="material-icons-outlined ac-arrow">arrow_forward</span>
        </a>

        <a routerLink="/records" class="access-card animate-in">
          <div class="ac-icon edu"><span class="material-icons-outlined">school</span></div>
          <div class="ac-body">
            <h4>School Records</h4>
            <p>Access report cards, transcripts, IEP documents, and attendance history.</p>
          </div>
          <span class="material-icons-outlined ac-arrow">arrow_forward</span>
        </a>

        <a routerLink="/messages" class="access-card animate-in">
          <div class="ac-icon msg"><span class="material-icons-outlined">people</span></div>
          <div class="ac-body">
            <h4>Contact Support Network</h4>
            <p>Message your former social workers and foster parents for guidance and support.</p>
          </div>
          <span class="material-icons-outlined ac-arrow">arrow_forward</span>
        </a>

        <a routerLink="/resources" class="access-card animate-in">
          <div class="ac-icon res"><span class="material-icons-outlined">auto_stories</span></div>
          <div class="ac-body">
            <h4>Resources & Support</h4>
            <p>Find housing assistance, job training, education aid, healthcare, and mentorship programs.</p>
          </div>
          <span class="material-icons-outlined ac-arrow">arrow_forward</span>
        </a>
      </div>

      <!-- My Info Summary -->
      <div class="section-header animate-in" style="margin-top: 8px;"><h3>My Information</h3></div>
      <div class="info-card animate-in">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Full Name</span>
            <span class="info-val">Jordan Davis</span>
          </div>
          <div class="info-item">
            <span class="info-label">Date of Birth</span>
            <span class="info-val">March 14, 2008</span>
          </div>
          <div class="info-item">
            <span class="info-label">Case Number</span>
            <span class="info-val">AC-2024-0734</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status</span>
            <span class="info-val status">Aged Out — Independent</span>
          </div>
          <div class="info-item">
            <span class="info-label">Last Placement</span>
            <span class="info-val">Residential Care</span>
          </div>
          <div class="info-item">
            <span class="info-label">Time in Care</span>
            <span class="info-val">36 months</span>
          </div>
          <div class="info-item">
            <span class="info-label">Former Social Worker</span>
            <span class="info-val">Samantha Townsend</span>
          </div>
          <div class="info-item">
            <span class="info-label">Former Foster Parent</span>
            <span class="info-val">Maria Garcia</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .youth-dash { max-width: 100%; }
    .dash-header { margin-bottom: 20px; }
    .dash-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 13px; color: var(--text-light); margin-top: 2px; }

    .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .qs-card {
      display: flex; align-items: center; gap: 14px; padding: 18px;
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); transition: all var(--transition-med);
    }
    .qs-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .qs-icon {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .qs-icon .material-icons-outlined { font-size: 22px; color: white; }
    .qs-label { font-size: 12px; color: var(--text-secondary); display: block; }
    .qs-value { font-size: 24px; font-weight: 800; display: block; margin-top: 2px; }

    .section-header { margin-bottom: 16px; }
    .section-header h3 { font-size: 17px; font-weight: 700; }

    /* Access Cards */
    .access-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 28px; }
    .access-card {
      display: flex; align-items: center; gap: 16px; padding: 20px;
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); cursor: pointer; text-decoration: none;
      color: inherit; transition: all var(--transition-med);
    }
    .access-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); border-color: var(--primary); }
    .ac-icon {
      width: 52px; height: 52px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ac-icon .material-icons-outlined { font-size: 24px; color: white; }
    .ac-icon.med { background: linear-gradient(135deg, #e53e3e, #c53030); }
    .ac-icon.edu { background: linear-gradient(135deg, #38b2ac, #319795); }
    .ac-icon.msg { background: linear-gradient(135deg, #667eea, #764ba2); }
    .ac-icon.res { background: linear-gradient(135deg, #ed8936, #dd6b20); }
    .ac-body { flex: 1; }
    .ac-body h4 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .ac-body p { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
    .ac-arrow { font-size: 20px; color: var(--text-light); transition: all var(--transition-fast); }
    .access-card:hover .ac-arrow { color: var(--primary); transform: translateX(3px); }

    /* Info Card */
    .info-card {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: 24px;
    }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 11px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; }
    .info-val { font-size: 14px; font-weight: 600; }
    .info-val.status {
      color: #38b2ac; background: rgba(56,178,172,0.1);
      padding: 2px 10px; border-radius: var(--radius-full); font-size: 12px; width: fit-content;
    }

    @media (max-width: 1200px) {
      .quick-stats { grid-template-columns: repeat(2, 1fr); }
      .access-grid { grid-template-columns: 1fr; }
      .info-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class YouthDashboardComponent {
  constructor(private auth: AuthService) {}
}
