import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-page">
      <div class="ai-main">
        <!-- Welcome Screen -->
        <div class="ai-welcome" *ngIf="messages.length === 0">
          <div class="welcome-icon">
            <span class="material-icons-outlined">psychology</span>
          </div>
          <h2>CareAssist AI</h2>
          <p class="welcome-sub">Your intelligent casework companion. Ask about cases, policies, best practices, or get recommendations.</p>

          <!-- Suggestion Cards -->
          <div class="suggestion-grid">
            <div class="suggestion-card" *ngFor="let s of suggestions" (click)="useSuggestion(s.text)">
              <span class="material-icons-outlined" [style.color]="s.color">{{ s.icon }}</span>
              <span class="sug-text">{{ s.text }}</span>
            </div>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="ai-messages" *ngIf="messages.length > 0">
          <div class="ai-bubble"
               *ngFor="let m of messages"
               [class.user]="m.role === 'user'"
               [class.assistant]="m.role === 'assistant'">
            <div class="bubble-avatar" *ngIf="m.role === 'assistant'">
              <span class="material-icons-outlined">psychology</span>
            </div>
            <div class="bubble-content">
              <p [innerHTML]="formatContent(m.content)"></p>
              <span class="bubble-time">{{ m.timestamp | date:'h:mm a' }}</span>
            </div>
            <div class="bubble-avatar user-avatar" *ngIf="m.role === 'user'">ST</div>
          </div>

          <!-- Typing indicator -->
          <div class="ai-bubble assistant" *ngIf="isLoading">
            <div class="bubble-avatar">
              <span class="material-icons-outlined">psychology</span>
            </div>
            <div class="bubble-content typing">
              <div class="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="ai-input-bar">
          <input type="text" placeholder="Ask CareAssist AI anything..."
                 [(ngModel)]="userInput"
                 (keydown.enter)="send()"
                 [disabled]="isLoading" />
          <button class="send-btn" (click)="send()" [disabled]="!userInput.trim() || isLoading">
            <span class="material-icons-outlined">send</span>
          </button>
        </div>
      </div>

      <!-- Context Panel -->
      <div class="ai-context-panel">
        <h4>Quick Actions</h4>
        <div class="context-actions">
          <button class="ctx-action" *ngFor="let a of quickActions" (click)="useSuggestion(a.prompt)">
            <span class="material-icons-outlined">{{ a.icon }}</span>
            {{ a.label }}
          </button>
        </div>

        <h4>Capabilities</h4>
        <div class="capabilities">
          <div class="cap-item" *ngFor="let cap of capabilities">
            <span class="material-icons-outlined">{{ cap.icon }}</span>
            <div>
              <strong>{{ cap.title }}</strong>
              <p>{{ cap.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-page { display: flex; gap: 20px; height: calc(100vh - 160px); }
    .ai-main { flex: 1; display: flex; flex-direction: column; background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; }

    /* Welcome */
    .ai-welcome {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 40px;
    }
    .welcome-icon {
      width: 64px; height: 64px; border-radius: var(--radius-lg);
      background: var(--gradient-primary); display: flex; align-items: center;
      justify-content: center; margin-bottom: 16px;
    }
    .welcome-icon .material-icons-outlined { font-size: 32px; color: white; }
    .ai-welcome h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .welcome-sub { font-size: 14px; color: var(--text-secondary); text-align: center; max-width: 500px; line-height: 1.6; margin-bottom: 32px; }

    .suggestion-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 550px; width: 100%; }
    .suggestion-card {
      display: flex; align-items: center; gap: 10px; padding: 14px;
      border-radius: var(--radius-md); border: 1px solid var(--border);
      background: var(--bg); cursor: pointer; transition: all var(--transition-fast);
    }
    .suggestion-card:hover { border-color: var(--primary); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
    .suggestion-card .material-icons-outlined { font-size: 20px; }
    .sug-text { font-size: 12px; font-weight: 600; color: var(--text-secondary); line-height: 1.4; }

    /* Messages */
    .ai-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .ai-bubble { display: flex; gap: 10px; max-width: 80%; }
    .ai-bubble.user { align-self: flex-end; flex-direction: row-reverse; }
    .ai-bubble.assistant { align-self: flex-start; }

    .bubble-avatar {
      width: 32px; height: 32px; border-radius: var(--radius-md);
      background: var(--gradient-primary); display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .bubble-avatar .material-icons-outlined { font-size: 18px; color: white; }
    .user-avatar {
      background: var(--gradient-info) !important; font-size: 12px; font-weight: 700; color: white;
    }

    .bubble-content {
      padding: 12px 16px; border-radius: var(--radius-lg); font-size: 13px; line-height: 1.6;
    }
    .ai-bubble.user .bubble-content {
      background: var(--primary); color: white; border-bottom-right-radius: 4px;
    }
    .ai-bubble.assistant .bubble-content {
      background: var(--bg); border: 1px solid var(--border); border-bottom-left-radius: 4px;
    }
    .bubble-time { font-size: 9px; opacity: 0.5; display: block; margin-top: 6px; }

    /* Typing */
    .typing { padding: 12px 20px !important; }
    .typing-dots { display: flex; gap: 4px; align-items: center; }
    .typing-dots span {
      width: 6px; height: 6px; border-radius: 50%; background: var(--text-light);
      animation: typingDot 1.4s infinite;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingDot { 0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); } 30% { opacity: 1; transform: scale(1); } }

    /* Input */
    .ai-input-bar {
      display: flex; gap: 10px; padding: 16px 20px;
      border-top: 1px solid var(--border);
    }
    .ai-input-bar input {
      flex: 1; padding: 10px 16px; border-radius: var(--radius-full);
      border: 1px solid var(--border); font-size: 13px; font-family: var(--font);
      background: var(--bg);
    }
    .ai-input-bar input:focus { border-color: var(--primary); outline: none; }
    .send-btn {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: var(--primary); color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--transition-fast);
    }
    .send-btn:hover { background: var(--primary-dark); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Context Panel */
    .ai-context-panel {
      width: 260px; background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: 20px; flex-shrink: 0; overflow-y: auto;
    }
    .ai-context-panel h4 { font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; }
    .ai-context-panel h4:not(:first-child) { margin-top: 24px; }

    .context-actions { display: flex; flex-direction: column; gap: 6px; }
    .ctx-action {
      display: flex; align-items: center; gap: 8px; padding: 8px 12px;
      border-radius: var(--radius-md); border: 1px solid var(--border);
      background: transparent; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast);
      text-align: left; font-family: var(--font); color: var(--text-secondary);
    }
    .ctx-action:hover { border-color: var(--primary); color: var(--primary); background: rgba(139,92,246,0.04); }
    .ctx-action .material-icons-outlined { font-size: 16px; color: var(--primary); }

    .capabilities { display: flex; flex-direction: column; gap: 12px; }
    .cap-item { display: flex; gap: 10px; }
    .cap-item .material-icons-outlined { font-size: 18px; color: var(--primary); margin-top: 2px; }
    .cap-item strong { font-size: 12px; display: block; }
    .cap-item p { font-size: 11px; color: var(--text-light); margin-top: 2px; line-height: 1.4; }

    @media (max-width: 1000px) {
      .ai-context-panel { display: none; }
    }
  `],
})
export class AiAssistantComponent {
  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;

  suggestions = [
    { icon: 'flag', text: 'Which of my cases have the highest risk scores?', color: 'var(--danger)' },
    { icon: 'gavel', text: 'What are best practices for TPR documentation?', color: 'var(--primary)' },
    { icon: 'psychology', text: 'Summarize the behavioral flags across my caseload', color: 'var(--warning)' },
    { icon: 'family_restroom', text: 'What permanency options exist for older youth?', color: 'var(--success)' },
  ];

  quickActions = [
    { icon: 'summarize', label: 'Summarize caseload', prompt: 'Give me a summary of my current caseload status' },
    { icon: 'priority_high', label: 'Risk analysis', prompt: 'Analyze the risk factors across my cases' },
    { icon: 'checklist', label: 'Action items', prompt: 'What are my most urgent action items this week?' },
    { icon: 'policy', label: 'Policy lookup', prompt: 'What does AFCARS require for quarterly reviews?' },
  ];

  capabilities = [
    { icon: 'analytics', title: 'Case Analysis', desc: 'Risk scoring, pattern detection, outcome prediction' },
    { icon: 'search', title: 'Policy Search', desc: 'AFCARS, ICWA, Multiethnic Placement Act guidance' },
    { icon: 'lightbulb', title: 'Recommendations', desc: 'Evidence-based placement and intervention suggestions' },
  ];

  constructor(private chatService: ChatService) {}

  useSuggestion(text: string): void {
    this.userInput = text;
    this.send();
  }

  send(): void {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: this.userInput.trim(),
      timestamp: new Date(),
    };
    this.messages.push(userMsg);
    const input = this.userInput.trim();
    this.userInput = '';
    this.isLoading = true;

    this.chatService.sendMessage(input).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          content: res.reply,
          timestamp: new Date(),
        });
        this.isLoading = false;
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
          timestamp: new Date(),
        });
        this.isLoading = false;
      },
    });
  }

  formatContent(content: string): string {
    return content.replace(/\n/g, '<br>');
  }
}
