// =============================================================
// Persistent dashboard top bar.
// Drop this on any page with:
//     <script src="topbar.js" defer></script>
// It self-injects HTML + CSS, reads progress from the same
// localStorage keys the dashboard's tabs already use, and a
// water "+1" button writes to localStorage and (if configured)
// pushes a merged update to the Supabase health row so the
// new bottle appears on every device within ~1 second.
// =============================================================
(function () {
  'use strict';

  // -------- Supabase config (same project as the rest of the dashboard) --------
  // For your audience's standalone, replace these with placeholders
  // and have them paste their own values, just like the other pages.
  // Prefer Vercel env vars (served via /api/config → window.DASH_*),
  // otherwise fall back to these defaults.
  const TOPBAR_SUPABASE_URL = (window.DASH_SUPABASE_URL) || 'https://srajryooffirbroltjmg.supabase.co';
  const TOPBAR_SUPABASE_KEY = (window.DASH_SUPABASE_KEY) || 'sb_publishable_5142ZwTLF_DkSVRzciNuRA_bHwRAu4c';

  // -------- CSS --------
  const css = `
.topbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 40;
  display: flex; justify-content: flex-end; align-items: center;
  gap: 8px;
  padding: max(10px, env(safe-area-inset-top)) 14px 8px;
  background: rgba(240,244,255,0.70);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.75);
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), inset 0 -1px 0 rgba(255,255,255,0.5);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
}
body.has-topbar {
  padding-top: calc(68px + env(safe-area-inset-top)) !important;
}
.topbar-water-wrap {
  display: flex; align-items: stretch;
  position: relative; overflow: hidden;
  border-radius: 12px;
  background: rgba(99,155,255,0.20);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.78);
  border-bottom-color: rgba(255,255,255,0.35);
  border-right-color: rgba(255,255,255,0.35);
  box-shadow:
    0 4px 14px rgba(59,130,246,0.15),
    inset 0 1px 0 rgba(255,255,255,0.90);
}

/* Single shimmer across the whole pill */
@keyframes topbar-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
.topbar-water-wrap::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255,255,255,0.45) 50%,
    transparent 70%
  );
  width: 60%;
  animation: topbar-shimmer 2.8s cubic-bezier(0.4,0,0.6,1) infinite;
  pointer-events: none;
  z-index: 2;
}
/* Specular top highlight */
.topbar-water-wrap::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 45%);
  pointer-events: none; z-index: 1; border-radius: inherit;
}

.topbar-water-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 12px 9px 14px;
  background: transparent;
  border: none;
  border-radius: 0;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  position: relative; z-index: 3;
}
.topbar-water-emoji {
  display: flex; align-items: center; justify-content: center;
  width: 40px;
  background: rgba(59,130,246,0.12);
  border-left: 1px solid rgba(255,255,255,0.45);
  border-radius: 0;
  font-size: 18px; line-height: 1;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  position: relative; z-index: 3;
}
.topbar-water-pill .topbar-pill-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0;
  animation: topbar-dot-pulse 1.8s ease-in-out infinite;
}
@keyframes topbar-dot-pulse {
  0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0   var(--dot-color, rgba(255,255,255,0.4)); }
  50%      { transform: scale(1.15); box-shadow: 0 0 0 4px transparent; }
}
.topbar-pill-count {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 13px; font-weight: 700;
  color: rgba(0,0,0,0.75);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.topbar-finance-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 42px;
  position: relative; overflow: hidden;
  background: rgba(255,255,255,0.22);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.78);
  border-radius: 12px;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow:
    0 4px 14px rgba(0,0,0,0.06),
    inset 0 1px 0 rgba(255,255,255,0.9);
  transition: background 0.2s;
}
.topbar-finance-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.50) 0%,
    rgba(255,255,255,0.0) 50%,
    rgba(255,255,255,0.15) 100%
  );
  pointer-events: none;
  border-radius: inherit;
}
.topbar-finance-btn:hover { background: rgba(255,255,255,0.40); }
.topbar-finance-icon {
  font-size: 20px; line-height: 1;
  opacity: 0.90; position: relative; z-index: 1;
}

/* Bottom tab bar — floating liquid glass pill */
.bottombar {
  position: fixed;
  bottom: max(20px, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
  display: inline-flex;
  gap: 2px;
  padding: 5px;
  background: rgba(255,255,255,0.22);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.78);
  border-bottom-color: rgba(255,255,255,0.35);
  border-radius: 26px;
  box-shadow:
    0 4px 16px rgba(0,0,0,0.08),
    0 12px 40px rgba(0,0,0,0.06),
    inset 0 1px 0 rgba(255,255,255,0.9);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
  white-space: nowrap;
}
.bottombar-tab {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px;
  padding: 7px 14px 5px;
  border-radius: 20px;
  border: 1px solid transparent;
  text-decoration: none;
  color: rgba(0,0,0,0.45);
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.04em;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.bottombar-tab-icon {
  font-size: 22px; line-height: 1;
  filter: saturate(0.5);
  opacity: 0.55;
  transition: opacity 0.15s, filter 0.15s, transform 0.10s;
}
.bottombar-tab.active {
  background: rgba(255,255,255,0.60);
  color: rgba(0,0,0,0.80);
  box-shadow: inset 0 1px 0 rgba(255,255,255,1), 0 1px 4px rgba(0,0,0,0.08);
  border-color: rgba(255,255,255,0.5);
}
.bottombar-tab.active .bottombar-tab-icon {
  filter: saturate(1.4) brightness(1.0);
  opacity: 1;
}
.bottombar-tab:active .bottombar-tab-icon { transform: scale(0.90); }

/* Push page content above the floating pill */
body.has-bottombar {
  padding-bottom: calc(90px + env(safe-area-inset-bottom)) !important;
}

@media (max-width: 480px) {
  .topbar { padding-left: 10px; padding-right: 10px; gap: 6px; }
  .topbar-water-pill { padding: 8px 11px; gap: 6px; }
  .topbar-pill-count { font-size: 12px; }
  .topbar-finance-btn { width: 40px; height: 38px; }
  .topbar-finance-icon { font-size: 18px; }
  .bottombar-tab-icon { font-size: 22px; }
  .bottombar-tab { font-size: 10px; }
}

/* === Global mobile lockdown ===
   1) Hide the right-side scrollbar on phones (iOS uses overlay scrollbars anyway).
   2) Stop iOS auto-text-size-adjust.
   3) touch-action: pan-y prevents pinch-zoom while still allowing vertical scroll.
   4) overscroll-behavior on every common modal class stops scroll chaining —
      scrolling inside a settings popup won't drag the page behind it.
   5) When body has .topbar-modal-open, the page can't scroll at all (locked).
*/
html, body {
  -webkit-text-size-adjust: 100%;
}
@media (max-width: 768px) {
  html { touch-action: pan-y; }
  ::-webkit-scrollbar { width: 0; height: 0; display: none; }
  html, body { scrollbar-width: none; -ms-overflow-style: none; }
}
.modal-bg, .modal, .po-modal-bg, .po-modal, .wt-overlay, .wt-viewer {
  overscroll-behavior: contain;
}
body.topbar-modal-open {
  overflow: hidden;
  touch-action: none;
}
/* On phones, blow the modals up to full screen and let them be the only
   scrolling element. Way less "is this scrolling the page or the modal?"
   confusion. */
@media (max-width: 480px) {
  .modal-bg, .po-modal-bg {
    padding: 0 !important;
    align-items: stretch !important;
    justify-content: stretch !important;
  }
  .modal, .po-modal {
    width: 100% !important;
    max-width: 100% !important;
    max-height: 100vh !important;
    height: 100vh !important;
    border-radius: 0 !important;
    padding-top: max(20px, env(safe-area-inset-top)) !important;
    padding-bottom: max(28px, env(safe-area-inset-bottom)) !important;
    overflow-y: auto !important;
    overscroll-behavior: contain;
  }
}
`;

  // -------- HTML --------
  const topbarHtml = `
<header class="topbar" id="topbar" role="navigation" aria-label="Quick actions">
  <div class="topbar-water-wrap">
    <a href="po-water.html" class="topbar-water-pill" id="topbarWater" aria-label="Water progress">
      <span class="topbar-pill-dot"></span>
      <span class="topbar-pill-count" id="topbarWaterCount">0 / 0L</span>
    </a>
    <a href="po-water.html" class="topbar-water-emoji" aria-label="Go to water">💧</a>
  </div>
  <a href="finance.html" class="topbar-finance-btn" id="topbarFinance" aria-label="Finance">
    <span class="topbar-finance-icon">📊</span>
  </a>
</header>
`;

  const bottombarHtml = `
<nav class="bottombar" id="bottombar" role="navigation" aria-label="Main tabs">
  <a href="index.html" class="bottombar-tab" data-page="main">
    <span class="bottombar-tab-icon">🏠</span>
    <span>Main</span>
  </a>
  <a href="health.html" class="bottombar-tab" data-page="health">
    <span class="bottombar-tab-icon">💊</span>
    <span>Health</span>
  </a>
  <a href="gym.html" class="bottombar-tab" data-page="fitness">
    <span class="bottombar-tab-icon">💪</span>
    <span>Fitness</span>
  </a>
  <a href="po-water.html" class="bottombar-tab" data-page="water">
    <span class="bottombar-tab-icon">💧</span>
    <span>Water</span>
  </a>
  <a href="caffeine.html" class="bottombar-tab" data-page="caffeine">
    <span class="bottombar-tab-icon">☕</span>
    <span>Caffeine</span>
  </a>
</nav>
`;

  // Pages where we suppress the app chrome: finance has its own internal
  // 4-tab bottom nav and self-contained back button.
  function isFinancePage() {
    const p = (window.location.pathname || '').toLowerCase();
    return p.endsWith('/finance.html') || p.endsWith('finance.html');
  }
  // When the water tracker is iframed inside health.html, the embedded
  // page shouldn't render its own chrome again.
  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }
  function shouldShowChrome() {
    return !isFinancePage() && !isEmbedded();
  }
  function currentPageKey() {
    const p = (window.location.pathname || '').toLowerCase();
    if (p.endsWith('health.html')) return 'health';
    if (p.endsWith('gym.html')) return 'fitness';
    if (p.endsWith('po-water.html')) return 'water';
    if (p.endsWith('caffeine.html')) return 'caffeine';
    return 'main'; // index.html, /, or anything else falls back to main
  }

  function injectStyleAndHTML() {
    if (document.getElementById('topbar') || document.getElementById('bottombar')) return;
    if (!shouldShowChrome()) return;

    const style = document.createElement('style');
    style.id = 'topbar-style';
    style.textContent = css;
    document.head.appendChild(style);

    // Liquid Glass SVG distortion filter
    if (!document.getElementById('lg-svg-filter')) {
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.id = 'lg-svg-filter';
      svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;');
      svg.innerHTML = '<defs><filter id="lg-distort"><feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" result="displaced"/><feComposite in="displaced" in2="SourceGraphic" operator="in"/></filter></defs>';
      document.body.appendChild(svg);
    }

    const topWrap = document.createElement('div');
    topWrap.innerHTML = topbarHtml.trim();
    document.body.insertBefore(topWrap.firstChild, document.body.firstChild);

    const bottomWrap = document.createElement('div');
    bottomWrap.innerHTML = bottombarHtml.trim();
    document.body.appendChild(bottomWrap.firstChild);

    // Highlight the active bottom tab.
    const active = currentPageKey();
    document.querySelectorAll('.bottombar-tab').forEach((t) => {
      t.classList.toggle('active', t.getAttribute('data-page') === active);
    });

    // Reserve room above the fixed bottom bar so page content can scroll
    // past it without being hidden.
    document.body.classList.add('has-bottombar');
    document.body.classList.add('has-topbar');
  }

  // -------- Active-date helpers (match the goals page 6 AM rollover) --------
  function activeDateKey() {
    const now = new Date();
    const d = new Date(now);
    if (now.getHours() < 6) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  function calendarDateKey() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // -------- Read progress from localStorage --------
  function getGoalsProgress() {
    const key = 'goals:' + activeDateKey();
    let goals = [];
    try { goals = JSON.parse(localStorage.getItem(key)) || []; } catch (e) {}
    const total = Array.isArray(goals) ? goals.length : 0;
    const done = total ? goals.filter(g => g && g.done).length : 0;
    return { done, total };
  }

  function getStackProgress() {
    let items = [];
    try { items = JSON.parse(localStorage.getItem('stack:items')) || []; } catch (e) {}
    let taken = {};
    try { taken = JSON.parse(localStorage.getItem('stack:taken:' + activeDateKey())) || {}; } catch (e) {}
    const total = Array.isArray(items) ? items.length : 0;
    const done = total ? items.filter(i => i && taken[i.id]).length : 0;
    return { done, total };
  }

  function getWaterProgress() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem('po_water_v1')); } catch (e) {}
    if (!state) return { done: 0, total: 0 };
    const todayKey = calendarDateKey();
    const done = (state.logs || {})[todayKey] || 0;
    const p = state.profile || { weightKg: 75 };
    let wKg = state.weightUnit === 'lb' ? (p.weightKg || 75) / 2.20462 : (p.weightKg || 75);
    try {
      const entries = JSON.parse(localStorage.getItem('po_coach_weights') || '[]');
      if (entries.length > 0) {
        const last = entries[entries.length - 1];
        const gymState = JSON.parse(localStorage.getItem('po_coach_v1') || '{}');
        wKg = gymState.units === 'lb' ? last.weight / 2.20462 : last.weight;
      }
    } catch (e) {}
    const base = wKg * 30;
    const exercise = (p.activityHrsPerWeek || 0) / 7 * 350;
    const caffeine = Math.max(0, (state.caffeineMgPerDay || 0) - 200) * 1.5;
    const subs = (state.substances || []).reduce((s, x) => {
      const dose = (x && x.dose != null ? x.dose : (x && x.defaultDose)) || 0;
      return s + Math.max(0, dose * ((x && x.mlPerUnit) || 0));
    }, 0);
    let adjust = 0;
    if (p.sex === 'm') adjust += 200;
    if ((p.age || 0) >= 50) adjust += 100;
    let heat = 0;
    try {
      const wx = JSON.parse(localStorage.getItem('water_weather'));
      if (wx && (Date.now() - wx.ts) < 30 * 60 * 1000 && wx.temp > 25) {
        heat = Math.round(Math.min((wx.temp - 25) * 120, 600));
      }
    } catch (e) {}
    const totalMl = Math.min(base + exercise + caffeine + subs + adjust + heat, 4000);
    let unitVol;
    if (state.unit === 'glass') unitVol = state.glassMl || 250;
    else if (state.unit === 'oz') unitVol = 30;
    else if (state.unit === 'ml') unitVol = 1;
    else if (state.unit === 'L') unitVol = 1000;
    else unitVol = state.bottleMl || 500;
    const total = Math.max(1, Math.ceil(totalMl / unitVol));
    // logs stored in ml (>=50) since quick-pick update; convert to units for display
    const doneUnits = done >= 50 ? Math.round((done / unitVol) * 10) / 10 : done;
    const doneMl = done >= 50 ? done : done * unitVol;
    return { done: doneUnits, total, doneMl, totalMl, unit: state.unit || 'bottle' };
  }

  function classifyStatus(done, total) {
    if (total === 0) return 'idle';
    if (done >= total) return 'good';
    if (done >= total * 0.5) return 'warn';
    // Past 6pm and still under half → flag as missed
    const h = new Date().getHours();
    if (h >= 18 && done < total * 0.5) return 'miss';
    return 'warn';
  }

  function setPillStatus(pillEl, status) {
    pillEl.classList.remove('good', 'warn', 'miss');
    if (status === 'warn' || status === 'miss') pillEl.classList.add(status);
  }

  function render() {
    const waterEl = document.getElementById('topbarWater');
    if (!waterEl) return; // not injected yet

    const w = getWaterProgress();
    const countEl = document.getElementById('topbarWaterCount');
    const dotEl = waterEl.querySelector('.topbar-pill-dot');
    if (countEl) {
      if (!w.total) {
        countEl.textContent = '0 / 0L';
      } else {
        function fmtL(ml) {
          const l = Math.round(ml / 100) / 10;
          return l.toFixed(1).replace(/\.0$/, '') + 'L';
        }
        countEl.textContent = fmtL(w.doneMl) + ' / ' + fmtL(w.totalMl);
      }
    }
    if (dotEl && w.total) {
      const ratio = w.done / w.total;
      let dotColor;
      if      (ratio >= 1.5)  dotColor = '#ef4444';
      else if (ratio >= 1.25) dotColor = '#f97316';
      else if (ratio >= 1.0)  dotColor = '#facc15';
      else if (ratio >= 0.75) dotColor = '#22c55e';
      else if (ratio >= 0.5)  dotColor = '#4ade80';
      else if (ratio >= 0.25) dotColor = '#a3e635';
      else                    dotColor = '#fbbf24';
      dotEl.style.background = dotColor;
      dotEl.style.setProperty('--dot-color', dotColor + '80');
    }
    setPillStatus(waterEl, classifyStatus(w.done, w.total));
  }

  // -------- Mobile lockdown helpers --------
  // Belt-and-suspenders zoom prevention — iOS Safari sometimes ignores
  // user-scalable=no, so we also kill the gesture events directly.
  function blockGesture(e) { e.preventDefault(); }
  function lockGestures() {
    document.addEventListener('gesturestart', blockGesture, { passive: false });
    document.addEventListener('gesturechange', blockGesture, { passive: false });
    document.addEventListener('gestureend', blockGesture, { passive: false });
    // Also kill the iOS double-tap-to-zoom on any tap.
    let lastTouch = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouch <= 300) e.preventDefault();
      lastTouch = now;
    }, { passive: false });
  }

  // Watch every known modal-bg / overlay class — when any one of them
  // gets `.show` or `.is-open`, lock the body scroll. When the last
  // one closes, unlock.
  function startModalLock() {
    const MODAL_SELECTORS = [
      '.modal-bg', '.po-modal-bg', '.wt-overlay', '.wt-viewer', '.wt-cam'
    ];
    function anyOpen() {
      for (const sel of MODAL_SELECTORS) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          if (el.classList.contains('show') || el.classList.contains('is-open')) {
            return true;
          }
        }
      }
      return false;
    }
    function sync() {
      document.body.classList.toggle('topbar-modal-open', anyOpen());
    }
    const observer = new MutationObserver(sync);
    // Observe class changes anywhere in body — modal toggles are rare so
    // a global subtree observer is cheap.
    observer.observe(document.body, {
      attributes: true, attributeFilter: ['class'], subtree: true
    });
    sync();
  }

  // -------- Boot --------
  function boot() {
    injectStyleAndHTML();
    const btn = document.getElementById('topbarWaterAdd');
    render();
    lockGestures();
    startModalLock();

    // Re-render when localStorage changes from another tab/window OR when
    // the page becomes visible (sync may have pulled in the background).
    window.addEventListener('storage', render);
    window.addEventListener('focus', render);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

    // Periodic refresh so counts stay current after midnight rollover etc.
    setInterval(render, 30 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
