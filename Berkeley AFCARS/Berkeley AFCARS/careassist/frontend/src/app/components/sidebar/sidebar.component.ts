import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
  exact?: boolean;
  ai?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <span class="material-icons-outlined">volunteer_activism</span>
        </div>
        <div class="brand-text">
          <span class="brand-name">CareAssist</span>
          <span class="brand-sub">{{ isFosterParent ? 'Family Portal' : 'Case Management' }}</span>
        </div>
      </div>

      <div class="nav-section">
        <span class="nav-label">Main</span>

        <ng-container *ngFor="let item of navItems">
          <a [routerLink]="item.route"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: !!item.exact}"
             class="nav-item"
             [class.ai-nav]="item.ai">
            <span class="material-icons-outlined">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
            <span class="nav-badge" *ngIf="item.badge">{{ item.badge }}</span>
            <span class="ai-glow" *ngIf="item.ai"></span>
          </a>
        </ng-container>
      </div>

      <ng-container *ngIf="toolItems.length > 0">
        <div class="nav-section">
          <span class="nav-label">Tools</span>
          <ng-container *ngFor="let item of toolItems">
            <a [routerLink]="item.route"
               routerLinkActive="active"
               class="nav-item"
               [class.ai-nav]="item.ai">
              <span class="material-icons-outlined">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
              <span class="ai-glow" *ngIf="item.ai"></span>
            </a>
          </ng-container>
        </div>
      </ng-container>

      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitials }}</div>
        <div class="user-info">
          <span class="user-name">{{ userDisplayName }}</span>
          <span class="user-role">{{ userRoleLabel }}</span>
        </div>
        <span class="user-status"></span>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      height: 100vh;
      position: sticky;
      top: 0;
      background: var(--gradient-sidebar);
      display: flex;
      flex-direction: column;
      padding: 20px 12px;
      overflow-y: auto;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 8px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 20px;
    }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: var(--gradient-primary); display: flex;
      align-items: center; justify-content: center;
    }
    .brand-icon .material-icons-outlined { font-size: 20px; color: white; }
    .brand-name { font-weight: 700; font-size: 16px; color: white; display: block; }
    .brand-sub { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }

    .nav-section { margin-bottom: 20px; }
    .nav-label {
      font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px;
      color: rgba(255,255,255,0.3); padding: 0 12px; margin-bottom: 8px; display: block;
    }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: var(--radius-md);
      color: rgba(255,255,255,0.6); transition: all var(--transition-fast);
      cursor: pointer; position: relative; font-size: 13px; font-weight: 500;
    }
    .nav-item:hover { color: white; background: rgba(255,255,255,0.06); }
    .nav-item.active {
      color: white; background: rgba(102, 126, 234, 0.2);
    }
    .nav-item.active::before {
      content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
      width: 3px; height: 20px; background: var(--primary); border-radius: 0 3px 3px 0;
    }
    .nav-item .material-icons-outlined { font-size: 19px; }
    .nav-badge {
      margin-left: auto; font-size: 10px; font-weight: 700;
      background: var(--danger); color: white; padding: 2px 7px;
      border-radius: var(--radius-full);
    }

    .ai-nav .material-icons-outlined { color: #c084fc; }
    .ai-glow {
      position: absolute; inset: 0; border-radius: var(--radius-md);
      background: radial-gradient(ellipse at center, rgba(192,132,252,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .sidebar-user {
      margin-top: auto; display: flex; align-items: center; gap: 10px;
      padding: 14px 8px; border-top: 1px solid rgba(255,255,255,0.06);
    }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 10px;
      background: var(--gradient-primary); display: flex;
      align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 12px;
    }
    .user-name { font-size: 13px; color: white; font-weight: 600; display: block; }
    .user-role { font-size: 11px; color: rgba(255,255,255,0.4); }
    .user-status {
      width: 8px; height: 8px; border-radius: 50%; background: #38ef7d;
      margin-left: auto; box-shadow: 0 0 6px rgba(56, 239, 125, 0.4);
    }
  `],
})
export class SidebarComponent {
  navItems: NavItem[] = [];
  toolItems: NavItem[] = [];
  isFosterParent = false;

  userInitials = '??';
  userDisplayName = 'User';
  userRoleLabel = '';

  constructor(private auth: AuthService) {
    const user = this.auth.getCurrentUser();
    const role = this.auth.getUserRole() || 'social_worker';
    this.isFosterParent = role === 'foster_parent';

    if (user) {
      this.userInitials = (user.first_name[0] + user.last_name[0]).toUpperCase();
      this.userDisplayName = user.first_name + ' ' + user.last_name[0] + '.';
      this.userRoleLabel = this.auth.getRoleLabel(role);
    }

    if (role === 'foster_parent') {
      this.navItems = [
        { icon: 'family_restroom', label: 'My Children', route: '/', exact: true },
        { icon: 'chat_bubble_outline', label: 'Messages', route: '/messages', badge: 3 },
        { icon: 'calendar_today', label: 'Calendar', route: '/calendar' },
        { icon: 'upload_file', label: 'Documents', route: '/files' },
        { icon: 'assessment', label: 'Reports', route: '/reports' },
      ];
      this.toolItems = [];
    } else {
      // social_worker, supervisor, admin
      this.navItems = [
        { icon: 'dashboard', label: 'Dashboard', route: '/', exact: true },
        { icon: 'folder_open', label: 'Cases', route: '/cases' },
        { icon: 'chat_bubble_outline', label: 'Messages', route: '/messages', badge: 3 },
        { icon: 'calendar_today', label: 'Calendar', route: '/calendar' },
        { icon: 'description', label: 'Files', route: '/files' },
        { icon: 'assessment', label: 'Reports', route: '/reports' },
      ];
      this.toolItems = [
        { icon: 'auto_awesome', label: 'AI Assistant', route: '/ai-assistant', ai: true },
      ];
    }
  }
}
