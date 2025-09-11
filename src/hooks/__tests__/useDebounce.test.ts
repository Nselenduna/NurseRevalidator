import { renderHook, act } from '@testing-library/react-native';
import useDebounce from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('cancels previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Rapid changes
    rerender({ value: 'change1', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(250);
    });
    
    rerender({ value: 'change2', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(250);
    });
    
    // Should still be initial value
    expect(result.current).toBe('initial');
    
    // Complete the timeout
    act(() => {
      jest.advanceTimersByTime(250);
    });
    
    // Should be the final change
    expect(result.current).toBe('change2');
  });

  it('handles different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 100 },
      }
    );

    rerender({ value: 'updated', delay: 100 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });

  it('cleans up timeout on unmount', () => {
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 500 });
    
    // Unmount before timeout completes
    unmount();
    
    // This should not throw or cause issues
    act(() => {
      jest.advanceTimersByTime(500);
    });
  });

  it('works with different value types', () => {
    // Test with numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 100 },
      }
    );

    numberRerender({ value: 42, delay: 100 });
    
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(numberResult.current).toBe(42);

    // Test with objects
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: { count: 0 }, delay: 100 },
      }
    );

    const newObject = { count: 5 };
    objectRerender({ value: newObject, delay: 100 });
    
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(objectResult.current).toBe(newObject);
  });

  it('handles zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 },
      }
    );

    rerender({ value: 'updated', delay: 0 });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });
});