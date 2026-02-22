import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder-page animate-in">
      <div class="placeholder-icon">
        <span class="material-icons-outlined">folder_open</span>
      </div>
      <h2>Files</h2>
      <p>Document management coming soon. Upload and organize case-related files securely.</p>
    </div>
  `,
  styles: [`
    .placeholder-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; }
    .placeholder-icon { width: 72px; height: 72px; border-radius: var(--radius-lg); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .placeholder-icon .material-icons-outlined { font-size: 36px; color: white; }
    h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: var(--text-secondary); max-width: 400px; line-height: 1.6; }
  `],
})
export class FilesComponent {}
