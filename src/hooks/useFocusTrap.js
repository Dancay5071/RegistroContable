import { useEffect, useRef } from "react";

export function useFocusTrap(active = true) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement;
    const focusableSelector = [
      "input:not([type='hidden']):not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      "a[href]",
      "[tabindex]:not([tabindex='-1'])"
    ].join(", ");

    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    };

    const getFocusableElements = () => {
      if (!modalRef.current) return [];
      const nodes = Array.from(modalRef.current.querySelectorAll(focusableSelector));
      return nodes.filter(isVisible);
    };

    const setInitialFocus = () => {
      if (!modalRef.current) return;
      const elements = getFocusableElements();
      if (elements.length === 0) {
        if (modalRef.current) modalRef.current.focus();
        return;
      }

      const preferred = elements.find(
        (el) =>
          el.hasAttribute("autofocus") ||
          el.tagName === "INPUT" ||
          el.tagName === "SELECT" ||
          el.tagName === "TEXTAREA" ||
          (el.tagName === "BUTTON" && !el.classList.contains("btn-close"))
      );

      if (preferred) {
        preferred.focus();
      } else {
        elements[0].focus();
      }
    };

    const rafId = requestAnimationFrame(() => {
      setInitialFocus();
    });

    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || !modalRef.current) return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeEl = document.activeElement;

      if (!modalRef.current.contains(activeEl)) {
        e.preventDefault();
        firstElement.focus();
        return;
      }

      if (e.shiftKey) {
        if (activeEl === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (activeEl === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return modalRef;
}
