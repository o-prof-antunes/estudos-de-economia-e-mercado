/* ==========================================================================
   EcoEngine — Orquestrador de Sala de Aula 100% Offline (Aulas 01 a 20)
   Stepper 5 blocos · Timer 150 min · Modo Docente · Guardas NaN · Progresso
   ========================================================================== */

window.EcoEngine = (function () {
  "use strict";

  const STORAGE_DONE = "eco_mercado_done_lessons_v1";
  const STORAGE_DOC = "eco_mercado_modo_docente_v1";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function safeNum(val, fallback) {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : (fallback !== undefined ? fallback : 0);
  }

  function safeDiv(num, den, fallback) {
    if (!Number.isFinite(num) || !Number.isFinite(den) || Math.abs(den) < 1e-9) {
      return fallback !== undefined ? fallback : 0;
    }
    return num / den;
  }

  function fmtBRL(n) {
    const v = Number.isFinite(n) ? n : 0;
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtNum(n, dec) {
    const v = Number.isFinite(n) ? n : 0;
    const d = dec !== undefined ? dec : 2;
    return v.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function fmtPct(n, dec) {
    return fmtNum(n, dec !== undefined ? dec : 2) + "%";
  }

  function pulseRow(el) {
    if (!el) return;
    el.classList.remove("flash-row");
    void el.offsetWidth;
    el.classList.add("flash-row");
  }

  function getDoneSet() {
    try {
      const raw = localStorage.getItem(STORAGE_DONE);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (_) {
      return new Set();
    }
  }

  function saveDoneSet(set) {
    try {
      localStorage.setItem(STORAGE_DONE, JSON.stringify(Array.from(set)));
    } catch (_) { /* noop */ }
  }

  function initTopControls(lessonId) {
    // 1. Modo Docente toggle
    const docBtn = $("#btn-modo-docente");
    let docActive = false;
    try {
      docActive = localStorage.getItem(STORAGE_DOC) === "1";
    } catch (_) { docActive = false; }

    function applyDocMode() {
      document.body.classList.toggle("docente-on", docActive);
      if (docBtn) {
        docBtn.setAttribute("aria-pressed", docActive ? "true" : "false");
        docBtn.textContent = docActive ? "Modo Docente: ATIVO" : "Modo Docente";
      }
    }
    applyDocMode();

    if (docBtn) {
      docBtn.addEventListener("click", function () {
        docActive = !docActive;
        try { localStorage.setItem(STORAGE_DOC, docActive ? "1" : "0"); } catch (_) {}
        applyDocMode();
      });
    }

    // 2. Focus Simulator toggle
    const focusBtn = $("#btn-focus-sim");
    const gridEl = $(".workspace-grid");
    if (focusBtn && gridEl) {
      focusBtn.addEventListener("click", function () {
        const isFocus = gridEl.classList.toggle("focus-sim");
        focusBtn.setAttribute("aria-pressed", isFocus ? "true" : "false");
        focusBtn.textContent = isFocus ? "Mostrar Roteiro" : "Expandir Simulador";
      });
    }

    // 3. Concluir Aula toggle
    const doneBtn = $("#btn-done-lesson");
    if (doneBtn && lessonId) {
      const syncDone = () => {
        const done = getDoneSet().has(lessonId);
        doneBtn.setAttribute("aria-pressed", done ? "true" : "false");
        doneBtn.textContent = done ? "Aula Concluída ✓" : "Marcar Concluída";
      };
      syncDone();
      doneBtn.addEventListener("click", function () {
        const set = getDoneSet();
        if (set.has(lessonId)) set.delete(lessonId);
        else set.add(lessonId);
        saveDoneSet(set);
        syncDone();
      });
    }

    // 4. 150-min Classroom Timer
    const disp = $("#timer-display");
    const startBtn = $("#timer-toggle");
    const resetBtn = $("#timer-reset");
    if (disp && startBtn && resetBtn) {
      let totalSec = 150 * 60;
      let running = false;
      let iv = null;

      function renderTimer() {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        disp.textContent =
          String(h).padStart(2, "0") + ":" +
          String(m).padStart(2, "0") + ":" +
          String(s).padStart(2, "0");
      }
      renderTimer();

      startBtn.addEventListener("click", function () {
        if (running) {
          clearInterval(iv);
          running = false;
          startBtn.textContent = "▶";
        } else {
          running = true;
          startBtn.textContent = "❚❚";
          iv = setInterval(function () {
            if (totalSec > 0) {
              totalSec--;
              renderTimer();
            } else {
              clearInterval(iv);
              running = false;
              startBtn.textContent = "▶";
            }
          }, 1000);
        }
      });

      resetBtn.addEventListener("click", function () {
        clearInterval(iv);
        running = false;
        totalSec = 150 * 60;
        startBtn.textContent = "▶";
        renderTimer();
      });
    }
  }

  function initStepper() {
    const tabs = $all(".step-tab");
    const panels = $all(".step-panel");
    if (!tabs.length || !panels.length) return;
    let current = 0;

    function go(idx) {
      current = Math.max(0, Math.min(panels.length - 1, idx));
      tabs.forEach((t, i) => t.classList.toggle("active", i === current));
      panels.forEach((p, i) => p.classList.toggle("active", i === current));
      const prev = $("#btn-step-prev");
      const next = $("#btn-step-next");
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === panels.length - 1;
    }

    tabs.forEach((t, i) => t.addEventListener("click", () => go(i)));
    const prev = $("#btn-step-prev");
    const next = $("#btn-step-next");
    if (prev) prev.addEventListener("click", () => go(current - 1));
    if (next) next.addEventListener("click", () => go(current + 1));

    document.addEventListener("keydown", function (ev) {
      const tag = (ev.target && ev.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (ev.key === "ArrowRight") go(current + 1);
      else if (ev.key === "ArrowLeft") go(current - 1);
    });

    go(0);
  }

  function bindInputs(ids, fn) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", fn);
        el.addEventListener("change", fn);
      }
    });
    fn();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const lessonId = document.body.getAttribute("data-lesson-id") || "";
    initTopControls(lessonId);
    initStepper();
    if (typeof window.initLessonSim === "function") {
      window.initLessonSim();
    }
  });

  return {
    $, $all, safeNum, safeDiv, fmtBRL, fmtNum, fmtPct, pulseRow, bindInputs, getDoneSet
  };
})();
