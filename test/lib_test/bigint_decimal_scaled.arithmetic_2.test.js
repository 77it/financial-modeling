//@ts-nocheck
//<file bigint_decimal_scaled.arithmetic_2.test.js>

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

import {
  stringToBigIntScaled,
  bigIntScaledToString,
  fxAdd,
  fxSub,
  fxMul,
  fxDiv,
  _TEST_ONLY__set
} from '../../src/lib/bigint_decimal_scaled.arithmetic.js';
import { Decimal } from '../../vendor/decimaljs/decimal.js';

// ========= Shared helpers =========
const SCALE = 20;

function S(x) { return stringToBigIntScaled(String(x)); }
function toStr(sig) { return bigIntScaledToString(sig, { trim: true }); }
function expandExp(str) {
  const s = String(str);
  if (!/[eE]/.test(s)) return s;
  const m = s.match(/^([+-]?)(\d+(?:\.\d+)?)[eE]([+-]?\d+)$/);
  if (!m) return s;
  const sign = m[1] || '';
  const digits = m[2].replace('.', '');
  const exp = parseInt(m[3], 10);
  const dotPos = (m[2].split('.')[0] || '').length;
  const newPos = dotPos + exp;
  if (newPos <= 0) return sign + '0.' + '0'.repeat(-newPos) + digits.replace(/^0+/, '') || '0';
  if (newPos >= digits.length) return sign + digits + '0'.repeat(newPos - digits.length);
  return sign + digits.slice(0, newPos) + '.' + digits.slice(newPos);
}
function assertFx(opName, a, b, expected) {
  const A = S(a), B = S(b);
  let R;
  switch (opName) {
    case 'add': R = fxAdd(A, B); break;
    case 'sub': R = fxSub(A, B); break;
    case 'mul': R = fxMul(A, B); break;
    case 'div': R = fxDiv(A, B); break;
    default: throw new Error('Unknown op: ' + opName);
  }
  const got = toStr(R);
  const want = expandExp(expected);
  assert.strictEqual(got, want, `${opName}(${a}, ${b}) -> got ${got}, want ${want}`);
}
function assertThrows(fn, msg) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  if (!threw) assert.fail(msg || 'Expected throw, but did not throw');
}

// ========= Deterministic vectors @ HALF_UP =========
t('SETUP HALF_UP (global)', () => {
  _TEST_ONLY__set({ decimalScale: SCALE, accountingDecimalPlaces: 4, roundingMode: "HALF_UP" });
});

t('fxAdd (plus) – basics, carries, signs, zeros', () => {
  const V = [
    // trivial/identities
    ['0', '0', '0'], ['1', '0', '1'], ['-1', '0', '-1'], ['0', '1', '1'],
    // small decimals
    ['0.1', '0.2', '0.3'], ['0.01', '-0.01', '0'], ['-0.00000000000000000001', '0.00000000000000000001', '0'],
    // carries across decimal point
    ['0.9999', '0.0001', '1'], ['1.999', '0.001', '2'],
    // signs
    ['-5', '2', '-3'], ['-2.5', '-2.5', '-5'], ['5', '-2.75', '2.25'],
    // long fraction strings
    ['123456789.987654321', '0.012345679', '123456790'],
    // mixing exponents & plain
    ['1e-14', '1', '1.00000000000001'], ['-1e-14', '-1', '-1.00000000000001'],
    // trimming
    ['111.1111111110000', '0', '111.111111111'],
    // large magnitudes
    ['9999999999999999', '1', '10000000000000000'],
    ['9999999999999999.99999999999999999999', '0.00000000000000000001', '10000000000000000'],
    // cancellation
    ['-123456789.123456789123456789', '123456789.123456789123456789', '0'],
  ];
  for (const [a,b,exp] of V) assertFx('add', a, b, exp);
});

