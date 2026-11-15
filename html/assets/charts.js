/* ==========================================================================
   EcoCharts — Biblioteca Vetorial SVG 100% Offline (Arquitetura Fiduciária)
   ========================================================================== */

window.EcoCharts = (function () {
  "use strict";

  const C = {
    navy: "#0D2436",
    brand: "#1D3557",
    slate: "#3C4459",
    gold: "#D9A65B",
    teal: "#0F766E",
    crimson: "#B91C1C",
    muted: "#526071",
    grid: "#E2E8F0",
    bg: "#FFFFFF"
  };

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Plota Fronteira de Possibilidades de Produção (FPP linear ou côncava) + ponto atual.
   */
  function renderFPP(container, cfg) {
    if (!container) return;
    const W = 620, H = 310, padL = 64, padR = 28, padT = 26, padB = 46;
    const cw = W - padL - padR;
    const ch = H - padT - padB;
    const maxX = Math.max(1, cfg.maxX || 20);
    const maxY = Math.max(1, cfg.maxY || 10);
    const techMult = Math.max(0.5, cfg.techMult || 1);
    const effX = maxX * techMult;
    const effY = maxY * techMult;
    const axisMaxX = Math.max(effX, cfg.ptX || 0) * 1.15;
    const axisMaxY = Math.max(effY, cfg.ptY || 0) * 1.15;

    const toPx = (x) => padL + (x / axisMaxX) * cw;
    const toPy = (y) => padT + ch - (y / axisMaxY) * ch;

    const concave = !!cfg.concave;
    let dCurve = "";
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = effX * t;
      const y = concave ? effY * Math.sqrt(Math.max(0, 1 - t * t)) : effY * (1 - t);
      dCurve += (i === 0 ? "M " : " L ") + toPx(x).toFixed(1) + " " + toPy(y).toFixed(1);
    }

    const ptX = Math.max(0, cfg.ptX || 0);
    const ptY = Math.max(0, cfg.ptY || 0);
    const px = toPx(ptX);
    const py = toPy(ptY);
    const statusColor = cfg.statusColor || C.navy;

    let gridLines = "";
    for (let i = 1; i <= 4; i++) {
      const gy = padT + (ch * i) / 5;
      const gx = padL + (cw * i) / 5;
      gridLines += `<line x1="${padL}" y1="${gy.toFixed(1)}" x2="${W - padR}" y2="${gy.toFixed(1)}" stroke="${C.grid}" stroke-dasharray="3 3"/>`;
      gridLines += `<line x1="${gx.toFixed(1)}" y1="${padT}" x2="${gx.toFixed(1)}" y2="${H - padB}" stroke="${C.grid}" stroke-dasharray="3 3"/>`;
    }

    container.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico Fronteira de Possibilidades de Produção">
        <rect width="${W}" height="${H}" fill="${C.bg}" rx="6"/>
        ${gridLines}
        <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="${C.navy}" stroke-width="2"/>
        <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="${C.navy}" stroke-width="2"/>
        <path d="${dCurve}" fill="none" stroke="${C.brand}" stroke-width="3.2"/>
        ${techMult > 1 ? `<text x="${toPx(effX * 0.55).toFixed(1)}" y="${(toPy(effY * 0.52) - 8).toFixed(1)}" font-size="11" font-weight="700" fill="${C.teal}">FPP Expandida (${techMult.toFixed(2)}x)</text>` : ""}
        <circle cx="${toPx(0)}" cy="${toPy(effY)}" r="4.5" fill="${C.brand}"/>
        <circle cx="${toPx(effX)}" cy="${toPy(0)}" r="4.5" fill="${C.brand}"/>
        <text x="${padL - 8}" y="${toPy(effY) + 4}" text-anchor="end" font-size="11" font-weight="700" fill="${C.navy}">${effY.toFixed(1)}</text>
        <text x="${toPx(effX)}" y="${H - padB + 18}" text-anchor="middle" font-size="11" font-weight="700" fill="${C.navy}">${effX.toFixed(1)}</text>
        <line x1="${padL}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="${statusColor}" stroke-dasharray="4 3" stroke-width="1.4"/>
        <line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${H - padB}" stroke="${statusColor}" stroke-dasharray="4 3" stroke-width="1.4"/>
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="7" fill="${statusColor}" stroke="#fff" stroke-width="2"/>
        <text x="${Math.min(W - padR - 110, px + 10).toFixed(1)}" y="${Math.max(padT + 14, py - 8).toFixed(1)}" font-size="12" font-weight="700" fill="${statusColor}" paint-order="stroke" stroke="#ffffff" stroke-width="4" stroke-linejoin="round">Ponto (${ptX.toFixed(1)}; ${ptY.toFixed(1)})</text>
        <text x="${padL + cw / 2}" y="${H - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.slate}">${esc(cfg.xLabel || "Bem X")}</text>
        <text x="18" y="${padT + ch / 2}" text-anchor="middle" transform="rotate(-90 18 ${padT + ch / 2})" font-size="12" font-weight="700" fill="${C.slate}">${esc(cfg.yLabel || "Bem Y")}</text>
      </svg>`;
  }

  /**
   * Plota curvas lineares de Demanda e/ou Oferta com interseção e área de excesso.
   */
  function renderMarketGraph(container, cfg) {
    if (!container) return;
    const W = 620, H = 320, padL = 62, padR = 28, padT = 26, padB = 46;
    const cw = W - padL - padR;
    const ch = H - padT - padB;
    const maxQ = Math.max(50, cfg.maxQ || 600);
    const maxP = Math.max(10, cfg.maxP || 120);

    const toPx = (q) => padL + (Math.max(0, Math.min(maxQ, q)) / maxQ) * cw;
    const toPy = (p) => padT + ch - (Math.max(0, Math.min(maxP, p)) / maxP) * ch;

    let svg = `<rect width="${W}" height="${H}" fill="${C.bg}" rx="6"/>`;
    for (let i = 1; i <= 4; i++) {
      const y = padT + (ch * i) / 5;
      const x = padL + (cw * i) / 5;
      svg += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="${C.grid}" stroke-dasharray="3 3"/>`;
      svg += `<line x1="${x.toFixed(1)}" y1="${padT}" x2="${x.toFixed(1)}" y2="${H - padB}" stroke="${C.grid}" stroke-dasharray="3 3"/>`;
    }

    // Optional shaded disequilibrium band
    if (cfg.testP !== undefined && cfg.qdAtP !== undefined && cfg.qoAtP !== undefined) {
      const pyTest = toPy(cfg.testP);
      const qLow = Math.min(cfg.qdAtP, cfg.qoAtP);
      const qHigh = Math.max(cfg.qdAtP, cfg.qoAtP);
      const x1 = toPx(qLow);
      const x2 = toPx(qHigh);
      const excess = cfg.qoAtP - cfg.qdAtP;
      if (Math.abs(excess) > 0.5) {
        const bandColor = excess > 0 ? "#D9A65B" : "#B91C1C";
        svg += `<line x1="${padL}" y1="${pyTest.toFixed(1)}" x2="${W - padR}" y2="${pyTest.toFixed(1)}" stroke="${bandColor}" stroke-width="1.8" stroke-dasharray="5 3"/>`;
        svg += `<rect x="${x1.toFixed(1)}" y="${(pyTest - 6).toFixed(1)}" width="${Math.max(2, x2 - x1).toFixed(1)}" height="12" fill="${bandColor}" opacity="0.28" rx="3"/>`;
        svg += `<circle cx="${toPx(cfg.qdAtP).toFixed(1)}" cy="${pyTest.toFixed(1)}" r="4.5" fill="${C.brand}"/>`;
        svg += `<circle cx="${toPx(cfg.qoAtP).toFixed(1)}" cy="${pyTest.toFixed(1)}" r="4.5" fill="${C.teal}"/>`;
      }
    }

    // Draw arbitrary segment curves [{p1,q1,p2,q2,color,label,dashed}]
    (cfg.curves || []).forEach((cv) => {
      const x1 = toPx(cv.q1), y1 = toPy(cv.p1), x2 = toPx(cv.q2), y2 = toPy(cv.p2);
      svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${cv.color || C.brand}" stroke-width="${cv.dashed ? 2.4 : 3.2}" ${cv.dashed ? 'stroke-dasharray="7 4"' : ""}/>`;
      if (cv.label) {
        const lx = cv.labelAt === "start" ? x1 + 6 : x2 - 6;
        const ly = cv.labelAt === "start" ? y1 + 14 : y2 - 6;
        svg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="11.5" font-weight="700" fill="${cv.color || C.brand}">${esc(cv.label)}</text>`;
      }
    });

    // Optional Equilibrium dot
    if (cfg.eq && cfg.eq.p >= 0 && cfg.eq.q >= 0 && cfg.eq.q <= maxQ && cfg.eq.p <= maxP) {
      const ex = toPx(cfg.eq.q), ey = toPy(cfg.eq.p);
      svg += `<line x1="${padL}" y1="${ey.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${C.slate}" stroke-dasharray="3 3"/>`;
      svg += `<line x1="${ex.toFixed(1)}" y1="${ey.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${H - padB}" stroke="${C.slate}" stroke-dasharray="3 3"/>`;
      svg += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="6.5" fill="${C.navy}" stroke="#fff" stroke-width="2"/>`;
      svg += `<text x="${(ex + 9).toFixed(1)}" y="${(ey - 8).toFixed(1)}" font-size="11.5" font-weight="700" fill="${C.navy}" paint-order="stroke" stroke="#ffffff" stroke-width="4" stroke-linejoin="round">E (Pe=${cfg.eq.p.toFixed(1)}; Qe=${cfg.eq.q.toFixed(0)})</text>`;
    }

    // Optional marker point
    if (cfg.point) {
      const mx = toPx(cfg.point.q), my = toPy(cfg.point.p);
      svg += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="6" fill="${C.gold}" stroke="${C.navy}" stroke-width="2"/>`;
      svg += `<text x="${(mx + 8).toFixed(1)}" y="${(my - 8).toFixed(1)}" font-size="11" font-weight="700" fill="${C.navy}">${esc(cfg.point.label || "")}</text>`;
    }

    // Axes & Ticks
    svg += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="${C.navy}" stroke-width="2"/>`;
    svg += `<line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="${C.navy}" stroke-width="2"/>`;
    svg += `<text x="${padL - 8}" y="${padT + 6}" text-anchor="end" font-size="10.5" fill="${C.muted}">${maxP.toFixed(0)}</text>`;
    svg += `<text x="${padL - 8}" y="${H - padB + 4}" text-anchor="end" font-size="10.5" fill="${C.muted}">0</text>`;
    svg += `<text x="${W - padR}" y="${H - padB + 16}" text-anchor="end" font-size="10.5" fill="${C.muted}">${maxQ.toFixed(0)}</text>`;
    svg += `<text x="${padL + cw / 2}" y="${H - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="${C.slate}">${esc(cfg.xLabel || "Quantidade (Q)")}</text>`;
    svg += `<text x="18" y="${padT + ch / 2}" text-anchor="middle" transform="rotate(-90 18 ${padT + ch / 2})" font-size="12" font-weight="700" fill="${C.slate}">${esc(cfg.yLabel || "Preço (R$)")}</text>`;

    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico Econômico de Mercado">${svg}</svg>`;
  }

  /**
   * Gráfico horizontal de barras comparativas (PIB, HHI, Cenários, Elasticidade, Margens).
   */
  function renderBars(container, items, opts) {
    if (!container || !items || !items.length) return;
    opts = opts || {};
    const W = 620;
    const rowH = 38;
    const padL = opts.labelWidth || 165;
    const padR = 95;
    const padT = 18;
    const padB = 22;
    const H = padT + padB + items.length * rowH;
    const maxAbs = Math.max(1, ...items.map((it) => Math.abs(it.value)));
    const hasNeg = items.some((it) => it.value < 0);
    const cw = W - padL - padR;
    const zeroX = hasNeg ? padL + cw * 0.42 : padL;
    const posScale = hasNeg ? (cw * 0.58) / maxAbs : cw / maxAbs;
    const negScale = hasNeg ? (cw * 0.42) / maxAbs : posScale;

    let rows = "";
    items.forEach((it, idx) => {
      const y = padT + idx * rowH + 6;
      const barH = 22;
      const val = it.value || 0;
      const bw = Math.max(2, Math.abs(val) * (val >= 0 ? posScale : negScale));
      const bx = val >= 0 ? zeroX : zeroX - bw;
      const col = it.color || (val >= 0 ? C.brand : C.crimson);
      const tx = val >= 0 ? bx + bw + 6 : Math.max(padL + 2, bx - 6);
      const anchor = val >= 0 ? "start" : "end";
      rows += `<text x="${padL - 8}" y="${y + 15}" text-anchor="end" font-size="12" font-weight="700" fill="${C.navy}">${esc(it.label)}</text>`;
      rows += `<rect x="${bx.toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="${barH}" fill="${col}" rx="4" opacity="0.92"/>`;
      rows += `<text x="${tx.toFixed(1)}" y="${y + 15}" text-anchor="${anchor}" font-size="11.5" font-weight="700" fill="${C.navy}">${esc(it.display || val.toFixed(2))}</text>`;
    });

    const axisLine = `<line x1="${zeroX.toFixed(1)}" y1="${padT - 4}" x2="${zeroX.toFixed(1)}" y2="${H - padB + 4}" stroke="${C.slate}" stroke-width="1.5"/>`;
    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparativo em Barras">${axisLine}${rows}</svg>`;
  }

  /**
   * Barra empilhada de composição (Spread Bancário, Orçamento, Cadeia de Valor Agregado).
   */
  function renderStackedBar(container, segments, subtitle) {
    if (!container || !segments || !segments.length) return;
    const W = 620, H = 112, padL = 18, padR = 18, barY = 26, barH = 34;
    const total = Math.max(0.0001, segments.reduce((acc, s) => acc + Math.max(0, s.value), 0));
    const cw = W - padL - padR;

    let x = padL;
    let bars = "", leg = "";
    let legX = padL;
    segments.forEach((s) => {
      const w = (Math.max(0, s.value) / total) * cw;
      bars += `<rect x="${x.toFixed(1)}" y="${barY}" width="${w.toFixed(1)}" height="${barH}" fill="${s.color || C.brand}" stroke="#fff" stroke-width="1"/>`;
      if (w > 46) {
        bars += `<text x="${(x + w / 2).toFixed(1)}" y="${barY + 21}" text-anchor="middle" font-size="11" font-weight="700" fill="${s.textColor || "#fff"}">${esc(s.short || s.value.toFixed(1))}</text>`;
      }
      x += w;
      leg += `<rect x="${legX}" y="76" width="11" height="11" rx="2" fill="${s.color || C.brand}"/>`;
      leg += `<text x="${legX + 15}" y="86" font-size="11" font-weight="600" fill="${C.navy}">${esc(s.label)}</text>`;
      legX += Math.max(125, cw / segments.length);
    });

    const sub = subtitle ? `<text x="${padL}" y="16" font-size="11.5" font-weight="700" fill="${C.slate}">${esc(subtitle)}</text>` : "";
    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Composição Empilhada">${sub}${bars}${leg}</svg>`;
  }

  return { C, renderFPP, renderMarketGraph, renderBars, renderStackedBar };
})();
