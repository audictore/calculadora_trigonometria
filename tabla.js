// tabla.js — Tabla trigonométrica y calculadoras
(function () {
    'use strict';

    const $ = id => document.getElementById(id);

    // ══════════════════════════════════════════════════════════════
    // VISUALIZACIÓN ANIMADA — Circunferencia Unitaria
    // ══════════════════════════════════════════════════════════════
    (function initUnitCircle() {
        const canvas = $('unit-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let playing = false;
        let angle   = 0;    // grados — arranca desde 0
        let speed   = 0.7;  // grados/frame (~8.6 s por vuelta a 60 fps)
        let rafId   = null;

        // Paleta de colores (una por función)
        const C = {
            sen:    '#38bdf8',
            cos:    '#4ade80',
            tan:    '#fbbf24',
            cot:    '#a78bfa',
            sec:    '#f472b6',
            csc:    '#fb923c',
            axis:   'rgba(148,163,184,0.55)',
            circle: 'rgba(148,163,184,0.35)',
            radius: 'rgba(226,232,240,0.45)',
        };

        // ── Helpers de canvas ──────────────────────────────────────
        function line(x1, y1, x2, y2, color, width, dash = []) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.setLineDash(dash);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();
        }

        function dot(x, y, r, fill, stroke, sw = 2) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); }
            ctx.restore();
        }

        function txt(text, x, y, color, size, align = 'center', baseline = 'middle') {
            ctx.save();
            ctx.fillStyle = color;
            ctx.font = `700 ${size}px -apple-system, system-ui, sans-serif`;
            ctx.textAlign = align;
            ctx.textBaseline = baseline;
            ctx.fillText(text, x, y);
            ctx.restore();
        }

        // ── Dibujo principal ───────────────────────────────────────
        function draw(deg) {
            const W = canvas.width, H = canvas.height;
            const cx = W / 2, cy = H / 2;
            const R  = Math.min(W, H) * 0.32;  // radio en píxeles = 1 unidad
            const PAD = 28;

            const θ    = deg * Math.PI / 180;
            const sinθ = Math.sin(θ);
            const cosθ = Math.cos(θ);
            const tanθ = sinθ / cosθ;
            const cotθ = cosθ / sinθ;

            // Coordenadas clave (canvas: y crece hacia abajo)
            const Px = cx + R * cosθ,   Py = cy - R * sinθ;  // punto P en circunferencia
            const Fx = Px,              Fy = cy;              // pie de perpendicular (en eje x)
            const TanX = cx + R,        TanY = cy - R * tanθ; // intersección línea tan (x=1)
            const CotX = cx + R * cotθ, CotY = cy - R;        // intersección línea cot (y=1)

            const MAXV    = 7;
            const showTan = Math.abs(cosθ) > 0.06 && Math.abs(tanθ) < MAXV;
            const showCot = Math.abs(sinθ) > 0.06 && Math.abs(cotθ) < MAXV;

            // ── Limpiar ─────────────────────────────────────────────
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, W, H);

            // ── Líneas de referencia punteadas (x=1, y=1) ──────────
            if (showTan)
                line(TanX, PAD, TanX, H - PAD, 'rgba(251,191,36,0.18)', 1, [5, 5]);
            if (showCot)
                line(PAD, CotY, W - PAD, CotY, 'rgba(167,139,250,0.18)', 1, [5, 5]);

            // ── Ejes ────────────────────────────────────────────────
            line(PAD, cy, W - PAD, cy, C.axis, 1.5);
            line(cx, PAD, cx, H - PAD, C.axis, 1.5);

            // Flechas de ejes
            ctx.save();
            ctx.fillStyle = C.axis;
            // flecha +x
            ctx.beginPath();
            ctx.moveTo(W - PAD + 9, cy);
            ctx.lineTo(W - PAD,     cy - 5);
            ctx.lineTo(W - PAD,     cy + 5);
            ctx.fill();
            // flecha +y
            ctx.beginPath();
            ctx.moveTo(cx,     PAD - 9);
            ctx.lineTo(cx - 5, PAD);
            ctx.lineTo(cx + 5, PAD);
            ctx.fill();
            ctx.restore();

            txt('x', W - PAD + 16, cy,       C.axis, 12);
            txt('y', cx,           PAD - 18, C.axis, 12);

            // Marcas en ±1
            const dim = 'rgba(148,163,184,0.4)';
            txt('1',  cx + R + 4,  cy + 15, dim, 10);
            txt('−1', cx - R - 4,  cy + 15, dim, 10);
            txt('1',  cx + 9,      cy - R,  dim, 10, 'left');
            txt('−1', cx + 9,      cy + R,  dim, 10, 'left');
            txt('O',  cx - 13,     cy + 13, dim, 11);

            // ── Circunferencia unitaria ─────────────────────────────
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.strokeStyle = C.circle;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();

            // ── Segmentos (orden: sec/csc detrás, encima los demás) ─

            // sec: origen → (x=1, tan θ)
            if (showTan) line(cx, cy, TanX, TanY, C.sec, 2.2);
            // csc: origen → (cot θ, y=1)
            if (showCot) line(cx, cy, CotX, CotY, C.csc, 2.2);

            // cos: origen → pie perpendicular (eje x)
            line(cx, cy, Fx, Fy, C.cos, 3.8);

            // sin: pie → P
            line(Fx, Fy, Px, Py, C.sen, 3.8);

            // tan: (x=1, 0) → (x=1, tan θ)
            if (showTan) line(TanX, cy, TanX, TanY, C.tan, 3.8);

            // cot: (0, y=1) → (cot θ, y=1)
            if (showCot) line(cx, CotY, CotX, CotY, C.cot, 3.8);

            // Radio (línea fino, detrás del punto P)
            line(cx, cy, Px, Py, C.radius, 1.5);

            // ── Marcador ángulo recto en pie ────────────────────────
            if (Math.abs(sinθ) > 0.07 && Math.abs(cosθ) > 0.07) {
                const sq = 8;
                const sqX = cosθ >= 0 ? -sq : 0;
                const sqY = sinθ >= 0 ? -sq : 0;
                ctx.save();
                ctx.strokeStyle = 'rgba(148,163,184,0.4)';
                ctx.lineWidth = 1;
                ctx.setLineDash([]);
                ctx.strokeRect(Fx + sqX, Fy + sqY, sq, sq);
                ctx.restore();
            }

            // ── Arco del ángulo ─────────────────────────────────────
            if (Math.abs(deg % 360) > 1) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, R * 0.18, 0, -θ, true);
                ctx.strokeStyle = 'rgba(251,191,36,0.6)';
                ctx.lineWidth = 1.8;
                ctx.setLineDash([]);
                ctx.stroke();
                ctx.restore();
            }

            // Etiqueta del ángulo (sobre la bisectriz del arco)
            {
                const lr  = R * 0.30;
                const mid = -(θ / 2);
                txt(deg.toFixed(1) + '°',
                    cx + lr * Math.cos(mid),
                    cy + lr * Math.sin(mid),
                    'rgba(251,191,36,0.85)', 11);
            }

            // ── Etiquetas de funciones ──────────────────────────────
            if (Math.abs(sinθ) > 0.1) {
                txt('sen',
                    Px + (cosθ >= 0 ? 24 : -24),
                    (Py + Fy) / 2,
                    C.sen, 13);
            }
            if (Math.abs(cosθ) > 0.1) {
                txt('cos',
                    (cx + Fx) / 2,
                    cy + (sinθ >= 0 ? 18 : -18),
                    C.cos, 13);
            }
            if (showTan && Math.abs(tanθ) > 0.08) {
                txt('tan', TanX + 24, (cy + TanY) / 2, C.tan, 13);
            }
            if (showTan) {
                // sec: a lo largo del segmento, desplazado perpendicular
                const mx = (cx + TanX) / 2, my = (cy + TanY) / 2;
                const dx = TanX - cx, dy = TanY - cy;
                const ln = Math.hypot(dx, dy) || 1;
                txt('sec', mx + (-dy / ln) * 15, my + (dx / ln) * 15, C.sec, 11);
            }
            if (showCot && Math.abs(cotθ) > 0.08) {
                txt('cot', (cx + CotX) / 2, CotY + (sinθ >= 0 ? -18 : 18), C.cot, 13);
            }
            if (showCot) {
                const mx = (cx + CotX) / 2, my = (cy + CotY) / 2;
                const dx = CotX - cx, dy = CotY - cy;
                const ln = Math.hypot(dx, dy) || 1;
                txt('csc', mx + (-dy / ln) * 15, my + (dx / ln) * 15, C.csc, 11);
            }

            // ── Punto P ─────────────────────────────────────────────
            dot(Px, Py, 7, '#fff', C.sen, 2.5);
            // Puntos de intersección de tan y cot
            if (showTan) dot(TanX, TanY, 5, C.tan, '#0f172a', 1.5);
            if (showCot) dot(CotX, CotY, 5, C.cot, '#0f172a', 1.5);

            // Etiqueta P
            const plx = Px + (cosθ >= 0 ? 14 : -14);
            const ply = Py + (sinθ >= 0 ? -14 : 14);
            txt('P', plx, ply, '#e2e8f0', 13);
        }

        // ══════════════════════════════════════════════════════════════
        // GRÁFICAS DE ONDA — una por cada función
        // ══════════════════════════════════════════════════════════════
        const WAVES = [
            { id: 'wc-tan', label: 'y = tan(x)', color: '#fbbf24',
              fn: r => Math.sin(r) / Math.cos(r),  yRange: 4.5,
              yTicks: [-4, -2, -1, 1, 2, 4],       asyms: [90, 270] },
            { id: 'wc-cot', label: 'y = cot(x)', color: '#a78bfa',
              fn: r => Math.cos(r) / Math.sin(r),  yRange: 4.5,
              yTicks: [-4, -2, -1, 1, 2, 4],       asyms: [0, 180, 360] },
            { id: 'wc-sec', label: 'y = sec(x)', color: '#f472b6',
              fn: r => 1 / Math.cos(r),            yRange: 4.5,
              yTicks: [-4, -2, -1, 1, 2, 4],       asyms: [90, 270] },
            { id: 'wc-csc', label: 'y = csc(x)', color: '#fb923c',
              fn: r => 1 / Math.sin(r),            yRange: 4.5,
              yTicks: [-4, -2, -1, 1, 2, 4],       asyms: [0, 180, 360] },
        ];

        function drawWave(cfg, currentDeg) {
            const wc = document.getElementById(cfg.id);
            if (!wc) return;
            const wctx = wc.getContext('2d');
            const W = wc.width, H = wc.height;

            const ML = 44, MR = 14, MT = 18, MB = 28;
            const pw = W - ML - MR;   // ancho del área de trazado
            const ph = H - MT - MB;   // alto del área de trazado

            const mapX = d   => ML + (d / 360) * pw;
            const mapY = yv  => MT + (1 - (yv + cfg.yRange) / (2 * cfg.yRange)) * ph;

            const CLIP = cfg.yRange * 1.15;

            // ── Fondo ────────────────────────────────────────────────
            wctx.fillStyle = '#0a1628';
            wctx.fillRect(0, 0, W, H);

            // ── Área de trazado (fondo ligeramente más claro) ────────
            wctx.fillStyle = 'rgba(255,255,255,0.015)';
            wctx.fillRect(ML, MT, pw, ph);

            // ── Líneas horizontales de cuadrícula + etiquetas Y ──────
            cfg.yTicks.forEach(yv => {
                const ypx = mapY(yv);
                wctx.save();
                wctx.setLineDash([3, 5]);
                wctx.strokeStyle = 'rgba(148,163,184,0.18)';
                wctx.lineWidth = 1;
                wctx.beginPath();
                wctx.moveTo(ML, ypx);
                wctx.lineTo(W - MR, ypx);
                wctx.stroke();
                wctx.setLineDash([]);
                wctx.fillStyle = 'rgba(148,163,184,0.6)';
                wctx.font = '600 9px -apple-system, system-ui, sans-serif';
                wctx.textAlign = 'right';
                wctx.textBaseline = 'middle';
                wctx.fillText(yv, ML - 5, ypx);
                wctx.restore();
            });

            // ── Líneas verticales de cuadrícula + etiquetas X ────────
            [0, 90, 180, 270, 360].forEach(xv => {
                const xpx = mapX(xv);
                wctx.save();
                wctx.setLineDash([3, 5]);
                wctx.strokeStyle = 'rgba(148,163,184,0.18)';
                wctx.lineWidth = 1;
                wctx.beginPath();
                wctx.moveTo(xpx, MT);
                wctx.lineTo(xpx, MT + ph);
                wctx.stroke();
                wctx.setLineDash([]);
                wctx.fillStyle = 'rgba(148,163,184,0.6)';
                wctx.font = '600 9px -apple-system, system-ui, sans-serif';
                wctx.textAlign = 'center';
                wctx.textBaseline = 'top';
                wctx.fillText(xv + '°', xpx, MT + ph + 4);
                wctx.restore();
            });

            // ── Asíntotas (líneas rojas punteadas) ───────────────────
            cfg.asyms.forEach(xv => {
                if (xv === 0 || xv === 360) return; // evitar solapar con ejes
                const xpx = mapX(xv);
                wctx.save();
                wctx.setLineDash([5, 4]);
                wctx.strokeStyle = 'rgba(248,113,113,0.4)';
                wctx.lineWidth = 1;
                wctx.beginPath();
                wctx.moveTo(xpx, MT);
                wctx.lineTo(xpx, MT + ph);
                wctx.stroke();
                wctx.restore();
            });

            // ── Ejes ─────────────────────────────────────────────────
            const yZero = mapY(0);
            wctx.save();
            wctx.setLineDash([]);
            wctx.strokeStyle = 'rgba(148,163,184,0.55)';
            wctx.lineWidth = 1.5;
            // Eje X (y = 0)
            if (yZero >= MT && yZero <= MT + ph) {
                wctx.beginPath();
                wctx.moveTo(ML, yZero);
                wctx.lineTo(W - MR, yZero);
                wctx.stroke();
            }
            // Eje Y (x = 0°)
            wctx.beginPath();
            wctx.moveTo(ML, MT);
            wctx.lineTo(ML, MT + ph);
            wctx.stroke();
            wctx.restore();

            // ── Helper: trazar segmento de curva ─────────────────────
            function traceCurve(d0, d1) {
                let pYv = null, iPath = false;
                wctx.beginPath();
                for (let d = d0; d <= d1 + 0.01; d += 0.5) {
                    const r  = d * Math.PI / 180;
                    const yv = cfg.fn(r);
                    if (!Number.isFinite(yv) || Math.abs(yv) > CLIP) {
                        pYv = null; iPath = false; continue;
                    }
                    if (pYv !== null && Math.abs(yv - pYv) > CLIP) {
                        pYv = null; iPath = false;
                    }
                    const xpx = mapX(d), ypx = mapY(yv);
                    if (!iPath) { wctx.moveTo(xpx, ypx); iPath = true; }
                    else        { wctx.lineTo(xpx, ypx); }
                    pYv = yv;
                }
                wctx.stroke();
            }

            // ── Onda fantasma — curva completa, muy tenue ─────────────
            wctx.save();
            wctx.beginPath();
            wctx.rect(ML, MT, pw, ph);
            wctx.clip();
            wctx.strokeStyle = cfg.color;
            wctx.lineWidth   = 1.2;
            wctx.globalAlpha = 0.12;
            wctx.setLineDash([]);
            wctx.lineJoin    = 'round';
            traceCurve(0, 360);
            wctx.globalAlpha = 1;
            wctx.restore();

            // ── Onda activa — se va trazando de 0° al ángulo actual ───
            wctx.save();
            wctx.beginPath();
            wctx.rect(ML, MT, pw, ph);
            wctx.clip();
            wctx.strokeStyle = cfg.color;
            wctx.lineWidth   = 2.5;
            wctx.setLineDash([]);
            wctx.lineJoin    = 'round';
            wctx.lineCap     = 'round';
            traceCurve(0, currentDeg);
            wctx.restore();

            // ── Cruceta del ángulo actual ────────────────────────────
            const cxpx  = mapX(currentDeg);
            const curR  = currentDeg * Math.PI / 180;
            const curYv = cfg.fn(curR);
            const valid = Number.isFinite(curYv) && Math.abs(curYv) <= CLIP;

            // Línea VERTICAL (dorada) — siempre visible dentro del área
            wctx.save();
            wctx.beginPath();
            wctx.rect(ML, MT, pw, ph);
            wctx.clip();
            wctx.setLineDash([5, 4]);
            wctx.strokeStyle = 'rgba(251,191,36,0.80)';
            wctx.lineWidth = 1.5;
            wctx.beginPath();
            wctx.moveTo(cxpx, MT);
            wctx.lineTo(cxpx, MT + ph);
            wctx.stroke();
            wctx.restore();

            // Triángulo marcador en eje X (debajo del gráfico)
            wctx.save();
            wctx.fillStyle = 'rgba(251,191,36,0.85)';
            wctx.beginPath();
            wctx.moveTo(cxpx, MT + ph);
            wctx.lineTo(cxpx - 5, MT + ph + 6);
            wctx.lineTo(cxpx + 5, MT + ph + 6);
            wctx.closePath();
            wctx.fill();
            wctx.restore();

            if (valid) {
                const cypx = mapY(curYv);

                // Línea HORIZONTAL (color función) — del eje Y al punto
                wctx.save();
                wctx.beginPath();
                wctx.rect(ML, MT, pw, ph);
                wctx.clip();
                wctx.setLineDash([5, 4]);
                wctx.globalAlpha = 0.65;
                wctx.strokeStyle = cfg.color;
                wctx.lineWidth = 1.5;
                wctx.beginPath();
                wctx.moveTo(ML, cypx);
                wctx.lineTo(cxpx, cypx);
                wctx.stroke();
                wctx.globalAlpha = 1;
                wctx.restore();

                // Triángulo marcador en eje Y (izquierda del gráfico)
                wctx.save();
                wctx.fillStyle = cfg.color;
                wctx.globalAlpha = 0.85;
                wctx.beginPath();
                wctx.moveTo(ML, cypx);
                wctx.lineTo(ML - 7, cypx - 4);
                wctx.lineTo(ML - 7, cypx + 4);
                wctx.closePath();
                wctx.fill();
                wctx.globalAlpha = 1;
                wctx.restore();

                // Halo del círculo
                wctx.save();
                wctx.beginPath();
                wctx.arc(cxpx, cypx, 11, 0, Math.PI * 2);
                wctx.fillStyle = cfg.color;
                wctx.globalAlpha = 0.18;
                wctx.fill();
                wctx.globalAlpha = 1;
                wctx.restore();

                // Círculo principal
                wctx.save();
                wctx.beginPath();
                wctx.arc(cxpx, cypx, 6, 0, Math.PI * 2);
                wctx.fillStyle = cfg.color;
                wctx.fill();
                wctx.strokeStyle = '#0a1628';
                wctx.lineWidth = 2;
                wctx.stroke();
                wctx.restore();

                // Etiqueta del valor actual (X: ángulo, Y: valor)
                const valTxt  = curYv.toFixed(3);
                const goRight = currentDeg < 295;
                // Posición: encima o debajo según dónde hay espacio
                const lblOffY = cypx < MT + ph * 0.5 ? 14 : -14;
                const lblX    = cxpx + (goRight ? 10 : -10);
                const lblY    = cypx + lblOffY;
                wctx.save();
                // Fondo pequeño para legibilidad
                wctx.font = '700 10px -apple-system, system-ui, sans-serif';
                wctx.textAlign   = goRight ? 'left' : 'right';
                wctx.textBaseline = 'middle';
                const tw = wctx.measureText(valTxt).width;
                const tx = goRight ? lblX : lblX - tw;
                wctx.fillStyle = 'rgba(10,22,40,0.75)';
                wctx.fillRect(tx - 2, lblY - 7, tw + 4, 14);
                wctx.fillStyle = cfg.color;
                wctx.fillText(valTxt, lblX, lblY);
                wctx.restore();
            }
        }

        // ══════════════════════════════════════════════════════════════
        // PROYECCIÓN ANIMADA — sen θ y cos θ (canvas integrado)
        // ══════════════════════════════════════════════════════════════
        function drawSinCosProjection(deg) {
            const wc = document.getElementById('sc-canvas');
            if (!wc) return;
            const wctx = wc.getContext('2d');
            const W = wc.width, H = wc.height;

            // ── Layout ────────────────────────────────────────────────
            const CX = 178, CY = 198, R = 118;   // centro y radio del círculo
            const SX = CX + R;                    // x inicio onda sen (borde derecho círculo)
            const SY = CY + R;                    // y inicio onda cos (borde inferior círculo)
            const SW = W - SX - 14;               // ancho onda sen (px para 0→2π)
            const SH = H - SY - 18;               // alto  onda cos (px para 0→2π)

            const θ    = deg * Math.PI / 180;
            const sinθ = Math.sin(θ);
            const cosθ = Math.cos(θ);

            // Mapeos: ángulo/valor → píxel
            const sinMapX = t => SX + t / (2 * Math.PI) * SW;
            const sinMapY = v => CY - v * R;
            const cosMapX = v => CX + v * R;
            const cosMapY = t => SY + t / (2 * Math.PI) * SH;

            // Puntos clave
            const Px    = CX + R * cosθ,  Py    = CY - R * sinθ;
            const cSinX = sinMapX(θ),      cSinY = sinMapY(sinθ);
            const cCosX = cosMapX(cosθ),   cCosY = cosMapY(θ);

            // Paleta
            const WAVE = '#f5d142';
            const CIRC = '#dc3a4f';
            const AX   = 'rgba(90,140,190,0.72)';
            const GRID = 'rgba(90,140,190,0.12)';
            const DASH = 'rgba(255,255,255,0.30)';

            // ── Helpers locales ───────────────────────────────────────
            function wl(x1,y1,x2,y2,col,lw=1,dash=[]) {
                wctx.save(); wctx.strokeStyle=col; wctx.lineWidth=lw;
                wctx.setLineDash(dash); wctx.lineCap='round';
                wctx.beginPath(); wctx.moveTo(x1,y1); wctx.lineTo(x2,y2);
                wctx.stroke(); wctx.restore();
            }
            function wd(x,y,r,fill,stk=null,sw=2) {
                wctx.save(); wctx.beginPath(); wctx.arc(x,y,r,0,Math.PI*2);
                if(fill){wctx.fillStyle=fill; wctx.fill();}
                if(stk){wctx.strokeStyle=stk; wctx.lineWidth=sw; wctx.stroke();}
                wctx.restore();
            }
            function wt(txt,x,y,col,sz=10,align='center',base='middle') {
                wctx.save(); wctx.fillStyle=col;
                wctx.font=`600 ${sz}px 'Courier New',monospace`;
                wctx.textAlign=align; wctx.textBaseline=base;
                wctx.fillText(txt,x,y); wctx.restore();
            }

            // ── Fondo ─────────────────────────────────────────────────
            wctx.fillStyle = '#050d1a';
            wctx.fillRect(0, 0, W, H);

            // ── Ejes del círculo (se extienden hasta las ondas) ───────
            wl(14,  CY, SX,  CY, AX, 1.2);   // horizontal izq→borde círculo
            wl(CX,  14, CX,  SY, AX, 1.2);   // vertical   arr→borde círculo

            // ── Ejes onda sen (derecha) ───────────────────────────────
            // Eje θ (horizontal, en y=CY)
            wl(SX, CY, SX+SW+10, CY, AX, 1.2);
            // Eje valor (vertical, en x=SX)
            wl(SX, CY-R-16, SX, CY+R+12, AX, 1.2);
            // Marcas θ en π/2, π, 3π/2, 2π
            [['π/2',Math.PI/2],['π',Math.PI],['3π/2',3*Math.PI/2],['2π',2*Math.PI]].forEach(([lbl,t]) => {
                const tx = sinMapX(t);
                wl(tx, CY-R, tx, CY+R, GRID, 1, [3,4]);
                wl(tx, CY-5, tx, CY+5, AX, 1);
                wt(lbl, tx, CY+17, AX, 9);
            });
            // Marcas valor ±1
            [-1,1].forEach(v => {
                const ty = sinMapY(v);
                wl(SX, ty, SX+SW, ty, GRID, 1, [3,4]);
                wl(SX-5, ty, SX+5, ty, AX, 1);
                wt(String(v), SX-9, ty, AX, 9, 'right');
            });
            // Etiqueta "sen θ"
            wt('sen θ', SX+SW/2, CY-R-8, WAVE, 13);

            // ── Ejes onda cos (abajo) ─────────────────────────────────
            // Eje θ (vertical, en x=CX)
            wl(CX, SY, CX, SY+SH+10, AX, 1.2);
            // Eje valor (horizontal, en y=SY)
            wl(CX-R-16, SY, CX+R+12, SY, AX, 1.2);
            // Marcas θ en π/2, π, 3π/2, 2π
            [['π/2',Math.PI/2],['π',Math.PI],['3π/2',3*Math.PI/2],['2π',2*Math.PI]].forEach(([lbl,t]) => {
                const ty = cosMapY(t);
                wl(CX-R, ty, CX+R, ty, GRID, 1, [3,4]);
                wl(CX-5, ty, CX+5, ty, AX, 1);
                wt(lbl, CX-9, ty, AX, 9, 'right');
            });
            // Marcas valor ±1
            [-1,1].forEach(v => {
                const tx = cosMapX(v);
                wl(tx, SY, tx, SY+SH, GRID, 1, [3,4]);
                wl(tx, SY-5, tx, SY+5, AX, 1);
                wt(String(v), tx, SY+14, AX, 9);
            });
            // Etiqueta "cos θ"
            wt('cos θ', CX+R+10, SY+14, WAVE, 13, 'left');

            // ── Circunferencia unitaria ────────────────────────────────
            wctx.save();
            wctx.beginPath(); wctx.arc(CX, CY, R, 0, 2*Math.PI);
            wctx.strokeStyle = CIRC; wctx.lineWidth = 2.2; wctx.stroke();
            wctx.restore();

            // Ticks ±1 en los ejes del círculo
            [[CX+R,CY],[CX-R,CY],[CX,CY-R],[CX,CY+R]].forEach(([x,y]) =>
                wd(x, y, 2.5, AX));

            // ── Onda fantasma (completa, muy tenue) ───────────────────
            function ghost(pts) {
                wctx.save(); wctx.globalAlpha=0.13;
                wctx.strokeStyle=WAVE; wctx.lineWidth=1.5;
                wctx.lineJoin='round'; wctx.setLineDash([]);
                wctx.beginPath();
                pts.forEach(([x,y],i)=> i===0?wctx.moveTo(x,y):wctx.lineTo(x,y));
                wctx.stroke(); wctx.globalAlpha=1; wctx.restore();
            }
            const sinPts=[], cosPts=[];
            for(let d=0;d<=360;d+=0.5){
                const t=d*Math.PI/180;
                sinPts.push([sinMapX(t), sinMapY(Math.sin(t))]);
                cosPts.push([cosMapX(Math.cos(t)), cosMapY(t)]);
            }
            ghost(sinPts); ghost(cosPts);

            // ── Onda activa (de 0° al ángulo actual) ──────────────────
            if (deg > 0.1) {
                function active(pts) {
                    wctx.save(); wctx.strokeStyle=WAVE; wctx.lineWidth=2.6;
                    wctx.lineJoin='round'; wctx.lineCap='round'; wctx.setLineDash([]);
                    wctx.beginPath();
                    pts.forEach(([x,y],i)=> i===0?wctx.moveTo(x,y):wctx.lineTo(x,y));
                    wctx.stroke(); wctx.restore();
                }
                const sinA=[], cosA=[];
                for(let d=0;d<=deg+0.01;d+=0.5){
                    const t=d*Math.PI/180;
                    sinA.push([sinMapX(t), sinMapY(Math.sin(t))]);
                    cosA.push([cosMapX(Math.cos(t)), cosMapY(t)]);
                }
                active(sinA); active(cosA);
            }

            // ── Líneas de proyección desde P ──────────────────────────
            // Horizontal: P → punto actual en onda sen (mismo Y)
            wl(Px, Py, cSinX, cSinY, DASH, 1.2, [6,4]);
            // Vertical:   P → punto actual en onda cos (mismo X)
            wl(Px, Py, cCosX, cCosY, DASH, 1.2, [6,4]);

            // ── Radio ─────────────────────────────────────────────────
            wl(CX, CY, Px, Py, 'rgba(220,232,245,0.50)', 1.5);

            // ── Punto P ───────────────────────────────────────────────
            wd(Px, Py, 13, 'rgba(251,191,36,0.18)');
            wd(Px, Py,  7, '#fbbf24', '#050d1a', 1.8);

            // ── Puntos en las ondas ───────────────────────────────────
            wd(cSinX, cSinY, 10, 'rgba(245,209,66,0.18)');
            wd(cSinX, cSinY,  5, WAVE, '#050d1a', 1.5);
            wd(cCosX, cCosY, 10, 'rgba(245,209,66,0.18)');
            wd(cCosX, cCosY,  5, WAVE, '#050d1a', 1.5);

            // ── Valores numéricos flotantes ───────────────────────────
            if (deg > 1) {
                // Valor del seno
                const sv = sinθ.toFixed(3);
                const sy_ok = cSinY > CY-R+14 && cSinY < CY+R-6;
                if (sy_ok) {
                    const sLblY = cSinY + (sinθ >= 0 ? 14 : -14);
                    wctx.save();
                    wctx.font='700 10px -apple-system,system-ui,sans-serif';
                    const tw=wctx.measureText(sv).width;
                    wctx.fillStyle='rgba(5,13,26,0.78)';
                    wctx.fillRect(cSinX+8, sLblY-7, tw+4, 14);
                    wctx.restore();
                    wt(sv, cSinX+10+tw/2, sLblY, WAVE, 10);
                }
                // Valor del coseno
                const cv = cosθ.toFixed(3);
                const cx_ok = cCosX > CX-R+14 && cCosX < CX+R-6;
                if (cx_ok) {
                    const cLblX = cCosX + (cosθ >= 0 ? 14 : -14);
                    wctx.save();
                    wctx.font='700 10px -apple-system,system-ui,sans-serif';
                    const tw=wctx.measureText(cv).width;
                    wctx.fillStyle='rgba(5,13,26,0.78)';
                    wctx.fillRect(cLblX-tw/2-2, cCosY-20, tw+4, 14);
                    wctx.restore();
                    wt(cv, cLblX, cCosY-13, WAVE, 10);
                }
            }

            // ── Arco del ángulo + etiqueta ────────────────────────────
            if (deg > 1) {
                wctx.save();
                wctx.beginPath();
                wctx.arc(CX, CY, R*0.20, 0, -θ, true);
                wctx.strokeStyle='rgba(251,191,36,0.65)';
                wctx.lineWidth=1.5; wctx.setLineDash([]);
                wctx.stroke(); wctx.restore();
                const lr=R*0.33, mid=-(θ/2);
                wt(deg.toFixed(0)+'°', CX+lr*Math.cos(mid), CY+lr*Math.sin(mid),
                   'rgba(251,191,36,0.85)', 10);
            }

            // Punto central O
            wd(CX, CY, 3, AX);
            wt('O', CX-12, CY+12, AX, 10);
        }

        // ── Actualizar tarjetas de valores ─────────────────────────
        function updateCards(deg) {
            const θ   = deg * Math.PI / 180;
            const sin = Math.sin(θ);
            const cos = Math.cos(θ);
            const tan = Math.abs(cos) < 1e-10 ? Infinity   : sin / cos;
            const cot = Math.abs(sin) < 1e-10 ? Infinity   : cos / sin;
            const sec = Math.abs(cos) < 1e-10 ? Infinity   : 1 / cos;
            const csc = Math.abs(sin) < 1e-10 ? Infinity   : 1 / sin;

            const fv = v => !Number.isFinite(v) ? '∞' : v.toFixed(4);
            const vals = { sen: sin, cos, tan, cot, sec, csc };

            Object.entries(vals).forEach(([fn, v]) => {
                const el = $(`v-${fn}`);
                if (!el) return;
                el.textContent = fv(v);
                el.style.color = v < 0 ? 'var(--error)' : '';
            });

            $('anim-deg-big').textContent   = deg.toFixed(1) + '°';
            $('anim-rad-small').textContent = (θ).toFixed(4) + ' rad';
        }

        // ── Refresh ────────────────────────────────────────────────
        function refresh(deg) {
            angle = ((deg % 360) + 360) % 360;
            $('angle-slider').value = angle;
            draw(angle);
            updateCards(angle);
            WAVES.forEach(w => drawWave(w, angle));
        }

        // ── Slider ─────────────────────────────────────────────────
        $('angle-slider').addEventListener('input', e => {
            if (playing) stop();
            refresh(parseFloat(e.target.value));
        });

        // ── Play / Pause ───────────────────────────────────────────
        function stop() {
            playing = false;
            cancelAnimationFrame(rafId);
            $('anim-play').textContent = '▶ Animar';
        }

        function start() {
            playing = true;
            $('anim-play').textContent = '⏸ Pausar';
            (function step() {
                if (!playing) return;
                angle = (angle + speed) % 360;
                $('angle-slider').value = angle;
                draw(angle);
                updateCards(angle);
                WAVES.forEach(w => drawWave(w, angle));
                rafId = requestAnimationFrame(step);
            })();
        }

        $('anim-play').addEventListener('click', () => playing ? stop() : start());

        // ── Velocidad ──────────────────────────────────────────────
        document.querySelectorAll('.spd-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.spd-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                speed = parseFloat(btn.dataset.speed);
            });
        });

        // ── Init — siempre en movimiento desde 0° ──────────────────
        angle = 0;
        start();
    })();
    // ══════════════════════════════════════════════════════════════
    const rad = d => d * Math.PI / 180;
    const degF = r => r * 180 / Math.PI;

    function fmtDec(v, d = 4) {
        if (!Number.isFinite(v)) return '∞';
        if (Math.abs(v) < 1e-12) return '0';
        return v.toFixed(d).replace(/\.?0+$/, '');
    }

    function fmtRad(d) {
        const r = rad(d);
        if (Math.abs(r) < 1e-12) return '0';
        return r.toFixed(4).replace(/\.?0+$/, '');
    }

    // ── Valores exactos ──────────────────────────────────────────────────
    const SQ2 = Math.SQRT2;          // √2 ≈ 1.41421
    const SQ3 = Math.sqrt(3);        // √3 ≈ 1.73205
    const S2H = SQ2 / 2;             // √2/2
    const S3H = SQ3 / 2;             // √3/2
    const S3O = 1 / SQ3;             // √3/3 = 1/√3
    const T2S = 2 / SQ3;             // 2√3/3

    // Diccionario de valores exactos: key → { html, val }
    const E = {
        '0':         { html: '0',         val: 0 },
        '1':         { html: '1',         val: 1 },
        '2':         { html: '2',         val: 2 },
        '½':         { html: '½',         val: 0.5 },
        '√2':        { html: '√2',        val: SQ2 },
        '√3':        { html: '√3',        val: SQ3 },
        '√2/2':      { html: '√2/2',      val: S2H },
        '√3/2':      { html: '√3/2',      val: S3H },
        '√3/3':      { html: '√3/3',      val: S3O },
        '2√3/3':     { html: '2√3/3',     val: T2S },
        '−1':        { html: '−1',        val: -1 },
        '−2':        { html: '−2',        val: -2 },
        '−½':        { html: '−½',        val: -0.5 },
        '−√2':       { html: '−√2',       val: -SQ2 },
        '−√3':       { html: '−√3',       val: -SQ3 },
        '−√2/2':     { html: '−√2/2',     val: -S2H },
        '−√3/2':     { html: '−√3/2',     val: -S3H },
        '−√3/3':     { html: '−√3/3',     val: -S3O },
        '−2√3/3':    { html: '−2√3/3',    val: -T2S },
        '∞':         { html: '∞',         val: Infinity },
    };

    // ── Tabla de ángulos especiales ──────────────────────────────────────
    // Cada fila: [grados, radianes (texto), sen, cos, tan, cot, sec, csc]
    const SPECIAL = [
        [0,   '0',    '0',      '1',      '0',      '∞',      '1',       '∞'      ],
        [30,  'π/6',  '½',      '√3/2',   '√3/3',   '√3',     '2√3/3',   '2'      ],
        [45,  'π/4',  '√2/2',   '√2/2',   '1',      '1',      '√2',      '√2'     ],
        [60,  'π/3',  '√3/2',   '½',      '√3',     '√3/3',   '2',       '2√3/3'  ],
        [90,  'π/2',  '1',      '0',      '∞',      '0',      '∞',       '1'      ],
        [120, '2π/3', '√3/2',   '−½',     '−√3',    '−√3/3',  '−2',      '2√3/3'  ],
        [135, '3π/4', '√2/2',   '−√2/2',  '−1',     '−1',     '−√2',     '√2'     ],
        [150, '5π/6', '½',      '−√3/2',  '−√3/3',  '−√3',    '−2√3/3',  '2'      ],
        [180, 'π',    '0',      '−1',     '0',      '∞',      '−1',      '∞'      ],
    ];

    function specCell(key) {
        const e = E[key];
        if (!e) return `<td class="sc-cell"><span class="sc-exact">?</span></td>`;
        const isInf = !Number.isFinite(e.val);
        const isNeg = e.val < 0;
        const cls = isInf ? 'sc-inf' : isNeg ? 'sc-neg' : '';
        const dec  = isInf ? '' : `<span class="sc-dec">${fmtDec(e.val)}</span>`;
        return `<td class="sc-cell"><span class="sc-exact ${cls}">${e.html}</span>${dec}</td>`;
    }

    (function buildSpecTable() {
        const tbody = $('spec-tbody');
        let html = '';
        SPECIAL.forEach(([deg, radTxt, sin, cos, tan, cot, sec, csc]) => {
            const special90 = deg === 90;
            html += `<tr class="${special90 ? 'row-90' : ''}">
                <td class="ang-cell"><strong>${deg}°</strong></td>
                <td class="rad-cell">${radTxt}</td>
                ${[sin, cos, tan, cot, sec, csc].map(specCell).join('')}
            </tr>`;
        });
        tbody.innerHTML = html;
    })();

    // ── Tabla de funciones inversas ──────────────────────────────────────
    // arcsen + arccos
    const INV_SINCOS = [
        { val: -1,    exact: '−1',   asin: -90, acos: 180 },
        { val: -S3H,  exact: '−√3/2', asin: -60, acos: 150 },
        { val: -S2H,  exact: '−√2/2', asin: -45, acos: 135 },
        { val: -0.5,  exact: '−½',   asin: -30, acos: 120 },
        { val: 0,     exact: '0',    asin: 0,   acos: 90  },
        { val: 0.5,   exact: '½',    asin: 30,  acos: 60  },
        { val: S2H,   exact: '√2/2', asin: 45,  acos: 45  },
        { val: S3H,   exact: '√3/2', asin: 60,  acos: 30  },
        { val: 1,     exact: '1',    asin: 90,  acos: 0   },
    ];

    // arctan
    const INV_TAN = [
        { val: -SQ3,  exact: '−√3',   atan: -60 },
        { val: -1,    exact: '−1',    atan: -45 },
        { val: -S3O,  exact: '−√3/3', atan: -30 },
        { val: 0,     exact: '0',     atan: 0   },
        { val: S3O,   exact: '√3/3',  atan: 30  },
        { val: 1,     exact: '1',     atan: 45  },
        { val: SQ3,   exact: '√3',    atan: 60  },
    ];

    (function buildInvTables() {
        // arcsen + arccos
        const tbody1 = $('inv-sincos-tbody');
        tbody1.innerHTML = INV_SINCOS.map(r => {
            const decVal = Math.abs(r.val) < 1e-12 ? '0' : r.val.toFixed(4).replace(/\.?0+$/, '');
            return `<tr>
                <td class="sc-cell"><span class="sc-dec">${decVal}</span></td>
                <td class="sc-cell"><span class="sc-exact">${r.exact}</span></td>
                <td class="inv-deg ${r.asin < 0 ? 'neg' : ''}">${r.asin}°</td>
                <td class="inv-rad">${fmtRad(r.asin)} rad</td>
                <td class="inv-deg">${r.acos}°</td>
                <td class="inv-rad">${fmtRad(r.acos)} rad</td>
            </tr>`;
        }).join('');

        // arctan
        const tbody2 = $('inv-tan-tbody');
        tbody2.innerHTML = INV_TAN.map(r => {
            const decVal = Math.abs(r.val) < 1e-12 ? '0' : r.val.toFixed(4).replace(/\.?0+$/, '');
            return `<tr>
                <td class="sc-cell"><span class="sc-dec">${decVal}</span></td>
                <td class="sc-cell"><span class="sc-exact">${r.exact}</span></td>
                <td class="inv-deg ${r.atan < 0 ? 'neg' : ''}">${r.atan}°</td>
                <td class="inv-rad">${fmtRad(r.atan)} rad</td>
            </tr>`;
        }).join('');
    })();

    // ── Calculadora de razones ────────────────────────────────────────────
    let calcUnit = 'deg'; // 'deg' | 'rad'
    let invUnit  = 'deg';

    $('btn-deg').addEventListener('click', () => setUnit('deg'));
    $('btn-rad').addEventListener('click', () => setUnit('rad'));

    function setUnit(u) {
        calcUnit = u;
        $('btn-deg').classList.toggle('active', u === 'deg');
        $('btn-rad').classList.toggle('active', u === 'rad');
    }

    $('btn-calc').addEventListener('click', calcRatios);
    $('calc-angle').addEventListener('keydown', e => { if (e.key === 'Enter') calcRatios(); });

    function calcRatios() {
        const raw = $('calc-angle').value.trim();
        const errEl = $('calc-error');
        if (!raw) { showCalcErr(errEl, 'Ingresa un ángulo.'); return; }
        const num = parseFloat(raw);
        if (!Number.isFinite(num)) { showCalcErr(errEl, 'Número inválido.'); return; }
        errEl.hidden = true;

        const angleRad = calcUnit === 'deg' ? rad(num) : num;
        const angleDeg = calcUnit === 'deg' ? num : degF(num);

        const sin = Math.sin(angleRad);
        const cos = Math.cos(angleRad);
        const tan = Math.abs(cos) < 1e-10 ? Infinity : Math.tan(angleRad);
        const cot = Math.abs(sin) < 1e-10 ? Infinity : cos / sin;
        const sec = Math.abs(cos) < 1e-10 ? Infinity : 1 / cos;
        const csc = Math.abs(sin) < 1e-10 ? Infinity : 1 / sin;

        const display = calcUnit === 'deg'
            ? `${fmtDec(angleDeg)}° = ${fmtRad(angleDeg)} rad`
            : `${fmtDec(num, 6)} rad = ${fmtDec(angleDeg)}°`;

        $('calc-angle-display').textContent = `Ángulo: ${display}`;

        const ratios = [
            { name: 'sen',   val: sin,  formula: 'opuesto / hipotenusa' },
            { name: 'cos',   val: cos,  formula: 'adyacente / hipotenusa' },
            { name: 'tan',   val: tan,  formula: 'opuesto / adyacente' },
            { name: 'cot',   val: cot,  formula: 'adyacente / opuesto' },
            { name: 'sec',   val: sec,  formula: '1 / cos' },
            { name: 'csc',   val: csc,  formula: '1 / sen' },
        ];

        $('ratio-grid').innerHTML = ratios.map(r => {
            const v     = r.val;
            const disp  = !Number.isFinite(v) ? '∞' : fmtDec(v, 6);
            const neg   = v < 0;
            const isInf = !Number.isFinite(v);
            return `<div class="ratio-card ${neg ? 'neg' : ''} ${isInf ? 'undef' : ''}">
                <div class="rc-name">${r.name}</div>
                <div class="rc-val">${disp}</div>
                <div class="rc-formula">${r.formula}</div>
            </div>`;
        }).join('');

        $('calc-result').hidden = false;
    }

    // ── Calculadora inversa ───────────────────────────────────────────────
    $('btn-inv-deg').addEventListener('click', () => setInvUnit('deg'));
    $('btn-inv-rad').addEventListener('click', () => setInvUnit('rad'));

    function setInvUnit(u) {
        invUnit = u;
        $('btn-inv-deg').classList.toggle('active', u === 'deg');
        $('btn-inv-rad').classList.toggle('active', u === 'rad');
    }

    $('btn-inv-calc').addEventListener('click', calcInverse);
    $('inv-val').addEventListener('keydown', e => { if (e.key === 'Enter') calcInverse(); });

    function calcInverse() {
        const raw   = $('inv-val').value.trim();
        const errEl = $('inv-error');
        if (!raw) { showCalcErr(errEl, 'Ingresa un valor.'); return; }
        const num = parseFloat(raw);
        if (!Number.isFinite(num)) { showCalcErr(errEl, 'Número inválido.'); return; }
        errEl.hidden = true;

        const results = [];

        // arcsen — dominio [-1, 1]
        if (num >= -1 - 1e-10 && num <= 1 + 1e-10) {
            const clamped = Math.min(1, Math.max(-1, num));
            const r = Math.asin(clamped);
            const d = degF(r);
            results.push({ name: 'arcsen', val: num,
                deg: fmtDec(d) + '°', radStr: fmtDec(r, 6) + ' rad',
                domain: '[−1, 1]', rango: '[−90°, 90°]', ok: true });
        } else {
            results.push({ name: 'arcsen', ok: false, domain: '[−1, 1]',
                reason: `${fmtDec(num, 4)} ∉ [−1, 1]` });
        }

        // arccos — dominio [-1, 1]
        if (num >= -1 - 1e-10 && num <= 1 + 1e-10) {
            const clamped = Math.min(1, Math.max(-1, num));
            const r = Math.acos(clamped);
            const d = degF(r);
            results.push({ name: 'arccos', val: num,
                deg: fmtDec(d) + '°', radStr: fmtDec(r, 6) + ' rad',
                domain: '[−1, 1]', rango: '[0°, 180°]', ok: true });
        } else {
            results.push({ name: 'arccos', ok: false, domain: '[−1, 1]',
                reason: `${fmtDec(num, 4)} ∉ [−1, 1]` });
        }

        // arctan — dominio todos los reales
        {
            const r = Math.atan(num);
            const d = degF(r);
            results.push({ name: 'arctan', val: num,
                deg: fmtDec(d) + '°', radStr: fmtDec(r, 6) + ' rad',
                domain: 'ℝ', rango: '(−90°, 90°)', ok: true });
        }

        const unitLabel = invUnit;
        $('inv-card-grid').innerHTML = results.map(r => {
            if (!r.ok) {
                return `<div class="inv-card inv-card-undef">
                    <div class="ic-name">${r.name}</div>
                    <div class="ic-undef">No definido</div>
                    <div class="ic-reason">${r.reason}</div>
                    <div class="ic-domain">Dom: ${r.domain}</div>
                </div>`;
            }
            const shown = unitLabel === 'deg' ? r.deg : r.radStr;
            const other  = unitLabel === 'deg' ? r.radStr : r.deg;
            return `<div class="inv-card">
                <div class="ic-name">${r.name}</div>
                <div class="ic-val">${shown}</div>
                <div class="ic-other">${other}</div>
                <div class="ic-domain">Dom: ${r.domain} &nbsp;·&nbsp; Rango: ${r.rango}</div>
            </div>`;
        }).join('');

        $('inv-result').hidden = false;
    }

    function showCalcErr(el, msg) {
        el.textContent = msg;
        el.hidden = false;
    }

})();
