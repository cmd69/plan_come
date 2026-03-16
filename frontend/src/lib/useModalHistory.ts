import { useEffect, useRef, useCallback } from "react";

/**
 * When `open` is true:
 * - Pushes a history entry so the browser back button closes the modal
 * - Locks body scroll
 *
 * Returns a `close` function that should be called from UI dismiss actions
 * (X button, backdrop, save). It pops the history entry and calls `onClose`.
 *
 * When the user presses the browser back button, `onClose` is called directly
 * (history already popped by the browser).
 */
export function useModalHistory(open: boolean, onClose: () => void) {
  const pushed = useRef(false);
  const closingFromUI = useRef(false);

  useEffect(() => {
    if (open) {
      history.pushState({ modal: true }, "");
      pushed.current = true;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      pushed.current = false;
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPopState() {
      if (closingFromUI.current) {
        closingFromUI.current = false;
        return;
      }
      pushed.current = false;
      onClose();
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open, onClose]);

  /** Call this from UI dismiss (X, backdrop, save) — pops history + closes */
  const close = useCallback(() => {
    if (pushed.current) {
      closingFromUI.current = true;
      pushed.current = false;
      history.back();
    }
    onClose();
  }, [onClose]);

  return close;
}
