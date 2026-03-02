import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaseService } from '../../services/case.service';
import { AuthService } from '../../services/auth.service';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'hearing' | 'visit' | 'review' | 'medical' | 'personal';
  time?: string;
  caseNumber?: string;
  source: 'system' | 'user';
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="calendar-page">
      <!-- Header -->
      <div class="page-header animate-in">
        <div>
          <h2>Calendar</h2>
          <p class="subtitle">{{ calendarSubtitle }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary btn-sm" (click)="showAddModal = true">
            <span class="material-icons-outlined">add</span> Add Event
          </button>
        </div>
      </div>

      <div class="calendar-layout">
        <!-- Calendar Grid -->
        <div class="calendar-grid-wrap animate-in">
          <!-- Nav -->
          <div class="cal-nav">
            <button class="cal-nav-btn" (click)="prevMonth()">
              <span class="material-icons-outlined">chevron_left</span>
            </button>
            <h3 class="cal-month-title">{{ monthNames[currentMonth] }} {{ currentYear }}</h3>
            <button class="cal-nav-btn" (click)="nextMonth()">
              <span class="material-icons-outlined">chevron_right</span>
            </button>
          </div>

          <!-- Day Headers -->
          <div class="cal-grid">
            <div class="cal-day-header" *ngFor="let day of dayNames">{{ day }}</div>

            <!-- Day Cells -->
            <div class="cal-day"
                 *ngFor="let d of calendarDays"
                 [class.out-month]="!d.inMonth"
                 [class.today]="d.isToday"
                 [class.selected]="isSelectedDay(d.date)"
                 (click)="selectDay(d)">
              <span class="day-num">{{ d.date.getDate() }}</span>
              <div class="day-events">
                <div class="event-bar"
                     *ngFor="let ev of d.events.slice(0, 3)"
                     [ngClass]="ev.type"
                     [title]="ev.title">
                  <span class="ev-icon material-icons-outlined">{{ getEventIcon(ev.type) }}</span>
                  <span class="ev-time" *ngIf="ev.time">{{ ev.time }}</span>
                  <span class="ev-title">{{ getShortTitle(ev.title) }}</span>
                </div>
                <div class="more-events" *ngIf="d.events.length > 3">+{{ d.events.length - 3 }} more</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="calendar-sidebar animate-in">
          <!-- Selected Day Events -->
          <div class="sidebar-section" *ngIf="selectedDay">
            <h4>{{ selectedDay.date | date:'EEEE, MMMM d' }}</h4>
            <div class="sidebar-events" *ngIf="selectedDay.events.length > 0">
              <div class="sidebar-event" *ngFor="let ev of selectedDay.events" [ngClass]="ev.type">
                <div class="se-color-bar" [ngClass]="ev.type"></div>
                <div class="se-info">
                  <span class="se-title">{{ ev.title }}</span>
                  <span class="se-meta">
                    <span class="material-icons-outlined">schedule</span>
                    {{ ev.time || 'All day' }}
                  </span>
                  <span class="se-meta" *ngIf="ev.caseNumber">
                    <span class="material-icons-outlined">folder</span>
                    {{ ev.caseNumber }}
                  </span>
                </div>
                <button class="se-delete" *ngIf="ev.source === 'user'" (click)="deleteEvent(ev.id)">
                  <span class="material-icons-outlined">close</span>
                </button>
              </div>
            </div>
            <p class="empty-day" *ngIf="selectedDay.events.length === 0">No events scheduled</p>
          </div>

          <!-- Upcoming Events -->
          <div class="sidebar-section">
            <h4>Upcoming</h4>
            <div class="sidebar-events">
              <div class="sidebar-event" *ngFor="let ev of upcomingEvents" [ngClass]="ev.type">
                <div class="se-color-bar" [ngClass]="ev.type"></div>
                <div class="se-info">
                  <span class="se-title">{{ ev.title }}</span>
                  <span class="se-meta">
                    <span class="material-icons-outlined">event</span>
                    {{ ev.date | date:'MMM d' }}
                    <span *ngIf="ev.time"> &middot; {{ ev.time }}</span>
                  </span>
                </div>
              </div>
              <p class="empty-day" *ngIf="upcomingEvents.length === 0">No upcoming events</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Event Modal -->
      <div class="modal-overlay" *ngIf="showAddModal" (click)="showAddModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Event</h3>
            <button class="modal-close" (click)="showAddModal = false">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>
          <div class="modal-body">
            <label>Title</label>
            <input type="text" [(ngModel)]="newEvent.title" placeholder="Event title" />
            <label>Date</label>
            <input type="date" [(ngModel)]="newEvent.date" />
            <label>Time (optional)</label>
            <input type="time" [(ngModel)]="newEvent.time" />
            <label>Type</label>
            <select [(ngModel)]="newEvent.type">
              <option value="hearing">Hearing</option>
              <option value="visit">Visit</option>
              <option value="review">Review</option>
              <option value="medical">Medical</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" (click)="showAddModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" (click)="addEvent()" [disabled]="!newEvent.title || !newEvent.date">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-page { max-width: 100%; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
    .page-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 13px; color: var(--text-light); margin-top: 2px; }

    .calendar-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }

    /* Calendar Grid */
    .calendar-grid-wrap {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: 20px;
    }
    .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .cal-nav-btn {
      width: 32px; height: 32px; border-radius: var(--radius-md); border: 1px solid var(--border);
      background: transparent; cursor: pointer; display: flex; align-items: center;
      justify-content: center; transition: all var(--transition-fast);
    }
    .cal-nav-btn:hover { background: rgba(139,92,246,0.08); border-color: var(--primary); }
    .cal-nav-btn .material-icons-outlined { font-size: 20px; }
    .cal-month-title { font-size: 17px; font-weight: 700; }

    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
    .cal-day-header {
      text-align: center; font-size: 11px; font-weight: 700;
      color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px;
      padding: 8px 0;
    }
    .cal-day {
      min-height: 90px; padding: 6px; border: 1px solid var(--border-light);
      border-radius: 4px; cursor: pointer; transition: all var(--transition-fast);
    }
    .cal-day:hover { background: rgba(139,92,246,0.04); }
    .cal-day.out-month { opacity: 0.35; }
    .cal-day.today { background: rgba(139,92,246,0.06); border-color: var(--primary); }
    .cal-day.today .day-num { color: var(--primary); font-weight: 800; }
    .cal-day.selected { background: rgba(139,92,246,0.1); border-color: var(--primary); }
    .day-num { font-size: 12px; font-weight: 600; margin-bottom: 4px; display: block; }

    .day-events { display: flex; flex-direction: column; gap: 2px; }
    .event-bar {
      display: flex; align-items: center; gap: 3px; padding: 2px 5px;
      border-radius: 3px; font-size: 9px; font-weight: 600; overflow: hidden;
      white-space: nowrap; text-overflow: ellipsis;
    }
    .event-bar.hearing { background: rgba(139,92,246,0.15); color: var(--primary); }
    .event-bar.visit { background: rgba(56,178,172,0.15); color: #38b2ac; }
    .event-bar.review { background: rgba(237,137,54,0.15); color: #dd6b20; }
    .event-bar.medical { background: rgba(229,62,62,0.15); color: var(--danger); }
    .event-bar.personal { background: rgba(66,153,225,0.15); color: #4299e1; }
    .ev-icon { font-size: 11px; }
    .ev-time { opacity: 0.7; }
    .ev-title { overflow: hidden; text-overflow: ellipsis; }
    .more-events { font-size: 9px; color: var(--text-light); padding: 1px 5px; }

    /* Sidebar */
    .calendar-sidebar { display: flex; flex-direction: column; gap: 20px; }
    .sidebar-section {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: 16px;
    }
    .sidebar-section h4 { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .sidebar-events { display: flex; flex-direction: column; gap: 10px; }
    .sidebar-event {
      display: flex; align-items: flex-start; gap: 10px; padding: 10px;
      border-radius: var(--radius-md); background: var(--bg); position: relative;
    }
    .se-color-bar {
      width: 3px; border-radius: 2px; align-self: stretch; flex-shrink: 0;
    }
    .se-color-bar.hearing { background: var(--primary); }
    .se-color-bar.visit { background: #38b2ac; }
    .se-color-bar.review { background: #dd6b20; }
    .se-color-bar.medical { background: var(--danger); }
    .se-color-bar.personal { background: #4299e1; }
    .se-info { flex: 1; }
    .se-title { font-size: 13px; font-weight: 600; display: block; }
    .se-meta {
      display: flex; align-items: center; gap: 4px; font-size: 11px;
      color: var(--text-light); margin-top: 3px;
    }
    .se-meta .material-icons-outlined { font-size: 13px; }
    .se-delete {
      border: none; background: transparent; cursor: pointer;
      color: var(--text-light); padding: 2px;
    }
    .se-delete:hover { color: var(--danger); }
    .empty-day { font-size: 12px; color: var(--text-light); font-style: italic; }

    /* Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex;
      align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: var(--surface); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl); width: 420px; max-width: 90vw;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--border);
    }
    .modal-header h3 { font-size: 16px; font-weight: 700; }
    .modal-close {
      border: none; background: transparent; cursor: pointer;
      color: var(--text-light); padding: 4px;
    }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .modal-body label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .modal-body input, .modal-body select {
      padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border);
      font-size: 13px; font-family: var(--font); background: var(--surface);
    }
    .modal-body input:focus, .modal-body select:focus { border-color: var(--primary); outline: none; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 20px; border-top: 1px solid var(--border);
    }

    @media (max-width: 1100px) {
      .calendar-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class CalendarComponent implements OnInit {
  today = new Date();
  currentMonth = this.today.getMonth();
  currentYear = this.today.getFullYear();
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;
  allEvents: CalendarEvent[] = [];
  upcomingEvents: CalendarEvent[] = [];
  showAddModal = false;
  calendarSubtitle = 'Upcoming hearings, visits & reviews';

  newEvent = { title: '', date: '', time: '', type: 'hearing' as CalendarEvent['type'] };

  monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private role = 'social_worker';

  constructor(private caseService: CaseService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserEvents();
    this.role = this.authService.getUserRole() || 'social_worker';

    if (this.role === 'foster_parent') {
      this.calendarSubtitle = 'Appointments & meetings for your children';
      this.addFosterParentEvents();
      this.buildCalendar();
      this.updateUpcoming();
    } else if (this.role === 'aged_out_youth') {
      this.calendarSubtitle = 'Your upcoming appointments & meetings';
      this.addYouthEvents();
      this.buildCalendar();
      this.updateUpcoming();
    } else if (this.role === 'supervisor') {
      this.calendarSubtitle = 'Team check-ins & case reviews';
      this.addSupervisorCheckIns();
      this.loadWorkerCaseEvents();
    } else {
      // social_worker / admin
      this.loadWorkerCaseEvents();
    }
  }

  /** Load case-based system events (for social workers & supervisors). */
  private loadWorkerCaseEvents(): void {
    this.caseService.getCases().subscribe((cases) => {
      const systemEvents: CalendarEvent[] = [];
      const now = new Date();
      cases.forEach((c, i) => {
        const reviewDate = new Date(now);
        reviewDate.setDate(reviewDate.getDate() + (i + 1) * 5);
        systemEvents.push({
          id: 'sys-review-' + c.id,
          title: c.child_name + ' \u2013 Review',
          date: reviewDate.toISOString().slice(0, 10),
          time: '10:00',
          type: 'review',
          caseNumber: c.case_number,
          source: 'system',
        });
        if (c.flag_count > 0) {
          const hearingDate = new Date(now);
          hearingDate.setDate(hearingDate.getDate() + (i + 1) * 7 + 2);
          systemEvents.push({
            id: 'sys-hearing-' + c.id,
            title: c.child_name + ' \u2013 Hearing',
            date: hearingDate.toISOString().slice(0, 10),
            time: '09:00',
            type: 'hearing',
            caseNumber: c.case_number,
            source: 'system',
          });
        }
      });
      this.allEvents = [...this.allEvents, ...systemEvents];
      this.buildCalendar();
      this.updateUpcoming();
    });
  }

  /** Foster parent: kid appointments, doctor visits, SW meetings. */
  private addFosterParentEvents(): void {
    const now = new Date();
    const children = [
      { name: 'Ethan Rodriguez', sw: 'Samantha Townsend' },
      { name: 'Liam Thompson', sw: 'Samantha Townsend' },
      { name: 'Emma Martinez', sw: 'Priya Patel' },
    ];

    children.forEach((child, ci) => {
      // Pediatrician check-up
      const pediatric = new Date(now);
      pediatric.setDate(pediatric.getDate() + 3 + ci * 8);
      this.allEvents.push({
        id: 'fp-medical-' + ci,
        title: child.name + ' \u2013 Pediatrician',
        date: pediatric.toISOString().slice(0, 10),
        time: ci === 0 ? '9:30' : ci === 1 ? '11:00' : '2:00',
        type: 'medical',
        source: 'system',
      });

      // Meeting with social worker
      const swMeeting = new Date(now);
      swMeeting.setDate(swMeeting.getDate() + 5 + ci * 6);
      this.allEvents.push({
        id: 'fp-sw-' + ci,
        title: 'Meeting w/ ' + child.sw + ' re: ' + child.name.split(' ')[0],
        date: swMeeting.toISOString().slice(0, 10),
        time: ci === 0 ? '1:00' : ci === 1 ? '10:00' : '3:30',
        type: 'visit',
        source: 'system',
      });

      // School events
      const schoolEvent = new Date(now);
      schoolEvent.setDate(schoolEvent.getDate() + 10 + ci * 5);
      this.allEvents.push({
        id: 'fp-school-' + ci,
        title: child.name.split(' ')[0] + ' \u2013 Parent-Teacher Conf.',
        date: schoolEvent.toISOString().slice(0, 10),
        time: ci === 0 ? '4:00' : ci === 1 ? '3:00' : '4:30',
        type: 'review',
        source: 'system',
      });
    });

    // Therapy sessions (recurring)
    for (let w = 0; w < 4; w++) {
      const therapy = new Date(now);
      therapy.setDate(therapy.getDate() + (w * 7) + 2); // Wednesdays roughly
      this.allEvents.push({
        id: 'fp-therapy-ethan-' + w,
        title: 'Ethan \u2013 Therapy Session',
        date: therapy.toISOString().slice(0, 10),
        time: '10:00',
        type: 'medical',
        source: 'system',
      });
    }

    // Foster parent support group
    const supportGroup = new Date(now);
    supportGroup.setDate(supportGroup.getDate() + 12);
    this.allEvents.push({
      id: 'fp-support-group',
      title: 'Foster Parent Support Group',
      date: supportGroup.toISOString().slice(0, 10),
      time: '6:30',
      type: 'personal',
      source: 'system',
    });

    // Case review hearing
    const hearing = new Date(now);
    hearing.setDate(hearing.getDate() + 18);
    this.allEvents.push({
      id: 'fp-hearing',
      title: 'Ethan \u2013 Permanency Hearing',
      date: hearing.toISOString().slice(0, 10),
      time: '9:00',
      type: 'hearing',
      source: 'system',
    });
  }

  /** Aged-out youth: personal appointments, court, SW meetings, etc. */
  private addYouthEvents(): void {
    const now = new Date();

    const youthEvents: { title: string; offset: number; time: string; type: CalendarEvent['type'] }[] = [
      { title: 'Meeting w/ Priya Patel (Social Worker)', offset: 2, time: '10:00', type: 'visit' },
      { title: 'Therapy Session \u2013 Dr. Kim', offset: 4, time: '2:00', type: 'medical' },
      { title: 'Court \u2013 Independent Living Review', offset: 7, time: '9:00', type: 'hearing' },
      { title: 'Job Training Orientation', offset: 9, time: '11:00', type: 'personal' },
      { title: 'Chafee Grant Application Deadline', offset: 11, time: '11:59', type: 'review' },
      { title: 'Transition Planning Meeting', offset: 14, time: '1:00', type: 'visit' },
      { title: 'Therapy Session \u2013 Dr. Kim', offset: 18, time: '2:00', type: 'medical' },
      { title: 'Housing Assistance \u2013 Intake Appt.', offset: 20, time: '10:30', type: 'personal' },
      { title: 'Meeting w/ Priya Patel (Social Worker)', offset: 23, time: '10:00', type: 'visit' },
      { title: 'Court \u2013 Status Hearing', offset: 28, time: '9:00', type: 'hearing' },
      { title: 'GED Prep Class Start', offset: 15, time: '9:00', type: 'review' },
      { title: 'Life Skills Workshop', offset: 21, time: '3:00', type: 'personal' },
      { title: 'Physical Exam \u2013 Extended Medicaid', offset: 25, time: '8:30', type: 'medical' },
      { title: 'Mentorship Program Meetup', offset: 12, time: '5:00', type: 'personal' },
    ];

    // Also add a few past events
    const pastEvents: { title: string; offset: number; time: string; type: CalendarEvent['type'] }[] = [
      { title: 'Meeting w/ Priya Patel (Social Worker)', offset: -5, time: '10:00', type: 'visit' },
      { title: 'Therapy Session \u2013 Dr. Kim', offset: -10, time: '2:00', type: 'medical' },
      { title: 'Court \u2013 Emancipation Finalization', offset: -14, time: '9:00', type: 'hearing' },
    ];

    [...pastEvents, ...youthEvents].forEach((ev, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + ev.offset);
      this.allEvents.push({
        id: 'youth-' + i,
        title: ev.title,
        date: d.toISOString().slice(0, 10),
        time: ev.time,
        type: ev.type,
        source: 'system',
      });
    });
  }

  buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startOffset = firstDay.getDay();
    const days: CalendarDay[] = [];

    // Previous month fill
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(this.currentYear, this.currentMonth, -i);
      days.push({ date: d, inMonth: false, isToday: false, events: this.getEventsForDate(d) });
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const isToday = this.isSameDay(date, this.today);
      days.push({ date, inMonth: true, isToday, events: this.getEventsForDate(date) });
      if (isToday && !this.selectedDay) this.selectedDay = days[days.length - 1];
    }
    // Next month fill
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(this.currentYear, this.currentMonth + 1, i);
      days.push({ date: d, inMonth: false, isToday: false, events: this.getEventsForDate(d) });
    }
    this.calendarDays = days;
  }

  getEventsForDate(date: Date): CalendarEvent[] {
    const ds = date.toISOString().slice(0, 10);
    return this.allEvents.filter((e) => e.date === ds);
  }

  isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  isSelectedDay(date: Date): boolean {
    return !!this.selectedDay && this.isSameDay(date, this.selectedDay.date);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else { this.currentMonth--; }
    this.selectedDay = null;
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else { this.currentMonth++; }
    this.selectedDay = null;
    this.buildCalendar();
  }

  updateUpcoming(): void {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    this.upcomingEvents = this.allEvents
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }

  getEventIcon(type: string): string {
    const map: Record<string, string> = {
      hearing: 'gavel', visit: 'home', review: 'rate_review',
      medical: 'medical_services', personal: 'event',
    };
    return map[type] || 'event';
  }

  getShortTitle(title: string): string {
    return title.length > 18 ? title.slice(0, 18) + '…' : title;
  }

  addEvent(): void {
    if (!this.newEvent.title || !this.newEvent.date) return;
    const ev: CalendarEvent = {
      id: 'user-' + Date.now(),
      title: this.newEvent.title,
      date: this.newEvent.date,
      time: this.newEvent.time || undefined,
      type: this.newEvent.type,
      source: 'user',
    };
    this.allEvents.push(ev);
    this.saveUserEvents();
    this.buildCalendar();
    this.updateUpcoming();
    this.showAddModal = false;
    this.newEvent = { title: '', date: '', time: '', type: 'hearing' };
  }

  deleteEvent(id: string): void {
    this.allEvents = this.allEvents.filter((e) => e.id !== id);
    this.saveUserEvents();
    this.buildCalendar();
    this.updateUpcoming();
  }

  private loadUserEvents(): void {
    try {
      const raw = localStorage.getItem('careassist_calendar_events');
      if (raw) this.allEvents = JSON.parse(raw);
    } catch {}
  }

  private saveUserEvents(): void {
    const userEvents = this.allEvents.filter((e) => e.source === 'user');
    localStorage.setItem('careassist_calendar_events', JSON.stringify(userEvents));
  }

  private addSupervisorCheckIns(): void {
    const workers = [
      { name: 'Samantha Townsend', day: 1 }, // Monday
      { name: 'Priya Patel', day: 3 },        // Wednesday
      { name: 'Marcus Williams', day: 5 },    // Friday
    ];
    const today = new Date();

    // Generate check-ins for 4 weeks (2 past, 2 future)
    for (let weekOffset = -2; weekOffset <= 2; weekOffset++) {
      for (const w of workers) {
        const d = new Date(today);
        const currentDay = d.getDay();
        const diff = w.day - currentDay + weekOffset * 7;
        d.setDate(d.getDate() + diff);

        this.allEvents.push({
          id: 'checkin-' + w.name.replace(/\s/g, '') + '-' + d.toISOString().slice(0, 10),
          title: 'Check-in: ' + w.name,
          date: d.toISOString().slice(0, 10),
          time: w.day === 1 ? '9:00' : w.day === 3 ? '10:30' : '2:00',
          type: 'visit',
          source: 'system',
        });
      }
    }
  }
}
