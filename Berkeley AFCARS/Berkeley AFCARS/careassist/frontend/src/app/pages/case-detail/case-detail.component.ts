import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CaseService } from '../../services/case.service';
import { FeaturesService } from '../../services/features.service';
import { AuthService } from '../../services/auth.service';
import {
  CaseDetail, CaseExplanation, FeatureContribution,
  RiskScoreHistory, SiblingLink, TimelineEvent, SharedNote,
} from '../../models/interfaces';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page" *ngIf="detail">
      <!-- Header -->
      <div class="page-header">
        <a routerLink="/cases" class="back-link">
          <span class="material-icons-outlined">arrow_back</span> Cases
        </a>
        <div class="header-main">
          <div class="header-left">
            <h1>{{ detail.child.first_name }} {{ detail.child.last_name }}</h1>
            <span class="case-num">{{ detail.case_number }}</span>
            <span class="status-badge" [class]="'status-' + detail.status">{{ formatStatus(detail.status) }}</span>
          </div>
          <div class="header-right">
            <div class="risk-gauge">
              <div class="risk-ring" [class]="riskClass">
                <svg viewBox="0 0 36 36">
                  <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="ring-fill" [attr.stroke-dasharray]="riskDash" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span class="ring-text">{{ (detail.priority_score * 100).toFixed(0) }}%</span>
              </div>
              <span class="risk-label">{{ riskTier }} Risk</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs">
        <button *ngFor="let t of tabs" class="tab" [class.active]="activeTab === t.key" (click)="activeTab = t.key">
          <span class="material-icons-outlined">{{ t.icon }}</span> {{ t.label }}
        </button>
      </div>

      <!-- ═══ OVERVIEW TAB ═══ -->
      <div class="tab-content" *ngIf="activeTab === 'overview'">
        <div class="grid-2">
          <!-- Risk Trend Chart -->
          <div class="card">
            <div class="card-title"><span class="material-icons-outlined">trending_up</span> Risk Score Trend</div>
            <div class="chart-area" *ngIf="riskHistory.length > 0">
              <svg class="sparkline" viewBox="0 0 400 120" preserveAspectRatio="none">
                <!-- Grid lines -->
                <line x1="0" y1="30" x2="400" y2="30" class="grid-line" />
                <line x1="0" y1="60" x2="400" y2="60" class="grid-line" />
                <line x1="0" y1="90" x2="400" y2="90" class="grid-line" />
                <!-- Danger zone -->
                <rect x="0" y="0" width="400" [attr.height]="120 * 0.4" class="danger-zone" />
                <!-- Area fill -->
                <path [attr.d]="trendAreaPath" class="trend-area" />
                <!-- Line -->
                <path [attr.d]="trendLinePath" class="trend-line" />
                <!-- Points -->
                <circle *ngFor="let p of trendPoints" [attr.cx]="p.x" [attr.cy]="p.y" r="4" class="trend-dot" [class]="p.cls" />
              </svg>
              <div class="chart-labels">
                <span *ngFor="let l of trendLabels" class="chart-label">{{ l }}</span>
              </div>
              <div class="chart-legend">
                <span class="legend-item danger"><span class="dot"></span> High Risk Zone (60%+)</span>
              </div>
            </div>
          </div>

          <!-- Case Info -->
          <div class="card">
            <div class="card-title"><span class="material-icons-outlined">info</span> Case Information</div>
            <div class="info-grid">
              <div class="info-row"><span class="lbl">Assigned Worker</span><span>{{ detail.assigned_worker || '—' }}</span></div>
              <div class="info-row"><span class="lbl">Placement Type</span><span>{{ detail.placement_type || '—' }}</span></div>
              <div class="info-row"><span class="lbl">Months in Care</span><span>{{ detail.months_in_care }}</span></div>
              <div class="info-row"><span class="lbl">Permanency Goal</span><span>{{ detail.permanency_goal || '—' }}</span></div>
              <div class="info-row"><span class="lbl">Removal Reason</span><span>{{ detail.removal_reason || '—' }}</span></div>
              <div class="info-row"><span class="lbl">TPR Status</span><span>{{ detail.has_parental_rights_terminated ? 'Terminated' : 'Active' }}</span></div>
              <div class="info-row"><span class="lbl">Date of Birth</span><span>{{ detail.child.date_of_birth }}</span></div>
            </div>
          </div>
        </div>

        <!-- SHAP Toggle Button -->
        <div class="shap-toggle-section" *ngIf="explanation">
          <button class="explain-btn" (click)="showShapDetail = !showShapDetail">
            <span class="material-icons-outlined">{{ showShapDetail ? 'expand_less' : 'psychology' }}</span>
            {{ showShapDetail ? 'Hide Score Explanation' : 'Explore This Case in Detail' }}
          </button>
        </div>

        <!-- SHAP Explainability (collapsible) -->
        <div class="card" *ngIf="explanation && showShapDetail">
          <div class="card-title"><span class="material-icons-outlined">psychology</span> AI Risk Factor Analysis (SHAP Explainability)</div>
          <p class="card-subtitle">Feature contributions explaining why this case scored <strong>{{ (explanation.predicted_score * 100).toFixed(0) }}%</strong> risk ({{ explanation.risk_tier }}). Baseline population risk is {{ (explanation.base_score * 100).toFixed(0) }}%.</p>
          <div class="shap-chart">
            <div class="shap-row" *ngFor="let f of topFeatures; let i = index">
              <span class="shap-label">{{ f.label }}</span>
              <div class="shap-bar-wrap">
                <div class="shap-bar" [class]="f.direction"
                     [style.width.%]="getBarWidth(f.contribution)"
                     [style.margin-left]="f.direction === 'protective' ? 'auto' : '50%'"
                     [style.margin-right]="f.direction === 'protective' ? '50%' : 'auto'">
                </div>
                <div class="shap-zero-line"></div>
              </div>
              <span class="shap-value" [class]="f.direction">{{ f.direction === 'risk' ? '+' : '' }}{{ (f.contribution * 100).toFixed(1) }}%</span>
              <span class="shap-feat-val">{{ f.value }}</span>
            </div>
          </div>
          <div class="shap-legend">
            <span class="legend-item risk"><span class="dot"></span> Increases Risk</span>
            <span class="legend-item protective"><span class="dot"></span> Decreases Risk</span>
          </div>
        </div>

        <!-- Flags -->
        <div class="card" *ngIf="detail.flags.length > 0">
          <div class="card-title"><span class="material-icons-outlined">flag</span> Active Flags ({{ detail.flags.length }})</div>
          <div class="flag-grid">
            <div class="flag-card" *ngFor="let f of detail.flags" [class]="'flag-' + f.severity">
              <div class="flag-top">
                <span class="severity-badge" [class]="f.severity">{{ f.severity }}</span>
                <span class="confidence">{{ (f.confidence * 100).toFixed(0) }}% confidence</span>
              </div>
              <div class="flag-name">{{ f.flag_type }}</div>
              <p class="flag-desc" *ngIf="f.description">{{ f.description }}</p>
              <p class="flag-rec" *ngIf="f.recommendation"><strong>Recommendation:</strong> {{ f.recommendation }}</p>
            </div>
          </div>
        </div>

        <!-- Siblings -->
        <div class="card" *ngIf="siblings.length > 0">
          <div class="card-title"><span class="material-icons-outlined">group</span> Sibling Linkage Map</div>
          <div class="sibling-map">
            <div class="sibling-center">
              <div class="sibling-node primary">
                <span class="material-icons-outlined">person</span>
                <span class="name">{{ detail.child.first_name }} {{ detail.child.last_name }}</span>
                <span class="meta">Current Child</span>
              </div>
            </div>
            <div class="sibling-links">
              <div class="sibling-link-item" *ngFor="let s of siblings">
                <div class="link-line">
                  <span class="link-type">{{ formatRelType(s.relationship_type) }}</span>
                </div>
                <div class="sibling-node">
                  <span class="material-icons-outlined">person</span>
                  <span class="name">{{ s.child_name }}</span>
                  <span class="meta">{{ s.case_number || 'No case' }} · {{ s.placement_type || 'Unknown' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ TIMELINE TAB ═══ -->
      <div class="tab-content" *ngIf="activeTab === 'timeline'">
        <div class="card">
          <div class="card-title"><span class="material-icons-outlined">timeline</span> Placement Stability Timeline</div>
          <div class="timeline" *ngIf="timeline.length > 0">
            <div class="timeline-item" *ngFor="let e of timeline; let i = index" [class]="'type-' + e.event_type">
              <div class="tl-dot"><span class="material-icons-outlined">{{ getTimelineIcon(e.event_type) }}</span></div>
              <div class="tl-content">
                <div class="tl-header">
                  <span class="tl-title">{{ e.title }}</span>
                  <span class="tl-date">{{ formatDate(e.date) }}</span>
                </div>
                <p class="tl-desc">{{ e.description }}</p>
                <span class="tl-badge" *ngIf="e.severity" [class]="e.severity">{{ e.severity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ FAMILY TAB ═══ -->
      <div class="tab-content" *ngIf="activeTab === 'family'">
        <div class="card">
          <div class="card-title"><span class="material-icons-outlined">account_tree</span> Family Tree</div>
          <div class="family-tree" *ngIf="familyMembers.length > 0">
            <!-- Parents Row -->
            <div class="tree-level" *ngIf="getByRelGroup('parents').length > 0">
              <div class="level-label">Parents</div>
              <div class="tree-nodes">
                <div class="tree-node" *ngFor="let m of getByRelGroup('parents')" [class.unsafe]="!m.safe_contact">
                  <div class="node-icon parent"><span class="material-icons-outlined">person</span></div>
                  <div class="node-info">
                    <span class="node-name">{{ m.first_name }} {{ m.last_name }}</span>
                    <span class="node-rel">{{ m.relationship_type | titlecase }}</span>
                    <span class="node-phone" *ngIf="m.phone && canViewDetails">{{ m.phone }}</span>
                    <span class="safe-badge" [class.safe]="m.safe_contact" [class.unsafe]="!m.safe_contact">
                      {{ m.safe_contact ? 'Safe Contact' : 'Restricted' }}
                    </span>
                    <p class="node-notes" *ngIf="m.notes && canViewDetails">{{ m.notes }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="tree-connector" *ngIf="getByRelGroup('parents').length > 0"></div>
            <!-- Child (center) -->
            <div class="tree-level child-level">
              <div class="tree-nodes">
                <div class="tree-node child-node">
                  <div class="node-icon child"><span class="material-icons-outlined">child_care</span></div>
                  <div class="node-info">
                    <span class="node-name">{{ detail.child.first_name }} {{ detail.child.last_name }}</span>
                    <span class="node-rel">Child in Care</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Extended Family Row -->
            <div class="tree-connector" *ngIf="getByRelGroup('extended').length > 0"></div>
            <div class="tree-level" *ngIf="getByRelGroup('extended').length > 0">
              <div class="level-label">Extended Family</div>
              <div class="tree-nodes">
                <div class="tree-node" *ngFor="let m of getByRelGroup('extended')" [class.unsafe]="!m.safe_contact">
                  <div class="node-icon extended"><span class="material-icons-outlined">people</span></div>
                  <div class="node-info">
                    <span class="node-name">{{ m.first_name }} {{ m.last_name }}</span>
                    <span class="node-rel">{{ m.relationship_type | titlecase }}</span>
                    <span class="node-phone" *ngIf="m.phone && canViewDetails">{{ m.phone }}</span>
                    <span class="safe-badge" [class.safe]="m.safe_contact" [class.unsafe]="!m.safe_contact">
                      {{ m.safe_contact ? 'Safe Contact' : 'Restricted' }}
                    </span>
                    <p class="node-notes" *ngIf="m.notes && canViewDetails">{{ m.notes }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="empty-state" *ngIf="familyMembers.length === 0">
            <span class="material-icons-outlined">family_restroom</span>
            <p>No family members recorded yet.</p>
          </div>
          <!-- Add Family Member Form (workers/supervisors only) -->
          <div class="add-family" *ngIf="canViewDetails">
            <button class="btn-add" (click)="showAddFamily = !showAddFamily">
              <span class="material-icons-outlined">add</span> Add Family Member
            </button>
            <div class="add-form" *ngIf="showAddFamily">
              <div class="form-row">
                <input [(ngModel)]="newFamily.first_name" placeholder="First Name" class="input" />
                <input [(ngModel)]="newFamily.last_name" placeholder="Last Name" class="input" />
              </div>
              <div class="form-row">
                <select [(ngModel)]="newFamily.relationship_type" class="input">
                  <option value="">Select Relationship</option>
                  <option *ngFor="let r of relationshipTypes" [value]="r">{{ r | titlecase }}</option>
                </select>
                <input [(ngModel)]="newFamily.phone" placeholder="Phone" class="input" />
              </div>
              <div class="form-row">
                <label class="checkbox"><input type="checkbox" [(ngModel)]="newFamily.safe_contact" /> Safe Contact</label>
              </div>
              <textarea [(ngModel)]="newFamily.notes" placeholder="Notes..." class="input textarea"></textarea>
              <button class="btn-save" (click)="addFamilyMember()">Save</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ NOTES TAB ═══ -->
      <div class="tab-content" *ngIf="activeTab === 'notes'">
        <!-- Shared Notes -->
        <div class="card">
          <div class="card-title"><span class="material-icons-outlined">forum</span> Shared Notes (Foster Parent ↔ Worker)</div>
          <div class="shared-notes-list">
            <div class="shared-note" *ngFor="let n of sharedNotes" [class.pinned]="n.is_pinned">
              <div class="sn-header">
                <div class="sn-author">
                  <span class="sn-avatar" [class]="n.author_role">{{ n.author_name[0] }}</span>
                  <span class="sn-name">{{ n.author_name }}</span>
                  <span class="sn-role">{{ formatRole(n.author_role) }}</span>
                </div>
                <span class="sn-date">{{ formatDate(n.created_at) }}</span>
                <span class="pin-icon" *ngIf="n.is_pinned"><span class="material-icons-outlined">push_pin</span></span>
              </div>
              <p class="sn-content">{{ n.content }}</p>
            </div>
          </div>
          <div class="sn-add" *ngIf="userRole === 'social_worker' || userRole === 'supervisor' || userRole === 'foster_parent'">
            <textarea [(ngModel)]="newSharedNote" placeholder="Write a shared note..." class="input textarea"></textarea>
            <button class="btn-save" (click)="addSharedNote()" [disabled]="!newSharedNote.trim()">Send Note</button>
          </div>
        </div>

        <!-- Case Notes -->
        <div class="card">
          <div class="card-title"><span class="material-icons-outlined">note</span> Case Notes</div>
          <div class="notes-list">
            <div class="note-item" *ngFor="let n of detail.notes">
              <div class="note-header">
                <span class="note-type-badge" [class]="n.note_type">{{ n.note_type }}</span>
                <span class="note-date">{{ formatDate(n.created_at) }}</span>
              </div>
              <p class="note-content">{{ n.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; padding: 0 24px; box-sizing: border-box; }
    .page { max-width: 100%; margin: 0 auto; font-size: 15px; }

    /* Header */
    .page-header { margin-bottom: 24px; }
    .back-link {
      display: inline-flex; align-items: center; gap: 4px; font-size: 14px;
      color: var(--primary); font-weight: 600; margin-bottom: 12px; cursor: pointer;
    }
    .back-link .material-icons-outlined { font-size: 18px; }
    .header-main { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left h1 { font-size: 30px; font-weight: 800; margin-bottom: 4px; }
    .case-num { font-size: 17px; color: var(--text-secondary); margin-right: 10px; }
    .status-badge {
      font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
      padding: 4px 12px; border-radius: var(--radius-full);
    }
    .status-open { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .status-in_progress { background: rgba(102,126,234,0.1); color: #667eea; }
    .status-closed { background: rgba(160,160,160,0.1); color: #999; }

    /* Risk Gauge */
    .risk-gauge { text-align: center; }
    .risk-ring { width: 96px; height: 96px; position: relative; margin: 0 auto 4px; }
    .risk-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--border-light); stroke-width: 3; }
    .ring-fill { fill: none; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.8s ease; }
    .risk-ring.critical .ring-fill { stroke: #dc2626; }
    .risk-ring.high .ring-fill { stroke: #ea580c; }
    .risk-ring.medium .ring-fill { stroke: #ca8a04; }
    .risk-ring.low .ring-fill { stroke: #16a34a; }
    .ring-text {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      font-size: 22px; font-weight: 800;
    }
    .risk-label { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .risk-ring.critical ~ .risk-label { color: #dc2626; }
    .risk-ring.high ~ .risk-label { color: #ea580c; }
    .risk-ring.medium ~ .risk-label { color: #ca8a04; }
    .risk-ring.low ~ .risk-label { color: #16a34a; }

    /* Tabs */
    .tabs {
      display: flex; gap: 4px; margin-bottom: 20px; padding-bottom: 12px;
      border-bottom: 1px solid var(--border-light);
    }
    .tab {
      display: flex; align-items: center; gap: 6px; padding: 10px 20px;
      border-radius: var(--radius-full); border: 1px solid var(--border);
      background: transparent; font-size: 16px; font-weight: 600;
      color: var(--text-secondary); cursor: pointer; font-family: var(--font);
      transition: all 0.2s;
    }
    .tab:hover { border-color: var(--primary); color: var(--primary); }
    .tab.active { background: var(--primary); color: white; border-color: var(--primary); }
    .tab .material-icons-outlined { font-size: 16px; }

    /* Grid */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }

    /* Cards */
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 24px; margin-bottom: 24px;
    }
    .card-title {
      display: flex; align-items: center; gap: 8px; font-size: 18px;
      font-weight: 700; margin-bottom: 16px; padding-bottom: 10px;
      border-bottom: 1px solid var(--border-light);
    }
    .card-title .material-icons-outlined { font-size: 22px; color: var(--primary); }
    .card-subtitle { font-size: 15px; color: var(--text-secondary); margin: -8px 0 16px; }

    /* Explain Score Toggle Button */
    .shap-toggle-section { text-align: center; margin: 0 0 20px; }
    .explain-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 28px; border-radius: var(--radius-full);
      border: 2px solid var(--primary); background: rgba(102,126,234,0.06);
      color: var(--primary); font-size: 16px; font-weight: 700;
      cursor: pointer; font-family: inherit; transition: all 0.2s;
      letter-spacing: 0.3px;
    }
    .explain-btn:hover {
      background: var(--primary); color: white;
      box-shadow: 0 4px 12px rgba(102,126,234,0.3);
      transform: translateY(-1px);
    }
    .explain-btn .material-icons-outlined { font-size: 18px; }

    /* Risk Trend Chart */
    .chart-area { padding: 8px 0; }
    .sparkline { width: 100%; height: auto; }
    .grid-line { stroke: var(--border-light); stroke-width: 0.5; }
    .danger-zone { fill: rgba(220,38,38,0.04); }
    .trend-area { fill: rgba(102,126,234,0.1); }
    .trend-line { fill: none; stroke: var(--primary); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .trend-dot { fill: white; stroke-width: 2; }
    .trend-dot.high { stroke: #dc2626; fill: #dc2626; }
    .trend-dot.mid { stroke: #ca8a04; fill: #ca8a04; }
    .trend-dot.low { stroke: #16a34a; fill: #16a34a; }
    .chart-labels { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-light); margin-top: 6px; }
    .chart-legend { margin-top: 8px; font-size: 13px; }
    .legend-item { display: inline-flex; align-items: center; gap: 4px; margin-right: 16px; }
    .legend-item .dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-item.danger .dot { background: rgba(220,38,38,0.3); }
    .legend-item.risk .dot { background: #dc2626; }
    .legend-item.protective .dot { background: #16a34a; }

    /* Info Grid */
    .info-grid { display: flex; flex-direction: column; gap: 12px; }
    .info-row { display: flex; justify-content: space-between; font-size: 16px; padding: 5px 0; }
    .info-row .lbl { color: var(--text-secondary); }

    /* SHAP Chart */
    .shap-chart { display: flex; flex-direction: column; gap: 6px; }
    .shap-row { display: grid; grid-template-columns: 220px 1fr 70px 100px; align-items: center; gap: 10px; padding: 5px 0; }
    .shap-label { font-size: 15px; font-weight: 500; text-align: right; color: var(--text-secondary); }
    .shap-bar-wrap { position: relative; height: 24px; background: var(--bg); border-radius: 4px; overflow: hidden; }
    .shap-bar { height: 100%; border-radius: 4px; transition: width 0.6s ease; min-width: 2px; }
    .shap-bar.risk { background: linear-gradient(90deg, rgba(220,38,38,0.7), #dc2626); }
    .shap-bar.protective { background: linear-gradient(90deg, #16a34a, rgba(22,163,74,0.7)); }
    .shap-zero-line {
      position: absolute; left: 50%; top: 0; bottom: 0; width: 1px;
      background: var(--text-light); opacity: 0.3;
    }
    .shap-value { font-size: 14px; font-weight: 700; text-align: right; }
    .shap-value.risk { color: #dc2626; }
    .shap-value.protective { color: #16a34a; }
    .shap-feat-val { font-size: 14px; color: var(--text-light); }
    .shap-legend { margin-top: 12px; font-size: 14px; display: flex; gap: 20px; }

    /* Flags */
    .flag-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
    .flag-card { padding: 14px; border-radius: var(--radius-md); border-left: 4px solid; background: var(--bg); }
    .flag-critical { border-color: #dc2626; }
    .flag-high { border-color: #ea580c; }
    .flag-medium { border-color: #ca8a04; }
    .flag-low { border-color: #16a34a; }
    .flag-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .severity-badge {
      font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px;
      border-radius: var(--radius-full);
    }
    .severity-badge.critical { background: rgba(220,38,38,0.1); color: #dc2626; }
    .severity-badge.high { background: rgba(234,88,12,0.1); color: #ea580c; }
    .severity-badge.medium { background: rgba(202,138,4,0.1); color: #ca8a04; }
    .severity-badge.low { background: rgba(22,163,74,0.1); color: #16a34a; }
    .confidence { font-size: 12px; color: var(--text-secondary); }
    .flag-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .flag-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 4px; }
    .flag-rec { font-size: 14px; color: var(--primary); line-height: 1.5; }

    /* Sibling Map */
    .sibling-map { display: flex; align-items: flex-start; gap: 40px; padding: 20px; overflow-x: auto; }
    .sibling-center { flex-shrink: 0; }
    .sibling-node {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 16px 20px; border-radius: var(--radius-lg); border: 2px solid var(--border);
      background: var(--bg); min-width: 140px; text-align: center;
    }
    .sibling-node.primary { border-color: var(--primary); background: rgba(102,126,234,0.08); }
    .sibling-node .material-icons-outlined { font-size: 28px; color: var(--primary); }
    .sibling-node .name { font-size: 14px; font-weight: 700; }
    .sibling-node .meta { font-size: 11px; color: var(--text-secondary); }
    .sibling-links { display: flex; flex-direction: column; gap: 16px; }
    .sibling-link-item { display: flex; align-items: center; gap: 16px; }
    .link-line {
      width: 60px; height: 2px; background: var(--border);
      position: relative; display: flex; align-items: center; justify-content: center;
    }
    .link-type {
      position: absolute; top: -10px; font-size: 10px; font-weight: 600;
      color: var(--text-light); background: var(--surface); padding: 0 4px; white-space: nowrap;
    }

    /* Timeline */
    .timeline { position: relative; padding-left: 40px; }
    .timeline::before {
      content: ''; position: absolute; left: 16px; top: 0; bottom: 0;
      width: 2px; background: var(--border-light);
    }
    .timeline-item { position: relative; margin-bottom: 24px; }
    .tl-dot {
      position: absolute; left: -40px; top: 0; width: 32px; height: 32px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: var(--surface); border: 2px solid var(--border);
    }
    .tl-dot .material-icons-outlined { font-size: 16px; }
    .type-placement .tl-dot { border-color: #667eea; color: #667eea; }
    .type-flag .tl-dot { border-color: #dc2626; color: #dc2626; }
    .type-visit .tl-dot, .type-court .tl-dot { border-color: #ca8a04; color: #ca8a04; }
    .type-system .tl-dot { border-color: #38b2ac; color: #38b2ac; }
    .type-general .tl-dot, .type-medical .tl-dot { border-color: #8b5cf6; color: #8b5cf6; }
    .tl-content {
      background: var(--bg); border-radius: var(--radius-md); padding: 12px 16px;
      border: 1px solid var(--border-light);
    }
    .tl-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .tl-title { font-size: 16px; font-weight: 700; }
    .tl-date { font-size: 14px; color: var(--text-secondary); }
    .tl-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
    .tl-badge {
      display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase;
      padding: 2px 6px; border-radius: var(--radius-full); margin-top: 6px;
    }
    .tl-badge.critical { background: rgba(220,38,38,0.1); color: #dc2626; }
    .tl-badge.high { background: rgba(234,88,12,0.1); color: #ea580c; }
    .tl-badge.medium { background: rgba(202,138,4,0.1); color: #ca8a04; }

    /* Family Tree */
    .family-tree { display: flex; flex-direction: column; align-items: center; gap: 0; padding: 20px 0; }
    .tree-level { width: 100%; }
    .level-label {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
      color: var(--text-light); text-align: center; margin-bottom: 12px;
    }
    .tree-nodes { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .tree-node {
      display: flex; gap: 12px; padding: 14px 18px; border-radius: var(--radius-lg);
      border: 1px solid var(--border); background: var(--bg); min-width: 200px; max-width: 340px;
    }
    .tree-node.unsafe { border-color: rgba(220,38,38,0.3); background: rgba(220,38,38,0.03); }
    .tree-node.child-node { border-color: var(--primary); background: rgba(102,126,234,0.08); }
    .node-icon {
      width: 40px; height: 40px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .node-icon.parent { background: rgba(102,126,234,0.15); color: var(--primary); }
    .node-icon.child { background: rgba(56,178,172,0.15); color: #38b2ac; }
    .node-icon.extended { background: rgba(139,92,246,0.15); color: #8b5cf6; }
    .node-icon .material-icons-outlined { font-size: 20px; }
    .node-info { display: flex; flex-direction: column; gap: 2px; }
    .node-name { font-size: 16px; font-weight: 700; }
    .node-rel { font-size: 14px; color: var(--text-secondary); }
    .node-phone { font-size: 14px; color: var(--primary); }
    .safe-badge {
      font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px;
      border-radius: var(--radius-full); display: inline-block; width: fit-content;
    }
    .safe-badge.safe { background: rgba(22,163,74,0.1); color: #16a34a; }
    .safe-badge.unsafe { background: rgba(220,38,38,0.1); color: #dc2626; }
    .node-notes { font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin: 4px 0 0; }
    .tree-connector {
      width: 2px; height: 30px; background: var(--border); margin: 0 auto;
    }
    .child-level { margin: 8px 0; }
    .empty-state { text-align: center; padding: 30px; color: var(--text-secondary); }
    .empty-state .material-icons-outlined { font-size: 48px; opacity: 0.3; display: block; margin-bottom: 8px; }

    /* Add Family Form */
    .add-family { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-light); }
    .btn-add {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
      border-radius: var(--radius-md); border: 1px dashed var(--border);
      background: transparent; font-size: 14px; font-weight: 600;
      color: var(--primary); cursor: pointer; font-family: var(--font);
    }
    .btn-add:hover { background: rgba(102,126,234,0.05); }
    .add-form { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; max-width: 500px; }
    .form-row { display: flex; gap: 10px; }
    .input {
      flex: 1; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius-md);
      font-size: 14px; font-family: var(--font); background: var(--bg);
    }
    .textarea { min-height: 60px; resize: vertical; }
    .checkbox { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; }
    .btn-save {
      align-self: flex-start; padding: 8px 20px; border-radius: var(--radius-md);
      background: var(--primary); color: white; border: none; font-size: 14px;
      font-weight: 600; cursor: pointer; font-family: var(--font);
    }
    .btn-save:hover { opacity: 0.9; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Shared Notes */
    .shared-notes-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .shared-note {
      padding: 14px; border-radius: var(--radius-md); background: var(--bg);
      border: 1px solid var(--border-light);
    }
    .shared-note.pinned { border-color: rgba(102,126,234,0.3); background: rgba(102,126,234,0.03); }
    .sn-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .sn-author { display: flex; align-items: center; gap: 8px; flex: 1; }
    .sn-avatar {
      width: 28px; height: 28px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; font-size: 12px;
      font-weight: 700; color: white;
    }
    .sn-avatar.social_worker { background: var(--primary); }
    .sn-avatar.foster_parent { background: #38b2ac; }
    .sn-avatar.supervisor { background: #8b5cf6; }
    .sn-name { font-size: 16px; font-weight: 600; }
    .sn-role { font-size: 14px; color: var(--text-secondary); }
    .sn-date { font-size: 13px; color: var(--text-light); }
    .pin-icon .material-icons-outlined { font-size: 16px; color: var(--primary); }
    .sn-content { font-size: 15px; line-height: 1.6; margin: 0; }
    .sn-add { display: flex; flex-direction: column; gap: 8px; }

    /* Case Notes */
    .notes-list { display: flex; flex-direction: column; gap: 10px; }
    .note-item { padding: 12px; border-radius: var(--radius-md); background: var(--bg); }
    .note-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .note-type-badge {
      font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px;
      border-radius: var(--radius-full);
    }
    .note-type-badge.visit { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .note-type-badge.court { background: rgba(234,88,12,0.1); color: #ea580c; }
    .note-type-badge.general { background: rgba(102,126,234,0.1); color: #667eea; }
    .note-type-badge.medical { background: rgba(220,38,38,0.1); color: #dc2626; }
    .note-type-badge.behavioral { background: rgba(139,92,246,0.1); color: #8b5cf6; }
    .note-date { font-size: 14px; color: var(--text-secondary); }
    .note-content { font-size: 15px; line-height: 1.6; margin: 0; }

    @media (max-width: 900px) {
      .grid-2 { grid-template-columns: 1fr; }
      .shap-row { grid-template-columns: 120px 1fr 50px 60px; }
    }
  `],
})
export class CaseDetailComponent implements OnInit {
  detail: CaseDetail | null = null;
  explanation: CaseExplanation | null = null;
  riskHistory: RiskScoreHistory[] = [];
  siblings: SiblingLink[] = [];
  timeline: TimelineEvent[] = [];
  sharedNotes: SharedNote[] = [];
  familyMembers: any[] = [];

  activeTab = 'overview';
  tabs = [
    { key: 'overview', label: 'Overview', icon: 'dashboard' },
    { key: 'timeline', label: 'Timeline', icon: 'timeline' },
    { key: 'family', label: 'Family', icon: 'account_tree' },
    { key: 'notes', label: 'Notes', icon: 'forum' },
  ];

  // Chart data
  trendLinePath = '';
  trendAreaPath = '';
  trendPoints: { x: number; y: number; cls: string }[] = [];
  trendLabels: string[] = [];

  // Top SHAP features (limit to 10)
  topFeatures: FeatureContribution[] = [];
  maxContribution = 0;

  // Risk gauge
  riskClass = 'low';
  riskTier = 'Low';
  riskDash = '0, 100';

  // Role-based access
  userRole = '';
  userId = 0;
  canViewDetails = false;
  showShapDetail = false;

  // Add family form
  showAddFamily = false;
  newFamily = { first_name: '', last_name: '', relationship_type: '', phone: '', safe_contact: true, notes: '' };
  relationshipTypes = ['mother', 'father', 'grandmother', 'grandfather', 'aunt', 'uncle', 'sibling', 'cousin', 'step-parent', 'godparent', 'family friend'];

  // Shared notes
  newSharedNote = '';

  constructor(
    private route: ActivatedRoute,
    private caseService: CaseService,
    private features: FeaturesService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.userRole = this.auth.getUserRole() || '';
    this.userId = user?.id || 0;
    this.canViewDetails = this.userRole === 'social_worker' || this.userRole === 'supervisor';

    // Auto-expand SHAP panel if navigated with ?explain=1
    if (this.route.snapshot.queryParamMap.get('explain') === '1') {
      this.showShapDetail = true;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.caseService.getCaseDetail(id).subscribe((d) => {
      this.detail = d;
      this.computeRiskGauge(d.priority_score);
    });

    this.caseService.getExplanation(id).subscribe((e) => {
      this.explanation = e;
      this.topFeatures = e.features.slice(0, 10);
      this.maxContribution = Math.max(...e.features.map(f => Math.abs(f.contribution)), 0.01);
    });

    this.features.getRiskHistory(id).subscribe((h) => {
      this.riskHistory = h;
      this.buildChart(h);
    });

    this.features.getSiblings(id).subscribe((s) => this.siblings = s);
    this.features.getTimeline(id).subscribe((t) => this.timeline = t);
    this.features.getSharedNotes(id).subscribe((n) => this.sharedNotes = n);
    this.features.getFamilyMembers(id).subscribe((m) => this.familyMembers = m);
  }

  computeRiskGauge(score: number): void {
    const pct = score * 100;
    this.riskDash = `${pct}, 100`;
    if (score >= 0.8) { this.riskClass = 'critical'; this.riskTier = 'Critical'; }
    else if (score >= 0.6) { this.riskClass = 'high'; this.riskTier = 'High'; }
    else if (score >= 0.3) { this.riskClass = 'medium'; this.riskTier = 'Medium'; }
    else { this.riskClass = 'low'; this.riskTier = 'Low'; }
  }

  buildChart(history: RiskScoreHistory[]): void {
    if (!history.length) return;
    const w = 400, h = 120;
    const pad = 10;
    const n = history.length;
    const points = history.map((p, i) => ({
      x: pad + (i / Math.max(n - 1, 1)) * (w - 2 * pad),
      y: h - pad - (p.score * (h - 2 * pad)),
      cls: p.score >= 0.6 ? 'high' : p.score >= 0.3 ? 'mid' : 'low',
    }));

    this.trendPoints = points;
    this.trendLinePath = 'M ' + points.map(p => `${p.x},${p.y}`).join(' L ');
    this.trendAreaPath = `M ${points[0].x},${h - pad} L ` +
      points.map(p => `${p.x},${p.y}`).join(' L ') +
      ` L ${points[points.length - 1].x},${h - pad} Z`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.trendLabels = history.map(h => {
      const d = new Date(h.recorded_at);
      return months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2);
    });
  }

  getBarWidth(contribution: number): number {
    return Math.min(Math.abs(contribution) / this.maxContribution * 50, 50);
  }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatRelType(t: string): string {
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatDate(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatRole(role: string): string {
    return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getTimelineIcon(type: string): string {
    const icons: Record<string, string> = {
      placement: 'home', flag: 'flag', visit: 'visibility', court: 'gavel',
      medical: 'medical_services', system: 'info', general: 'note', behavioral: 'psychology',
    };
    return icons[type] || 'circle';
  }

  getByRelGroup(group: string): any[] {
    if (group === 'parents') {
      return this.familyMembers.filter(m =>
        ['mother', 'father', 'step-parent'].includes(m.relationship_type)
      );
    }
    return this.familyMembers.filter(m =>
      !['mother', 'father', 'step-parent'].includes(m.relationship_type)
    );
  }

  addFamilyMember(): void {
    if (!this.detail || !this.newFamily.first_name || !this.newFamily.last_name || !this.newFamily.relationship_type) return;
    this.features.addFamilyMember(this.detail.id, this.newFamily).subscribe((m) => {
      this.familyMembers.push(m);
      this.newFamily = { first_name: '', last_name: '', relationship_type: '', phone: '', safe_contact: true, notes: '' };
      this.showAddFamily = false;
    });
  }

  addSharedNote(): void {
    if (!this.detail || !this.newSharedNote.trim()) return;
    this.features.addSharedNote(this.detail.id, this.newSharedNote, this.userId).subscribe((n) => {
      this.sharedNotes.unshift(n);
      this.newSharedNote = '';
    });
  }
}
