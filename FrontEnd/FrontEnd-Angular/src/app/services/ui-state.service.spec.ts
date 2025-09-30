import { TestBed } from '@angular/core/testing';

import { UiState } from './ui-state.service';

describe('UiState', () => {
  let service: UiState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
