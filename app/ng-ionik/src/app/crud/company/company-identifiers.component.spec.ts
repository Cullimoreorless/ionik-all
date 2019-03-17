import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyIdentifiersComponent } from './company-identifiers.component';

describe('CompanyIdentifiersComponent', () => {
  let component: CompanyIdentifiersComponent;
  let fixture: ComponentFixture<CompanyIdentifiersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyIdentifiersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyIdentifiersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
