// tabla.js — Tabla trigonométrica y calculadoras
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
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
