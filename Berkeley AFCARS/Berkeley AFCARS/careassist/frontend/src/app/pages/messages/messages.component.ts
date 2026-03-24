import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Conversation {
  id: number;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: { text: string; from: 'me' | 'them'; time: string }[];
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-page">
      <!-- Sidebar -->
      <div class="msg-sidebar">
        <div class="msg-sidebar-header">
          <h3>Messages</h3>
          <button class="icon-btn">
            <span class="material-icons-outlined">edit_square</span>
          </button>
        </div>
        <div class="msg-search">
          <span class="material-icons-outlined">search</span>
          <input type="text" placeholder="Search conversations..." [(ngModel)]="searchQuery" />
        </div>
        <div class="msg-tabs">
          <button class="msg-tab" [class.active]="msgTab === 'all'" (click)="msgTab = 'all'">All</button>
          <button class="msg-tab" [class.active]="msgTab === 'unread'" (click)="msgTab = 'unread'">Unread</button>
        </div>
        <div class="convo-list">
          <div class="convo-item"
               *ngFor="let c of getFilteredConvos()"
               [class.active]="activeConvo?.id === c.id"
               (click)="selectConvo(c)">
            <div class="convo-avatar" [style.background]="getAvatarColor(c.id)">
              {{ c.avatar }}
              <span class="online-dot" *ngIf="c.online"></span>
            </div>
            <div class="convo-info">
              <div class="convo-top">
                <span class="convo-name">{{ c.name }}</span>
                <span class="convo-time">{{ c.time }}</span>
              </div>
              <div class="convo-bottom">
                <span class="convo-preview">{{ c.lastMessage }}</span>
                <span class="unread-badge" *ngIf="c.unread > 0">{{ c.unread }}</span>
              </div>
            </div>
            <button class="convo-delete-btn" (click)="deleteConvo(c, $event)" title="Delete conversation">
              <span class="material-icons-outlined">delete_outline</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="msg-chat" *ngIf="activeConvo">
        <div class="chat-header">
          <div class="chat-user">
            <div class="convo-avatar sm" [style.background]="getAvatarColor(activeConvo.id)">
              {{ activeConvo.avatar }}
            </div>
            <div>
              <span class="chat-name">{{ activeConvo.name }}</span>
              <span class="chat-role">{{ activeConvo.role }}</span>
            </div>
          </div>
          <div class="chat-actions">
            <button class="icon-btn"><span class="material-icons-outlined">phone</span></button>
            <button class="icon-btn"><span class="material-icons-outlined">videocam</span></button>
            <button class="icon-btn"><span class="material-icons-outlined">more_vert</span></button>
          </div>
        </div>
        <div class="chat-messages">
          <div class="chat-bubble"
               *ngFor="let m of activeConvo.messages"
               [class.me]="m.from === 'me'"
               [class.them]="m.from === 'them'">
            <p>{{ m.text }}</p>
            <span class="bubble-time">{{ m.time }}</span>
          </div>
        </div>
        <div class="chat-input-bar">
          <button class="icon-btn"><span class="material-icons-outlined">attach_file</span></button>
          <input type="text" placeholder="Type a message..."
                 [(ngModel)]="newMessage"
                 (keydown.enter)="sendMessage()" />
          <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">
            <span class="material-icons-outlined">send</span>
          </button>
        </div>
      </div>
      <!-- Empty State -->
      <div class="msg-empty" *ngIf="!activeConvo">
        <span class="material-icons-outlined">chat_bubble_outline</span>
        <h3>Select a conversation</h3>
        <p>Choose a conversation from the sidebar to start messaging</p>
      </div>
    </div>
  `,
  styles: [`
    .messages-page { display: flex; height: calc(100vh - 160px); border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border); }

    /* Sidebar */
    .msg-sidebar {
      width: 320px; border-right: 1px solid var(--border); background: var(--surface);
      display: flex; flex-direction: column; flex-shrink: 0;
    }
    .msg-sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; border-bottom: 1px solid var(--border);
    }
    .msg-sidebar-header h3 { font-size: 16px; font-weight: 700; }
    .icon-btn {
      border: none; background: transparent; cursor: pointer;
      color: var(--text-secondary); padding: 4px; border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }
    .icon-btn:hover { background: rgba(139,92,246,0.08); color: var(--primary); }

    .msg-search {
      display: flex; align-items: center; gap: 8px; margin: 12px;
      padding: 8px 12px; border-radius: var(--radius-full);
      border: 1px solid var(--border); background: var(--bg);
    }
    .msg-search .material-icons-outlined { font-size: 18px; color: var(--text-light); }
    .msg-search input { border: none; outline: none; background: transparent; font-size: 15px; font-family: var(--font); flex: 1; }

    .msg-tabs { display: flex; gap: 4px; padding: 0 12px 12px; }
    .msg-tab {
      flex: 1; padding: 6px 0; border-radius: var(--radius-md); border: 1px solid var(--border);
      background: transparent; font-size: 16px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast); font-family: var(--font);
      color: var(--text-secondary);
    }
    .msg-tab.active { background: var(--primary); color: white; border-color: var(--primary); }

    .convo-list { flex: 1; overflow-y: auto; }
    .convo-item {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      cursor: pointer; transition: all var(--transition-fast);
      border-left: 3px solid transparent;
    }
    .convo-item:hover { background: rgba(139,92,246,0.04); }
    .convo-item.active { background: rgba(139,92,246,0.08); border-left-color: var(--primary); }

    .convo-delete-btn {
      border: none; background: transparent; cursor: pointer; padding: 4px;
      border-radius: var(--radius-sm); color: var(--text-light);
      opacity: 0; transition: all var(--transition-fast); flex-shrink: 0;
    }
    .convo-item:hover .convo-delete-btn { opacity: 1; }
    .convo-delete-btn:hover { color: #e53e3e; background: rgba(229,62,62,0.1); }
    .convo-delete-btn .material-icons-outlined { font-size: 16px; }

    .convo-avatar {
      width: 40px; height: 40px; border-radius: var(--radius-full); display: flex;
      align-items: center; justify-content: center; font-weight: 700; font-size: 16px;
      color: white; position: relative; flex-shrink: 0;
    }
    .convo-avatar.sm { width: 34px; height: 34px; font-size: 16px; }
    .online-dot {
      width: 10px; height: 10px; background: #48bb78; border: 2px solid var(--surface);
      border-radius: 50%; position: absolute; bottom: -1px; right: -1px;
    }
    .convo-info { flex: 1; min-width: 0; }
    .convo-top { display: flex; justify-content: space-between; align-items: center; }
    .convo-name { font-size: 15px; font-weight: 700; }
    .convo-time { font-size: 14px; color: var(--text-light); }
    .convo-bottom { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
    .convo-preview {
      font-size: 16px; color: var(--text-light); white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; flex: 1;
    }
    .unread-badge {
      background: var(--primary); color: white; font-size: 14px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }

    /* Chat Area */
    .msg-chat { flex: 1; display: flex; flex-direction: column; background: var(--bg); }
    .chat-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; background: var(--surface); border-bottom: 1px solid var(--border);
    }
    .chat-user { display: flex; align-items: center; gap: 10px; }
    .chat-name { font-size: 16px; font-weight: 700; display: block; }
    .chat-role { font-size: 15px; color: var(--text-light); }
    .chat-actions { display: flex; gap: 4px; }

    .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .chat-bubble {
      max-width: 70%; padding: 10px 14px; border-radius: var(--radius-lg);
      font-size: 15px; line-height: 1.5; position: relative;
    }
    .chat-bubble.me {
      align-self: flex-end; background: var(--primary); color: white;
      border-bottom-right-radius: 4px;
    }
    .chat-bubble.them {
      align-self: flex-start; background: var(--surface);
      border: 1px solid var(--border); border-bottom-left-radius: 4px;
    }
    .bubble-time {
      font-size: 13px; opacity: 0.6; display: block; text-align: right; margin-top: 4px;
    }

    .chat-input-bar {
      display: flex; align-items: center; gap: 10px; padding: 12px 20px;
      background: var(--surface); border-top: 1px solid var(--border);
    }
    .chat-input-bar input {
      flex: 1; padding: 10px 14px; border-radius: var(--radius-full);
      border: 1px solid var(--border); font-size: 15px; font-family: var(--font);
      background: var(--bg);
    }
    .chat-input-bar input:focus { border-color: var(--primary); outline: none; }
    .send-btn {
      width: 38px; height: 38px; border-radius: 50%; border: none;
      background: var(--primary); color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--transition-fast);
    }
    .send-btn:hover { background: var(--primary-dark); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .send-btn .material-icons-outlined { font-size: 18px; }

    /* Empty State */
    .msg-empty {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; color: var(--text-light); background: var(--bg);
    }
    .msg-empty .material-icons-outlined { font-size: 56px; margin-bottom: 12px; opacity: 0.3; }
    .msg-empty h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px; color: var(--text-secondary); }
    .msg-empty p { font-size: 15px; }
  `],
})
export class MessagesComponent implements OnInit {
  searchQuery = '';
  msgTab = 'all';
  activeConvo: Conversation | null = null;
  newMessage = '';
  conversations: Conversation[] = [];

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    const role = this.auth.getUserRole() || 'social_worker';
    this.conversations = this.getConversationsForRole(role);
  }

  private getConversationsForRole(role: string): Conversation[] {
    switch (role) {
      case 'supervisor': return this.supervisorConversations();
      case 'foster_parent': return this.fosterParentConversations();
      case 'aged_out_youth': return this.youthConversations();
      default: return this.socialWorkerConversations();
    }
  }

  private socialWorkerConversations(): Conversation[] {
    return [
      {
        id: 1, name: 'Judge Martinez', role: 'Family Court Judge', avatar: 'JM',
        lastMessage: 'The hearing for Maya has been rescheduled to next Tuesday.',
        time: '10:32 AM', unread: 2, online: true,
        messages: [
          { text: 'Good morning, I wanted to discuss the Johnson case.', from: 'them', time: '10:15 AM' },
          { text: 'Good morning, Judge. What would you like to discuss?', from: 'me', time: '10:18 AM' },
          { text: 'The hearing for Maya has been rescheduled to next Tuesday.', from: 'them', time: '10:32 AM' },
          { text: 'Please ensure all documentation is submitted by Friday.', from: 'them', time: '10:32 AM' },
        ],
      },
      {
        id: 2, name: 'Dr. Sarah Chen', role: 'Child Psychologist', avatar: 'SC',
        lastMessage: 'Ethan\'s behavioral assessment is complete. Report attached.',
        time: '9:45 AM', unread: 1, online: true,
        messages: [
          { text: 'Hi Jessica, I completed Ethan Rodriguez\'s assessment.', from: 'them', time: '9:30 AM' },
          { text: 'He showed improvement in social interaction metrics.', from: 'them', time: '9:31 AM' },
          { text: 'That\'s great to hear! Can you send the full report?', from: 'me', time: '9:40 AM' },
          { text: 'Ethan\'s behavioral assessment is complete. Report attached.', from: 'them', time: '9:45 AM' },
        ],
      },
      {
        id: 3, name: 'Lisa Thompson', role: 'Foster Parent', avatar: 'LT',
        lastMessage: 'Liam had a great week at school. His teacher is pleased.',
        time: 'Yesterday', unread: 0, online: false,
        messages: [
          { text: 'Hi Jessica, I wanted to give you an update on Liam.', from: 'them', time: 'Yesterday 4:15 PM' },
          { text: 'Liam had a great week at school. His teacher is pleased.', from: 'them', time: 'Yesterday 4:16 PM' },
          { text: 'Wonderful! Thank you for the update, Lisa.', from: 'me', time: 'Yesterday 4:30 PM' },
        ],
      },
      {
        id: 4, name: 'Mark Davis', role: 'CASA Volunteer', avatar: 'MD',
        lastMessage: 'I visited Jordan yesterday. Notes are in the system.',
        time: 'Yesterday', unread: 0, online: false,
        messages: [
          { text: 'I visited Jordan yesterday. Notes are in the system.', from: 'them', time: 'Yesterday 2:00 PM' },
          { text: 'Thank you, Mark. I\'ll review them today.', from: 'me', time: 'Yesterday 2:15 PM' },
        ],
      },
      {
        id: 5, name: 'Angela Rivera', role: 'Supervisor', avatar: 'AR',
        lastMessage: 'Please prepare the quarterly report by end of week.',
        time: 'Mon', unread: 0, online: true,
        messages: [
          { text: 'Hi Jessica, reminder about the quarterly caseload report.', from: 'them', time: 'Mon 11:00 AM' },
          { text: 'Please prepare the quarterly report by end of week.', from: 'them', time: 'Mon 11:01 AM' },
          { text: 'Will do, Angela. I\'ll have it ready by Thursday.', from: 'me', time: 'Mon 11:15 AM' },
        ],
      },
      {
        id: 6, name: 'David Park', role: 'Attorney (Children\'s Law)', avatar: 'DP',
        lastMessage: 'TPR motion filed for the Williams case.',
        time: 'Mon', unread: 0, online: false,
        messages: [
          { text: 'The TPR motion has been officially filed for Aisha Williams.', from: 'them', time: 'Mon 9:00 AM' },
          { text: 'Court date is set for next month. I\'ll send details soon.', from: 'them', time: 'Mon 9:01 AM' },
          { text: 'Understood. Please keep me updated on any developments.', from: 'me', time: 'Mon 9:20 AM' },
        ],
      },
    ];
  }

  private supervisorConversations(): Conversation[] {
    return [
      {
        id: 1, name: 'Jessica Hawkins', role: 'Social Worker', avatar: 'JH',
        lastMessage: 'Caseload report for Q1 is ready for your review.',
        time: '11:05 AM', unread: 2, online: true,
        messages: [
          { text: 'Hi James, I\'ve finished the Q1 caseload report.', from: 'them', time: '10:50 AM' },
          { text: 'Great. Any high-risk cases I should flag for the director?', from: 'me', time: '10:55 AM' },
          { text: 'Yes — case AC-2024-0891 has been escalated. Priority score is very high.', from: 'them', time: '11:00 AM' },
          { text: 'Caseload report for Q1 is ready for your review.', from: 'them', time: '11:05 AM' },
        ],
      },
      {
        id: 2, name: 'Priya Patel', role: 'Social Worker', avatar: 'PP',
        lastMessage: 'The placement for Sophia may be disrupted — foster family is relocating.',
        time: '10:20 AM', unread: 1, online: true,
        messages: [
          { text: 'James, I need to flag something about the Nguyen placement.', from: 'them', time: '10:00 AM' },
          { text: 'What\'s the situation?', from: 'me', time: '10:05 AM' },
          { text: 'The foster family is relocating out of county next month.', from: 'them', time: '10:10 AM' },
          { text: 'The placement for Sophia may be disrupted — foster family is relocating.', from: 'them', time: '10:20 AM' },
        ],
      },
      {
        id: 3, name: 'Marcus Williams', role: 'Social Worker', avatar: 'MW',
        lastMessage: 'Family reunification visit for the Carter children went well.',
        time: 'Yesterday', unread: 0, online: false,
        messages: [
          { text: 'The supervised visit with the Carter family happened yesterday.', from: 'them', time: 'Yesterday 3:00 PM' },
          { text: 'How did it go? Any concerns?', from: 'me', time: 'Yesterday 3:10 PM' },
          { text: 'Very positive. The children were comfortable and engaged.', from: 'them', time: 'Yesterday 3:15 PM' },
          { text: 'Family reunification visit for the Carter children went well.', from: 'them', time: 'Yesterday 3:20 PM' },
        ],
      },
      {
        id: 4, name: 'Director Lopez', role: 'Department Director', avatar: 'DL',
        lastMessage: 'Budget review meeting moved to Thursday at 2 PM.',
        time: 'Yesterday', unread: 0, online: true,
        messages: [
          { text: 'James, the county budget review has been rescheduled.', from: 'them', time: 'Yesterday 9:00 AM' },
          { text: 'Budget review meeting moved to Thursday at 2 PM.', from: 'them', time: 'Yesterday 9:01 AM' },
          { text: 'Noted. I\'ll have the staffing projections ready by then.', from: 'me', time: 'Yesterday 9:30 AM' },
        ],
      },
      {
        id: 5, name: 'Karen Mitchell', role: 'Training Coordinator', avatar: 'KM',
        lastMessage: 'New worker orientation is confirmed for next Monday.',
        time: 'Mon', unread: 0, online: false,
        messages: [
          { text: 'Hi James, the new hire orientation schedule is finalized.', from: 'them', time: 'Mon 2:00 PM' },
          { text: 'Perfect. I\'ll assign a mentor from the team.', from: 'me', time: 'Mon 2:15 PM' },
          { text: 'New worker orientation is confirmed for next Monday.', from: 'them', time: 'Mon 2:20 PM' },
        ],
      },
      {
        id: 6, name: 'David Park', role: 'Legal Counsel', avatar: 'DP',
        lastMessage: 'Compliance audit findings are ready. No major issues.',
        time: 'Mon', unread: 0, online: false,
        messages: [
          { text: 'James, the Q4 compliance audit is complete.', from: 'them', time: 'Mon 10:00 AM' },
          { text: 'Any areas of concern?', from: 'me', time: 'Mon 10:10 AM' },
          { text: 'Compliance audit findings are ready. No major issues.', from: 'them', time: 'Mon 10:20 AM' },
        ],
      },
    ];
  }

  private fosterParentConversations(): Conversation[] {
    return [
      {
        id: 1, name: 'Jessica Hawkins', role: 'Social Worker', avatar: 'JH',
        lastMessage: 'Home visit is scheduled for this Thursday at 3 PM.',
        time: '10:15 AM', unread: 2, online: true,
        messages: [
          { text: 'Hi Maria, I wanted to schedule the next home visit.', from: 'them', time: '9:45 AM' },
          { text: 'Sure, Thursday afternoon works best for me.', from: 'me', time: '10:00 AM' },
          { text: 'Home visit is scheduled for this Thursday at 3 PM.', from: 'them', time: '10:15 AM' },
          { text: 'I\'ll also bring the updated placement agreement for you to sign.', from: 'them', time: '10:15 AM' },
        ],
      },
      {
        id: 2, name: 'Dr. Amelia Brooks', role: 'Pediatrician', avatar: 'AB',
        lastMessage: 'Liam\'s immunizations are up to date. Next checkup in 6 months.',
        time: '9:30 AM', unread: 1, online: true,
        messages: [
          { text: 'Good morning, Maria. Liam\'s annual checkup results are in.', from: 'them', time: '9:00 AM' },
          { text: 'How did everything look?', from: 'me', time: '9:15 AM' },
          { text: 'All within normal range. He\'s growing well.', from: 'them', time: '9:20 AM' },
          { text: 'Liam\'s immunizations are up to date. Next checkup in 6 months.', from: 'them', time: '9:30 AM' },
        ],
      },
      {
        id: 3, name: 'Ms. Rachel Kim', role: 'School Counselor', avatar: 'RK',
        lastMessage: 'Liam\'s IEP meeting is set for next Wednesday.',
        time: 'Yesterday', unread: 0, online: false,
        messages: [
          { text: 'Hi Maria, I wanted to update you on the IEP meeting.', from: 'them', time: 'Yesterday 2:00 PM' },
          { text: 'Great, when is it scheduled?', from: 'me', time: 'Yesterday 2:15 PM' },
          { text: 'Liam\'s IEP meeting is set for next Wednesday.', from: 'them', time: 'Yesterday 2:20 PM' },
          { text: 'We\'ll review his academic progress and adjust goals.', from: 'them', time: 'Yesterday 2:21 PM' },
        ],
      },
      {
        id: 4, name: 'Foster Parent Network', role: 'Support Group', avatar: 'FN',
        lastMessage: 'Monthly meetup this Saturday at the community center.',
        time: 'Yesterday', unread: 0, online: false,
        messages: [
          { text: 'Reminder: our monthly foster parent support group is this Saturday.', from: 'them', time: 'Yesterday 10:00 AM' },
          { text: 'Monthly meetup this Saturday at the community center.', from: 'them', time: 'Yesterday 10:01 AM' },
          { text: 'I\'ll be there! Should I bring anything?', from: 'me', time: 'Yesterday 10:30 AM' },
        ],
      },
      {
        id: 5, name: 'Family Resource Center', role: 'Resource Coordinator', avatar: 'FR',
        lastMessage: 'Respite care approved for the weekend of March 22.',
        time: 'Mon', unread: 0, online: true,
        messages: [
          { text: 'Hi Maria, your respite care request has been processed.', from: 'them', time: 'Mon 1:00 PM' },
          { text: 'Respite care approved for the weekend of March 22.', from: 'them', time: 'Mon 1:01 PM' },
          { text: 'Thank you so much! That really helps.', from: 'me', time: 'Mon 1:20 PM' },
        ],
      },
      {
        id: 6, name: 'Sarah Johnson', role: 'Child Therapist', avatar: 'SJ',
        lastMessage: 'Liam\'s therapy sessions are showing positive progress.',
        time: 'Mon', unread: 0, online: false,
        messages: [
          { text: 'Maria, I wanted to share an update on Liam\'s therapy.', from: 'them', time: 'Mon 11:00 AM' },
          { text: 'He\'s been opening up more in our sessions.', from: 'them', time: 'Mon 11:01 AM' },
          { text: 'That\'s wonderful to hear. He seems happier at home too.', from: 'me', time: 'Mon 11:15 AM' },
          { text: 'Liam\'s therapy sessions are showing positive progress.', from: 'them', time: 'Mon 11:20 AM' },
        ],
      },
    ];
  }

  private youthConversations(): Conversation[] {
    return [
      {
        id: 1, name: 'Jessica Hawkins', role: 'Case Worker', avatar: 'JH',
        lastMessage: 'Your birth certificate request has been processed.',
        time: '11:00 AM', unread: 2, online: true,
        messages: [
          { text: 'Hi Jordan, I have an update on those documents you requested.', from: 'them', time: '10:30 AM' },
          { text: 'Great! Were you able to get my birth certificate?', from: 'me', time: '10:40 AM' },
          { text: 'Yes, it\'s been processed and should arrive this week.', from: 'them', time: '10:50 AM' },
          { text: 'Your birth certificate request has been processed.', from: 'them', time: '11:00 AM' },
        ],
      },
      {
        id: 2, name: 'Michael Torres', role: 'Life Skills Mentor', avatar: 'MT',
        lastMessage: 'Budgeting workshop is this Thursday at 5 PM. See you there!',
        time: '9:15 AM', unread: 1, online: true,
        messages: [
          { text: 'Hey Jordan! Reminder about the budgeting workshop.', from: 'them', time: '9:00 AM' },
          { text: 'We\'ll cover monthly spending plans and saving strategies.', from: 'them', time: '9:01 AM' },
          { text: 'Sounds good, I really need help with that.', from: 'me', time: '9:10 AM' },
          { text: 'Budgeting workshop is this Thursday at 5 PM. See you there!', from: 'them', time: '9:15 AM' },
        ],
      },
      {
        id: 3, name: 'Housing Connect', role: 'Housing Coordinator', avatar: 'HC',
        lastMessage: 'Your apartment application has been submitted. We\'ll hear back in 2 weeks.',
        time: 'Yesterday', unread: 0, online: false,
        messages: [
          { text: 'Jordan, your transitional housing application is filed.', from: 'them', time: 'Yesterday 3:00 PM' },
          { text: 'How long until I hear back?', from: 'me', time: 'Yesterday 3:15 PM' },
          { text: 'Your apartment application has been submitted. We\'ll hear back in 2 weeks.', from: 'them', time: 'Yesterday 3:20 PM' },
        ],
      },
      {
        id: 4, name: 'Career Center', role: 'Employment Specialist', avatar: 'CC',
        lastMessage: 'Mock interview scheduled for Friday at 10 AM. Bring your resume!',
        time: 'Yesterday', unread: 0, online: false,
        messages: [
          { text: 'Hi Jordan, I found a few job openings that match your interests.', from: 'them', time: 'Yesterday 11:00 AM' },
          { text: 'That\'s awesome! Can we do a practice interview?', from: 'me', time: 'Yesterday 11:15 AM' },
          { text: 'Absolutely! Let\'s schedule one.', from: 'them', time: 'Yesterday 11:20 AM' },
          { text: 'Mock interview scheduled for Friday at 10 AM. Bring your resume!', from: 'them', time: 'Yesterday 11:25 AM' },
        ],
      },
      {
        id: 5, name: 'Tanya Brooks', role: 'College Advisor', avatar: 'TB',
        lastMessage: 'Your FAFSA application looks good. I submitted it today.',
        time: 'Mon', unread: 0, online: true,
        messages: [
          { text: 'Jordan, I reviewed your FAFSA application.', from: 'them', time: 'Mon 2:00 PM' },
          { text: 'Everything checked out. I submitted it on your behalf.', from: 'them', time: 'Mon 2:01 PM' },
          { text: 'Thank you so much! When will I know about financial aid?', from: 'me', time: 'Mon 2:15 PM' },
          { text: 'Your FAFSA application looks good. I submitted it today.', from: 'them', time: 'Mon 2:20 PM' },
        ],
      },
      {
        id: 6, name: 'Youth Alumni Network', role: 'Peer Support Group', avatar: 'YA',
        lastMessage: 'Next support group meetup is Saturday at noon. Pizza included!',
        time: 'Mon', unread: 0, online: false,
        messages: [
          { text: 'Hey everyone! Reminder about our monthly meetup.', from: 'them', time: 'Mon 10:00 AM' },
          { text: 'Next support group meetup is Saturday at noon. Pizza included!', from: 'them', time: 'Mon 10:01 AM' },
          { text: 'I\'ll be there!', from: 'me', time: 'Mon 10:10 AM' },
        ],
      },
    ];
  }

  getFilteredConvos(): Conversation[] {
    let result = this.conversations;
    if (this.msgTab === 'unread') result = result.filter((c) => c.unread > 0);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
    }
    return result;
  }

  selectConvo(c: Conversation): void {
    this.activeConvo = c;
    c.unread = 0;
  }

  deleteConvo(c: Conversation, event: Event): void {
    event.stopPropagation();
    if (confirm(`Delete conversation with ${c.name}?`)) {
      this.conversations = this.conversations.filter((x) => x.id !== c.id);
      if (this.activeConvo?.id === c.id) {
        this.activeConvo = null;
      }
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeConvo) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    this.activeConvo.messages.push({ text: this.newMessage, from: 'me', time });
    this.activeConvo.lastMessage = this.newMessage;
    this.activeConvo.time = time;
    this.newMessage = '';
  }

  getAvatarColor(id: number): string {
    const colors = ['var(--gradient-primary)', 'var(--gradient-success)', 'var(--gradient-warning)',
      'var(--gradient-danger)', 'var(--gradient-info)', 'linear-gradient(135deg, #805ad5, #553c9a)'];
    return colors[(id - 1) % colors.length];
  }
}
