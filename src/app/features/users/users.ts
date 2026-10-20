import { ChangeDetectionStrategy, Component, WritableSignal, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ROLES, ROLE_LABELS, Role } from '../../core/models/role.model';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { ReportConfigService } from '../../core/services/report-config.service';
import { UsersService } from '../../core/services/users.service';

function powerBiUrlValidator(control: AbstractControl<string>): ValidationErrors | null {
  return ReportConfigService.isValidPowerBiUrl((control.value ?? '').trim()) ? null : { powerBiUrl: true };
}

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly reportConfig = inject(ReportConfigService);
  private readonly auth = inject(AuthService);

  protected readonly users = this.usersService.users;
  protected readonly currentUser = this.auth.currentUser;
  protected readonly roles = ROLES;
  protected readonly roleLabels = ROLE_LABELS;

  protected readonly userMessage = signal<string | null>(null);
  protected readonly linksMessage = signal<string | null>(null);

  protected readonly addForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email, (c: AbstractControl<string>) => this.uniqueEmail(c)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['ATHLETE' as Role, Validators.required],
  });

  protected readonly linksForm = this.fb.nonNullable.group({
    dashboardUrl: [this.reportConfig.links().dashboardUrl, powerBiUrlValidator],
    gymsUrl: [this.reportConfig.links().gymsUrl, powerBiUrlValidator],
  });

  protected isSelf(user: User): boolean {
    return user.id === this.currentUser()?.id;
  }

  protected changeRole(user: User, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as Role;
    this.usersService.updateRole(user.id, role);
    this.flash(this.userMessage, `Rôle de ${user.name} mis à jour : ${ROLE_LABELS[role]}.`);
  }

  protected remove(user: User): void {
    if (this.isSelf(user)) return;
    if (!confirm(`Supprimer l'utilisateur ${user.name} ?`)) return;
    this.usersService.remove(user.id);
    this.flash(this.userMessage, `Utilisateur ${user.name} supprimé.`);
  }

  protected addUser(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const user = this.usersService.add(this.addForm.getRawValue());
    this.addForm.reset({ name: '', email: '', password: '', role: 'ATHLETE' });
    this.flash(this.userMessage, `Utilisateur ${user.name} ajouté.`);
  }

  protected saveLinks(): void {
    if (this.linksForm.invalid) {
      this.linksForm.markAllAsTouched();
      return;
    }
    this.reportConfig.save(this.linksForm.getRawValue());
    this.flash(this.linksMessage, 'Liens Power BI enregistrés.');
  }

  protected showError(form: 'add' | 'links', name: string): boolean {
    const group: AbstractControl = form === 'add' ? this.addForm : this.linksForm;
    const c = group.get(name);
    return !!c && c.invalid && c.touched;
  }

  private uniqueEmail(control: AbstractControl<string>): ValidationErrors | null {
    return control.value && this.usersService.emailExists(control.value) ? { emailTaken: true } : null;
  }

  private flash(target: WritableSignal<string | null>, msg: string): void {
    target.set(msg);
    setTimeout(() => target() === msg && target.set(null), 3500);
  }
}
