import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show label when provided', () => {
    component.label = 'Correo electrónico';
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('Correo electrónico');
  });

  it('should show required mark when required is true', () => {
    component.label = 'Nombre';
    component.required = true;
    fixture.detectChanges();
    const mark = fixture.nativeElement.querySelector('.required-mark');
    expect(mark).toBeTruthy();
  });

  it('should show error message when error is provided', () => {
    component.error = 'Este campo es obligatorio';
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.field-error');
    expect(error.textContent.trim()).toBe('Este campo es obligatorio');
  });

  it('should NOT show hint when error is present', () => {
    component.hint = 'Texto de ayuda';
    component.error = 'Hay un error';
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.field-hint');
    expect(hint).toBeNull();
  });

  it('should show hint when no error', () => {
    component.hint = 'Texto de ayuda';
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('.field-hint');
    expect(hint.textContent.trim()).toBe('Texto de ayuda');
  });
});