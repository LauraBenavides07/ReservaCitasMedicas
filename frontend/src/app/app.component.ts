import { Component } from '@angular/core';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppointmentListComponent],
  template: `
    <header class="bg-primary shadow">
      <div class="container header-content">
        <h1 class="title">Piedrazul</h1>
        <p class="subtitle">Gestión de Citas Médicas</p>
      </div>
    </header>
    
    <main class="container py-3">
      <app-appointment-list></app-appointment-list>
    </main>

    <footer class="container py-3 text-center">
      <p>&copy; 2026 Piedrazul - Sistema de Gestión de Citas Médicas</p>
    </footer>
  `,
  styles: [`
    header {
      padding: 1.5rem 0;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      color: white;
    }
    .header-content {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .title {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .subtitle {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.9;
    }
    .shadow {
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .py-3 { padding: 3rem 1.5rem; }
    .text-center { text-align: center; }
    footer p {
      color: #888;
      font-size: 0.9rem;
    }
  `]
})
export class AppComponent {}
