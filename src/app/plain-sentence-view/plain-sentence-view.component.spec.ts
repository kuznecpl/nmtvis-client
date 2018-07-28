import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlainSentenceViewComponent } from './plain-sentence-view.component';

describe('PlainSentenceViewComponent', () => {
  let component: PlainSentenceViewComponent;
  let fixture: ComponentFixture<PlainSentenceViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlainSentenceViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlainSentenceViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
