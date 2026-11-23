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

      if (activeEl?.closest("#navbar")) {
        const isDolarPill = activeEl?.classList?.contains("navbar-dolar-pill") || activeEl?.closest(".navbar-dolar-pill");
        const isGastosLink = (activeEl?.getAttribute?.("href")?.includes("/gastos") || activeEl?.closest("a[href*='/gastos']"));

        if (isDolarPill && e.key === "ArrowRight") {
          const gastosLink = document.querySelector("#navbar a[href*='/gastos']");
          if (gastosLink) {
            e.preventDefault();
            gastosLink.focus();
            return;
          }
        }

        if (isGastosLink && e.key === "ArrowLeft") {
          const dolarPill = document.querySelector(".navbar-dolar-pill");
          if (dolarPill) {
            e.preventDefault();
            dolarPill.focus();
            return;
          }
        }

        if (isDolarPill && e.key === "ArrowLeft") {
          const brandLink = document.querySelector("#navbar .navbar-brand");
          if (brandLink) {
            e.preventDefault();
            brandLink.focus();
            return;
          }
        }

        if (activeEl?.closest(".navbar-brand") && e.key === "ArrowRight") {
          const dolarPill = document.querySelector(".navbar-dolar-pill");
          const gastosLink = document.querySelector("#navbar a[href*='/gastos']");
          const target = dolarPill || gastosLink;
          if (target) {
            e.preventDefault();
            target.focus();
            return;
          }
        }

        if (e.key === "ArrowDown") {
          const mainEl = document.getElementById("main-content");
          if (mainEl) {
            const firstInMain = Array.from(mainEl.querySelectorAll(focusableSelector)).filter(isVisible)[0];
            if (firstInMain) {
              e.preventDefault();
              firstInMain.focus();
              return;
            }
          }
        }

        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          const navItems = Array.from(document.querySelectorAll("#navbar " + focusableSelector)).filter(isVisible);
          const currentItem = activeEl.closest(focusableSelector) || activeEl;
          const idx = navItems.indexOf(currentItem);
          if (idx !== -1) {
            e.preventDefault();
            const nextIdx = e.key === "ArrowRight"
              ? (idx < navItems.length - 1 ? idx + 1 : 0)
              : (idx > 0 ? idx - 1 : navItems.length - 1);
            navItems[nextIdx].focus();
            return;
          }
        }
      }

      if (e.key === "ArrowUp") {
        const isCalendarCell = activeEl?.closest(".calendar-cell") || activeEl?.classList?.contains("calendar-cell");
        if (isCalendarCell) return;

        const inMainContent = activeEl?.closest("#main-content");
        const mainEl = document.getElementById("main-content");
        const mainFocusables = mainEl ? Array.from(mainEl.querySelectorAll(focusableSelector)).filter(isVisible) : [];
        const currentIndexInMain = activeEl ? mainFocusables.indexOf(activeEl) : -1;

        if (currentIndexInMain <= 2 || !inMainContent) {
          const navTarget = (
            document.querySelector("#navbar a.nav-link.active") ||
            document.querySelector("#navbar a[href*='/calendario']") ||
            document.querySelector("#navbar a[href*='/gastos']") ||
            document.querySelector(".navbar-dolar-pill")
          );
          if (navTarget && activeEl !== navTarget && inMainContent) {
            e.preventDefault();
            navTarget.focus();
            return;
          }
        }
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

      const root = document.querySelector(".app-wrapper") || document.body;
      const allFocusable = Array.from(root.querySelectorAll(focusableSelector)).filter(isVisible);

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
