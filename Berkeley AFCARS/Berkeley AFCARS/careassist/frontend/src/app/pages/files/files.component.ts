import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FosterParentService, FosterChild } from '../../services/foster-parent.service';
import { CaseService } from '../../services/case.service';

interface DocFile {
  name: string;
  type: string;
  child: string;
  category: string;
  date: string;
  size: string;
}

interface ChildDocGroup {
  childName: string;
  categories: { key: string; label: string; icon: string; files: DocFile[] }[];
  totalCount: number;
}

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="files-page">
      <!-- Header -->
      <div class="page-header animate-in">
        <div>
          <h2>{{ isYouth ? 'My Documents' : 'Documents' }}</h2>
          <p class="subtitle">{{ headerSub }}</p>
        </div>
        <button class="btn btn-primary btn-sm" *ngIf="!isYouth" (click)="showUploadModal = true">
          <span class="material-icons-outlined">upload_file</span>
          Upload Document
        </button>
      </div>

      <!-- Search bar -->
      <div class="search-bar animate-in">
        <span class="material-icons-outlined search-icon">search</span>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search documents by name, child, or category..." class="search-input" />
        <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>

      <!-- Category filter tabs -->
      <div class="cat-tabs animate-in">
        <button class="cat-tab" [class.active]="activeCategory === 'all'" (click)="activeCategory = 'all'">
          <span class="material-icons-outlined">folder</span> All
          <span class="cat-count">{{ allFiles.length }}</span>
        </button>
        <button class="cat-tab" *ngFor="let ct of catDefs"
                [class.active]="activeCategory === ct.key" (click)="activeCategory = ct.key">
          <span class="material-icons-outlined">{{ ct.icon }}</span> {{ ct.label }}
          <span class="cat-count">{{ countByCat(ct.key) }}</span>
        </button>
      </div>

      <!-- Grouped by child -->
      <div class="child-groups animate-in">
        <div class="child-group" *ngFor="let g of getGroupedFiles()">
          <div class="cg-header" (click)="toggleGroup(g.childName)" *ngIf="!isYouth">
            <div class="cg-avatar">{{ getInitials(g.childName) }}</div>
            <div class="cg-info">
              <h3>{{ g.childName }}</h3>
              <span class="cg-count">{{ g.totalCount }} document{{ g.totalCount !== 1 ? 's' : '' }}</span>
            </div>
            <span class="material-icons-outlined cg-chevron" [class.open]="isExpanded(g.childName)">
              expand_more
            </span>
          </div>

          <div class="cg-body" *ngIf="isYouth || isExpanded(g.childName)">
            <div class="sub-cat" *ngFor="let sc of g.categories">
              <div class="sc-header" *ngIf="sc.files.length > 0">
                <span class="material-icons-outlined sc-icon" [ngClass]="sc.key">{{ sc.icon }}</span>
                <h4>{{ sc.label }}</h4>
                <span class="sc-count">{{ sc.files.length }}</span>
              </div>
              <div class="doc-row" *ngFor="let f of sc.files">
                <span class="material-icons-outlined doc-type-icon" [ngClass]="sc.key">{{ getFileTypeIcon(f.type) }}</span>
                <div class="doc-info">
                  <span class="doc-name">{{ f.name }}</span>
                  <span class="doc-meta">{{ f.date }} · {{ f.size }}</span>
                </div>
                <div class="doc-actions">
                  <button class="icon-btn" title="Download">
                    <span class="material-icons-outlined">download</span>
                  </button>
                  <button class="icon-btn del" title="Delete" *ngIf="!isYouth" (click)="deleteFile(f)">
                    <span class="material-icons-outlined">delete_outline</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="empty-cat" *ngIf="g.totalCount === 0">
              <span class="material-icons-outlined">folder_off</span>
              <p>No documents match the selected category.</p>
            </div>
          </div>
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
              <button class="child-opt" *ngFor="let cat of catDefs"
                      [class.selected]="selectedCategory === cat.key"
                      (click)="selectedCategory = cat.key">
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
  `,
  styles: [`
    .files-page { max-width: 100%; }
    .page-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
    }
    .page-header h2 { font-size: 22px; font-weight: 700; }
    .subtitle { font-size: 15px; color: var(--text-light); margin-top: 2px; }

    /* Search bar */
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

    /* Category tabs */
    .cat-tabs { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
    .cat-tab {
      display: flex; align-items: center; gap: 5px; padding: 8px 16px;
      border-radius: var(--radius-full); border: 1px solid var(--border);
      background: transparent; font-size: 16px; font-weight: 600;
      cursor: pointer; transition: all var(--transition-fast); font-family: var(--font);
      color: var(--text-secondary);
    }
    .cat-tab .material-icons-outlined { font-size: 16px; }
    .cat-tab:hover { border-color: var(--primary); color: var(--primary); }
    .cat-tab.active { background: var(--primary); color: white; border-color: var(--primary); }
    .cat-count {
      background: rgba(255,255,255,0.25); padding: 1px 7px;
      border-radius: var(--radius-full); font-size: 14px;
    }

    /* Child groups */
    .child-groups { display: flex; flex-direction: column; gap: 16px; }
    .child-group {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden;
    }
    .cg-header {
      display: flex; align-items: center; gap: 14px; padding: 16px 20px;
      cursor: pointer; transition: background var(--transition-fast);
      border-bottom: 1px solid transparent;
    }
    .cg-header:hover { background: rgba(139,92,246,0.02); }
    .cg-avatar {
      width: 40px; height: 40px; border-radius: 12px;
      background: var(--gradient-primary); display: flex;
      align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 16px; flex-shrink: 0;
    }
    .cg-info { flex: 1; }
    .cg-info h3 { font-size: 15px; font-weight: 700; margin: 0; }
    .cg-count { font-size: 16px; color: var(--text-light); }
    .cg-chevron {
      font-size: 22px; color: var(--text-light);
      transition: transform 0.2s ease;
    }
    .cg-chevron.open { transform: rotate(180deg); }

    .cg-body { border-top: 1px solid var(--border-light); }

    /* Sub-category sections */
    .sub-cat { padding: 0; }
    .sc-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 20px 6px; background: rgba(139,92,246,0.02);
    }
    .sc-icon { font-size: 18px; }
    .sc-icon.medical { color: #e53e3e; }
    .sc-icon.education { color: #38b2ac; }
    .sc-icon.legal { color: var(--primary); }
    .sc-icon.placement { color: #667eea; }
    .sc-header h4 { font-size: 15px; font-weight: 700; flex: 1; margin: 0; }
    .sc-count {
      font-size: 14px; font-weight: 600; color: var(--text-light);
      background: var(--border); padding: 1px 8px; border-radius: var(--radius-full);
    }

    .doc-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 20px 10px 36px;
      border-bottom: 1px solid var(--border-light);
      transition: background var(--transition-fast);
    }
    .doc-row:last-child { border-bottom: none; }
    .doc-row:hover { background: rgba(139,92,246,0.03); }

    .doc-type-icon { font-size: 20px; flex-shrink: 0; }
    .doc-type-icon.medical { color: #e53e3e; }
    .doc-type-icon.education { color: #38b2ac; }
    .doc-type-icon.legal { color: var(--primary); }
    .doc-type-icon.placement { color: #667eea; }
    .doc-info { flex: 1; min-width: 0; }
    .doc-name { display: block; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-meta { font-size: 15px; color: var(--text-light); }
    .doc-actions { display: flex; gap: 4px; flex-shrink: 0; }

    .icon-btn {
      border: none; background: transparent; cursor: pointer; padding: 4px;
      border-radius: var(--radius-sm); color: var(--text-secondary);
      transition: all var(--transition-fast);
    }
    .icon-btn:hover { background: rgba(139,92,246,0.08); color: var(--primary); }
    .icon-btn.del:hover { background: rgba(229,62,62,0.08); color: #e53e3e; }

    .empty-cat {
      display: flex; flex-direction: column; align-items: center; padding: 30px; color: var(--text-light); text-align: center;
    }
    .empty-cat .material-icons-outlined { font-size: 36px; opacity: 0.3; margin-bottom: 8px; }
    .empty-cat p { font-size: 15px; margin: 0; }

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
    .modal-body label { font-size: 16px; font-weight: 600; color: var(--text-secondary); }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 20px; border-top: 1px solid var(--border);
    }
    .child-select { display: flex; gap: 8px; flex-wrap: wrap; }
    .child-opt {
      display: flex; align-items: center; gap: 5px; padding: 8px 14px;
      border-radius: var(--radius-md); border: 1px solid var(--border);
      background: transparent; font-size: 15px; font-weight: 600;
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
    .upload-zone p { font-size: 15px; color: var(--text-light); }
    .upload-zone .selected-file { color: var(--primary); font-weight: 600; }

    .btn { padding: 8px 16px; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; font-family: var(--font); }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
    .btn-sm { padding: 7px 14px; font-size: 16px; }
  `],
})
export class FilesComponent implements OnInit {
  isFosterParent = false;
  isYouth = false;
  headerSub = '';
  children: FosterChild[] = [];
  allFiles: DocFile[] = [];
  activeCategory = 'all';
  searchQuery = '';
  showUploadModal = false;
  selectedChildForUpload = '';
  selectedCategory = '';
  pendingFileName = '';
  expandedChildren: Set<string> = new Set();

  catDefs = [
    { key: 'medical', label: 'Medical Records', icon: 'medical_services' },
    { key: 'education', label: 'Education', icon: 'school' },
    { key: 'legal', label: 'Legal', icon: 'gavel' },
    { key: 'placement', label: 'Placement', icon: 'home' },
  ];

  constructor(
    private auth: AuthService,
    private fosterService: FosterParentService,
    private caseService: CaseService,
  ) {}

  ngOnInit(): void {
    const role = this.auth.getUserRole();
    this.isFosterParent = role === 'foster_parent';
    this.isYouth = role === 'aged_out_youth';

    if (this.isYouth) {
      this.headerSub = 'Your medical, education, and placement records';
      const user = this.auth.getCurrentUser();
      const youthName = user ? user.first_name + ' ' + user.last_name : 'Youth';
      this.children = [{ first_name: user?.first_name || 'Youth', last_name: user?.last_name || '' } as FosterChild];
      this.seedYouthFiles(youthName);
    } else if (this.isFosterParent) {
      this.headerSub = 'Upload and manage files for your children';
      const user = this.auth.getCurrentUser();
      if (user) {
        this.fosterService.getMyChildren(user.id).subscribe((c) => {
          this.children = c;
          this.seedFosterFiles();
          this.expandedChildren.add(this.children[0]?.first_name + ' ' + this.children[0]?.last_name);
        });
      }
    } else {
      this.headerSub = 'All case documents organized by child';
      this.caseService.getCases().subscribe((cases) => {
        this.children = cases.map((cs) => {
          const parts = cs.child_name.split(' ');
          return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '' } as FosterChild;
        });
        this.seedWorkerFiles();
        if (this.children.length > 0) {
          this.expandedChildren.add(this.children[0].first_name + ' ' + this.children[0].last_name);
        }
      });
    }
  }

  /* ── Grouping ── */

  getGroupedFiles(): ChildDocGroup[] {
    const childNames = this.children.map(c => c.first_name + ' ' + c.last_name);
    return childNames.map(name => {
      const childFiles = this.allFiles.filter(f => f.child === name);
      const q = this.searchQuery.toLowerCase().trim();
      let filtered = this.activeCategory === 'all'
        ? childFiles
        : childFiles.filter(f => f.category === this.activeCategory);
      if (q) {
        filtered = filtered.filter(f =>
          f.name.toLowerCase().includes(q) ||
          f.child.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.date.toLowerCase().includes(q)
        );
      }
      const cats = this.catDefs
        .map(cd => ({
          key: cd.key,
          label: cd.label,
          icon: cd.icon,
          files: filtered.filter(f => f.category === cd.key),
        }))
        .filter(c => c.files.length > 0);
      return { childName: name, categories: cats, totalCount: filtered.length };
    }).filter(g => g.totalCount > 0);
  }

  countByCat(key: string): number {
    return this.allFiles.filter(f => f.category === key).length;
  }

  /* ── Expand / collapse ── */

  toggleGroup(childName: string): void {
    if (this.expandedChildren.has(childName)) {
      this.expandedChildren.delete(childName);
    } else {
      this.expandedChildren.add(childName);
    }
  }

  isExpanded(childName: string): boolean {
    return this.expandedChildren.has(childName);
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  getFileTypeIcon(ext: string): string {
    const map: Record<string, string> = { pdf: 'picture_as_pdf', docx: 'description', doc: 'description', xlsx: 'table_chart', png: 'image', jpg: 'image' };
    return map[ext] || 'insert_drive_file';
  }

  /* ── Upload ── */

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) this.pendingFileName = input.files[0].name;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) this.pendingFileName = event.dataTransfer.files[0].name;
  }

  confirmUpload(): void {
    if (!this.selectedChildForUpload || !this.selectedCategory || !this.pendingFileName) return;
    const now = new Date();
    this.allFiles.unshift({
      name: this.pendingFileName,
      type: this.pendingFileName.split('.').pop() || 'file',
      child: this.selectedChildForUpload,
      category: this.selectedCategory,
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      size: (Math.random() * 4 + 0.5).toFixed(1) + ' MB',
    });
    this.showUploadModal = false;
    this.selectedChildForUpload = '';
    this.selectedCategory = '';
    this.pendingFileName = '';
  }

  deleteFile(file: DocFile): void {
    this.allFiles = this.allFiles.filter(f => f !== file);
  }

  /* ── Seed data ── */

  private seedYouthFiles(name: string): void {
    this.allFiles = [
      { name: 'Annual_Physical_Exam_Jan2026.pdf', type: 'pdf', child: name, category: 'medical', date: 'Jan 15, 2026', size: '1.2 MB' },
      { name: 'Flu_Vaccination_Record.pdf', type: 'pdf', child: name, category: 'medical', date: 'Oct 20, 2025', size: '0.3 MB' },
      { name: 'Dental_Cleaning_Report.pdf', type: 'pdf', child: name, category: 'medical', date: 'Sep 8, 2025', size: '0.5 MB' },
      { name: 'Vision_Exam_Results.pdf', type: 'pdf', child: name, category: 'medical', date: 'Jun 1, 2025', size: '0.4 MB' },
      { name: 'Therapy_Discharge_Summary.pdf', type: 'pdf', child: name, category: 'medical', date: 'Jul 12, 2025', size: '0.8 MB' },
      { name: 'Senior_Year_Report_Card_S1.pdf', type: 'pdf', child: name, category: 'education', date: 'Jan 20, 2026', size: '0.6 MB' },
      { name: 'Junior_Year_Final_Transcript.pdf', type: 'pdf', child: name, category: 'education', date: 'Jun 15, 2025', size: '0.4 MB' },
      { name: 'IEP_Meeting_Notes_Apr2025.pdf', type: 'pdf', child: name, category: 'education', date: 'Apr 10, 2025', size: '1.1 MB' },
      { name: 'School_Enrollment_Confirmation.pdf', type: 'pdf', child: name, category: 'education', date: 'Aug 22, 2024', size: '0.2 MB' },
      { name: 'Court_Order_Custody_2025.pdf', type: 'pdf', child: name, category: 'legal', date: 'Mar 5, 2025', size: '1.5 MB' },
      { name: 'Case_Plan_Review_2025.pdf', type: 'pdf', child: name, category: 'legal', date: 'Nov 12, 2025', size: '0.9 MB' },
      { name: 'Independent_Living_Transition_Plan.pdf', type: 'pdf', child: name, category: 'placement', date: 'Feb 1, 2026', size: '1.3 MB' },
      { name: 'Residential_Care_Placement_Agreement.pdf', type: 'pdf', child: name, category: 'placement', date: 'Feb 10, 2023', size: '0.7 MB' },
      { name: 'Foster_Home_Placement_Record.pdf', type: 'pdf', child: name, category: 'placement', date: 'Jun 5, 2021', size: '0.6 MB' },
    ];
  }

  private seedFosterFiles(): void {
    this.allFiles = [];
    this.children.forEach(c => {
      const n = c.first_name + ' ' + c.last_name;
      const f = c.first_name;
      this.allFiles.push(
        // Medical Records
        { name: f + '_Annual_Physical_Exam_2026.pdf', type: 'pdf', child: n, category: 'medical', date: 'Feb 15, 2026', size: '1.2 MB' },
        { name: f + '_Vaccination_Record.pdf', type: 'pdf', child: n, category: 'medical', date: 'Jan 28, 2026', size: '0.5 MB' },
        { name: f + '_Dental_Checkup_Report.pdf', type: 'pdf', child: n, category: 'medical', date: 'Dec 10, 2025', size: '0.4 MB' },
        // Education
        { name: f + '_Report_Card_Q3_2025.pdf', type: 'pdf', child: n, category: 'education', date: 'Jan 20, 2026', size: '0.8 MB' },
        { name: f + '_School_Enrollment_Letter.pdf', type: 'pdf', child: n, category: 'education', date: 'Aug 18, 2025', size: '0.3 MB' },
        // Legal
        { name: f + '_Court_Order_2025.pdf', type: 'pdf', child: n, category: 'legal', date: 'Nov 5, 2025', size: '1.5 MB' },
        { name: f + '_Case_Plan_Review.pdf', type: 'pdf', child: n, category: 'legal', date: 'Sep 12, 2025', size: '0.9 MB' },
        // Placement
        { name: f + '_Placement_Agreement.pdf', type: 'pdf', child: n, category: 'placement', date: 'Jul 1, 2025', size: '0.7 MB' },
        { name: f + '_Home_Study_Report.pdf', type: 'pdf', child: n, category: 'placement', date: 'Jun 15, 2025', size: '1.4 MB' },
      );
    });
  }

  private seedWorkerFiles(): void {
    this.allFiles = [];
    this.children.forEach(c => {
      const n = c.first_name + ' ' + c.last_name;
      const f = c.first_name;
      this.allFiles.push(
        // Medical Records
        { name: f + '_Annual_Physical_Feb2026.pdf', type: 'pdf', child: n, category: 'medical', date: 'Feb 12, 2026', size: '1.1 MB' },
        { name: f + '_Immunization_Record.pdf', type: 'pdf', child: n, category: 'medical', date: 'Jan 10, 2026', size: '0.4 MB' },
        { name: f + '_Behavioral_Health_Assessment.pdf', type: 'pdf', child: n, category: 'medical', date: 'Nov 20, 2025', size: '0.9 MB' },
        // Education
        { name: f + '_Report_Card_Fall_2025.pdf', type: 'pdf', child: n, category: 'education', date: 'Jan 18, 2026', size: '0.6 MB' },
        { name: f + '_IEP_Progress_Report.docx', type: 'docx', child: n, category: 'education', date: 'Dec 5, 2025', size: '1.2 MB' },
        { name: f + '_Attendance_Summary_Q2.pdf', type: 'pdf', child: n, category: 'education', date: 'Oct 8, 2025', size: '0.3 MB' },
        // Legal
        { name: f + '_Court_Hearing_Summary.pdf', type: 'pdf', child: n, category: 'legal', date: 'Feb 1, 2026', size: '1.5 MB' },
        { name: f + '_Case_Plan_Update_2025.pdf', type: 'pdf', child: n, category: 'legal', date: 'Nov 15, 2025', size: '0.8 MB' },
        { name: f + '_Permanency_Goal_Review.pdf', type: 'pdf', child: n, category: 'legal', date: 'Aug 22, 2025', size: '0.7 MB' },
        // Placement
        { name: f + '_Placement_Change_Record.pdf', type: 'pdf', child: n, category: 'placement', date: 'Jan 5, 2026', size: '0.6 MB' },
        { name: f + '_Home_Visit_Report_Dec2025.pdf', type: 'pdf', child: n, category: 'placement', date: 'Dec 18, 2025', size: '1.0 MB' },
        { name: f + '_Foster_Care_Agreement.pdf', type: 'pdf', child: n, category: 'placement', date: 'Jul 1, 2025', size: '0.9 MB' },
      );
    });
  }
}
