// pitagoras.js — Teorema de Pitágoras con desarrollo paso a paso
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
    const rad = d => d * Math.PI / 180;
    const degF = r => r * 180 / Math.PI;

    function fmt(v, d = 4) {
        if (!Number.isFinite(v)) return '—';
        if (Math.abs(v) < 1e-12) return '0';
        return v.toFixed(d).replace(/\.?0+$/, '');
    }

    // ── Configuración de modos ──────────────────────────────────────────
    const MODES = {
        hyp: {
            label: 'Hipotenusa c',
            formula: 'c = √(a² + b²)',
            fields: [
                { id: 'in-a', label: 'Cateto <em>a</em>', isAngle: false },
                { id: 'in-b', label: 'Cateto <em>b</em>', isAngle: false }
            ],
            unknown: 'c'
        },
        cata: {
            label: 'Cateto a',
            formula: 'a = √(c² − b²)',
            fields: [
                { id: 'in-c', label: 'Hipotenusa <em>c</em>', isAngle: false },
                { id: 'in-b', label: 'Cateto <em>b</em>',     isAngle: false }
            ],
            unknown: 'a'
        },
        catb: {
            label: 'Cateto b',
            formula: 'b = √(c² − a²)',
            fields: [
                { id: 'in-c', label: 'Hipotenusa <em>c</em>', isAngle: false },
                { id: 'in-a', label: 'Cateto <em>a</em>',     isAngle: false }
            ],
            unknown: 'b'
        }
    };

    let currentMode = null;

    // ── Selección de modo ────────────────────────────────────────────────
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentMode = card.dataset.mode;
            buildInputs(currentMode);
            $('step2').hidden = false;
            $('result-section').hidden = true;
            $('error-box').hidden = true;
            $('step2').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // ── Construcción de campos dinámicos ────────────────────────────────
    function buildInputs(mode) {
        const cfg = MODES[mode];
        $('mode-formula').textContent = cfg.formula;

        const container = $('dyn-fields');
        container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'field-group';
        wrapper.innerHTML = `<span class="fg-title">Datos conocidos</span>`;

        cfg.fields.forEach(f => {
            const item = document.createElement('div');
            item.className = 'field-item';
            item.innerHTML = `
                <div class="field-row">
                    <span class="fl-label">${f.label}</span>
                    <input type="number" id="${f.id}" step="any" min="0"
                           placeholder="0" inputmode="decimal" autocomplete="off">
                </div>
                <span class="field-error" id="${f.id}-err"></span>
            `;
            wrapper.appendChild(item);
        });

        container.appendChild(wrapper);

        // Eventos de validación
        cfg.fields.forEach(f => {
            const inp = $(f.id);
            const err = $(`${f.id}-err`);
            inp.addEventListener('input', () => { validateField(inp, err, false); updateBtn(); });
            inp.addEventListener('blur',  () => { validateField(inp, err, true);  updateBtn(); });
        });

        $('btn-solve').disabled = true;
    }

    // ── Validación ──────────────────────────────────────────────────────
    function validateField(inp, err, showRequired) {
        const val = inp.value.trim();
        if (!val) {
            if (showRequired) setErr(inp, err, 'Este campo es requerido.');
            else clearErr(inp, err);
            return false;
        }
        const n = parseFloat(val);
        if (isNaN(n))  { setErr(inp, err, 'Ingresa un número válido.'); return false; }
        if (n <= 0)    { setErr(inp, err, 'El valor debe ser mayor que 0.'); return false; }
        inp.classList.remove('invalid'); inp.classList.add('valid');
        err.textContent = ''; err.classList.remove('show');
        return true;
    }

    function setErr(inp, err, msg) {
        inp.classList.add('invalid'); inp.classList.remove('valid');
        err.textContent = msg; err.classList.add('show');
    }

    function clearErr(inp, err) {
        inp.classList.remove('invalid', 'valid');
        err.textContent = ''; err.classList.remove('show');
    }

    function updateBtn() {
        if (!currentMode) return;
        const allValid = MODES[currentMode].fields.every(f => {
            const inp = $(f.id);
            return inp && inp.value.trim() !== '' && !inp.classList.contains('invalid');
        });
        $('btn-solve').disabled = !allValid;
    }

    // ── Cálculo ──────────────────────────────────────────────────────────
    $('btn-solve').addEventListener('click', calculate);

    function calculate() {
        if (!currentMode) return;
        const cfg = MODES[currentMode];

        let allOk = true;
        cfg.fields.forEach(f => {
            if (!validateField($(f.id), $(`${f.id}-err`), true)) allOk = false;
        });
        if (!allOk) return;

        const get = id => parseFloat($(id).value);
        let a, b, c;

        if (currentMode === 'hyp') {
            a = get('in-a'); b = get('in-b');
            c = Math.sqrt(a * a + b * b);
        } else if (currentMode === 'cata') {
            c = get('in-c'); b = get('in-b');
            if (c <= b) { showErr('La hipotenusa debe ser mayor que el cateto b (c > b).'); return; }
            a = Math.sqrt(c * c - b * b);
        } else {
            c = get('in-c'); a = get('in-a');
            if (c <= a) { showErr('La hipotenusa debe ser mayor que el cateto a (c > a).'); return; }
            b = Math.sqrt(c * c - a * a);
        }

        // Ángulos: C = 90° (vértice del ángulo recto)
        // A en vértice superior (opuesto a cateto a), B en vértice inferior-derecho
        const A = degF(Math.atan2(a, b)); // arctan(opuesto A / adyacente A) = arctan(a/b)
        const B = 90 - A;

        renderResult({ a, b, c, A, B, mode: currentMode });
    }

    function showErr(msg) {
        const box = $('error-box');
        box.textContent = msg;
        box.hidden = false;
        $('result-section').hidden = true;
    }

    // ── Render resultado ─────────────────────────────────────────────────
    function renderResult({ a, b, c, A, B, mode }) {
        $('error-box').hidden = true;

        // Tipo por lados
        const ST = 1e-3;
        const typeEl = $('rp-type-sides');
        if (Math.abs(a - b) < ST) typeEl.textContent = 'Isósceles';
        else typeEl.textContent = 'Escaleno';

        // Lados
        const unknown = MODES[mode].unknown;
        ['a', 'b', 'c'].forEach(side => {
            const el = $(`rp-${side}`);
            const val = side === 'a' ? a : side === 'b' ? b : c;
            el.textContent = fmt(val);
            el.className = 'vr-val ' + (side === unknown ? 'computed' : 'given');
            if (side === 'c') el.classList.add('hyp');
        });

        // Ángulos
        $('rp-A').textContent = `${fmt(A)}°`;
        $('rp-B').textContent = `${fmt(B)}°`;

        // Medidas derivadas
        const area        = a * b / 2;
        const perimeter   = a + b + c;
        const s           = perimeter / 2;
        const inradius    = area / s;
        const circumradius = c / 2; // Para triángulo rectángulo: R = c/2
        const ha = (2 * area) / a;
        const hb = (2 * area) / b;
        const hc = (2 * area) / c;

        $('rp-area').textContent = fmt(area);
        $('rp-per').textContent  = fmt(perimeter);
        $('rp-semi').textContent = fmt(s);
        $('rp-inr').textContent  = fmt(inradius);
        $('rp-cir').textContent  = fmt(circumradius);
        $('rp-ha').textContent   = fmt(ha);
        $('rp-hb').textContent   = fmt(hb);
        $('rp-hc').textContent   = fmt(hc);

        // SVG
        drawSVG(a, b, c, A, B);

        // Desarrollo
        buildDevSteps(a, b, c, A, B, mode);

        // Tabla trig
        buildTrigTable(A, B);

        // Acordeón: cerrar al mostrar nuevo resultado
        $('dev-body').hidden = true;
        $('dev-arrow').textContent = '▼';
        $('dev-toggle').classList.remove('open');

        $('result-section').hidden = false;
        $('result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── SVG ───────────────────────────────────────────────────────────────
    const SVG_W = 380, SVG_H = 280;

    function svgEl(tag, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        return el;
    }

    function drawSVG(a, b, c, A, B) {
        const svg = $('pit-svg');
        svg.innerHTML = '';

        const margin = 52;
        const availW = SVG_W - margin * 2;
        const availH = SVG_H - margin * 2;
        const scale  = Math.min(availW / a, availH / b) * 0.88;

        const scaledA = a * scale; // cateto horizontal
        const scaledB = b * scale; // cateto vertical

        // Centrar el triángulo en el viewBox
        const ox = (SVG_W - scaledA) / 2;
        const oy = (SVG_H + scaledB) / 2;

        // Vértices: C = ángulo recto (abajo-izquierda)
        const vC = { x: ox,          y: oy          };
        const vB = { x: ox + scaledA, y: oy          };
        const vA = { x: ox,          y: oy - scaledB };

        // Relleno
        svg.appendChild(svgEl('polygon', {
            points: `${vA.x},${vA.y} ${vB.x},${vB.y} ${vC.x},${vC.y}`,
            class: 'svg-fill'
        }));

        // Lados
        // Cateto a: C→B (horizontal)
        svg.appendChild(svgEl('line', { x1: vC.x, y1: vC.y, x2: vB.x, y2: vB.y, class: 'svg-side' }));
        // Cateto b: C→A (vertical)
        svg.appendChild(svgEl('line', { x1: vC.x, y1: vC.y, x2: vA.x, y2: vA.y, class: 'svg-side' }));
        // Hipotenusa c: A→B
        svg.appendChild(svgEl('line', { x1: vA.x, y1: vA.y, x2: vB.x, y2: vB.y, class: 'svg-side hypotenuse' }));

        // Cuadrado ángulo recto en C
        const sq = Math.min(scaledA, scaledB) * 0.12;
        svg.appendChild(svgEl('rect', {
            x: vC.x, y: vC.y - sq, width: sq, height: sq,
            class: 'svg-right-square'
        }));

        // Etiquetas de lados
        const midCB = { x: (vC.x + vB.x) / 2, y: vC.y + 16 };
        const midCA = { x: vC.x - 16,          y: (vC.y + vA.y) / 2 };
        const midAB = { x: (vA.x + vB.x) / 2 + 10, y: (vA.y + vB.y) / 2 };

        addText(svg, midCB.x, midCB.y,  'a', 'svg-side-label');
        addText(svg, midCA.x, midCA.y,  'b', 'svg-side-label');
        addText(svg, midAB.x, midAB.y,  'c', 'svg-hyp-label');

        // Etiquetas de vértices
        addText(svg, vA.x - 16, vA.y + 4, 'A', 'svg-vertex-label');
        addText(svg, vB.x + 16, vB.y + 4, 'B', 'svg-vertex-label');
        addText(svg, vC.x - 16, vC.y + 4, 'C', 'svg-vertex-label');

        // Arcos de ángulos A y B (C ya tiene el cuadradito)
        drawAngleArc(svg, vA, vB, vC, A, 'A');
        drawAngleArc(svg, vB, vA, vC, B, 'B');
    }

    function addText(svg, x, y, text, cls) {
        const el = svgEl('text', {
            x, y, class: cls,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        });
        el.textContent = text;
        svg.appendChild(el);
    }

    function drawAngleArc(svg, vertex, p1, p2, angleDeg, label) {
        const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
        const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
        const len1 = Math.hypot(v1.x, v1.y) || 1;
        const len2 = Math.hypot(v2.x, v2.y) || 1;
        const r = Math.min(len1, len2) * 0.22;

        const sx = vertex.x + (v1.x / len1) * r;
        const sy = vertex.y + (v1.y / len1) * r;
        const ex = vertex.x + (v2.x / len2) * r;
        const ey = vertex.y + (v2.y / len2) * r;

        // Producto vectorial: determina sentido del arco
        const cross = v1.x * v2.y - v1.y * v2.x;
        const sweep = cross > 0 ? 1 : 0;

        svg.appendChild(svgEl('path', {
            d: `M ${sx} ${sy} A ${r} ${r} 0 0 ${sweep} ${ex} ${ey}`,
            class: 'svg-angle-arc'
        }));

        // Etiqueta sobre la bisectriz
        const bx = v1.x / len1 + v2.x / len2;
        const by = v1.y / len1 + v2.y / len2;
        const bm = Math.hypot(bx, by) || 1;
        const lx = vertex.x + (bx / bm) * (r + 16);
        const ly = vertex.y + (by / bm) * (r + 16);

        const el = svgEl('text', {
            x: lx, y: ly, class: 'svg-angle-label',
            'text-anchor': 'middle', 'dominant-baseline': 'middle'
        });
        el.textContent = `${label}=${fmt(angleDeg, 1)}°`;
        svg.appendChild(el);
    }

    // ── Desarrollo paso a paso ────────────────────────────────────────────
    function buildDevSteps(a, b, c, A, B, mode) {
        let html = '';

        // ── ① Teorema de Pitágoras ──────────────────────────────────────
        html += group('① Teorema de Pitágoras');

        if (mode === 'hyp') {
            html += step('Fórmula y despeje', [
                { t: 'symbolic', s: 'c² = a² + b²' },
                { t: 'symbolic', s: 'c = √(a² + b²)' }
            ]);
            html += step('Sustitución', [
                { t: 'subst',  s: `c = √(${fmt(a)}² + ${fmt(b)}²)` },
                { t: 'subst',  s: `c = √(${fmt(a*a)} + ${fmt(b*b)})` },
                { t: 'subst',  s: `c = √${fmt(a*a + b*b)}` },
                { t: 'result', s: `c = ${fmt(c)}` }
            ]);
        } else if (mode === 'cata') {
            html += step('Despeje de a', [
                { t: 'symbolic', s: 'c² = a² + b²' },
                { t: 'symbolic', s: 'a² = c² − b²' },
                { t: 'symbolic', s: 'a = √(c² − b²)' }
            ]);
            html += step('Sustitución', [
                { t: 'subst',  s: `a = √(${fmt(c)}² − ${fmt(b)}²)` },
                { t: 'subst',  s: `a = √(${fmt(c*c)} − ${fmt(b*b)})` },
                { t: 'subst',  s: `a = √${fmt(c*c - b*b)}` },
                { t: 'result', s: `a = ${fmt(a)}` }
            ]);
        } else {
            html += step('Despeje de b', [
                { t: 'symbolic', s: 'c² = a² + b²' },
                { t: 'symbolic', s: 'b² = c² − a²' },
                { t: 'symbolic', s: 'b = √(c² − a²)' }
            ]);
            html += step('Sustitución', [
                { t: 'subst',  s: `b = √(${fmt(c)}² − ${fmt(a)}²)` },
                { t: 'subst',  s: `b = √(${fmt(c*c)} − ${fmt(a*a)})` },
                { t: 'subst',  s: `b = √${fmt(c*c - a*a)}` },
                { t: 'result', s: `b = ${fmt(b)}` }
            ]);
        }

        html += step('Verificación', [
            { t: 'subst',  s: `a² + b² = ${fmt(a)}² + ${fmt(b)}² = ${fmt(a*a + b*b, 6)}` },
            { t: 'subst',  s: `c²       = ${fmt(c)}²       = ${fmt(c*c, 6)}` },
            { t: 'result', s: `a² + b² = c²  ✓` }
        ]);

        html += '</div>'; // fin group

        // ── ② Cálculo de ángulos ────────────────────────────────────────
        html += group('② Ángulos mediante razones trigonométricas');

        html += step('Ángulo A — usando tangente', [
            { t: 'symbolic', s: 'tan(A) = opuesto / adyacente = a / b' },
            { t: 'subst',    s: `tan(A) = ${fmt(a)} / ${fmt(b)} = ${fmt(a/b)}` },
            { t: 'result',   s: `A = arctan(${fmt(a/b)}) = ${fmt(A)}°` }
        ]);
        html += step('Verificación con sen(A)', [
            { t: 'symbolic', s: 'sen(A) = opuesto / hipotenusa = a / c' },
            { t: 'subst',    s: `sen(A) = ${fmt(a)} / ${fmt(c)} = ${fmt(a/c)}` },
            { t: 'result',   s: `A = arcsen(${fmt(a/c, 6)}) = ${fmt(degF(Math.asin(a/c)))}°` }
        ]);
        html += step('Verificación con cos(A)', [
            { t: 'symbolic', s: 'cos(A) = adyacente / hipotenusa = b / c' },
            { t: 'subst',    s: `cos(A) = ${fmt(b)} / ${fmt(c)} = ${fmt(b/c)}` },
            { t: 'result',   s: `A = arccos(${fmt(b/c, 6)}) = ${fmt(degF(Math.acos(b/c)))}°` }
        ]);

        html += step('Ángulo B — usando tangente', [
            { t: 'symbolic', s: 'tan(B) = opuesto / adyacente = b / a' },
            { t: 'subst',    s: `tan(B) = ${fmt(b)} / ${fmt(a)} = ${fmt(b/a)}` },
            { t: 'result',   s: `B = arctan(${fmt(b/a)}) = ${fmt(B)}°` }
        ]);
        html += step('Verificación con sen(B)', [
            { t: 'symbolic', s: 'sen(B) = opuesto / hipotenusa = b / c' },
            { t: 'subst',    s: `sen(B) = ${fmt(b)} / ${fmt(c)} = ${fmt(b/c)}` },
            { t: 'result',   s: `B = arcsen(${fmt(b/c, 6)}) = ${fmt(degF(Math.asin(b/c)))}°` }
        ]);

        html += step('Verificación suma de ángulos', [
            { t: 'subst',  s: `A + B + C = ${fmt(A)}° + ${fmt(B)}° + 90°` },
            { t: 'result', s: `= ${fmt(A + B + 90)}°  ✓` }
        ]);

        html += '</div>'; // fin group

        // ── ③ Medidas derivadas ─────────────────────────────────────────
        const area = a * b / 2;
        const per  = a + b + c;
        const s2   = per / 2;
        const inr  = area / s2;
        const cir  = c / 2;

        html += group('③ Medidas derivadas');

        html += step('Área', [
            { t: 'symbolic', s: 'Área = (cateto_a × cateto_b) / 2' },
            { t: 'subst',    s: `Área = (${fmt(a)} × ${fmt(b)}) / 2` },
            { t: 'result',   s: `Área = ${fmt(area)}` }
        ]);
        html += step('Perímetro y semiperímetro', [
            { t: 'symbolic', s: 'P = a + b + c' },
            { t: 'subst',    s: `P = ${fmt(a)} + ${fmt(b)} + ${fmt(c)}` },
            { t: 'result',   s: `P = ${fmt(per)}` },
            { t: 'subst',    s: `s = P / 2 = ${fmt(per)} / 2` },
            { t: 'result',   s: `s = ${fmt(s2)}` }
        ]);
        html += step('Inradio (círculo inscrito)', [
            { t: 'symbolic', s: 'r = Área / s' },
            { t: 'subst',    s: `r = ${fmt(area)} / ${fmt(s2)}` },
            { t: 'result',   s: `r = ${fmt(inr)}` }
        ]);
        html += step('Circunradio (círculo circunscrito)', [
            { t: 'symbolic', s: 'R = c / 2  (el centro de la hipotenusa es el circuncentro)' },
            { t: 'subst',    s: `R = ${fmt(c)} / 2` },
            { t: 'result',   s: `R = ${fmt(cir)}` }
        ]);

        html += '</div>'; // fin group

        $('dev-body').innerHTML = html;
    }

    function group(title) {
        return `<div class="dev-group"><div class="dev-group-title">${title}</div>`;
    }

    function step(title, rows) {
        const rowsHtml = rows.map(r =>
            `<div class="dev-formula ${r.t}">${r.s}</div>`
        ).join('');
        return `<div class="dev-step">
            <div class="dev-step-title">${title}</div>
            <div class="dev-formula-row">${rowsHtml}</div>
        </div>`;
    }

    // ── Tabla trigonométrica ──────────────────────────────────────────────
    function buildTrigTable(A, B) {
        [
            { label: 'A', d: A },
            { label: 'B', d: B }
        ].forEach(({ label, d }) => {
            const r = rad(d);
            const sin = Math.sin(r);
            const cos = Math.cos(r);
            const tan = Math.abs(cos) < 1e-10 ? Infinity : Math.tan(r);
            const cot = Math.abs(sin) < 1e-10 ? Infinity : cos / sin;
            const sec = Math.abs(cos) < 1e-10 ? Infinity : 1 / cos;
            const csc = Math.abs(sin) < 1e-10 ? Infinity : 1 / sin;
            const f   = v => !Number.isFinite(v) ? '∞' : v.toFixed(4);

            $(`tp-${label}-val`).textContent = `${fmt(d)}°`;
            $(`tp-${label}-sen`).textContent = f(sin);
            $(`tp-${label}-cos`).textContent = f(cos);
            $(`tp-${label}-tan`).textContent = f(tan);
            $(`tp-${label}-cot`).textContent = f(cot);
            $(`tp-${label}-sec`).textContent = f(sec);
            $(`tp-${label}-csc`).textContent = f(csc);
        });
    }

    // ── Acordeón ─────────────────────────────────────────────────────────
    $('dev-toggle').addEventListener('click', () => {
        const body  = $('dev-body');
        const arrow = $('dev-arrow');
        const btn   = $('dev-toggle');
        const isOpen = !body.hidden;
        body.hidden = isOpen;
        arrow.textContent = isOpen ? '▼' : '▲';
        btn.classList.toggle('open', !isOpen);
    });

    // ── Reset ─────────────────────────────────────────────────────────────
    $('btn-reset').addEventListener('click', () => {
        $('result-section').hidden = true;
        $('error-box').hidden = true;
        $('step2').hidden = true;
        document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
        currentMode = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

})();
