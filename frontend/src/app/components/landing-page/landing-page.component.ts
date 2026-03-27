// Importaciones necesarias para el componente
import { Component, EventEmitter, Output, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorService, Doctor } from '../../services/doctor.service';


@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  // Evento de salida para navegación hacia el componente padre
  @Output() navigate = new EventEmitter<'login' | 'register'>();

  // Variables
  currentSlide = 0;
  totalSlides = 3;

  // Señales para estado reactivo
  doctors = signal<Doctor[]>([]);
  isMenuOpen = signal(false);
  isScrolled = signal(false);

  constructor(private doctorService: DoctorService) { }

  // Método que se ejecuta al inicializar el componente
  ngOnInit(): void {
    this.loadDoctors();
  }

  // Carga los médicos desde el servicio
  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (data) => this.doctors.set(data),
      error: (err) => console.error('Error loading doctors:', err)
    });
  }

  // Alterna la apertura/cierre del menú móvil
  toggleMenu(): void {
    this.isMenuOpen.update(v => !v);
    // Bloquea o desbloquea el scroll del body según el estado del menú
    document.body.style.overflow = this.isMenuOpen() ? 'hidden' : '';
  }

  // Cierra el menú móvil si está abierto
  closeMenu(): void {
    if (this.isMenuOpen()) {
      this.isMenuOpen.set(false);
      document.body.style.overflow = '';
    }
  }

  // Desplazamiento suave a una sección por ID
  scrollTo(id: string, e: Event): void {
    e.preventDefault();
    this.closeMenu();
    const el = document.getElementById(id);
    if (el) {
      // Desplazamiento suave hacia la sección
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Obtiene las iniciales del nombre del médico para mostrar en el avatar
  getInitials(name: string): string {
    // Elimina prefijos como "Dr." o "Dra." y separa por espacios
    const parts = name.replace('Dr. ', '').replace('Dra. ', '').trim().split(' ');
    if (parts.length >= 2) {
      // Toma primera letra del primer y segundo nombre
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    // Si solo tiene un nombre, toma las primeras dos letras
    return name.slice(0, 2).toUpperCase();
  }

  // Detecta el scroll para aplicar efecto de navbar
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 50);  // Activa cuando el scroll supera 50px
  }

  // Cierra el menú al presionar la tecla Escape
  @HostListener('document:keydown.escape', [])
  onEscapeKey(): void {
    this.closeMenu();
  }

  // Cierra el menú si se hace clic fuera del navbar o del menú
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const navbar = document.querySelector('.navbar');
    const mobileMenu = document.querySelector('.mobile-menu');

    // Si el menú está abierto y se hizo clic fuera del navbar y del menú, se cierra
    if (this.isMenuOpen() &&
      !navbar?.contains(target) &&
      !mobileMenu?.contains(target)) {
      this.closeMenu();
    }
  }

  // Limpia el estilo del body cuando se destruye el componente
  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  // Metodos carrusel 
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }
}