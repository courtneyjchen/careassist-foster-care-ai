import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FeaturesService } from '../../services/features.service';
import { AuthService } from '../../services/auth.service';
import { AppNotification } from '../../models/interfaces';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <h1><span class="material-icons-outlined">notifications</span> Notification Center</h1>
          <span class="badge-count" *ngIf="unreadCount > 0">{{ unreadCount }} unread</span>
        </div>
        <button class="btn-mark-all" (click)="markAllRead()" *ngIf="unreadCount > 0">
          <span class="material-icons-outlined">done_all</span> Mark All Read
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search notifications..." class="search-input" />
        <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button class="ftab" [class.active]="filter === 'all'" (click)="filter = 'all'">All</button>
        <button class="ftab" [class.active]="filter === 'alert'" (click)="filter = 'alert'">
          <span class="dot alert"></span> Alerts
        </button>
        <button class="ftab" [class.active]="filter === 'reminder'" (click)="filter = 'reminder'">
          <span class="dot reminder"></span> Reminders
        </button>
        <button class="ftab" [class.active]="filter === 'flag'" (click)="filter = 'flag'">
          <span class="dot flag"></span> Flags
        </button>
        <button class="ftab" [class.active]="filter === 'info'" (click)="filter = 'info'">
          <span class="dot info"></span> Info
        </button>
        <button class="ftab" [class.active]="filter === 'system'" (click)="filter = 'system'">
          <span class="dot system"></span> System
        </button>
      </div>

      <!-- Notification List -->
      <div class="notif-list">
        <div class="notif-item" *ngFor="let n of filteredNotifications"
             [class.unread]="!n.is_read"
             [class]="'type-' + n.notification_type"
             (click)="onNotifClick(n)">
          <div class="notif-icon" [class]="n.notification_type">
            <span class="material-icons-outlined">{{ getIcon(n.notification_type) }}</span>
          </div>
          <div class="notif-body">
            <div class="notif-header">
              <span class="notif-title">{{ n.title }}</span>
              <span class="notif-time">{{ timeAgo(n.created_at) }}</span>
            </div>
            <p class="notif-msg">{{ n.message }}</p>
            <span class="notif-case" *ngIf="n.related_case_id">View Case →</span>
          </div>
          <span class="unread-dot" *ngIf="!n.is_read"></span>
        </div>
      </div>

      <div class="empty" *ngIf="filteredNotifications.length === 0">
        <span class="material-icons-outlined">notifications_off</span>
        <p>No {{ filter === 'all' ? '' : filter }} notifications</p>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
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
    .header-left {
      display: flex; align-items: center; gap: 12px;
    }
    .header-left h1 {
      display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: 800;
    }
    .header-left h1 .material-icons-outlined { font-size: 26px; color: var(--primary); }
    .badge-count {
      font-size: 13px; font-weight: 700; background: var(--danger); color: white;
      padding: 3px 10px; border-radius: var(--radius-full);
    }
    .btn-mark-all {
      display: flex; align-items: center; gap: 6px; padding: 8px 16px;
      border-radius: var(--radius-md); border: 1px solid var(--border);
      background: transparent; font-size: 14px; font-weight: 600;
      color: var(--primary); cursor: pointer; font-family: var(--font);
    }
    .btn-mark-all:hover { background: rgba(102,126,234,0.05); }

    /* Filter Tabs */
    .filter-tabs {
      display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .ftab {
      display: flex; align-items: center; gap: 6px; padding: 6px 14px;
      border-radius: var(--radius-full); border: 1px solid var(--border);
      background: transparent; font-size: 14px; font-weight: 500;
      color: var(--text-secondary); cursor: pointer; font-family: var(--font);
    }
    .ftab:hover { border-color: var(--primary); }
    .ftab.active { background: var(--primary); color: white; border-color: var(--primary); }
    .dot {
      width: 8px; height: 8px; border-radius: 50%;
    }
    .dot.alert { background: #dc2626; }
    .dot.reminder { background: #ca8a04; }
    .dot.flag { background: #ea580c; }
    .dot.info { background: #667eea; }
    .dot.system { background: #38b2ac; }

    /* Notification Items */
    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-item {
      display: flex; gap: 14px; padding: 16px; border-radius: var(--radius-lg);
      background: var(--surface); border: 1px solid var(--border);
      cursor: pointer; transition: all 0.2s; position: relative;
    }
    .notif-item:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .notif-item.unread { background: rgba(102,126,234,0.03); border-color: rgba(102,126,234,0.2); }

    .notif-icon {
      width: 40px; height: 40px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .notif-icon .material-icons-outlined { font-size: 20px; color: white; }
    .notif-icon.alert { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .notif-icon.reminder { background: linear-gradient(135deg, #ca8a04, #a16207); }
    .notif-icon.flag { background: linear-gradient(135deg, #ea580c, #c2410c); }
    .notif-icon.info { background: linear-gradient(135deg, #667eea, #764ba2); }
    .notif-icon.system { background: linear-gradient(135deg, #38b2ac, #319795); }

    .notif-body { flex: 1; min-width: 0; }
    .notif-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .notif-title { font-size: 15px; font-weight: 700; }
    .notif-time { font-size: 13px; color: var(--text-light); flex-shrink: 0; }
    .notif-msg { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin: 0; }
    .notif-case { font-size: 13px; font-weight: 600; color: var(--primary); margin-top: 6px; display: inline-block; }

    .unread-dot {
      width: 10px; height: 10px; border-radius: 50%; background: var(--primary);
      flex-shrink: 0; align-self: center;
    }

    .empty {
      text-align: center; padding: 60px 20px; color: var(--text-secondary);
    }
    .empty .material-icons-outlined { font-size: 48px; opacity: 0.3; display: block; margin-bottom: 8px; }
  `],
})
export class NotificationsComponent implements OnInit {
  notifications: AppNotification[] = [];
  filter = 'all';
  searchQuery = '';
  unreadCount = 0;

  constructor(
    private featuresService: FeaturesService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) return;

    this.featuresService.getNotifications(user.id).subscribe((n) => {
      this.notifications = n;
      this.unreadCount = n.filter(x => !x.is_read).length;
    });
  }

  get filteredNotifications(): AppNotification[] {
    let result = this.notifications;
    if (this.filter !== 'all') result = result.filter(n => n.notification_type === this.filter);
    const q = this.searchQuery.toLowerCase().trim();
    if (q) result = result.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    return result;
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      alert: 'warning', reminder: 'schedule', flag: 'flag',
      info: 'info', system: 'settings',
    };
    return icons[type] || 'notifications';
  }

  timeAgo(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  }

  onNotifClick(n: AppNotification): void {
    if (!n.is_read) {
      this.featuresService.markNotificationRead(n.id).subscribe(() => {
        n.is_read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      });
    }
    if (n.related_case_id) {
      this.router.navigate(['/cases', n.related_case_id]);
    }
  }

  markAllRead(): void {
    const user = this.auth.getCurrentUser();
    if (!user) return;
    this.featuresService.markAllRead(user.id).subscribe(() => {
      this.notifications.forEach(n => n.is_read = true);
      this.unreadCount = 0;
    });
  }
}
