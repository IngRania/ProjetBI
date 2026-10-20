import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { PowerBIEmbedModule } from 'powerbi-client-angular';
import { IReportEmbedConfiguration, models } from 'powerbi-client';
import { catchError, map, of, switchMap } from 'rxjs';
import { ReportKey } from '../../core/models/report.model';
import { POWER_BI_TOKEN_SERVICE } from '../../core/services/powerbi-token.service';

/** Mode "embed" : chargé uniquement via @defer, pour ne pas alourdir le bundle initial. */
@Component({
  selector: 'app-powerbi-embed',
  imports: [PowerBIEmbedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (embedConfig(); as cfg) {
      <powerbi-report [embedConfig]="cfg" cssClassName="pbi-container" />
    } @else {
      <div class="state" role="status">
        <p>Rapport Power BI non configuré. L'administrateur doit renseigner le lien.</p>
      </div>
    }
  `,
  styles: `
    :host { display: block; width: 100%; height: 100%; }
    :host ::ng-deep .pbi-container { width: 100%; height: 100%; }
    :host ::ng-deep .pbi-container iframe { border: 0; }
    .state { height: 100%; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; color: var(--c-muted); }
  `,
})
export class PowerBiEmbed {
  private readonly tokens = inject(POWER_BI_TOKEN_SERVICE);
  readonly report = input.required<ReportKey>();

  protected readonly embedConfig = toSignal(
    toObservable(this.report).pipe(
      switchMap((key) => this.tokens.getEmbedConfig(key)),
      map((c): IReportEmbedConfiguration | null =>
        c.reportId && c.embedUrl && c.accessToken
          ? {
              type: 'report',
              id: c.reportId,
              embedUrl: c.embedUrl,
              accessToken: c.accessToken,
              tokenType: models.TokenType.Embed,
              pageName: c.pageName,
              settings: {
                panes: { filters: { visible: false }, pageNavigation: { visible: false } },
                background: models.BackgroundType.Transparent,
              },
            }
          : null,
      ),
      catchError(() => of(null)),
    ),
    { initialValue: null },
  );
}
