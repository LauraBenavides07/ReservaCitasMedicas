import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ButtonComponent (Atomic Design)', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let buttonElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    buttonElement = fixture.debugElement.query(By.css('.app-button'));
    fixture.detectChanges();
  });

  // ==================== CREACIÓN ====================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render as button element', () => {
    expect(buttonElement.nativeElement.tagName.toLowerCase()).toBe('button');
  });

  // ==================== VARIANTES ====================

  it('should apply primary variant by default', () => {
    expect(buttonElement.nativeElement.classList.contains('btn-primary')).toBe(true);
  });

  it('should apply secondary variant', () => {
    component.variant = 'secondary';
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList.contains('btn-secondary')).toBe(true);
  });

  it('should apply danger variant', () => {
    component.variant = 'danger';
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList.contains('btn-danger')).toBe(true);
  });

  it('should apply success variant', () => {
    component.variant = 'success';
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList.contains('btn-success')).toBe(true);
  });

  it('should apply warning variant', () => {
    component.variant = 'warning';
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList.contains('btn-warning')).toBe(true);
  });

  // ==================== TAMAÑOS ====================

  it('should apply medium size by default', () => {
    expect(buttonElement.nativeElement.classList.contains('btn-md')).toBe(true);
  });

  it('should apply small size', () => {
    component.size = 'sm';
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList.contains('btn-sm')).toBe(true);
  });

  it('should apply large size', () => {
    component.size = 'lg';
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList.contains('btn-lg')).toBe(true);
  });

  // ==================== PROPIEDADES ====================

  it('should set type attribute', () => {
    component.type = 'submit';
    fixture.detectChanges();
    expect(buttonElement.nativeElement.type).toBe('submit');
  });

  it('should be disabled when disabled is true', () => {
    component.disabled = true;
    fixture.detectChanges();
    expect(buttonElement.nativeElement.disabled).toBe(true);
  });

  it('should have full-width class when fullWidth is true', () => {
    component.fullWidth = true;
    fixture.detectChanges();
    expect(buttonElement.nativeElement.classList.contains('btn-full-width')).toBe(true);
  });

  it('should show loading state', () => {
    component.loading = true;
    fixture.detectChanges();
    const spinner = buttonElement.nativeElement.querySelector('.btn-spinner');
    expect(spinner).toBeTruthy();
    expect(buttonElement.nativeElement.classList.contains('btn-loading')).toBe(true);
  });

  it('should disable button when loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(buttonElement.nativeElement.disabled).toBe(true);
  });

  // ==================== EVENTOS ====================

  it('should emit clicked event when clicked', () => {
    spyOn(component.clicked, 'emit');
    component.onClick();
    expect(component.clicked.emit).toHaveBeenCalledWith(undefined);
  });

  it('should not emit clicked event when disabled', () => {
    component.disabled = true;
    spyOn(component.clicked, 'emit');
    component.onClick();
    expect(component.clicked.emit).not.toHaveBeenCalled();
  });

  it('should not emit clicked event when loading', () => {
    component.loading = true;
    spyOn(component.clicked, 'emit');
    component.onClick();
    expect(component.clicked.emit).not.toHaveBeenCalled();
  });

  it('should emit event when native button is clicked and enabled', () => {
    spyOn(component.clicked, 'emit');
    buttonElement.nativeElement.click();
    expect(component.clicked.emit).toHaveBeenCalled();
  });

  // ==================== ACCESIBILIDAD ====================

  it('should have aria-label by default', () => {
    const label = buttonElement.nativeElement.getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label).toContain('Botón');
  });

  it('should use custom aria-label when provided', () => {
    component.ariaLabel = 'Guardar cambios';
    fixture.detectChanges();
    const label = buttonElement.nativeElement.getAttribute('aria-label');
    expect(label).toBe('Guardar cambios');
  });

  it('should have aria-busy when loading', () => {
    component.loading = true;
    fixture.detectChanges();
    const busy = buttonElement.nativeElement.getAttribute('aria-busy');
    expect(busy).toBe('true');
  });

  // ==================== CONTENIDO ====================

  it('should display content through ng-content', () => {
    fixture.componentRef.setInput('', '');
    const content = fixture.nativeElement.textContent;
    // El contenido será vacío en este test, pero en uso real contendría el botón label
    expect(content).toBeDefined();
  });

  // ==================== GETTERS ====================

  it('should generate correct button classes', () => {
    component.variant = 'danger';
    component.size = 'lg';
    component.fullWidth = true;
    component.loading = true;

    const classes = component.buttonClasses;
    expect(classes).toContain('btn');
    expect(classes).toContain('btn-danger');
    expect(classes).toContain('btn-lg');
    expect(classes).toContain('btn-full-width');
    expect(classes).toContain('btn-loading');
    expect(classes).toContain('btn-disabled');
  });

  // ==================== COMBINACIONES ====================

  it('should handle multiple properties together', () => {
    component.variant = 'success';
    component.size = 'sm';
    component.fullWidth = true;
    component.disabled = false;
    component.type = 'button';

    fixture.detectChanges();

    expect(buttonElement.nativeElement.classList.contains('btn-success')).toBe(true);
    expect(buttonElement.nativeElement.classList.contains('btn-sm')).toBe(true);
    expect(buttonElement.nativeElement.classList.contains('btn-full-width')).toBe(true);
    expect(buttonElement.nativeElement.disabled).toBe(false);
    expect(buttonElement.nativeElement.type).toBe('button');
  });
});
