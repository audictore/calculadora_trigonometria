// solver.js — Motor matemático compartido entre páginas
// Expone el objeto global TriSolver
const TriSolver = (function () {
    'use strict';

    const TOL = 1e-7;
    const rad = d => (d * Math.PI) / 180;
    const deg = r => (r * 180) / Math.PI;

    // ── Formato ─────────────────────────────────────────────────────
    function fmt(value, decimals = 4) {
        if (value == null || !Number.isFinite(value)) return '—';
        if (Math.abs(value) < 1e-12) return '0';
        return value.toFixed(decimals).replace(/\.?0+$/, '');
    }

    function fmtAngle(degrees) {
        if (degrees == null || !Number.isFinite(degrees)) return '—';
        return `${fmt(degrees, 4)}° (${fmt(rad(degrees), 4)} rad)`;
    }

    function fmtTrig(v) {
        if (!Number.isFinite(v)) return '∞';
        return fmt(v, 4);
    }

    // ── Utilidades internas ─────────────────────────────────────────
    function counts(t) {
        return {
            sides: ['a', 'b', 'c'].filter(k => t[k] != null).length,
            angles: ['A', 'B', 'C'].filter(k => t[k] != null).length
        };
    }

    function triangleInequalityFails(a, b, c) {
        return a + b <= c + TOL || a + c <= b + TOL || b + c <= a + TOL;
    }

    // ── Resolutores ─────────────────────────────────────────────────

    // SSS — Ley de Cosenos
    function solveSSS(t) {
        const { a, b, c } = t;
        if (triangleInequalityFails(a, b, c)) {
            return { ok: false, error: 'No cumple la desigualdad triangular: cada lado debe ser menor que la suma de los otros dos.' };
        }
        const A = deg(Math.acos(Math.min(1, Math.max(-1, (b * b + c * c - a * a) / (2 * b * c)))));
        const B = deg(Math.acos(Math.min(1, Math.max(-1, (a * a + c * c - b * b) / (2 * a * c)))));
        const C = 180 - A - B;
        const sol = { a, b, c, A, B, C };
        for (const L of ['A', 'B', 'C']) {
            if (t[L] != null && Math.abs(t[L] - sol[L]) > 0.5) {
                return { ok: false, error: `Datos inconsistentes: el ángulo ${L} dado (${fmt(t[L], 2)}°) no coincide con el calculado (${fmt(sol[L], 2)}°).` };
            }
        }
        return { ok: true, sol, method: 'SSS · Ley de Cosenos' };
    }

    // ASA / AAS — Ley de Senos
    function solveASA(t) {
        let scaleK = null;
        for (const k of ['a', 'b', 'c']) {
            if (t[k] != null) { scaleK = t[k] / Math.sin(rad(t[k.toUpperCase()])); break; }
        }
        const sol = {
            A: t.A, B: t.B, C: t.C,
            a: scaleK * Math.sin(rad(t.A)),
            b: scaleK * Math.sin(rad(t.B)),
            c: scaleK * Math.sin(rad(t.C))
        };
        for (const s of ['a', 'b', 'c']) {
            if (t[s] != null && Math.abs(t[s] - sol[s]) > Math.max(1e-3, sol[s] * 0.005)) {
                return { ok: false, error: `Datos inconsistentes: el lado ${s} dado (${fmt(t[s], 3)}) no coincide con el calculado (${fmt(sol[s], 3)}).` };
            }
        }
        if (triangleInequalityFails(sol.a, sol.b, sol.c)) {
            return { ok: false, error: 'Los datos no forman un triángulo válido.' };
        }
        return { ok: true, sol, method: 'ASA / AAS · Ley de Senos' };
    }

    // SAS — Ley de Cosenos
    function solveSAS(t, missingSideKey) {
        const otherSides = ['a', 'b', 'c'].filter(k => k !== missingSideKey);
        const s1 = t[otherSides[0]], s2 = t[otherSides[1]];
        const ang = rad(t[missingSideKey.toUpperCase()]);
        const newSide = Math.sqrt(s1 * s1 + s2 * s2 - 2 * s1 * s2 * Math.cos(ang));
        const ts = { ...t, [missingSideKey]: newSide };
        if (triangleInequalityFails(ts.a, ts.b, ts.c)) {
            return { ok: false, error: 'Los datos no forman un triángulo válido.' };
        }
        const A = deg(Math.acos(Math.min(1, Math.max(-1, (ts.b * ts.b + ts.c * ts.c - ts.a * ts.a) / (2 * ts.b * ts.c)))));
        const B = deg(Math.acos(Math.min(1, Math.max(-1, (ts.a * ts.a + ts.c * ts.c - ts.b * ts.b) / (2 * ts.a * ts.c)))));
        const C = 180 - A - B;
        return { ok: true, sol: { a: ts.a, b: ts.b, c: ts.c, A, B, C }, method: 'SAS · Ley de Cosenos' };
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
        const sinOther = (t[otherSideL] * Math.sin(rad(t[givenAngleL]))) / t[oppositeSideL];
        if (sinOther > 1 + TOL) {
            return { ok: false, error: `No existe triángulo: sen(${otherAngleL}) = ${fmt(sinOther, 4)} > 1.` };
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
        return { ok: true, warning, sol: { a: ts.a, b: ts.b, c: ts.c, A: ts.A, B: ts.B, C: ts.C }, method: 'SSA · Ley de Senos (caso ambiguo)' };
    }

    // ── Solver principal ─────────────────────────────────────────────
    function solveTriangle(input) {
        const t = { ...input };
        const initAngles = ['A', 'B', 'C'].filter(k => t[k] != null).length;
        if (initAngles === 2) {
            const sumGiven = (t.A ?? 0) + (t.B ?? 0) + (t.C ?? 0);
            if (sumGiven >= 180 - TOL) return { ok: false, error: 'La suma de los dos ángulos dados debe ser menor a 180°.' };
            if (t.A == null) t.A = 180 - t.B - t.C;
            else if (t.B == null) t.B = 180 - t.A - t.C;
            else t.C = 180 - t.A - t.B;
        }
        if (initAngles === 3) {
            const sum = t.A + t.B + t.C;
            if (Math.abs(sum - 180) > 1e-3) return { ok: false, error: `La suma de los ángulos no es 180° (es ${fmt(sum, 2)}°).` };
        }
        const { sides: sGiven } = counts(input);
        const aGiven = initAngles;
        const knownAngles = ['A', 'B', 'C'].filter(k => t[k] != null).length;
        if (sGiven + aGiven < 3) return { ok: false, info: needMoreDataMessage(sGiven, aGiven) };
        if (sGiven === 0) return { ok: false, info: 'Tienes los ángulos pero falta al menos 1 lado para determinar el tamaño del triángulo.' };
        if (sGiven === 3) return solveSSS(t);
        if (knownAngles === 3 && sGiven >= 1) return solveASA(t);
        if (sGiven === 2 && aGiven === 1) {
            const missingSideKey = ['a', 'b', 'c'].find(k => t[k] == null);
            const givenAngle = ['A', 'B', 'C'].find(k => t[k] != null);
            if (givenAngle === missingSideKey.toUpperCase()) return solveSAS(t, missingSideKey);
            return solveSSA(t);
        }
        return { ok: false, error: 'Combinación de datos no soportada.' };
    }

    function needMoreDataMessage(sides, angles) {
        const total = sides + angles;
        if (total === 0) return 'Ingresa al menos 3 datos (lados y/o ángulos) para resolver el triángulo.';
        if (total === 1) {
            if (sides === 1) return 'Tienes 1 lado. Necesitas 2 datos más: otro lado y un ángulo, o dos ángulos.';
            return 'Tienes 1 ángulo. Necesitas 2 datos más e incluir al menos 1 lado.';
        }
        if (total === 2) {
            if (sides === 2) return 'Tienes 2 lados. Necesitas el ángulo entre ellos (SAS), el ángulo opuesto a uno (SSA), o el tercer lado (SSS).';
            if (sides === 1) return 'Tienes 1 lado y 1 ángulo. Necesitas 1 dato más: otro lado o un segundo ángulo.';
            return 'Tienes 2 ángulos. Necesitas al menos 1 lado para determinar el tamaño del triángulo.';
        }
        return 'Faltan datos para resolver el triángulo.';
    }

    // ── Cálculos derivados ───────────────────────────────────────────
    function computeExtras(sol) {
        const { a, b, c, A } = sol;
        const perimeter = a + b + c;
        const s = perimeter / 2;
        const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
        const inradius = area / s;
        const circumradius = a / (2 * Math.sin(rad(A)));
        return { perimeter, semi: s, area, inradius, circumradius, ha: (2 * area) / a, hb: (2 * area) / b, hc: (2 * area) / c };
    }

    function detectType(sol) {
        const { a, b, c, A, B, C } = sol;
        const ST = 1e-3, AT = 0.5;
        const ab = Math.abs(a - b) < ST, ac = Math.abs(a - c) < ST, bc = Math.abs(b - c) < ST;
        const bySides = (ab && ac) ? 'Equilátero' : (ab || ac || bc) ? 'Isósceles' : 'Escaleno';
        const maxAng = Math.max(A, B, C);
        let byAngles = Math.abs(maxAng - 90) < AT ? 'Rectángulo' : maxAng > 90 ? 'Obtusángulo' : 'Acutángulo';
        // Respaldo: verificar teorema de Pitágoras para detectar triángulos rectángulos
        // escalenos donde el ángulo calculado puede desviarse ligeramente de 90°
        if (byAngles !== 'Rectángulo') {
            const sorted = [a, b, c].slice().sort((x, y) => x - y);
            if (Math.abs(sorted[0] ** 2 + sorted[1] ** 2 - sorted[2] ** 2) < sorted[2] ** 2 * 1e-4) {
                byAngles = 'Rectángulo';
            }
        }
        let rightAngleVertex = null, hypotenuseSide = null;
        if (byAngles === 'Rectángulo') {
            // Buscar el vértice más cercano a 90° (robusto ante errores de redondeo)
            let minDiff = Infinity;
            for (const L of ['A', 'B', 'C']) {
                const d = Math.abs(sol[L] - 90);
                if (d < minDiff) { minDiff = d; rightAngleVertex = L; hypotenuseSide = L.toLowerCase(); }
            }
        }
        return { bySides, byAngles, rightAngleVertex, hypotenuseSide };
    }

    function trigRatios(angleDeg) {
        const r = rad(angleDeg);
        const sin = Math.sin(r), cos = Math.cos(r), tan = Math.tan(r);
        return {
            sen: sin, cos,
            tan: Math.abs(cos) < 1e-12 ? Infinity : tan,
            cot: Math.abs(sin) < 1e-12 ? Infinity : cos / sin,
            sec: Math.abs(cos) < 1e-12 ? Infinity : 1 / cos,
            csc: Math.abs(sin) < 1e-12 ? Infinity : 1 / sin
        };
    }

    return { solveTriangle, computeExtras, detectType, trigRatios, needMoreDataMessage, fmt, fmtAngle, fmtTrig, rad, deg };
})();
