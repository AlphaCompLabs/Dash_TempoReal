import { TestBed } from '@angular/core/testing';

import { Traffic } from './traffic';

describe('Traffic', () => {
  let service: Traffic;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Traffic);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
