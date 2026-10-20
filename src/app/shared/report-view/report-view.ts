import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReportKey } from '../../core/models/report.model';
import { ReportConfigService } from '../../core/services/report-config.service';
import { NativeDashboard } from '../native-report/native-dashboard';
import { NativeGyms } from '../native-report/native-gyms';
import { PowerBiEmbed } from './powerbi-embed';

/**
 * Affiche une page du rapport Power BI.
 * - mode "iframe" : lien « Publier sur le web » dans un iframe (URL validée puis assainie) ;
 * - mode "embed"  : composant powerbi-client chargé à la demande (@defer) ;
 * - sans lien     : rapport intégré, reconstruit en Angular à partir des données du fichier .pbix.
 */
@Component({
  selector: 'app-report-view',
  imports: [PowerBiEmbed, NativeDashboard, NativeGyms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-view.html',
  styleUrl: './report-view.scss',
})
export class ReportView {
  private readonly config = inject(ReportConfigService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly report = input.required<ReportKey>();
  readonly title = input('Rapport Power BI');

  protected readonly mode = this.config.mode;

  protected readonly safeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.config.urlFor(this.report());
    if (!url || !ReportConfigService.isValidPowerBiUrl(url)) return null;
    // L'URL a été validée (https + domaine powerbi.com) avant d'être marquée comme sûre.
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  protected readonly invalidUrl = computed(() => {
    const url = this.config.urlFor(this.report());
    return !!url && !ReportConfigService.isValidPowerBiUrl(url);
  });
}
