import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyShort, cn } from './utils';

describe('Utility Functions', () => {
  describe('cn() (Tailwind class merger)', () => {
    it('merges multiple class names properly', () => {
      const result = cn('bg-red-500', 'text-white', { 'p-4': true });
      expect(result).toBe('bg-red-500 text-white p-4');
    });

    it('resolves tailwind structural conflicts', () => {
      const result = cn('px-2 py-1', 'p-4');
      // p-4 should override px-2 py-1
      expect(result).toBe('p-4');
    });
  });

  describe('formatCurrency', () => {
    it('formats a regular number into ETB with two decimal places', () => {
      const formatted = formatCurrency(1234.5);
      // Depending on Node environment, Intl might insert standard or narrow non-breaking spaces
      // So we test for containing ETB and the number
      expect(formatted).toMatch(/ETB/);
      expect(formatted).toMatch(/1,234\.50/);
    });

    it('handles zero correctly', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toMatch(/0\.00/);
    });
  });

  describe('formatCurrencyShort', () => {
    it('compacts large numbers', () => {
      const formatted = formatCurrencyShort(1500000);
      expect(formatted).toMatch(/ETB/);
      expect(formatted).toMatch(/1\.5/);
      expect(formatted).toMatch(/M/);
    });
  });
});
