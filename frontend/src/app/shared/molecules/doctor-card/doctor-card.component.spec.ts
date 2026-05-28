import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorCardComponent } from './doctor-card.component';

describe('DoctorCardComponent', () => {
  let component: DoctorCardComponent;
  let fixture: ComponentFixture<DoctorCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorCardComponent);
    component = fixture.componentInstance;
    component.doctorId = '1';
    component.doctorName = 'Juan Lopez';
    component.specialty = 'Cardiología';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show initials from doctorName', () => {
    const avatar = fixture.nativeElement.querySelector('.doctor-card__avatar');
    expect(avatar.textContent.trim()).toBe('JU');
  });

  it('should show doctor name with prefix', () => {
    const name = fixture.nativeElement.querySelector('.doctor-card__name');
    expect(name.textContent).toContain('Juan Lopez');
  });

  it('should show specialty', () => {
    const spec = fixture.nativeElement.querySelector('.doctor-card__specialty');
    expect(spec.textContent.trim()).toBe('Cardiología');
  });

  it('should apply selected class when selected is true', () => {
    component.selected = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.doctor-card');
    expect(btn.classList).toContain('doctor-card--selected');
  });

 it('should emit selectDoctor on click', () => {
    const emitSpy = vi.spyOn(component.selectDoctor, 'emit');
    const btn = fixture.nativeElement.querySelector('.doctor-card');
    btn.click();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should calculate avatar color from doctorId', () => {
    expect(component.avatarColor).toBeTruthy();
    expect(component.avatarColor).toMatch(/^#[0-9a-f]{6}$/i);
  });
});