/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Adm_man_profileComponent } from './adm_man_profile.component';

describe('Adm_man_profileComponent', () => {
  let component: Adm_man_profileComponent;
  let fixture: ComponentFixture<Adm_man_profileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Adm_man_profileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Adm_man_profileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
