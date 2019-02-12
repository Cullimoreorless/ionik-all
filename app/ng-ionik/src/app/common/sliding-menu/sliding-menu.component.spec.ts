import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlidingMenuComponent } from './sliding-menu.component';

describe('SlidingMenuComponent', () => {
  let component: SlidingMenuComponent;
  let fixture: ComponentFixture<SlidingMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SlidingMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SlidingMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
