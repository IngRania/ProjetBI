import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReportView } from '../../shared/report-view/report-view';

@Component({
  selector: 'app-dashboard',
  imports: [ReportView, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Résultats des athlètes</h1>
          <p class="page-subtitle">Les quatre analyses du CrossFit Games 2019</p>
        </div>
        @if (isAthlete()) {
          <a routerLink="/home" class="btn btn-outline"><span aria-hidden="true">←</span> Retour au choix</a>
        }
      </div>
      <app-report-view report="dashboard" title="Tableau de bord – CrossFit Games 2019" />
    </section>
  `,
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  protected readonly isAthlete = computed(() => this.auth.role() === 'ATHLETE');
}
