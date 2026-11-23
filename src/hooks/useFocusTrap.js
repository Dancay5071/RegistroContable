import { useEffect, useRef } from "react";

export function useFocusTrap(active = true) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement;
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex=\"-1\"])"
    ].join(", ");

    const getFocusableElements = () => {
      if (!modalRef.current) return [];
      const nodes = Array.from(modalRef.current.querySelectorAll(focusableSelector));
      return nodes.filter((el) => {
        return (
          el.offsetParent !== null ||
          el.getClientRects().length > 0
        );
      });
    };

    const timer = setTimeout(() => {
      const elements = getFocusableElements();
      if (elements.length > 0) {
        elements[0].focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key !== "Tab" || !modalRef.current) return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const node = modalRef.current;
    if (node) {
      node.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      clearTimeout(timer);
      if (node) {
        node.removeEventListener("keydown", handleKeyDown);
      }
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return modalRef;
}
