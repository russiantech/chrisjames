import { useEffect, type RefObject } from 'react';

/**
 * Closes an open panel when the person clicks outside it or presses Escape.
 * Used instead of Bootstrap's dropdown JS, which needs its own document-level
 * listener and Popper for positioning — both are extra moving parts for a
 * simple menu, and were the source of the flicker on the mobile dropdown.
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;

    function handlePointer(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onOutside();
    }

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, onOutside, enabled]);
}
