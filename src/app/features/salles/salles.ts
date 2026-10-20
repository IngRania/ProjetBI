import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReportView } from '../../shared/report-view/report-view';

@Component({
  selector: 'app-salles',
  imports: [ReportView, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Salles de sport</h1>
          <p class="page-subtitle">Performance des salles de sport par pays.</p>
        </div>
        @if (isAthlete()) {
          <a routerLink="/home" class="btn btn-outline"><span aria-hidden="true">←</span> Retour au choix</a>
        }
      </div>
      <app-report-view report="gyms" title="Salles de sport – CrossFit Games 2019" />
    </section>
  `,
})
export class Salles {
  private readonly auth = inject(AuthService);
  protected readonly isAthlete = computed(() => this.auth.role() === 'ATHLETE');
}
