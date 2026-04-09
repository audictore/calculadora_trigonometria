// Calculadora Trigonométrica Interactiva
// Resuelve cualquier triángulo (rectángulo u oblicuángulo) en tiempo real
(function () {
    'use strict';

    // ---------------------------------------------------------------
    // Helpers matemáticos y de formato
    // ---------------------------------------------------------------
    const TOL = 1e-7;
    const rad = d => (d * Math.PI) / 180;
    const deg = r => (r * 180) / Math.PI;

    function fmt(value, decimals = 4) {
        if (value == null || !Number.isFinite(value)) return '—';
        if (Math.abs(value) < 1e-12) return '0';
        const fixed = value.toFixed(decimals);
        // Quitar ceros redundantes a la derecha (e.g., "3.5000" -> "3.5")
        return fixed.replace(/\.?0+$/, '');
    }

    function fmtAngle(degrees) {
        if (degrees == null || !Number.isFinite(degrees)) return '—';
        return `${fmt(degrees, 4)}° (${fmt(rad(degrees), 4)} rad)`;
    }

    function fmtTrig(v) {
        if (!Number.isFinite(v)) return '∞';
        return fmt(v, 4);
    }

    function parseInput(el) {
        const v = el.value.trim();
        if (v === '') return null;
        const n = Number(v);
        if (!Number.isFinite(n)) return NaN;
        return n;
    }

    // ---------------------------------------------------------------
    // Referencias al DOM
    // ---------------------------------------------------------------
    const $ = id => document.getElementById(id);

    const inputs = {
        a: $('side-a'), b: $('side-b'), c: $('side-c'),
        A: $('angle-A'), B: $('angle-B'), C: $('angle-C')
    };

    const results = {
        a: $('r-side-a'), b: $('r-side-b'), c: $('r-side-c'),
        A: $('r-angle-A'), B: $('r-angle-B'), C: $('r-angle-C'),
        perimeter: $('r-perimeter'),
        semi: $('r-semi'),
        area: $('r-area'),
        inradius: $('r-inradius'),
        circumradius: $('r-circumradius'),
        ha: $('r-h-a'), hb: $('r-h-b'), hc: $('r-h-c')
    };

    const trigCells = {};
    ['A', 'B', 'C'].forEach(L => {
        ['sen', 'cos', 'tan', 'cot', 'sec', 'csc'].forEach(fn => {
            trigCells[`${L}-${fn}`] = $(`t-${L}-${fn}`);
        });
    });

    const typeEls = {
        sides: $('r-type-sides'),
        angles: $('r-type-angles'),
        rightInfo: $('r-right-info')
    };

    const statusEl = $('status-message');
    const svgGroup = $('svg-triangle');
    const btnClear = $('btn-clear');
    const btnExample = $('btn-example');
    const btnExampleEqui = $('btn-example-equi');
    const btnExampleIso = $('btn-example-iso');
    const btnTypeRight = $('btn-type-right');
    const btnTypeEqui = $('btn-type-equi');
    const btnTypeIso45 = $('btn-type-iso45');

    // ---------------------------------------------------------------
    // Lectura y validación de entradas
    // ---------------------------------------------------------------
    function gather() {
        const out = {
            a: null, b: null, c: null, A: null, B: null, C: null,
            valid: true, errors: []
        };

        for (const k of Object.keys(inputs)) {
            const el = inputs[k];
            el.classList.remove('invalid');
            const v = parseInput(el);
            if (v === null) { out[k] = null; continue; }
            if (!Number.isFinite(v) || v <= 0) {
                out.valid = false;
                out.errors.push(`Valor inválido en "${k}" (debe ser un número positivo)`);
                el.classList.add('invalid');
                continue;
            }
            if (/^[ABC]$/.test(k) && v >= 180) {
                out.valid = false;
                out.errors.push(`El ángulo ${k} debe ser menor a 180°`);
                el.classList.add('invalid');
                continue;
            }
            out[k] = v;
        }
        return out;
    }

    function counts(t) {
        return {
            sides: ['a', 'b', 'c'].filter(k => t[k] != null).length,
            angles: ['A', 'B', 'C'].filter(k => t[k] != null).length
        };
    }

    function triangleInequalityFails(a, b, c) {
        return a + b <= c + TOL || a + c <= b + TOL || b + c <= a + TOL;
    }

    // ---------------------------------------------------------------
    // Resolutores
    // ---------------------------------------------------------------

    // SSS — Ley de Cosenos
    function solveSSS(t) {
        const { a, b, c } = t;
        if (triangleInequalityFails(a, b, c)) {
            return {
                ok: false,
                error: 'No cumple la desigualdad triangular: cada lado debe ser menor que la suma de los otros dos.'
            };
        }
        const A = deg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
        const B = deg(Math.acos((a * a + c * c - b * b) / (2 * a * c)));
        const C = 180 - A - B;
        const sol = { a, b, c, A, B, C };

        // Si el usuario también dio ángulos, verificar consistencia
        for (const L of ['A', 'B', 'C']) {
            if (t[L] != null && Math.abs(t[L] - sol[L]) > 0.5) {
                return {
                    ok: false,
                    error: `Datos inconsistentes: el ángulo ${L} dado (${fmt(t[L], 2)}°) no coincide con el calculado (${fmt(sol[L], 2)}°).`
                };
            }
        }
        return { ok: true, sol };
    }

    // ASA / AAS — Ley de Senos (los 3 ángulos ya conocidos + ≥1 lado)
    function solveASA(t) {
        // Tomar el primer (lado, ángulo correspondiente) conocido como escala
        let scaleK = null;
        for (const k of ['a', 'b', 'c']) {
            if (t[k] != null) {
                scaleK = t[k] / Math.sin(rad(t[k.toUpperCase()]));
                break;
            }
        }
        const sol = {
            A: t.A, B: t.B, C: t.C,
            a: scaleK * Math.sin(rad(t.A)),
            b: scaleK * Math.sin(rad(t.B)),
            c: scaleK * Math.sin(rad(t.C))
        };

        // Validar consistencia de cualquier lado adicional dado
        for (const s of ['a', 'b', 'c']) {
            if (t[s] != null && Math.abs(t[s] - sol[s]) > Math.max(1e-3, sol[s] * 0.005)) {
                return {
                    ok: false,
                    error: `Datos inconsistentes: el lado ${s} dado (${fmt(t[s], 3)}) no coincide con el calculado (${fmt(sol[s], 3)}).`
                };
            }
        }

        if (triangleInequalityFails(sol.a, sol.b, sol.c)) {
            return { ok: false, error: 'Los datos no forman un triángulo válido.' };
        }
        return { ok: true, sol };
    }

    // SAS — Ley de Cosenos (2 lados + ángulo entre ellos)
    function solveSAS(t, missingSideKey) {
        const otherSides = ['a', 'b', 'c'].filter(k => k !== missingSideKey);
        const s1 = t[otherSides[0]];
        const s2 = t[otherSides[1]];
        const ang = rad(t[missingSideKey.toUpperCase()]);
        const newSide = Math.sqrt(s1 * s1 + s2 * s2 - 2 * s1 * s2 * Math.cos(ang));
        const ts = { ...t, [missingSideKey]: newSide };

        if (triangleInequalityFails(ts.a, ts.b, ts.c)) {
            return { ok: false, error: 'Los datos no forman un triángulo válido.' };
        }
        // Calcular ángulos restantes con Ley de Cosenos
        const A = deg(Math.acos((ts.b * ts.b + ts.c * ts.c - ts.a * ts.a) / (2 * ts.b * ts.c)));
        const B = deg(Math.acos((ts.a * ts.a + ts.c * ts.c - ts.b * ts.b) / (2 * ts.a * ts.c)));
        const C = 180 - A - B;
        return { ok: true, sol: { a: ts.a, b: ts.b, c: ts.c, A, B, C } };
    }

    // SSA — Ley de Senos (caso ambiguo)
    function solveSSA(t) {
        const givenAngleL = ['A', 'B', 'C'].find(k => t[k] != null);
        const oppositeSideL = givenAngleL.toLowerCase();

        if (t[oppositeSideL] == null) {
            return { ok: false, error: 'Configuración SSA inválida (el ángulo dado no es opuesto a un lado conocido).' };
        }

        const otherSideL = ['a', 'b', 'c'].find(k => t[k] != null && k !== oppositeSideL);
        const otherAngleL = otherSideL.toUpperCase();

        // Ley de Senos: t[otherSide]/sin(otherAngle) = t[oppSide]/sin(givenAngle)
        const sinOther = (t[otherSideL] * Math.sin(rad(t[givenAngleL]))) / t[oppositeSideL];

        if (sinOther > 1 + TOL) {
            return {
                ok: false,
                error: `No existe triángulo con esos datos: en el caso SSA se obtiene sen(${otherAngleL}) > 1.`
            };
        }
        const clamped = Math.min(1, Math.max(-1, sinOther));
        const sol1 = deg(Math.asin(clamped));
        const sol2 = 180 - sol1;

        const valid1 = sol1 > TOL && (t[givenAngleL] + sol1) < 180 - TOL;
        const valid2 = sol2 > TOL && (t[givenAngleL] + sol2) < 180 - TOL && Math.abs(sol1 - sol2) > TOL;

        if (!valid1 && !valid2) {
            return { ok: false, error: 'No existe un triángulo válido con esos datos (caso SSA).' };
        }

        const chosen = valid1 ? sol1 : sol2;
        const warning = (valid1 && valid2)
            ? `Caso SSA ambiguo: existe un segundo triángulo válido con ${otherAngleL} ≈ ${fmt(sol2, 2)}°. Se muestra la solución con ${otherAngleL} ≈ ${fmt(sol1, 2)}°.`
            : null;

        const ts = { ...t };
        ts[otherAngleL] = chosen;
        const missingAngleL = ['A', 'B', 'C'].find(L => ts[L] == null);
        ts[missingAngleL] = 180 - ts[givenAngleL] - chosen;

        const missingSideL = ['a', 'b', 'c'].find(k => ts[k] == null);
        ts[missingSideL] = (ts[oppositeSideL] * Math.sin(rad(ts[missingAngleL]))) / Math.sin(rad(ts[givenAngleL]));

        if (triangleInequalityFails(ts.a, ts.b, ts.c)) {
            return { ok: false, error: 'Los datos no forman un triángulo válido.' };
        }
        return {
            ok: true,
            warning,
            sol: { a: ts.a, b: ts.b, c: ts.c, A: ts.A, B: ts.B, C: ts.C }
        };
    }

    // ---------------------------------------------------------------
    // Solver principal
    // ---------------------------------------------------------------
    function solveTriangle(input) {
        const t = { ...input };

        // Si tenemos 2 ángulos, deducir el tercero (sin contar como dato extra)
        const initAngles = ['A', 'B', 'C'].filter(k => t[k] != null).length;
        if (initAngles === 2) {
            const sumGiven = (t.A ?? 0) + (t.B ?? 0) + (t.C ?? 0);
            if (sumGiven >= 180 - TOL) {
                return { ok: false, error: 'La suma de los dos ángulos dados debe ser menor a 180°.' };
            }
            if (t.A == null) t.A = 180 - t.B - t.C;
            else if (t.B == null) t.B = 180 - t.A - t.C;
            else if (t.C == null) t.C = 180 - t.A - t.B;
        }
        if (initAngles === 3) {
            const sum = t.A + t.B + t.C;
            if (Math.abs(sum - 180) > 1e-3) {
                return { ok: false, error: `La suma de los tres ángulos no es 180° (es ${fmt(sum, 2)}°).` };
            }
        }

        const { sides: sGiven } = counts(input);     // datos originales
        const aGiven = initAngles;                    // datos originales
        const knownAngles = ['A', 'B', 'C'].filter(k => t[k] != null).length;

        // Datos insuficientes
        if (sGiven + aGiven < 3) {
            return { ok: false, info: needMoreDataMessage(sGiven, aGiven) };
        }
        if (sGiven === 0) {
            return { ok: false, info: 'Tienes los ángulos pero falta al menos 1 lado para determinar el tamaño del triángulo.' };
        }

        // SSS (3 lados, con o sin ángulos)
        if (sGiven === 3) {
            return solveSSS(t);
        }

        // Si conocemos los 3 ángulos (deducidos o dados) y hay ≥ 1 lado: ASA/AAS
        if (knownAngles === 3 && sGiven >= 1) {
            return solveASA(t);
        }

        // 2 lados + 1 ángulo
        if (sGiven === 2 && aGiven === 1) {
            const missingSideKey = ['a', 'b', 'c'].find(k => t[k] == null);
            const includedAngle = missingSideKey.toUpperCase();
            const givenAngle = ['A', 'B', 'C'].find(k => t[k] != null);

            if (givenAngle === includedAngle) {
                return solveSAS(t, missingSideKey);
            }
            return solveSSA(t);
        }

        return { ok: false, error: 'Combinación de datos no soportada.' };
    }

    function needMoreDataMessage(sides, angles) {
        const total = sides + angles;
        if (total === 0) return 'Ingresa al menos 3 datos (lados y/o ángulos) para resolver el triángulo.';
        if (total === 1) {
            if (sides === 1) return 'Tienes 1 lado. Necesitas 2 datos más: otro lado y un ángulo, o dos ángulos.';
            return 'Tienes 1 ángulo. Necesitas 2 datos más, e incluir al menos 1 lado.';
        }
        if (total === 2) {
            if (sides === 2 && angles === 0) return 'Tienes 2 lados. Necesitas 1 ángulo entre ellos (SAS) o el ángulo opuesto a uno (SSA), o el tercer lado (SSS).';
            if (sides === 1 && angles === 1) return 'Tienes 1 lado y 1 ángulo. Necesitas 1 dato más: otro lado o un segundo ángulo.';
            if (sides === 0 && angles === 2) return 'Tienes 2 ángulos. Necesitas al menos 1 lado para determinar el tamaño del triángulo.';
        }
        return 'Faltan datos para resolver el triángulo.';
    }

    // ---------------------------------------------------------------
    // Cálculos derivados
    // ---------------------------------------------------------------
    function computeExtras(sol) {
        const { a, b, c, A } = sol;
        const perimeter = a + b + c;
        const s = perimeter / 2;
        const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
        const inradius = area / s;
        const circumradius = a / (2 * Math.sin(rad(A)));
        const ha = (2 * area) / a;
        const hb = (2 * area) / b;
        const hc = (2 * area) / c;
        return { perimeter, semi: s, area, inradius, circumradius, ha, hb, hc };
    }

    // Clasificación del triángulo (por lados y por ángulos)
    function detectType(sol) {
        const { a, b, c, A, B, C } = sol;
        const SIDE_TOL = 1e-3;
        const ANGLE_TOL = 0.1; // grados

        // Por lados
        const ab = Math.abs(a - b) < SIDE_TOL;
        const ac = Math.abs(a - c) < SIDE_TOL;
        const bc = Math.abs(b - c) < SIDE_TOL;
        let bySides;
        if (ab && ac) bySides = 'Equilátero';
        else if (ab || ac || bc) bySides = 'Isósceles';
        else bySides = 'Escaleno';

        // Por ángulos
        const maxAngle = Math.max(A, B, C);
        let byAngles;
        if (Math.abs(maxAngle - 90) < ANGLE_TOL) byAngles = 'Rectángulo';
        else if (maxAngle > 90) byAngles = 'Obtusángulo';
        else byAngles = 'Acutángulo';

        // Identificar vértice del ángulo recto y lado hipotenusa (si aplica)
        let rightAngleVertex = null;
        let hypotenuseSide = null;
        if (byAngles === 'Rectángulo') {
            const angles = { A, B, C };
            for (const L of ['A', 'B', 'C']) {
                if (Math.abs(angles[L] - 90) < ANGLE_TOL) {
                    rightAngleVertex = L;
                    // El lado opuesto al ángulo recto es la hipotenusa
                    hypotenuseSide = L.toLowerCase();
                    break;
                }
            }
        }

        return { bySides, byAngles, rightAngleVertex, hypotenuseSide };
    }

    function renderType(sol, type) {
        typeEls.sides.textContent = type.bySides;
        typeEls.angles.textContent = type.byAngles;

        if (type.byAngles === 'Rectángulo' && type.hypotenuseSide) {
            const hyp = type.hypotenuseSide;
            const hypLen = sol[hyp];
            typeEls.rightInfo.hidden = false;
            typeEls.rightInfo.innerHTML =
                `Hipotenusa: <strong>lado ${hyp}</strong> = ${fmt(hypLen, 4)} ` +
                `(el lado más largo, opuesto al ángulo recto).<br>` +
                `Ángulo recto: <span class="pill">${type.rightAngleVertex} = 90°</span> ` +
                `(vértice opuesto a la hipotenusa).`;
        } else {
            typeEls.rightInfo.hidden = true;
            typeEls.rightInfo.innerHTML = '';
        }
    }

    function clearType() {
        typeEls.sides.textContent = '—';
        typeEls.angles.textContent = '—';
        typeEls.rightInfo.hidden = true;
        typeEls.rightInfo.innerHTML = '';
    }

    function trigRatios(angleDeg) {
        const r = rad(angleDeg);
        const sin = Math.sin(r);
        const cos = Math.cos(r);
        const tan = Math.tan(r);
        return {
            sen: sin,
            cos: cos,
            tan: Math.abs(cos) < 1e-12 ? Infinity : tan,
            cot: Math.abs(sin) < 1e-12 ? Infinity : cos / sin,
            sec: Math.abs(cos) < 1e-12 ? Infinity : 1 / cos,
            csc: Math.abs(sin) < 1e-12 ? Infinity : 1 / sin
        };
    }

    // ---------------------------------------------------------------
    // Render de resultados
    // ---------------------------------------------------------------
    function clearResults() {
        for (const k of Object.keys(results)) {
            results[k].textContent = '—';
            results[k].classList.remove('given', 'computed');
        }
        for (const id in trigCells) trigCells[id].textContent = '—';
        for (const k of ['a', 'b', 'c']) {
            const li = results[k].closest('li');
            if (li) li.classList.remove('is-hypotenuse');
        }
        clearType();
    }

    function markHypotenuseRow(hypSide) {
        for (const k of ['a', 'b', 'c']) {
            const li = results[k].closest('li');
            if (!li) continue;
            if (k === hypSide) li.classList.add('is-hypotenuse');
            else li.classList.remove('is-hypotenuse');
        }
    }

    function renderResults(input, sol) {
        const ext = computeExtras(sol);

        results.a.textContent = fmt(sol.a);
        results.b.textContent = fmt(sol.b);
        results.c.textContent = fmt(sol.c);
        results.A.textContent = fmtAngle(sol.A);
        results.B.textContent = fmtAngle(sol.B);
        results.C.textContent = fmtAngle(sol.C);
        results.perimeter.textContent = fmt(ext.perimeter);
        results.semi.textContent = fmt(ext.semi);
        results.area.textContent = fmt(ext.area);
        results.inradius.textContent = fmt(ext.inradius);
        results.circumradius.textContent = fmt(ext.circumradius);
        results.ha.textContent = fmt(ext.ha);
        results.hb.textContent = fmt(ext.hb);
        results.hc.textContent = fmt(ext.hc);

        for (const k of ['a', 'b', 'c', 'A', 'B', 'C']) {
            results[k].classList.remove('given', 'computed');
            results[k].classList.add(input[k] != null ? 'given' : 'computed');
        }

        for (const L of ['A', 'B', 'C']) {
            const tr = trigRatios(sol[L]);
            trigCells[`${L}-sen`].textContent = fmtTrig(tr.sen);
            trigCells[`${L}-cos`].textContent = fmtTrig(tr.cos);
            trigCells[`${L}-tan`].textContent = fmtTrig(tr.tan);
            trigCells[`${L}-cot`].textContent = fmtTrig(tr.cot);
            trigCells[`${L}-sec`].textContent = fmtTrig(tr.sec);
            trigCells[`${L}-csc`].textContent = fmtTrig(tr.csc);
        }
    }

    // ---------------------------------------------------------------
    // Diagrama SVG
    // ---------------------------------------------------------------
    const SVG_W = 400, SVG_H = 320, SVG_PAD = 50;
    const SVG_NS = 'http://www.w3.org/2000/svg';

    function clearSVG() {
        while (svgGroup.firstChild) svgGroup.removeChild(svgGroup.firstChild);
    }

    function svgEl(name, attrs, text) {
        const el = document.createElementNS(SVG_NS, name);
        if (attrs) for (const k of Object.keys(attrs)) el.setAttribute(k, attrs[k]);
        if (text != null) el.textContent = text;
        return el;
    }

    function showSVGPlaceholder(message) {
        clearSVG();
        svgGroup.appendChild(svgEl('text', {
            x: SVG_W / 2,
            y: SVG_H / 2,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            class: 'svg-placeholder'
        }, message));
    }

    function drawTriangle(sol, type) {
        clearSVG();
        const { a, b, c, A, B, C } = sol;
        const hypSide = type ? type.hypotenuseSide : null;
        const rightVertex = type ? type.rightAngleVertex : null;

        // Coordenadas en espacio matemático (Y hacia arriba)
        let Ap, Bp, Cp;

        if (rightVertex) {
            // Layout tipo "libro de texto": ángulo recto en el origen,
            // cateto largo horizontal (+X), cateto corto vertical (+Y).
            // Los lados que se encuentran en un vértice se llaman con la letra
            // del tercer vértice: A → {b→C, c→B}, B → {a→C, c→A}, C → {a→B, b→A}.
            const legMap = {
                A: [{ other: 'B', sideName: 'c' }, { other: 'C', sideName: 'b' }],
                B: [{ other: 'A', sideName: 'c' }, { other: 'C', sideName: 'a' }],
                C: [{ other: 'A', sideName: 'b' }, { other: 'B', sideName: 'a' }]
            };
            const legs = legMap[rightVertex].map(l => ({ ...l, length: sol[l.sideName] }));
            legs.sort((x, y) => y.length - x.length); // el cateto más largo va horizontal
            const [horizontalLeg, verticalLeg] = legs;

            const pos = { A: null, B: null, C: null };
            pos[rightVertex] = { x: 0, y: 0 };
            pos[horizontalLeg.other] = { x: horizontalLeg.length, y: 0 };
            pos[verticalLeg.other] = { x: 0, y: verticalLeg.length };
            Ap = pos.A; Bp = pos.B; Cp = pos.C;
        } else {
            Ap = { x: 0, y: 0 };
            Bp = { x: c, y: 0 };
            Cp = { x: b * Math.cos(rad(A)), y: b * Math.sin(rad(A)) };
        }

        const xs = [Ap.x, Bp.x, Cp.x];
        const ys = [Ap.y, Bp.y, Cp.y];
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const w = maxX - minX || 1;
        const h = maxY - minY || 1;
        const scale = Math.min((SVG_W - 2 * SVG_PAD) / w, (SVG_H - 2 * SVG_PAD) / h);

        // Centrar el triángulo en el SVG (mapeo math y-arriba -> svg y-abajo)
        const offsetX = SVG_W / 2 - ((minX + maxX) / 2) * scale;
        const offsetY = SVG_H / 2 + ((minY + maxY) / 2) * scale;

        const toSvg = p => ({
            x: p.x * scale + offsetX,
            y: -p.y * scale + offsetY
        });

        const sA = toSvg(Ap), sB = toSvg(Bp), sC = toSvg(Cp);

        // Triángulo lleno
        svgGroup.appendChild(svgEl('polygon', {
            points: `${sA.x},${sA.y} ${sB.x},${sB.y} ${sC.x},${sC.y}`,
            class: 'svg-fill'
        }));

        // Lados — resaltar hipotenusa si aplica
        const sideClass = which => 'svg-side' + (hypSide === which ? ' hypotenuse' : '');
        svgGroup.appendChild(svgEl('line', { x1: sB.x, y1: sB.y, x2: sC.x, y2: sC.y, class: sideClass('a') }));
        svgGroup.appendChild(svgEl('line', { x1: sA.x, y1: sA.y, x2: sC.x, y2: sC.y, class: sideClass('b') }));
        svgGroup.appendChild(svgEl('line', { x1: sA.x, y1: sA.y, x2: sB.x, y2: sB.y, class: sideClass('c') }));

        // Vértices
        for (const p of [sA, sB, sC]) {
            svgGroup.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 3.5, class: 'svg-vertex' }));
        }

        // Etiquetas de vértices (alejadas del centroide)
        const cent = { x: (sA.x + sB.x + sC.x) / 3, y: (sA.y + sB.y + sC.y) / 3 };
        const placeVertexLabel = (p, txt) => {
            const dx = p.x - cent.x, dy = p.y - cent.y;
            const m = Math.hypot(dx, dy) || 1;
            return svgEl('text', {
                x: p.x + (dx / m) * 22,
                y: p.y + (dy / m) * 22,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                class: 'svg-vertex-label'
            }, txt);
        };
        svgGroup.appendChild(placeVertexLabel(sA, 'A'));
        svgGroup.appendChild(placeVertexLabel(sB, 'B'));
        svgGroup.appendChild(placeVertexLabel(sC, 'C'));

        // Etiquetas de lados (en el medio, hacia afuera)
        const placeSideLabel = (p1, p2, opposite, txt, isHyp) => {
            const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
            let dx = mx - opposite.x, dy = my - opposite.y;
            const m = Math.hypot(dx, dy) || 1;
            const offset = isHyp ? 20 : 16;
            return svgEl('text', {
                x: mx + (dx / m) * offset,
                y: my + (dy / m) * offset,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                class: isHyp ? 'svg-hyp-label' : 'svg-side-label'
            }, txt);
        };
        const sideLabel = (which, val) =>
            `${which} = ${fmt(val, 3)}` + (hypSide === which ? '  (hipotenusa)' : '');
        svgGroup.appendChild(placeSideLabel(sB, sC, sA, sideLabel('a', a), hypSide === 'a'));
        svgGroup.appendChild(placeSideLabel(sA, sC, sB, sideLabel('b', b), hypSide === 'b'));
        svgGroup.appendChild(placeSideLabel(sA, sB, sC, sideLabel('c', c), hypSide === 'c'));

        // Arcos de ángulos
        drawAngleArc(sA, sB, sC, A, 'A', rightVertex === 'A');
        drawAngleArc(sB, sC, sA, B, 'B', rightVertex === 'B');
        drawAngleArc(sC, sA, sB, C, 'C', rightVertex === 'C');
    }

    function drawAngleArc(vertex, p1, p2, angleDeg, label, isRight) {
        const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
        const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
        const len1 = Math.hypot(v1.x, v1.y) || 1;
        const len2 = Math.hypot(v2.x, v2.y) || 1;
        const radius = Math.min(len1, len2) * (isRight ? 0.18 : 0.22);

        const start = { x: vertex.x + (v1.x / len1) * radius, y: vertex.y + (v1.y / len1) * radius };
        const end = { x: vertex.x + (v2.x / len2) * radius, y: vertex.y + (v2.y / len2) * radius };

        // En SVG (y hacia abajo): cross > 0 ⇒ v2 está en sentido horario respecto a v1 ⇒ sweep=1
        const cross = v1.x * v2.y - v1.y * v2.x;
        const sweep = cross > 0 ? 1 : 0;
        const largeArc = 0; // ángulo siempre < 180°

        if (isRight || Math.abs(angleDeg - 90) < 0.5) {
            // Cuadradito relleno para marcar ángulo recto
            const sq = radius * 0.9;
            const u1x = (v1.x / len1) * sq, u1y = (v1.y / len1) * sq;
            const u2x = (v2.x / len2) * sq, u2y = (v2.y / len2) * sq;
            const corner = { x: vertex.x + u1x + u2x, y: vertex.y + u1y + u2y };
            const d = `M ${vertex.x} ${vertex.y} ` +
                `L ${vertex.x + u1x} ${vertex.y + u1y} ` +
                `L ${corner.x} ${corner.y} ` +
                `L ${vertex.x + u2x} ${vertex.y + u2y} Z`;
            svgGroup.appendChild(svgEl('path', { d, class: 'svg-right-square' }));
        } else {
            svgGroup.appendChild(svgEl('path', {
                d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`,
                class: 'svg-angle-arc'
            }));
        }

        // Etiqueta del ángulo, sobre la bisectriz
        const bx = v1.x / len1 + v2.x / len2;
        const by = v1.y / len1 + v2.y / len2;
        const bm = Math.hypot(bx, by) || 1;
        const labelText = isRight
            ? `${label} = 90° ⟂`
            : `${label} = ${fmt(angleDeg, 1)}°`;
        svgGroup.appendChild(svgEl('text', {
            x: vertex.x + (bx / bm) * (radius + 18),
            y: vertex.y + (by / bm) * (radius + 18),
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            class: 'svg-angle-label'
        }, labelText));
    }

    // ---------------------------------------------------------------
    // Mensajes de estado
    // ---------------------------------------------------------------
    function setStatus(message, kind) {
        statusEl.className = 'status-message ' + (kind || 'info');
        statusEl.textContent = message;
    }

    // ---------------------------------------------------------------
    // Loop principal de actualización
    // ---------------------------------------------------------------
    function update() {
        const input = gather();
        if (!input.valid) {
            setStatus('Error: ' + input.errors.join('. '), 'error');
            clearResults();
            showSVGPlaceholder('Datos inválidos');
            return;
        }

        const result = solveTriangle(input);
        if (!result.ok) {
            if (result.info) {
                setStatus(result.info, 'info');
            } else {
                setStatus('Error: ' + (result.error || 'No se pudo resolver el triángulo.'), 'error');
            }
            clearResults();
            showSVGPlaceholder(result.info ? 'Esperando datos…' : 'Datos inválidos');
            return;
        }

        const type = detectType(result.sol);
        renderResults(input, result.sol);
        renderType(result.sol, type);
        markHypotenuseRow(type.hypotenuseSide);
        drawTriangle(result.sol, type);

        const typeLabel = `${type.byAngles} · ${type.bySides}`;
        if (result.warning) {
            setStatus(`Triángulo resuelto (${typeLabel}). ${result.warning}`, 'warning');
        } else {
            setStatus(`Triángulo resuelto correctamente (${typeLabel}).`, 'success');
        }
    }

    // ---------------------------------------------------------------
    // Eventos
    // ---------------------------------------------------------------
    Object.values(inputs).forEach(el => el.addEventListener('input', update));

    btnClear.addEventListener('click', () => {
        Object.values(inputs).forEach(el => {
            el.value = '';
            el.classList.remove('invalid');
        });
        update();
    });

    // Ejemplo: Triángulo rectángulo 3-4-5
    btnExample.addEventListener('click', () => {
        Object.values(inputs).forEach(el => el.value = '');
        inputs.a.value = '3';
        inputs.b.value = '4';
        inputs.c.value = '5';
        update();
    });

    // Ejemplo: Equilátero de lado 6
    btnExampleEqui.addEventListener('click', () => {
        Object.values(inputs).forEach(el => el.value = '');
        inputs.a.value = '6';
        inputs.b.value = '6';
        inputs.c.value = '6';
        update();
    });

    // Ejemplo: Isósceles con a = b = 5, c = 6
    btnExampleIso.addEventListener('click', () => {
        Object.values(inputs).forEach(el => el.value = '');
        inputs.a.value = '5';
        inputs.b.value = '5';
        inputs.c.value = '6';
        update();
    });

    // Presets de tipo: rellenan ángulos típicos y dejan al usuario completar lados
    btnTypeRight.addEventListener('click', () => {
        inputs.C.value = '90';
        update();
        (inputs.a.value ? inputs.b : inputs.a).focus();
    });

    btnTypeEqui.addEventListener('click', () => {
        inputs.A.value = '60';
        inputs.B.value = '60';
        inputs.C.value = '60';
        if (!inputs.a.value && !inputs.b.value && !inputs.c.value) {
            inputs.a.value = '1';
        }
        update();
        inputs.a.focus();
        inputs.a.select();
    });

    btnTypeIso45.addEventListener('click', () => {
        inputs.A.value = '45';
        inputs.B.value = '45';
        inputs.C.value = '90';
        update();
        (inputs.a.value ? inputs.b : inputs.a).focus();
    });

    // Render inicial
    update();
})();
