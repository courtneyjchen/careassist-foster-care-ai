import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { FosterDashboardComponent } from '../foster-dashboard/foster-dashboard.component';

@Component({
  selector: 'app-home-router',
  standalone: true,
  imports: [CommonModule, DashboardComponent, FosterDashboardComponent],
  template: `
    <app-foster-dashboard *ngIf="role === 'foster_parent'"></app-foster-dashboard>
    <app-dashboard *ngIf="role !== 'foster_parent'"></app-dashboard>
  `,
})
export class HomeRouterComponent implements OnInit {
  role = 'social_worker';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getUserRole() || 'social_worker';
  }
}
