import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.css']
})
export class FormFieldComponent {

  // Texto de la etiqueta visible sobre el input
  @Input() label = '';

  // ID del input al que conecta el label (accesibilidad)
  @Input() inputId = '';

  // Si es true, muestra un asterisco (*) junto al label
  @Input() required = false;

  // Mensaje de error a mostrar debajo del input (vacío = no muestra)
  @Input() error = '';

  @Input() validating = false;   // muestra "Verificando..." mientras pending
  @Input() hint2 = '';  

  // Texto de ayuda opcional debajo del input (solo si no hay error)
  @Input() hint = '';
}