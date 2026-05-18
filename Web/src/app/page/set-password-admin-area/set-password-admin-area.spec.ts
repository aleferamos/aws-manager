import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetPasswordAdminArea } from './set-password-admin-area';

describe('SetPasswordAdminArea', () => {
  let component: SetPasswordAdminArea;
  let fixture: ComponentFixture<SetPasswordAdminArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetPasswordAdminArea],
    }).compileComponents();

    fixture = TestBed.createComponent(SetPasswordAdminArea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
