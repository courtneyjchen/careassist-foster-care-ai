import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FosterParentService, FosterChild } from '../../services/foster-parent.service';

interface UploadedFile {
  name: string;
  type: string;
  child: string;
  category: string;
  date: string;
  size: string;
}

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Foster Parent Document Portal -->
    <div class="files-page" *ngIf="isFosterParent; else workerFiles">
      <div class="page-header animate-in">
        <div>
          <h2>Documents</h2>
          <p class="subtitle">Upload and manage files for your children</p>
        </div>
        <button class="btn btn-primary btn-sm" (click)="showUploadModal = true">
          <span class="material-icons-outlined">upload_file</span>
          Upload Document
        </button>
      </div>

      <!-- Category Tabs -->
      <div class="cat-tabs animate-in">
        <button class="cat-tab" [class.active]="activeCategory === 'all'" (click)="activeCategory = 'all'">
          <span class="material-icons-outlined">folder</span> All Files
          <span class="cat-count">{{ uploadedFiles.length }}</span>
        </button>
        <button class="cat-tab" [class.active]="activeCategory === 'medical'" (click)="activeCategory = 'medical'">
          <span class="material-icons-outlined">medical_services</span> Medical
        </button>
        <button class="cat-tab" [class.active]="activeCategory === 'education'" (click)="activeCategory = 'education'">
          <span class="material-icons-outlined">school</span> Education
        </button>
        <button class="cat-tab" [class.active]="activeCategory === 'legal'" (click)="activeCategory = 'legal'">
          <span class="material-icons-outlined">gavel</span> Legal
        </button>
        <button class="cat-tab" [class.active]="activeCategory === 'other'" (click)="activeCategory = 'other'">
          <span class="material-icons-outlined">insert_drive_file</span> Other
        </button>
      </div>

      <!-- File List -->
      <div class="file-list animate-in">
        <div class="file-list-header">
          <span class="fh-name">File Name</span>
          <span class="fh-child">Child</span>
          <span class="fh-cat">Category</span>
          <span class="fh-date">Date</span>
          <span class="fh-size">Size</span>
          <span class="fh-actions">Actions</span>
        </div>
        <div class="file-row" *ngFor="let f of getFilteredFiles()">
          <div class="file-name">
            <span class="material-icons-outlined file-icon" [ngClass]="f.category">{{ getCategoryIcon(f.category) }}</span>
            <span>{{ f.name }}</span>
          </div>
          <span class="file-child">{{ f.child }}</span>
          <span class="file-cat-tag" [ngClass]="f.category">{{ f.category | titlecase }}</span>
          <span class="file-date">{{ f.date }}</span>
          <span class="file-size">{{ f.size }}</span>
          <div class="file-actions">
            <button class="icon-btn" title="Download">
              <span class="material-icons-outlined">download</span>
            </button>
            <button class="icon-btn del" title="Delete" (click)="deleteFile(f)">
              <span class="material-icons-outlined">delete_outline</span>
            </button>
          </div>
        </div>

        <div class="empty-files" *ngIf="getFilteredFiles().length === 0">
          <span class="material-icons-outlined">cloud_upload</span>
          <h3>No documents yet</h3>
          <p>Upload medical reports, school report cards, and other important documents for your children.</p>
          <button class="btn btn-primary btn-sm" (click)="showUploadModal = true">Upload First Document</button>
        </div>
      </div>

      <!-- Upload Modal -->
      <div class="modal-overlay" *ngIf="showUploadModal" (click)="showUploadModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Upload Document</h3>
            <button class="modal-close" (click)="showUploadModal = false">
              <span class="material-icons-outlined">close</span>
            </button>
          </div>
          <div class="modal-body">
            <label>Child</label>
            <div class="child-select">
              <button class="child-opt" *ngFor="let c of children"
                      [class.selected]="selectedChildForUpload === c.first_name + ' ' + c.last_name"
                      (click)="selectedChildForUpload = c.first_name + ' ' + c.last_name">
                {{ c.first_name }} {{ c.last_name }}
              </button>
            </div>

            <label>Category</label>
            <div class="child-select">
              <button class="child-opt" *ngFor="let cat of categories"
                      [class.selected]="selectedCategory === cat.value"
                      (click)="selectedCategory = cat.value">
                <span class="material-icons-outlined">{{ cat.icon }}</span>
                {{ cat.label }}
              </button>
            </div>

            <label>File</label>
            <div class="upload-zone" (click)="fileInput.click()"
                 (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
              <span class="material-icons-outlined">cloud_upload</span>
              <p *ngIf="!pendingFileName">Click or drag a file here to upload</p>
              <p *ngIf="pendingFileName" class="selected-file">{{ pendingFileName }}</p>
              <input #fileInput type="file" hidden (change)="onFileSelect($event)" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" (click)="showUploadModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" (click)="confirmUpload()"
                    [disabled]="!selectedChildForUpload || !selectedCategory || !pendingFileName">
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Social Worker placeholder -->
    <ng-template #workerFiles>
      <div class="placeholder-page animate-in">
        <div class="placeholder-icon">
          <span class="material-icons-outlined">folder_open</span>
        </div>
        <h2>Files</h2>
        <p>Document management coming soon. Upload and organize case-related files securely.</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .files-page { max-width: 100%; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
    .page-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 13px; color: var(--text-light); margin-top: 2px; }

    /* Tabs */
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
    .cat-count {
      background: rgba(255,255,255,0.25); padding: 1px 7px;
      border-radius: var(--radius-full); font-size: 10px;
    }

    /* File List */
    .file-list {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden;
    }
    .file-list-header {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.7fr 0.8fr;
      gap: 12px; padding: 12px 20px; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-light);
      border-bottom: 1px solid var(--border);
    }
    .file-row {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.7fr 0.8fr;
      gap: 12px; padding: 14px 20px; align-items: center;
      border-bottom: 1px solid var(--border-light);
      transition: background var(--transition-fast);
    }
    .file-row:hover { background: rgba(139,92,246,0.03); }
    .file-name { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; }
    .file-icon { font-size: 20px; }
    .file-icon.medical { color: #e53e3e; }
    .file-icon.education { color: #38b2ac; }
    .file-icon.legal { color: var(--primary); }
    .file-icon.other { color: var(--text-light); }
    .file-child { font-size: 13px; color: var(--text-secondary); }
    .file-cat-tag {
      display: inline-flex; padding: 3px 10px; border-radius: var(--radius-full);
      font-size: 11px; font-weight: 600; width: fit-content;
    }
    .file-cat-tag.medical { background: rgba(229,62,62,0.1); color: #e53e3e; }
    .file-cat-tag.education { background: rgba(56,178,172,0.1); color: #38b2ac; }
    .file-cat-tag.legal { background: rgba(139,92,246,0.1); color: var(--primary); }
    .file-cat-tag.other { background: rgba(113,128,150,0.1); color: #718096; }
    .file-date { font-size: 12px; color: var(--text-light); }
    .file-size { font-size: 12px; color: var(--text-light); }
    .file-actions { display: flex; gap: 4px; }
    .icon-btn {
      border: none; background: transparent; cursor: pointer; padding: 4px;
      border-radius: var(--radius-sm); color: var(--text-secondary);
      transition: all var(--transition-fast);
    }
    .icon-btn:hover { background: rgba(139,92,246,0.08); color: var(--primary); }
    .icon-btn.del:hover { background: rgba(229,62,62,0.08); color: #e53e3e; }

    .empty-files {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px 20px; text-align: center;
    }
    .empty-files .material-icons-outlined { font-size: 48px; color: var(--text-light); margin-bottom: 12px; opacity: 0.4; }
    .empty-files h3 { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    .empty-files p { font-size: 13px; color: var(--text-light); max-width: 400px; margin-bottom: 16px; }

    /* Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1000; display: flex;
      align-items: center; justify-content: center; backdrop-filter: blur(4px);
    }
    .modal-card {
      background: var(--surface); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl); width: 480px; max-width: 90vw;
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
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .modal-body label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 20px; border-top: 1px solid var(--border);
    }

    .child-select { display: flex; gap: 8px; flex-wrap: wrap; }
    .child-opt {
      display: flex; align-items: center; gap: 5px; padding: 8px 14px;
      border-radius: var(--radius-md); border: 1px solid var(--border);
      background: transparent; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast); font-family: var(--font);
    }
    .child-opt .material-icons-outlined { font-size: 16px; }
    .child-opt:hover { border-color: var(--primary); color: var(--primary); }
    .child-opt.selected { background: var(--primary); color: white; border-color: var(--primary); }

    .upload-zone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 30px; border: 2px dashed var(--border); border-radius: var(--radius-md);
      cursor: pointer; transition: all var(--transition-fast); text-align: center;
    }
    .upload-zone:hover { border-color: var(--primary); background: rgba(139,92,246,0.03); }
    .upload-zone .material-icons-outlined { font-size: 32px; color: var(--text-light); margin-bottom: 8px; }
    .upload-zone p { font-size: 13px; color: var(--text-light); }
    .upload-zone .selected-file { color: var(--primary); font-weight: 600; }

    /* Placeholder for social worker */
    .placeholder-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; }
    .placeholder-icon { width: 72px; height: 72px; border-radius: var(--radius-lg); background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .placeholder-icon .material-icons-outlined { font-size: 36px; color: white; }
    h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }

    .btn { padding: 8px 16px; border-radius: var(--radius-md); font-size: 13px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; font-family: var(--font); }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
    .btn-sm { padding: 7px 14px; font-size: 12px; }
  `],
})
export class FilesComponent implements OnInit {
  isFosterParent = false;
  children: FosterChild[] = [];
  uploadedFiles: UploadedFile[] = [];
  activeCategory = 'all';
  showUploadModal = false;
  selectedChildForUpload = '';
  selectedCategory = '';
  pendingFileName = '';

  categories = [
    { value: 'medical', label: 'Medical', icon: 'medical_services' },
    { value: 'education', label: 'Education', icon: 'school' },
    { value: 'legal', label: 'Legal', icon: 'gavel' },
    { value: 'other', label: 'Other', icon: 'insert_drive_file' },
  ];

  constructor(
    private auth: AuthService,
    private fosterService: FosterParentService,
  ) {}

  ngOnInit(): void {
    const role = this.auth.getUserRole();
    this.isFosterParent = role === 'foster_parent';

    if (this.isFosterParent) {
      const user = this.auth.getCurrentUser();
      if (user) {
        this.fosterService.getMyChildren(user.id).subscribe((c) => this.children = c);
      }
      this.loadFiles();
    }
  }

  getFilteredFiles(): UploadedFile[] {
    if (this.activeCategory === 'all') return this.uploadedFiles;
    return this.uploadedFiles.filter(f => f.category === this.activeCategory);
  }

  getCategoryIcon(cat: string): string {
    const map: Record<string, string> = {
      medical: 'medical_services', education: 'school',
      legal: 'gavel', other: 'insert_drive_file',
    };
    return map[cat] || 'description';
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.pendingFileName = input.files[0].name;
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.pendingFileName = event.dataTransfer.files[0].name;
    }
  }

  confirmUpload(): void {
    if (!this.selectedChildForUpload || !this.selectedCategory || !this.pendingFileName) return;

    const now = new Date();
    const file: UploadedFile = {
      name: this.pendingFileName,
      type: this.pendingFileName.split('.').pop() || 'file',
      child: this.selectedChildForUpload,
      category: this.selectedCategory,
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      size: (Math.random() * 4 + 0.5).toFixed(1) + ' MB',
    };

    this.uploadedFiles.unshift(file);
    this.saveFiles();
    this.showUploadModal = false;
    this.selectedChildForUpload = '';
    this.selectedCategory = '';
    this.pendingFileName = '';
  }

  deleteFile(file: UploadedFile): void {
    this.uploadedFiles = this.uploadedFiles.filter(f => f !== file);
    this.saveFiles();
  }

  private loadFiles(): void {
    try {
      const raw = localStorage.getItem('careassist_foster_files');
      if (raw) {
        this.uploadedFiles = JSON.parse(raw);
      } else {
        // Seed with demo files
        this.uploadedFiles = [
          { name: 'Ethan_Medical_Checkup_Feb2026.pdf', type: 'pdf', child: 'Ethan Rodriguez', category: 'medical', date: 'Feb 15, 2026', size: '1.2 MB' },
          { name: 'Liam_Report_Card_Q3.pdf', type: 'pdf', child: 'Liam Thompson', category: 'education', date: 'Feb 10, 2026', size: '0.8 MB' },
          { name: 'Emma_Vaccination_Record.pdf', type: 'pdf', child: 'Emma Martinez', category: 'medical', date: 'Jan 28, 2026', size: '0.5 MB' },
          { name: 'Ethan_IEP_Meeting_Notes.docx', type: 'docx', child: 'Ethan Rodriguez', category: 'education', date: 'Jan 20, 2026', size: '2.1 MB' },
          { name: 'Liam_Dental_Exam.pdf', type: 'pdf', child: 'Liam Thompson', category: 'medical', date: 'Jan 15, 2026', size: '0.9 MB' },
          { name: 'Emma_Court_Order_2025.pdf', type: 'pdf', child: 'Emma Martinez', category: 'legal', date: 'Dec 20, 2025', size: '1.5 MB' },
        ];
        this.saveFiles();
      }
    } catch {}
  }

  private saveFiles(): void {
    localStorage.setItem('careassist_foster_files', JSON.stringify(this.uploadedFiles));
  }
}