t('fxSub (minus) – basics, borrows, signs, zeros', () => {
  const V = [
    ['0', '0', '0'], ['1', '0', '1'], ['0', '1', '-1'], ['-1', '0', '-1'],
    ['0.3', '0.1', '0.2'], ['0.01', '0.01', '0'], ['0', '0.00000000000000000001', '-0.00000000000000000001'],
    // borrow over decimal point
    ['1.0000', '0.0001', '0.9999'], ['2', '0.001', '1.999'],
    // signs
    ['-5', '2', '-7'], ['5', '-2.75', '7.75'], ['-2.5', '-2.5', '0'],
    // exponents
    ['1', '1e-14', '0.99999999999999'],
    // large magnitudes
    ['10000000000000000', '1', '9999999999999999'],
    // cancellation
    ['123456789.123456789123456789', '123456789.123456789123456789', '0'],
  ];
  for (const [a,b,exp] of V) assertFx('sub', a, b, exp);
});

t('fxMul (times) – scale growth, signs, tiny/huge, rounding sanity', () => {
  const V = [
    // identities
    ['0', 'X', '0', ['-5','5','0.00001','1e-20','9999999999.9999999999']], // special handling below
    // simple
    ['2', '3', '6'], ['-2', '3', '-6'], ['-2', '-3', '6'],
    // decimals
    ['0.1', '0.2', '0.02'], ['-0.01', '0.01', '-0.0001'],
    // exponent parsing
    ['3.345e-9', '1', '0.000000003345'],
    // large*large
    // exact integer result: 9,999,999,999.9999999999 * 10,000,000,000 = 99,999,999,999,999,999,999
    ['9999999999.9999999999', '10000000000', '99999999999999999999'],
    // small*small
    // true product ≈ 5.49081854961890952566e-12 → -0.00000000000549081855 at 20dp
    ['0.0000023432495704937', '-0.0000023432495704937', '-0.00000000000549081855'],
    // carry/trim
    ['03.333', '-4', '-13.332'],
    ['43534.5435', '0.054645', '2378.9451295575'],
    // alternating signs
    ['9.99', '-9.99', '-99.8001'],
    // huge magnitude balance (ensures no overflow in string Handling)
    ['12345678901234567890', '98765432109876543210', '1219326311370217952237463801111263526900'],
  ];
  // handle identity with multiple "X" right-ops
  for (const x of V[0][3]) assertFx('mul', V[0][0], x, '0');
  // the rest
  for (const row of V.slice(1)) assertFx('mul', row[0], row[1], row[2]);
});

t('fxDiv (divide) – exact, recurring, sign matrix, HALF_UP at 20dp', () => {
  const V = [
    // exact
    ['6', '3', '2'], ['-6', '3', '-2'], ['-6', '-3', '2'], ['1', '4', '0.25'],
    // recurring rounded to 20dp HALF_UP
    ['1', '3', '0.33333333333333333333'],
    ['2', '7', '0.28571428571428571429'],
    ['10', '6', '1.66666666666666666667'],
    ['5', '6', '0.83333333333333333333'],
    ['22', '7', '3.14285714285714285714'],
    // small divisors / large results
    ['0.5', '1e-20', '50000000000000000000'],
    ['-0.5', '1e-20', '-50000000000000000000'],
    // sub-1 by large
    ['1', '99999999999999999999', '0.00000000000000000001'],
    // signs matrix
    ['-1', '0.0019', '-526.31578947368421052632'],
    ['7', '-3', '-2.33333333333333333333'],
    // scale stress
    // NOTE: inputs are parsed to base scale first. The divisor has 29 frac digits
    // and is rounded to 20dp during parsing (fixed-point contract), i.e. 1.23456789e-12.
    // With that, the 20dp result becomes an exact integer at scale:
    ['123456789.123456789123456789', '0.00000000000123456789123456789', '100000000100000000100'],
  ];
  for (const [a,b,exp] of V) assertFx('div', a, b, exp);

  // division by zero throws
  assertThrows(() => fxDiv(S('1'), S('0')), 'dividing by zero must throw');
});

// ========= Mode flip: HALF_EVEN quick sanity (keeps scale 20) =========
t('SETUP HALF_EVEN (global)', () => {
  _TEST_ONLY__set({ decimalScale: SCALE, accountingDecimalPlaces: 4, roundingMode: "HALF_EVEN" });
});

