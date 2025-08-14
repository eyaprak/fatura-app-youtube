import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook to debounce a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if the value or delay changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced callback function
 * @param callback - The callback function to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced callback function
 */
export function useDebouncedCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  delay: number
): (...args: TArgs) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedCallback = useCallback(
    (...args: TArgs) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom hook for debounced search functionality
 * @param searchValue - The search value to debounce
 * @param onSearch - The search callback function
 * @param delay - The delay in milliseconds (default: 300ms)
 */
export function useDebouncedSearch(
  searchValue: string,
  onSearch: (value: string) => void,
  delay: number = 300
) {
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchValue = useDebounce(searchValue, delay);
  const callbackRef = useRef(onSearch);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (debouncedSearchValue !== searchValue) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchValue, debouncedSearchValue]);

  useEffect(() => {
    if (debouncedSearchValue) {
      callbackRef.current(debouncedSearchValue);
      setIsSearching(false);
    }
  }, [debouncedSearchValue]);

  return { isSearching, debouncedValue: debouncedSearchValue };
}
