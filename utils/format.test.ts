import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatCurrency, formatDate, generateId } from './format';

describe('formatCurrency', () => {
  it('should format positive amounts correctly', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100.00');
    expect(result).toContain('S/');

    const result2 = formatCurrency(1234.56);
    expect(result2).toContain('1,234.56');
    expect(result2).toContain('S/');
  });

  it('should format zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
    expect(result).toContain('S/');
  });

  it('should format negative amounts correctly', () => {
    const result = formatCurrency(-50.25);
    expect(result).toContain('50.25');
    expect(result).toContain('-');
  });

  it('should always show 2 decimal places', () => {
    const result1 = formatCurrency(100.1);
    expect(result1).toContain('100.10');

    const result2 = formatCurrency(100.999);
    expect(result2).toContain('101.00');
  });
});

describe('formatDate', () => {
  it('should format valid date strings correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/15\/01\/2024/);
  });

  it('should return "-" for empty string', () => {
    expect(formatDate('')).toBe('-');
  });

  it('should return "-" for null/undefined values', () => {
    expect(formatDate(null as any)).toBe('-');
    expect(formatDate(undefined as any)).toBe('-');
  });

  it('should handle ISO date strings', () => {
    const result = formatDate('2024-12-25T10:30:00Z');
    expect(result).toContain('2024');
  });
});

describe('generateId', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate ID with GP prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^GP/);
  });

  it('should generate different IDs when called multiple times', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    const id1 = generateId();

    vi.setSystemTime(new Date('2024-01-01T00:00:00.100Z'));
    const id2 = generateId();

    expect(id1).not.toBe(id2);
  });

  it('should generate IDs of reasonable length', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    const id = generateId();
    expect(id.length).toBeGreaterThan(2); // More than just "GP"
    expect(id.length).toBeLessThan(20); // Not unreasonably long
  });

  // Test for the bug: IDs might be duplicated if called in quick succession
  it('BUG TEST: may generate duplicate IDs in quick succession', () => {
    const timestamp = Date.now();
    vi.setSystemTime(timestamp);

    const id1 = generateId();
    // Same timestamp = same ID (this is the bug!)
    const id2 = generateId();

    // This test documents the current buggy behavior
    // In real scenarios with same millisecond, we'd get duplicates
    expect(id1).toBe(id2); // Shows the bug exists
  });

  it('should handle edge case of very short substring', () => {
    // Set a time that when substring(7) is applied, might be very short
    vi.setSystemTime(new Date('1970-01-01T00:00:01.000Z'));
    const id = generateId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
  });
});

describe('Integration: Currency and Date formatting together', () => {
  it('should format transaction display correctly', () => {
    const amount = 1500.50;
    const date = '2024-01-15';

    const displayAmount = formatCurrency(amount);
    const displayDate = formatDate(date);

    expect(displayAmount).toContain('1,500.50');
    expect(displayAmount).toContain('S/');
    expect(displayDate).toMatch(/15\/01\/2024/);
  });
});