t('HALF_EVEN – sanity vs HALF_UP tie behavior (constructed ties)', () => {
  // We construct values whose exact result has a 21st digit exactly 5 and trailing zeros.
  // For HALF_EVEN, last kept digit should become even; HALF_UP should always round up.
  // We verify internal consistency by performing the same operation two ways to hit a tie.
  // Case:  (1e-20 * 15) / 3  = 5e-20  (exact 0.000...0005 with 19 zeros before 5)
  const a = S('0.00000000000000000015'); // 15e-20
  const b = S('3');
  const r = toStr(fxDiv(a, b));         // exact 5e-21? Wait, compute: 1.5e-19 / 3 = 5e-20
  // 5e-20 should render as "0.00000000000000000005" (no rounding needed)
  assert.strictEqual(r, '0.00000000000000000005');

  // A crafted multiply that places 21st digit = 5 with zeros after:
  // (1 + 5e-21) * 1  -> exact; formatting should keep 20dp, last kept digit depends on mode when reducing internal guard (your mul rounds once).
  // We build it additively so it's unambiguous:
  const x = S('1');
  const delta = S('0.000000000000000000005'); // 5e-21
  const y = fxAdd(x, delta);
  const yStr = toStr(y);
  // HALF_EVEN at 20dp: 1.00000000000000000000 (since 21st digit is exactly 5, previous digit is 0 (even) => stays)
  assert.strictEqual(yStr, '1');
});

// ========= Algebraic properties (within fixed-point semantics) =========
t('Algebraic properties – commutativity, associativity (add), identities', () => {
  const A = ['0', '1', '-1', '0.1', '-0.1', '123456.78910111213', '-999999999.99999999999999999999'];
  for (const a of A) for (const b of A) {
    // add commutativity
    assert.strictEqual(toStr(fxAdd(S(a), S(b))), toStr(fxAdd(S(b), S(a))));
    // mul commutativity
    assert.strictEqual(toStr(fxMul(S(a), S(b))), toStr(fxMul(S(b), S(a))));
  }
  // additive identity
  for (const a of A) assert.strictEqual(toStr(fxAdd(S(a), S('0'))), expandExp(a).replace(/^(-?)0+(\d)/, '$1$2'));
  // additive inverse
  const negate = s => {
    const x = expandExp(s);
    return x[0] === '-' ? x.slice(1) : '-' + x;
  };
  for (const a of A) assert.strictEqual(toStr(fxAdd(S(a), S(negate(a)))), '0');
  // associativity (addition) – exact for fixed-point
  const B = ['0.00000000000000000001', '1', '-2.5'];
  for (const a of B) for (const b of B) for (const c of B) {
    const left = toStr(fxAdd(fxAdd(S(a), S(b)), S(c)));
    const right = toStr(fxAdd(S(a), fxAdd(S(b), S(c))));
    assert.strictEqual(left, right);
  }
});

// ========= Mixed massive vector sweep (hand-picked) =========
t('Massive vector sweep (hand-picked pairs) – all ops', () => {
  _TEST_ONLY__set({ decimalScale: SCALE, accountingDecimalPlaces: 4, roundingMode: "HALF_UP" }); // back to HALF_UP

  const A = [
    '0','-0','1','-1','2','-2','10','-10',
    '0.00000000000000000001','-0.00000000000000000001',
    '123456789.123456789123456789',
    '-987654321.987654321987654321',
    '9999999999999999.99999999999999999999',
    '-9999999999999999.99999999999999999999',
    '1e-14','-1e-14','3.14159265358979323846','-2.71828182845904523536',
    '43534.5435','0.054645','-0.054645','03.333','-4'
  ];
  const B = [
    '0','1','-1','2','-2','10','-10','0.00000000000000000001','-0.00000000000000000001',
    '7','-7','13','-13','111.1111111110000','-111.1111111110000',
    '1e-20','-1e-20','5e19','-5e19','10000000000','-10000000000'
  ];

  for (const a of A) for (const b of B) {
    // addition/subtraction
    const add = toStr(fxAdd(S(a), S(b)));
    const sub = toStr(fxSub(S(a), S(b)));
    // sanity: add - b == a
    assert.strictEqual(toStr(fxSub(S(add), S(b))), toStr(S(expandExp(a))));
    // sanity: a - (a - b) == b
    // normalize 'b' through engine to match your trimmed formatting (e.g. "111...0000" -> "111...")
    assert.strictEqual(toStr(fxSub(S(a), S(sub))), toStr(S(expandExp(b))));

    // multiplication identities
    assert.strictEqual(toStr(fxMul(S(a), S('0'))), '0');
    assert.strictEqual(toStr(fxMul(S(a), S('1'))), toStr(S(expandExp(a))));

    // division sanity (skip b==0)
    if (expandExp(b) !== '0') {
      const d = toStr(fxDiv(S(a), S(b)));
      // a ≈ d*b (exact when finite; otherwise rounded) — check back-substitute through our engine
      const back = toStr(fxMul(S(d), S(b)));
      // Allow |a - back| ≤ 0.5*|b| + 0.5 ulps (division + multiplication rounding).
      const diffSig = fxSub(S(expandExp(a)), S(back));   // scaled BigInt difference (in ulps)
      const diffAbs = diffSig < 0n ? -diffSig : diffSig;
      const absB = S(expandExp(b));                      // scaled BigInt for |b|
      const absBpos = absB < 0n ? -absB : absB;
      // 2*SCALE_FACTOR == 2*S('1') because S('1') == 10^S
      const maxUlps = 1n + (absBpos / (2n * S('1')));    // ceil(|b|/2) + 1 (integer-safe, slightly conservative)
      assert.ok(
        diffAbs <= maxUlps,
        `division back-check too large: a=${a}, b=${b}, got ${back}, diff=${toStr(diffSig).replace(/^-/, '')} (ulps=${diffAbs} > ${maxUlps})`
      );
    }
  }
});

