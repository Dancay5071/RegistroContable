import { useEffect } from "react";

export function useArrowNavigation(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([type='hidden']):not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
      "[role='button']:not([disabled])"
    ].join(", ");

    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    };

    const handleKeyDown = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;

      if (document.querySelector(".modal.show, [role='dialog']")) return;

      const activeEl = document.activeElement;
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

      const activeTableTr = activeEl?.closest("tbody tr");
      if (activeTableTr) {
        if (e.key === "ArrowDown") {
          const nextRow = activeTableTr.nextElementSibling;
          if (nextRow) {
            const nextBtn = nextRow.querySelector("button, a, [tabindex='0']");
            if (nextBtn) {
              e.preventDefault();
              nextBtn.focus();
              return;
            }
          }
        } else if (e.key === "ArrowUp") {
          const prevRow = activeTableTr.previousElementSibling;
          if (prevRow) {
            const prevBtn = prevRow.querySelector("button, a, [tabindex='0']");
            if (prevBtn) {
              e.preventDefault();
              prevBtn.focus();
              return;
            }
          }
        } else if (e.key === "ArrowRight") {
          const nextInRow = activeEl.nextElementSibling;
          if (nextInRow && (nextInRow.tagName === "BUTTON" || nextInRow.tagName === "A")) {
            e.preventDefault();
            nextInRow.focus();
            return;
          }
        } else if (e.key === "ArrowLeft") {
          const prevInRow = activeEl.previousElementSibling;
          if (prevInRow && (prevInRow.tagName === "BUTTON" || prevInRow.tagName === "A")) {
            e.preventDefault();
            prevInRow.focus();
            return;
          }
        }
      }

      const mainContainer = document.getElementById("main-content") || document.body;
      const allFocusable = Array.from(mainContainer.querySelectorAll(focusableSelector)).filter(isVisible);

      if (allFocusable.length === 0) return;

      const currentIndex = allFocusable.indexOf(activeEl);

      if (e.key === "ArrowDown" || (e.key === "ArrowRight" && !isTextInput)) {
        e.preventDefault();
        const nextIndex = currentIndex < allFocusable.length - 1 ? currentIndex + 1 : 0;
        allFocusable[nextIndex].focus();
      } else if (e.key === "ArrowUp" || (e.key === "ArrowLeft" && !isTextInput)) {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : allFocusable.length - 1;
        allFocusable[prevIndex].focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
