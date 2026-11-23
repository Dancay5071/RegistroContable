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
      if (!modalRef.current) return;
      const isTab = e.key === "Tab";
      const isArrow = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key);

      if (!isTab && !isArrow) return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];
      const activeEl = document.activeElement;

      if (!modalRef.current.contains(activeEl)) {
        e.preventDefault();
        firstElement.focus();
        return;
      }

      if (isTab) {
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
        return;
      }

      if (isArrow) {
        const isTextInput = activeEl && (
          activeEl.tagName === "TEXTAREA" ||
          (activeEl.tagName === "INPUT" && !["button", "submit", "reset", "checkbox", "radio", "range"].includes(activeEl.type))
        );

        if (isTextInput) {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") return;
          if (activeEl.type === "number" && (e.key === "ArrowUp" || e.key === "ArrowDown")) return;
        }

        if (activeEl && activeEl.tagName === "SELECT") {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") return;
        }

        const currentIndex = elements.indexOf(activeEl);
        if (currentIndex === -1) {
          e.preventDefault();
          firstElement.focus();
          return;
        }

        if (e.key === "ArrowDown" || (e.key === "ArrowRight" && !isTextInput)) {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % elements.length;
          const nextEl = elements[nextIndex];
          nextEl.focus();
          if (nextEl.classList.contains("quick-tab-btn") || nextEl.getAttribute("role") === "tab") {
            nextEl.click();
          }
        } else if (e.key === "ArrowUp" || (e.key === "ArrowLeft" && !isTextInput)) {
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + elements.length) % elements.length;
          const prevEl = elements[prevIndex];
          prevEl.focus();
          if (prevEl.classList.contains("quick-tab-btn") || prevEl.getAttribute("role") === "tab") {
            prevEl.click();
          }
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
