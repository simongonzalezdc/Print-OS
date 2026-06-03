import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateId, debounce } from '../utils';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate URL-safe IDs', () => {
      const id = generateId();

      // Should not contain special characters that need URL encoding
      expect(id).not.toMatch(/[+/=]/);
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toBeCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).not.toBeCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toBeCalledTimes(1);
    });

    it('should cancel previous calls when called again', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);

      debouncedFn(); // Cancel first call
      vi.advanceTimersByTime(50);
      expect(mockFn).not.toBeCalled();

      vi.advanceTimersByTime(50);
      expect(mockFn).toBeCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 123);
      vi.advanceTimersByTime(100);

      expect(mockFn).toBeCalledWith('arg1', 'arg2', 123);
    });

    it('should handle multiple rapid calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call multiple times rapidly
      for (let i = 0; i < 10; i++) {
        debouncedFn(i);
      }

      vi.advanceTimersByTime(100);
      expect(mockFn).toBeCalledTimes(1);
      expect(mockFn).toBeCalledWith(9); // Last call's argument
    });

    it('should work with different wait times', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn();
      vi.advanceTimersByTime(200);
      expect(mockFn).not.toBeCalled();

      vi.advanceTimersByTime(300);
      expect(mockFn).toBeCalledTimes(1);
    });
  });
});
