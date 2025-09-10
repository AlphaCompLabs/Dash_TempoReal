import { TestBed } from '@angular/core/testing';

import { TrafficData } from './traffic-data';

describe('TrafficData', () => {
  let service: TrafficData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrafficData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
