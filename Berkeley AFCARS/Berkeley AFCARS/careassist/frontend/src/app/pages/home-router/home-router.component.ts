import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { FosterDashboardComponent } from '../foster-dashboard/foster-dashboard.component';
import { YouthDashboardComponent } from '../youth-dashboard/youth-dashboard.component';
import { SupervisorDashboardComponent } from '../supervisor-dashboard/supervisor-dashboard.component';

@Component({
  selector: 'app-home-router',
  standalone: true,
  imports: [CommonModule, DashboardComponent, FosterDashboardComponent, YouthDashboardComponent, SupervisorDashboardComponent],
  template: `
    <app-foster-dashboard *ngIf="role === 'foster_parent'"></app-foster-dashboard>
    <app-youth-dashboard *ngIf="role === 'aged_out_youth'"></app-youth-dashboard>
    <app-supervisor-dashboard *ngIf="role === 'supervisor'"></app-supervisor-dashboard>
    <app-dashboard *ngIf="role !== 'foster_parent' && role !== 'aged_out_youth' && role !== 'supervisor'"></app-dashboard>
  `,
})
export class HomeRouterComponent implements OnInit {
  role = 'social_worker';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.role = this.auth.getUserRole() || 'social_worker';
  }
}