// ========= Optional randomized cross-checks vs decimal.js-light =========
t('Oracle cross-checks vs decimal.js-light (if available)', async () => {
  Decimal.set({ precision: 60, rounding: Decimal.ROUND_HALF_UP });

  // deterministic pseudo-random (LCG) for reproducibility
  let seed = 0xC0FFEE;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0, seed / 2**32);
  const randDecStr = () => {
    // generate sign, integer up to 1e12, and up to 20 fractional digits
    const sign = rnd() < 0.5 ? '' : '-';
    const int = Math.floor(rnd() * 1e12).toString();
    const fracLen = Math.floor(rnd() * 21); // 0..20
    const frac = Array.from({length: fracLen}, () => Math.floor(rnd()*10)).join('');
    return sign + (fracLen ? `${int}.${frac}` : int);
  };

  const N = 250; // total tuples; each produces 4 ops checks
  for (let i = 0; i < N; i++) {
    const aStr = randDecStr();
    const bStr = randDecStr().replace(/^-?0$/, '1'); // avoid exact zero for some ops

    const aDec = new Decimal(aStr);
    const bDec = new Decimal(bStr);

    const ops = [
      ['add', (x,y)=>x.plus(y)],
      ['sub', (x,y)=>x.minus(y)],
      ['mul', (x,y)=>x.times(y)],
      ['div', (x,y)=>x.div(y)],
    ];

    for (const [name, fn] of ops) {
      if (name === 'div' && bStr === '0') continue;
      const dec = fn(aDec, bDec).toFixed(SCALE, Decimal.ROUND_HALF_UP)
        .replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, ""); // trim like toStr
      const ours = (() => {
        switch (name) {
          case 'add': return toStr(fxAdd(S(aStr), S(bStr)));
          case 'sub': return toStr(fxSub(S(aStr), S(bStr)));
          case 'mul': return toStr(fxMul(S(aStr), S(bStr)));
          case 'div': return toStr(fxDiv(S(aStr), S(bStr)));
        }
      })();
      assert.strictEqual(ours, dec, `${name} oracle mismatch: a=${aStr} b=${bStr} got=${ours} want=${dec}`);
    }
  }
});

// ========= Edge cases: formatting & sign of zero =========
t('Formatting & signed zeros collapse to "0"', () => {
  const cases = ['0', '-0', '0.0', '-0.00000000000000000000'];
  for (const c of cases) assert.strictEqual(toStr(S(c)), '0');
  // ensure ops that produce -0 normalize
  assert.strictEqual(toStr(fxSub(S('0'), S('0'))), '0');
  assert.strictEqual(toStr(fxMul(S('-0'), S('5'))), '0');
  assert.strictEqual(toStr(fxDiv(S('0'), S('5'))), '0');
});
