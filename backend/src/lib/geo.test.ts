import { describe, expect, it } from 'vitest';
import { isValidLatitude, isValidLongitude, isValidWgs84Point } from './geo.js';

describe('geo (WGS84 helpers)', () => {
  it('accepts equator and prime meridian', () => {
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLongitude(0)).toBe(true);
    expect(isValidWgs84Point(0, 0)).toBe(true);
  });

  it('accepts bounds', () => {
    expect(isValidWgs84Point(-90, -180)).toBe(true);
    expect(isValidWgs84Point(90, 180)).toBe(true);
  });

  it('rejects non-finite values', () => {
    expect(isValidLatitude(NaN)).toBe(false);
    expect(isValidLongitude(Infinity)).toBe(false);
    expect(isValidWgs84Point(1, NaN)).toBe(false);
  });

  it('rejects out-of-range latitude', () => {
    expect(isValidLatitude(-90.0001)).toBe(false);
    expect(isValidLatitude(90.0001)).toBe(false);
    expect(isValidWgs84Point(91, 0)).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    expect(isValidLongitude(-180.0001)).toBe(false);
    expect(isValidLongitude(180.0001)).toBe(false);
    expect(isValidWgs84Point(0, 181)).toBe(false);
  });
});
