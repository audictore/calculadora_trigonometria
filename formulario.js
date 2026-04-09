// formulario.js — Lógica de la página de formulario guiado
(function () {
    'use strict';

    const S = TriSolver; // alias
    const $ = id => document.getElementById(id);

    // ── Configuración de campos por caso ────────────────────────────
    const CASES = {
        SSS: {
            hint: 'Ingresa los tres lados del triángulo. Los ángulos se calcularán automáticamente con la Ley de Cosenos.',
            groups: [
                {
                    title: 'Lados conocidos',
                    fields: [
                        { id: 'f-a', label: 'Lado <em>a</em>', key: 'a', type: 'side' },
                        { id: 'f-b', label: 'Lado <em>b</em>', key: 'b', type: 'side' },
                        { id: 'f-c', label: 'Lado <em>c</em>', key: 'c', type: 'side' }
                    ]
                }
            ]
        },
        SAS: {
            hint: 'Ingresa dos lados y el ángulo que está entre ellos (el ángulo formado por los dos lados).',
            groups: [
                {
                    title: 'Opción A: lados a, b → ángulo C entre ellos',
                    fields: [
                        { id: 'f-a', label: 'Lado <em>a</em>', key: 'a', type: 'side' },
                        { id: 'f-b', label: 'Lado <em>b</em>', key: 'b', type: 'side' },
                        { id: 'f-C', label: 'Ángulo <span class="ang-em">C</span> (entre a y b)', key: 'C', type: 'angle' }
                    ]
                }
            ]
        },
        ASA: {
            hint: 'Ingresa un lado y los dos ángulos que conoces. El tercer ángulo se deducirá automáticamente.',
            groups: [
                {
                    title: 'Lado conocido',
                    fields: [
                        { id: 'f-a', label: 'Lado <em>a</em>', key: 'a', type: 'side' }
                    ]
                },
                {
                    title: 'Dos ángulos conocidos',
                    fields: [
                        { id: 'f-B', label: 'Ángulo <span class="ang-em">B</span>', key: 'B', type: 'angle' },
                        { id: 'f-C', label: 'Ángulo <span class="ang-em">C</span>', key: 'C', type: 'angle' }
                    ]
                }
            ]
        },
        SSA: {
            hint: 'Ingresa dos lados y el ángulo opuesto a uno de ellos. Cuidado: puede haber dos soluciones (caso ambiguo).',
            groups: [
                {
                    title: 'Lados conocidos',
                    fields: [
                        { id: 'f-a', label: 'Lado <em>a</em>', key: 'a', type: 'side' },
                        { id: 'f-b', label: 'Lado <em>b</em>', key: 'b', type: 'side' }
                    ]
                },
                {
                    title: 'Ángulo opuesto a uno de los lados',
                    fields: [
                        { id: 'f-A', label: 'Ángulo <span class="ang-em">A</span> (opuesto a lado a)', key: 'A', type: 'angle' }
                    ]
                }
            ]
        }
    };

    // ── Estado ───────────────────────────────────────────────────────
    let currentCase = null;

    // ── Referencias DOM ───────────────────────────────────────────────
    const caseCards = document.querySelectorAll('.case-card');
    const step2 = $('step2');
    const step2Hint = $('step2-hint');
    const dynFields = $('dyn-fields');
    const btnSolve = $('btn-solve');
    const resultSection = $('result-section');
    const resultAlert = $('result-alert');
    const typeBadges = $('type-badges');
    const errorBox = $('error-box');
    const btnReset = $('btn-reset');
    const svgEl = $('form-svg');
    const hypInfo = $('fr-hyp-info');
    const methodBox = $('method-box');

    // ── Selector de caso ─────────────────────────────────────────────
    caseCards.forEach(card => {
        card.addEventListener('click', () => {
            const val = card.dataset.case;
            currentCase = val;
            card.querySelector('input[type="radio"]').checked = true;
            buildFields(val);
            step2.hidden = false;
            resultSection.hidden = true;
            errorBox.hidden = true;
            step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Focus al primer campo
            const first = dynFields.querySelector('input');
            if (first) setTimeout(() => first.focus(), 300);
        });
    });

    // ── Construir campos dinámicos ───────────────────────────────────
    function buildFields(caseKey) {
        const conf = CASES[caseKey];
        step2Hint.textContent = conf.hint;
        dynFields.innerHTML = '';

        conf.groups.forEach(group => {
            const div = document.createElement('div');
            div.className = 'field-group';

            const title = document.createElement('span');
            title.className = 'fg-title';
            title.textContent = group.title;
            div.appendChild(title);

            group.fields.forEach(field => {
                // Contenedor del campo + su error inline
                const item = document.createElement('div');
                item.className = 'field-item';

                const row = document.createElement('div');
                row.className = 'field-row';

                const lbl = document.createElement('span');
                lbl.className = 'fl-label';
                lbl.innerHTML = field.label;

                const inp = document.createElement('input');
                inp.type = 'number';
                inp.id = field.id;
                inp.step = 'any';
                inp.placeholder = field.type === 'angle' ? 'ej: 45' : 'ej: 5';
                inp.inputMode = 'decimal';
                inp.dataset.key = field.key;
                inp.dataset.kind = field.type;

                // Span de error inline (aparece debajo del campo)
                const errSpan = document.createElement('span');
                errSpan.className = 'field-error';
                errSpan.id = 'err-' + field.id;

                // Validación en tiempo real mientras el usuario escribe
                inp.addEventListener('input', () => {
                    validateField(inp, errSpan, false);
                    updateSolveBtn();
                });

                // Validación al salir del campo (blur) — también muestra "requerido"
                inp.addEventListener('blur', () => {
                    validateField(inp, errSpan, true);
                    updateSolveBtn();
                });

                inp.addEventListener('keydown', e => {
                    if (e.key === 'Enter') btnSolve.click();
                });

                row.appendChild(lbl);
                row.appendChild(inp);
                item.appendChild(row);
                item.appendChild(errSpan);
                div.appendChild(item);
            });

            dynFields.appendChild(div);
        });
    }

    // ── Validación de un campo individual ───────────────────────────
    // showRequired = true solo al salir del campo (blur) o al intentar enviar
    function validateField(inp, errSpan, showRequired) {
        const raw = inp.value.trim();
        const isAngle = inp.dataset.kind === 'angle';
        const label = inp.dataset.key; // 'a', 'b', 'A', 'C', etc.

        inp.classList.remove('invalid', 'valid');
        errSpan.textContent = '';
        errSpan.className = 'field-error';

        if (raw === '') {
            if (showRequired) {
                setFieldError(inp, errSpan,
                    isAngle ? `El ángulo ${label} es requerido.`
                            : `El lado ${label} es requerido.`);
            }
            return false; // vacío no es válido
        }

        const n = Number(raw);

        if (!Number.isFinite(n)) {
            setFieldError(inp, errSpan, `Ingresa un número válido.`);
            return false;
        }
        if (n <= 0) {
            setFieldError(inp, errSpan,
                isAngle ? `El ángulo debe ser mayor que 0°.`
                        : `El lado debe ser mayor que 0.`);
            return false;
        }
        if (isAngle && n >= 180) {
            setFieldError(inp, errSpan, `El ángulo debe ser menor que 180°. (Ingresaste ${n}°)`);
            return false;
        }
        if (!isAngle && n > 1e9) {
            setFieldError(inp, errSpan, `Valor demasiado grande.`);
            return false;
        }

        // ✔ válido
        inp.classList.add('valid');
        return true;
    }

    function setFieldError(inp, errSpan, msg) {
        inp.classList.add('invalid');
        errSpan.textContent = '⚠ ' + msg;
        errSpan.className = 'field-error show';
    }

    // Actualiza el estado del botón Calcular según si hay errores visibles
    function updateSolveBtn() {
        const anyInvalid = !!dynFields.querySelector('input.invalid');
        btnSolve.disabled = anyInvalid;
        btnSolve.style.opacity = anyInvalid ? '0.5' : '1';
    }

    // ── Leer inputs con validación completa ──────────────────────────
    function readInputs() {
        const data = { a: null, b: null, c: null, A: null, B: null, C: null };
        const inputEls = dynFields.querySelectorAll('input');
        let valid = true;

        // 1. Validar cada campo individualmente (mostrando "requerido")
        inputEls.forEach(el => {
            const errSpan = document.getElementById('err-' + el.id);
            const ok = validateField(el, errSpan, true);
            if (!ok) valid = false;
            else data[el.dataset.key] = Number(el.value.trim());
        });

        if (!valid) return { data, valid, crossErrors: [] };

        // 2. Validaciones cruzadas entre campos
        const crossErrors = validateCross(data);
        if (crossErrors.length > 0) valid = false;

        return { data, valid, crossErrors };
    }

    // ── Validaciones cruzadas ────────────────────────────────────────
    function validateCross(data) {
        const errors = [];
        const anglesGiven = ['A', 'B', 'C'].filter(k => data[k] != null);
        const sidesGiven  = ['a', 'b', 'c'].filter(k => data[k] != null);

        // Suma de ángulos
        if (anglesGiven.length >= 2) {
            const sum = anglesGiven.reduce((acc, k) => acc + data[k], 0);
            if (sum >= 180) {
                errors.push(
                    `La suma de los ángulos ingresados es ${sum.toFixed(2)}° ` +
                    `(${anglesGiven.join(' + ')} = ${anglesGiven.map(k => data[k].toFixed(2) + '°').join(' + ')}). ` +
                    `Debe ser menor que 180°.`
                );
            }
        }

        // Desigualdad triangular (si tenemos los 3 lados)
        if (sidesGiven.length === 3) {
            const { a, b, c } = data;
            if (a + b <= c) errors.push(`Desigualdad triangular: a + b (${(a+b).toFixed(4)}) debe ser mayor que c (${c.toFixed(4)}).`);
            else if (a + c <= b) errors.push(`Desigualdad triangular: a + c (${(a+c).toFixed(4)}) debe ser mayor que b (${b.toFixed(4)}).`);
            else if (b + c <= a) errors.push(`Desigualdad triangular: b + c (${(b+c).toFixed(4)}) debe ser mayor que a (${a.toFixed(4)}).`);
        }

        // Ángulo único no puede ser ≥ 180 (redundante pero explícito)
        anglesGiven.forEach(k => {
            if (data[k] != null && data[k] >= 180) {
                errors.push(`El ángulo ${k} = ${data[k]}° debe ser menor que 180°.`);
            }
        });

        return errors;
    }

    // ── Botón Calcular ───────────────────────────────────────────────
    btnSolve.addEventListener('click', () => {
        errorBox.hidden = true;
        resultSection.hidden = true;
        resultAlert.hidden = true;

        const { data, valid, crossErrors } = readInputs();

        if (!valid) {
            // Si hay errores cruzados además de campos inválidos, mostrarlos
            if (crossErrors && crossErrors.length > 0) {
                showError(crossErrors.map(e => '• ' + e).join('<br>'));
            }
            // Los errores de campo individual ya están marcados inline
            return;
        }

        const result = S.solveTriangle(data);

        if (!result.ok) {
            showError((result.error || result.info || 'No se pudo resolver el triángulo.'));
            return;
        }

        renderResult(data, result);
        resultSection.hidden = false;
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ── Renderizar resultados ────────────────────────────────────────
    function renderResult(input, result) {
        const sol = result.sol;
        const ext = S.computeExtras(sol);
        const type = S.detectType(sol);

        // Alerta ambigüedad SSA
        if (result.warning) {
            resultAlert.innerHTML = '⚠ ' + result.warning;
            resultAlert.hidden = false;
        } else {
            resultAlert.hidden = true;
        }

        // Badges tipo
        typeBadges.innerHTML = '';
        appendBadge(typeBadges, 'sides', `Por lados: ${type.bySides}`);
        appendBadge(typeBadges, 'angles', `Por ángulos: ${type.byAngles}`);
        if (result.method) appendBadge(typeBadges, 'method', `📐 ${result.method}`);

        // Info hipotenusa
        if (type.hypotenuseSide) {
            const hyp = type.hypotenuseSide;
            hypInfo.hidden = false;
            hypInfo.innerHTML =
                `<strong>Hipotenusa:</strong> lado <strong>${hyp}</strong> = ${S.fmt(sol[hyp], 4)} ` +
                `(el lado más largo, opuesto al ángulo recto).<br>` +
                `<strong>Ángulo recto:</strong> <span class="pill">${type.rightAngleVertex} = 90°</span> ` +
                `(vértice opuesto a la hipotenusa).`;
        } else {
            hypInfo.hidden = true;
        }

        // Método
        methodBox.innerHTML = `<strong>Método usado:</strong> ${result.method || '—'}`;

        // Valores — lados
        ['a', 'b', 'c'].forEach(k => {
            const el = $(`fr-${k}`);
            el.textContent = S.fmt(sol[k]);
            el.className = 'vr-val ' + (input[k] != null ? 'given' : 'computed');
            if (k === type.hypotenuseSide) el.classList.add('hyp');
            const row = el.closest('.value-row');
            if (row) row.classList.toggle('is-hyp', k === type.hypotenuseSide);
        });

        // Ángulos
        ['A', 'B', 'C'].forEach(k => {
            const el = $(`fr-${k}`);
            el.textContent = S.fmtAngle(sol[k]);
            el.className = 'vr-val ' + (input[k] != null ? 'given' : 'computed');
        });

        // Extras
        $('fr-per').textContent = S.fmt(ext.perimeter);
        $('fr-semi').textContent = S.fmt(ext.semi);
        $('fr-area').textContent = S.fmt(ext.area);
        $('fr-inr').textContent = S.fmt(ext.inradius);
        $('fr-cir').textContent = S.fmt(ext.circumradius);
        $('fr-ha').textContent = S.fmt(ext.ha);
        $('fr-hb').textContent = S.fmt(ext.hb);
        $('fr-hc').textContent = S.fmt(ext.hc);

        // Tabla trig
        ['A', 'B', 'C'].forEach(L => {
            $(`ff-${L}-val`).textContent = `${S.fmt(sol[L], 2)}°`;
            const tr = S.trigRatios(sol[L]);
            ['sen', 'cos', 'tan', 'cot', 'sec', 'csc'].forEach(fn => {
                $(`ff-${L}-${fn}`).textContent = S.fmtTrig(tr[fn]);
            });
        });

        // Diagrama SVG
        drawSVG(sol, type);

        // Desarrollo paso a paso
        $('dev-body').innerHTML = buildSteps(input, result, sol, ext, type);
        $('dev-body').hidden = true;       // cerrado por defecto
        $('dev-arrow').textContent = '▼';
        $('dev-toggle').classList.remove('open');
    }

    function appendBadge(container, cls, text) {
        const span = document.createElement('span');
        span.className = `type-badge ${cls}`;
        span.textContent = text;
        container.appendChild(span);
    }

    // ── SVG ──────────────────────────────────────────────────────────
    const SVG_W = 380, SVG_H = 280, SVG_PAD = 48;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    function svgNode(tag, attrs, text) {
        const el = document.createElementNS(SVG_NS, tag);
        if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        if (text != null) el.textContent = text;
        return el;
    }

    function drawSVG(sol, type) {
        while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
        const { a, b, c, A, B, C } = sol;
        const rad = S.rad;
        const rightVertex = type.rightAngleVertex;
        const hypSide = type.hypotenuseSide;

        let Ap, Bp, Cp;
        if (rightVertex) {
            const legMap = {
                A: [{ other: 'B', s: 'c' }, { other: 'C', s: 'b' }],
                B: [{ other: 'A', s: 'c' }, { other: 'C', s: 'a' }],
                C: [{ other: 'A', s: 'b' }, { other: 'B', s: 'a' }]
            };
            const legs = legMap[rightVertex].map(l => ({ ...l, len: sol[l.s] }));
            legs.sort((x, y) => y.len - x.len);
            const pos = { A: null, B: null, C: null };
            pos[rightVertex] = { x: 0, y: 0 };
            pos[legs[0].other] = { x: legs[0].len, y: 0 };
            pos[legs[1].other] = { x: 0, y: legs[1].len };
            Ap = pos.A; Bp = pos.B; Cp = pos.C;
        } else {
            Ap = { x: 0, y: 0 };
            Bp = { x: c, y: 0 };
            Cp = { x: b * Math.cos(rad(A)), y: b * Math.sin(rad(A)) };
        }

        const xs = [Ap.x, Bp.x, Cp.x], ys = [Ap.y, Bp.y, Cp.y];
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const w = maxX - minX || 1, h = maxY - minY || 1;
        const scale = Math.min((SVG_W - 2 * SVG_PAD) / w, (SVG_H - 2 * SVG_PAD) / h);
        const offX = SVG_W / 2 - ((minX + maxX) / 2) * scale;
        const offY = SVG_H / 2 + ((minY + maxY) / 2) * scale;
        const toSvg = p => ({ x: p.x * scale + offX, y: -p.y * scale + offY });

        const sA = toSvg(Ap), sB = toSvg(Bp), sC = toSvg(Cp);
        const fmt = S.fmt;

        // Relleno
        svgEl.appendChild(svgNode('polygon', {
            points: `${sA.x},${sA.y} ${sB.x},${sB.y} ${sC.x},${sC.y}`,
            fill: 'rgba(56,189,248,0.10)', stroke: 'none'
        }));

        // Lados
        const sideClass = w => w === hypSide
            ? 'stroke:#f472b6;stroke-width:4;fill:none;stroke-linecap:round'
            : 'stroke:#38bdf8;stroke-width:2.5;fill:none;stroke-linecap:round';
        svgEl.appendChild(svgNode('line', { x1: sB.x, y1: sB.y, x2: sC.x, y2: sC.y, style: sideClass('a') }));
        svgEl.appendChild(svgNode('line', { x1: sA.x, y1: sA.y, x2: sC.x, y2: sC.y, style: sideClass('b') }));
        svgEl.appendChild(svgNode('line', { x1: sA.x, y1: sA.y, x2: sB.x, y2: sB.y, style: sideClass('c') }));

        // Vértices
        [sA, sB, sC].forEach(p => svgEl.appendChild(svgNode('circle', { cx: p.x, cy: p.y, r: 3.5, fill: '#38bdf8' })));

        // Etiquetas vértices
        const cent = { x: (sA.x + sB.x + sC.x) / 3, y: (sA.y + sB.y + sC.y) / 3 };
        const vlabel = (p, t) => {
            const dx = p.x - cent.x, dy = p.y - cent.y;
            const m = Math.hypot(dx, dy) || 1;
            return svgNode('text', {
                x: p.x + (dx / m) * 22, y: p.y + (dy / m) * 22,
                'text-anchor': 'middle', 'dominant-baseline': 'middle',
                style: 'fill:#e2e8f0;font-size:16px;font-weight:700;font-family:inherit'
            }, t);
        };
        svgEl.appendChild(vlabel(sA, 'A'));
        svgEl.appendChild(vlabel(sB, 'B'));
        svgEl.appendChild(vlabel(sC, 'C'));

        // Etiquetas lados
        const slabel = (p1, p2, opp, txt, isHyp) => {
            const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
            const dx = mx - opp.x, dy = my - opp.y;
            const m = Math.hypot(dx, dy) || 1;
            return svgNode('text', {
                x: mx + (dx / m) * (isHyp ? 20 : 15),
                y: my + (dy / m) * (isHyp ? 20 : 15),
                'text-anchor': 'middle', 'dominant-baseline': 'middle',
                style: isHyp
                    ? 'fill:#f9a8d4;font-size:12px;font-weight:700;font-family:inherit'
                    : 'fill:#4ade80;font-size:12px;font-weight:600;font-family:inherit'
            }, txt);
        };
        svgEl.appendChild(slabel(sB, sC, sA, `a = ${fmt(a, 3)}` + (hypSide === 'a' ? ' (hip.)' : ''), hypSide === 'a'));
        svgEl.appendChild(slabel(sA, sC, sB, `b = ${fmt(b, 3)}` + (hypSide === 'b' ? ' (hip.)' : ''), hypSide === 'b'));
        svgEl.appendChild(slabel(sA, sB, sC, `c = ${fmt(c, 3)}` + (hypSide === 'c' ? ' (hip.)' : ''), hypSide === 'c'));

        // Arcos / ángulos
        drawArc(sA, sB, sC, A, 'A', rightVertex === 'A');
        drawArc(sB, sC, sA, B, 'B', rightVertex === 'B');
        drawArc(sC, sA, sB, C, 'C', rightVertex === 'C');
    }

    function drawArc(vertex, p1, p2, angleDeg, label, isRight) {
        const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
        const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
        const len1 = Math.hypot(v1.x, v1.y) || 1;
        const len2 = Math.hypot(v2.x, v2.y) || 1;
        const radius = Math.min(len1, len2) * (isRight ? 0.18 : 0.22);

        if (isRight) {
            const sq = radius * 0.9;
            const u1x = (v1.x / len1) * sq, u1y = (v1.y / len1) * sq;
            const u2x = (v2.x / len2) * sq, u2y = (v2.y / len2) * sq;
            const d = `M ${vertex.x} ${vertex.y} L ${vertex.x + u1x} ${vertex.y + u1y} L ${vertex.x + u1x + u2x} ${vertex.y + u1y + u2y} L ${vertex.x + u2x} ${vertex.y + u2y} Z`;
            svgEl.appendChild(svgNode('path', { d, style: 'fill:rgba(251,191,36,0.18);stroke:#fbbf24;stroke-width:1.5' }));
        } else {
            const cross = v1.x * v2.y - v1.y * v2.x;
            const sweep = cross > 0 ? 1 : 0;
            const start = { x: vertex.x + (v1.x / len1) * radius, y: vertex.y + (v1.y / len1) * radius };
            const end = { x: vertex.x + (v2.x / len2) * radius, y: vertex.y + (v2.y / len2) * radius };
            svgEl.appendChild(svgNode('path', {
                d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`,
                style: 'fill:none;stroke:#fbbf24;stroke-width:1.8'
            }));
        }

        const bx = v1.x / len1 + v2.x / len2, by = v1.y / len1 + v2.y / len2;
        const bm = Math.hypot(bx, by) || 1;
        svgEl.appendChild(svgNode('text', {
            x: vertex.x + (bx / bm) * (radius + 17),
            y: vertex.y + (by / bm) * (radius + 17),
            'text-anchor': 'middle', 'dominant-baseline': 'middle',
            style: 'fill:#fbbf24;font-size:11px;font-weight:600;font-family:inherit'
        }, isRight ? `${label}=90°⟂` : `${label}=${S.fmt(angleDeg, 1)}°`));
    }

    // ── Toggle acordeón del desarrollo ──────────────────────────────
    $('dev-toggle').addEventListener('click', () => {
        const body = $('dev-body');
        const arrow = $('dev-arrow');
        const btn = $('dev-toggle');
        body.hidden = !body.hidden;
        arrow.textContent = body.hidden ? '▼' : '▲';
        btn.classList.toggle('open', !body.hidden);
    });

    // ── Generador de desarrollo paso a paso ─────────────────────────
    function buildSteps(input, result, sol, ext, type) {
        const f = (v, d = 4) => S.fmt(v, d);
        const f2 = v => S.fmt(v, 4);
        const { a, b, c, A, B, C } = sol;
        const { perimeter, semi: s, area, inradius, circumradius, ha, hb, hc } = ext;
        const method = result.method || '';
        const parts = [];

        // ── helper para construir un bloque de paso ──────────────────
        function step(title, symbolic, substitution, result_str, note) {
            let html = `<div class="dev-step">`;
            html += `<div class="dev-step-title">${title}</div>`;
            html += `<div class="dev-formula-row">`;
            html += `<div class="dev-formula symbolic">${symbolic}</div>`;
            if (substitution) html += `<div class="dev-formula subst">${substitution}</div>`;
            html += `<div class="dev-formula result">${result_str}</div>`;
            html += `</div>`;
            if (note) html += `<div class="dev-note">${note}</div>`;
            html += `</div>`;
            return html;
        }

        function section(title, icon, content) {
            return `<div class="dev-group">
                <div class="dev-group-title">${icon} ${title}</div>
                ${content}
            </div>`;
        }

        // ════════════════════════════════════════════════════════════
        // BLOQUE 1: Resolución de ángulos/lados según el caso
        // ════════════════════════════════════════════════════════════
        let resolBlock = '';

        if (method.startsWith('SSS')) {
            // Ley de cosenos → 3 ángulos
            resolBlock += step(
                'Ángulo A — Ley de Cosenos',
                'cos(A) = (b² + c² − a²) / (2·b·c)',
                `cos(A) = (${f(b)}² + ${f(c)}² − ${f(a)}²) / (2·${f(b)}·${f(c)})<br>` +
                `cos(A) = (${f(b*b,4)} + ${f(c*c,4)} − ${f(a*a,4)}) / ${f(2*b*c,4)}<br>` +
                `cos(A) = ${f((b*b+c*c-a*a)/(2*b*c),6)}`,
                `A = arccos(${f((b*b+c*c-a*a)/(2*b*c),6)}) = <strong>${f(A,4)}°</strong>`,
                input.A != null ? '✔ Dato conocido — se verifica la consistencia.' : null
            );
            resolBlock += step(
                'Ángulo B — Ley de Cosenos',
                'cos(B) = (a² + c² − b²) / (2·a·c)',
                `cos(B) = (${f(a)}² + ${f(c)}² − ${f(b)}²) / (2·${f(a)}·${f(c)})<br>` +
                `cos(B) = (${f(a*a,4)} + ${f(c*c,4)} − ${f(b*b,4)}) / ${f(2*a*c,4)}<br>` +
                `cos(B) = ${f((a*a+c*c-b*b)/(2*a*c),6)}`,
                `B = arccos(${f((a*a+c*c-b*b)/(2*a*c),6)}) = <strong>${f(B,4)}°</strong>`,
                input.B != null ? '✔ Dato conocido — se verifica la consistencia.' : null
            );
            resolBlock += step(
                'Ángulo C — Suma de ángulos interiores',
                'A + B + C = 180°  →  C = 180° − A − B',
                `C = 180° − ${f(A,4)}° − ${f(B,4)}°`,
                `C = <strong>${f(C,4)}°</strong>`,
                null
            );
        }

        else if (method.startsWith('SAS')) {
            // Encontrar el lado faltante con Ley de Cosenos
            const missingSide = ['a','b','c'].find(k => input[k] == null);
            const givenAngle = ['A','B','C'].find(k => input[k] != null);
            const s1key = ['a','b','c'].filter(k => k !== missingSide)[0];
            const s2key = ['a','b','c'].filter(k => k !== missingSide)[1];
            const s1 = sol[s1key], s2 = sol[s2key], angVal = sol[givenAngle];

            resolBlock += step(
                `Lado ${missingSide} — Ley de Cosenos`,
                `${missingSide}² = ${s1key}² + ${s2key}² − 2·${s1key}·${s2key}·cos(${givenAngle})`,
                `${missingSide}² = ${f(s1)}² + ${f(s2)}² − 2·${f(s1)}·${f(s2)}·cos(${f(angVal,4)}°)<br>` +
                `${missingSide}² = ${f(s1*s1,4)} + ${f(s2*s2,4)} − ${f(2*s1*s2,4)}·${f(Math.cos(S.rad(angVal)),6)}<br>` +
                `${missingSide}² = ${f(sol[missingSide]*sol[missingSide],6)}`,
                `${missingSide} = √${f(sol[missingSide]*sol[missingSide],6)} = <strong>${f(sol[missingSide],4)}</strong>`,
                null
            );
            // Luego los dos ángulos restantes con Ley de Cosenos
            const remainAngles = ['A','B','C'].filter(L => L !== givenAngle);
            remainAngles.forEach(L => {
                const sL = L.toLowerCase();
                const otherSides = ['a','b','c'].filter(k=>k!==sL);
                const p = sol[otherSides[0]], q = sol[otherSides[1]], opp = sol[sL];
                const cosVal = (p*p + q*q - opp*opp) / (2*p*q);
                resolBlock += step(
                    `Ángulo ${L} — Ley de Cosenos`,
                    `cos(${L}) = (${otherSides[0]}² + ${otherSides[1]}² − ${sL}²) / (2·${otherSides[0]}·${otherSides[1]})`,
                    `cos(${L}) = (${f(p)}² + ${f(q)}² − ${f(opp)}²) / (2·${f(p)}·${f(q)})<br>` +
                    `cos(${L}) = ${f(cosVal,6)}`,
                    `${L} = arccos(${f(cosVal,6)}) = <strong>${f(sol[L],4)}°</strong>`,
                    null
                );
            });
        }

        else if (method.startsWith('ASA') || method.startsWith('AAS')) {
            // Deducir el tercer ángulo
            const missingAngle = ['A','B','C'].find(L => input[L] == null);
            const knownAngles = ['A','B','C'].filter(L => input[L] != null);
            resolBlock += step(
                `Ángulo ${missingAngle} — Suma de ángulos interiores`,
                `${missingAngle} = 180° − ${knownAngles[0]} − ${knownAngles[1]}`,
                `${missingAngle} = 180° − ${f(sol[knownAngles[0]],4)}° − ${f(sol[knownAngles[1]],4)}°`,
                `${missingAngle} = <strong>${f(sol[missingAngle],4)}°</strong>`,
                null
            );
            // Escala por Ley de Senos
            const knownSide = ['a','b','c'].find(k => input[k] != null);
            const knownSideAngle = knownSide.toUpperCase();
            const K = sol[knownSide] / Math.sin(S.rad(sol[knownSideAngle]));
            resolBlock += step(
                'Razón de la Ley de Senos',
                `${knownSide} / sin(${knownSideAngle}) = b / sin(B) = c / sin(C)`,
                `${f(sol[knownSide])} / sin(${f(sol[knownSideAngle],4)}°) = ${f(sol[knownSide])} / ${f(Math.sin(S.rad(sol[knownSideAngle])),6)}`,
                `Razón = <strong>${f(K,6)}</strong>`,
                null
            );
            ['a','b','c'].filter(k => k !== knownSide).forEach(sk => {
                const Lk = sk.toUpperCase();
                resolBlock += step(
                    `Lado ${sk} — Ley de Senos`,
                    `${sk} = Razón · sin(${Lk})`,
                    `${sk} = ${f(K,6)} · sin(${f(sol[Lk],4)}°) = ${f(K,6)} · ${f(Math.sin(S.rad(sol[Lk])),6)}`,
                    `${sk} = <strong>${f(sol[sk],4)}</strong>`,
                    null
                );
            });
        }

        else if (method.startsWith('SSA')) {
            const gA = ['A','B','C'].find(L => input[L] != null);
            const oppS = gA.toLowerCase();
            const otherS = ['a','b','c'].find(k => input[k] != null && k !== oppS);
            const otherA = otherS.toUpperCase();
            const sinOther = (sol[otherS] * Math.sin(S.rad(sol[gA]))) / sol[oppS];
            resolBlock += step(
                `Ángulo ${otherA} — Ley de Senos`,
                `sin(${otherA}) = ${otherS} · sin(${gA}) / ${oppS}`,
                `sin(${otherA}) = ${f(sol[otherS])} · sin(${f(sol[gA],4)}°) / ${f(sol[oppS])}<br>` +
                `sin(${otherA}) = ${f(sol[otherS])} · ${f(Math.sin(S.rad(sol[gA])),6)} / ${f(sol[oppS])}<br>` +
                `sin(${otherA}) = ${f(sinOther,6)}`,
                `${otherA} = arcsin(${f(sinOther,6)}) = <strong>${f(sol[otherA],4)}°</strong>`,
                result.warning ? `⚠ Caso ambiguo: sin(${otherA}) = ${f(sinOther,6)} también da ${otherA} = ${f(180 - sol[otherA],4)}°.` : null
            );
            const missingAngle = ['A','B','C'].find(L => !input[L] && L !== otherA);
            resolBlock += step(
                `Ángulo ${missingAngle} — Suma de ángulos`,
                `${missingAngle} = 180° − ${gA} − ${otherA}`,
                `${missingAngle} = 180° − ${f(sol[gA],4)}° − ${f(sol[otherA],4)}°`,
                `${missingAngle} = <strong>${f(sol[missingAngle],4)}°</strong>`,
                null
            );
            const missingSide = ['a','b','c'].find(k => !input[k]);
            const mA = missingSide.toUpperCase();
            resolBlock += step(
                `Lado ${missingSide} — Ley de Senos`,
                `${missingSide} / sin(${mA}) = ${oppS} / sin(${gA})`,
                `${missingSide} = ${f(sol[oppS])} · sin(${f(sol[mA],4)}°) / sin(${f(sol[gA],4)}°)<br>` +
                `${missingSide} = ${f(sol[oppS])} · ${f(Math.sin(S.rad(sol[mA])),6)} / ${f(Math.sin(S.rad(sol[gA])),6)}`,
                `${missingSide} = <strong>${f(sol[missingSide],4)}</strong>`,
                null
            );
        }

        parts.push(section('Resolución del triángulo', '🔺', resolBlock));

        // ════════════════════════════════════════════════════════════
        // BLOQUE 2: Medidas derivadas
        // ════════════════════════════════════════════════════════════
        let measBlock = '';
        measBlock += step(
            'Perímetro',
            'P = a + b + c',
            `P = ${f(a)} + ${f(b)} + ${f(c)}`,
            `P = <strong>${f(perimeter)}</strong>`,
            null
        );
        measBlock += step(
            'Semiperímetro',
            's = P / 2',
            `s = ${f(perimeter)} / 2`,
            `s = <strong>${f(s)}</strong>`,
            null
        );
        measBlock += step(
            'Área — Fórmula de Herón',
            'Área = √[ s·(s−a)·(s−b)·(s−c) ]',
            `Área = √[ ${f(s)}·(${f(s)}−${f(a)})·(${f(s)}−${f(b)})·(${f(s)}−${f(c)}) ]<br>` +
            `Área = √[ ${f(s)}·${f(s-a,4)}·${f(s-b,4)}·${f(s-c,4)} ]<br>` +
            `Área = √${f(s*(s-a)*(s-b)*(s-c),6)}`,
            `Área = <strong>${f(area)}</strong>`,
            null
        );
        measBlock += step(
            'Inradio (radio del círculo inscrito)',
            'r = Área / s',
            `r = ${f(area)} / ${f(s)}`,
            `r = <strong>${f(inradius)}</strong>`,
            null
        );
        measBlock += step(
            'Circunradio (radio del círculo circunscrito)',
            'R = a / (2·sin(A))',
            `R = ${f(a)} / (2·sin(${f(A,4)}°))<br>` +
            `R = ${f(a)} / (2·${f(Math.sin(S.rad(A)),6)})<br>` +
            `R = ${f(a)} / ${f(2*Math.sin(S.rad(A)),6)}`,
            `R = <strong>${f(circumradius)}</strong>`,
            null
        );
        measBlock += step(
            'Altura h_a (relativa al lado a)',
            'h_a = 2·Área / a',
            `h_a = 2·${f(area)} / ${f(a)}`,
            `h_a = <strong>${f(ha)}</strong>`,
            null
        );
        measBlock += step(
            'Altura h_b (relativa al lado b)',
            'h_b = 2·Área / b',
            `h_b = 2·${f(area)} / ${f(b)}`,
            `h_b = <strong>${f(hb)}</strong>`,
            null
        );
        measBlock += step(
            'Altura h_c (relativa al lado c)',
            'h_c = 2·Área / c',
            `h_c = 2·${f(area)} / ${f(c)}`,
            `h_c = <strong>${f(hc)}</strong>`,
            null
        );
        parts.push(section('Medidas derivadas', '📏', measBlock));

        // ════════════════════════════════════════════════════════════
        // BLOQUE 3: Razones trigonométricas con fórmulas
        // ════════════════════════════════════════════════════════════
        let trigBlock = '';
        ['A', 'B', 'C'].forEach(L => {
            const angDeg = sol[L];
            const tr = S.trigRatios(angDeg);
            const oppSide = L.toLowerCase();
            const adj = ['a','b','c'].filter(k => k !== oppSide);
            const hyp = type.hypotenuseSide;
            const isRight = type.byAngles === 'Rectángulo';

            trigBlock += `<div class="dev-trig-angle">
                <div class="dev-trig-label">Ángulo ${L} = ${f(angDeg,4)}° = ${f(S.rad(angDeg),6)} rad</div>
                <div class="dev-trig-grid">`;

            const row = (name, sym, val) =>
                `<div class="dtg-row">
                    <span class="dtg-name">${name}</span>
                    <span class="dtg-sym">${sym}</span>
                    <span class="dtg-val">${val}</span>
                </div>`;

            trigBlock += row('sen(' + L + ')', `sin(${f(angDeg,4)}°)`, `<strong>${S.fmtTrig(tr.sen)}</strong>`);
            trigBlock += row('cos(' + L + ')', `cos(${f(angDeg,4)}°)`, `<strong>${S.fmtTrig(tr.cos)}</strong>`);
            trigBlock += row('tan(' + L + ')', `sin(${L}) / cos(${L}) = ${S.fmtTrig(tr.sen)} / ${S.fmtTrig(tr.cos)}`, `<strong>${S.fmtTrig(tr.tan)}</strong>`);
            trigBlock += row('cot(' + L + ')', `1 / tan(${L}) = cos(${L}) / sin(${L})`, `<strong>${S.fmtTrig(tr.cot)}</strong>`);
            trigBlock += row('sec(' + L + ')', `1 / cos(${L}) = 1 / ${S.fmtTrig(tr.cos)}`, `<strong>${S.fmtTrig(tr.sec)}</strong>`);
            trigBlock += row('csc(' + L + ')', `1 / sin(${L}) = 1 / ${S.fmtTrig(tr.sen)}`, `<strong>${S.fmtTrig(tr.csc)}</strong>`);

            trigBlock += `</div></div>`;
        });
        parts.push(section('Razones trigonométricas', '📐', trigBlock));

        return parts.join('');
    }

    // ── Mostrar error ────────────────────────────────────────────────
    function showError(html) {
        errorBox.innerHTML = '❌ ' + html;
        errorBox.hidden = false;
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ── Nuevo cálculo ────────────────────────────────────────────────
    btnReset.addEventListener('click', () => {
        resultSection.hidden = true;
        errorBox.hidden = true;
        // Limpiar campos
        dynFields.querySelectorAll('input').forEach(el => {
            el.value = '';
            el.classList.remove('invalid');
        });
        // Scroll al paso 1
        document.querySelector('.case-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

})();
