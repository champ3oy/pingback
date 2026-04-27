import { parseDelay } from './parse-delay';

describe('parseDelay', () => {
  it('should return 0 for undefined', () => {
    expect(parseDelay(undefined)).toBe(0);
  });

  it('should return 0 for null', () => {
    expect(parseDelay(null)).toBe(0);
  });

  it('should pass through a positive integer as seconds', () => {
    expect(parseDelay(900)).toBe(900);
  });

  it('should parse a bare number string as seconds', () => {
    expect(parseDelay('900')).toBe(900);
  });

  it('should parse seconds', () => {
    expect(parseDelay('30s')).toBe(30);
  });

  it('should parse minutes', () => {
    expect(parseDelay('15m')).toBe(900);
  });

  it('should parse hours', () => {
    expect(parseDelay('2h')).toBe(7200);
  });

  it('should parse days', () => {
    expect(parseDelay('1d')).toBe(86400);
  });

  it('should parse combined units', () => {
    expect(parseDelay('1d2h30m15s')).toBe(95415);
  });

  it('should throw on zero delay', () => {
    expect(() => parseDelay(0)).toThrow('Delay must be a positive number');
  });

  it('should throw on negative delay', () => {
    expect(() => parseDelay(-10)).toThrow('Delay must be a positive number');
  });

  it('should throw on invalid string format', () => {
    expect(() => parseDelay('abc')).toThrow('Invalid delay format');
  });

  it('should throw on unknown unit', () => {
    expect(() => parseDelay('15x')).toThrow('Invalid delay format');
  });

  it('should throw when exceeding 30 days', () => {
    expect(() => parseDelay(2592001)).toThrow('exceeds maximum');
  });

  it('should throw when string exceeds 30 days', () => {
    expect(() => parseDelay('31d')).toThrow('exceeds maximum');
  });

  it('should allow exactly 30 days', () => {
    expect(parseDelay(2592000)).toBe(2592000);
  });

  it('should floor fractional seconds', () => {
    expect(parseDelay(1.7)).toBe(1);
    expect(parseDelay(90.9)).toBe(90);
  });
});
