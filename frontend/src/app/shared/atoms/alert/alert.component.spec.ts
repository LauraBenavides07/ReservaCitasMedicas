import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT render when message is empty', () => {
    component.message = '';
    component.show = true;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.alert');
    expect(el).toBeNull();
  });

  it('should NOT render when show is false', () => {
    component.message = 'Algo salió mal';
    component.show = false;
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.alert');
    expect(el).toBeNull();
  });

  it('should render when message is set and show is true', () => {
    component.message = 'Operación exitosa';
    component.show = true;
    component.type = 'success';
    component.ngOnChanges();
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.alert');
    expect(el).toBeTruthy();
  });

  it('should apply the correct type class', () => {
    component.message = 'Error';
    component.type = 'error';
    component.ngOnChanges();
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.alert');
    expect(el.classList).toContain('alert--error');
  });

  it('should show close button when dismissible is true', () => {
    component.message = 'Mensaje';
    component.dismissible = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.alert__close');
    expect(btn).toBeTruthy();
  });

  it('should hide alert when close button is clicked', () => {
    component.message = 'Mensaje';
    component.dismissible = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.alert__close');
    btn.click();
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.alert');
    expect(el).toBeNull();
  });

  it('should emit dismissed event when closed', () => {
    const emitSpy = vi.spyOn(component.dismissed, 'emit');
    component.message = 'Mensaje';
    component.dismissible = true;
    fixture.detectChanges();
    component.dismiss();
    expect(emitSpy).toHaveBeenCalled();
  });
});