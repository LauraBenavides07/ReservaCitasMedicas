import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should apply padding-md class by default', () => {
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('.card');
    expect(div.classList).toContain('card--padding-md');
  });

  it('should apply padding-none class when padding is none', () => {
    component.padding = 'none';
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('.card');
    expect(div.classList).toContain('card--padding-none');
  });

  it('should apply hoverable class when hoverable is true', () => {
    component.hoverable = true;
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('.card');
    expect(div.classList).toContain('card--hoverable');
  });

  it('should apply overflow-hidden class when overflow is hidden', () => {
    component.overflow = 'hidden';
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('.card');
    expect(div.classList).toContain('card--overflow-hidden');
  });
});