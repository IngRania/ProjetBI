import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ROLE_HOME } from '../../core/models/role.model';
import { AuthService } from '../../core/services/auth.service';

interface DemoAccount {
  label: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly demoAccounts: DemoAccount[] = [
    { label: 'Administrateur', email: 'admin@esprit.tn', password: 'admin123' },
    { label: 'Analyste', email: 'analyste@esprit.tn', password: 'analyste123' },
    { label: 'Sportif', email: 'sportif@esprit.tn', password: 'sportif123' },
  ];

  protected fill(account: DemoAccount): void {
    this.form.setValue({ email: account.email, password: account.password });
    this.error.set(null);
  }

  protected submit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Veuillez saisir une adresse e-mail valide et un mot de passe.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.router.navigateByUrl(ROLE_HOME[user.role]);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Adresse e-mail ou mot de passe incorrect.');
      },
    });
  }

  protected invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && c.touched;
  }
}
