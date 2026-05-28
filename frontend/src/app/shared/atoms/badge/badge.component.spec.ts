import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show label in Spanish', () => {
    component.status = 'cancelada';
    component.ngOnChanges();
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.textContent.trim()).toBe('Cancelada');
  });

  it('should apply outline variant class by default', () => {
    component.status = 'confirmada';
    component.ngOnChanges();
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.classList).toContain('badge--outline');
  });

  it('should apply solid variant class when variant is solid', () => {
    component.status = 'confirmada';
    component.variant = 'solid';
    component.ngOnChanges();
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.classList).toContain('badge--solid');
  });

  it('should show dot only in solid variant', () => {
    component.variant = 'solid';
    component.status = 'pendiente';
    component.ngOnChanges();
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.badge__dot');
    expect(dot).toBeTruthy();
  });

  it('should NOT show dot in outline variant', () => {
    component.variant = 'outline';
    component.status = 'pendiente';
    component.ngOnChanges();
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.badge__dot');
    expect(dot).toBeNull();
  });

  it('should apply status class', () => {
    component.status = 'cancelada';
    component.ngOnChanges();
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.classList).toContain('badge--cancelada');
  });
});