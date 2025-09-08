// Benchmark JSON.parse vs JSON5 vs YAML parse on equivalent payloads.

import { parseJSON5strict, parseJSON5relaxed } from '../../src/lib/json5.js';
import { parseYAML } from '../../src/lib/yaml.js';
import { createHash } from 'node:crypto';

// json__json5__yaml__parse__benchmark.js
// ESM-friendly, works on Node (>=18) and Deno (Node-compat mode).
// Usage:
//   node json__json5__yaml__parse__benchmark.js --n 2000 --i 200 --validate
//   deno run --allow-all json__json5__yaml__parse__benchmark.js --n 2000 --i 200 --validate

/** @typedef {{ name: string, parseFn: () => any, text: string }} Block */
/** @typedef {{ name: string, ms: number, opsSec: number, bytes: number, digest?: string }} BenchResult */

/* ------------------------------- PARAMETERS -------------------------------- */

const N = 50;     // records in the "items" array
const ITER = 10;       // iterations per parser
const VALIDATE = true;

/* --------------------------------- UTILS ----------------------------------- */

/** Stable stringify with sorted keys to get canonical JSON. */
function canonicalJSON(value) {
  return JSON.stringify(value, replacerSorted, 0);
  function replacerSorted(_k, v) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return v;
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = v[k];
    return out;
  }
}

/** SHA-256 digest (hex). Uses Node crypto when available, falls back to WebCrypto. */
async function sha256Hex(text) {
  // Node.js path
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const { createHash } = await import('node:crypto');
    const h = createHash('sha256');
    h.update(text);
    return h.digest('hex');
  } catch {
    // WebCrypto path (Deno / browsers / Node w/o node:crypto importable)
    const enc = new TextEncoder();
    const buf = enc.encode(text);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    const bytes = new Uint8Array(digest);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

/** lightweight printf for sizes */
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  const k = 1024;
  const units = ['KB', 'MB', 'GB'];
  let u = -1;
  let v = n;
  do { v /= k; u++; } while (v >= k && u < units.length - 1);
  return `${v.toFixed(1)} ${units[u]}`;
}

/** Sleep helper to reduce cross-talk between runs. */
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/** Performance.now() cross-runtime */
function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

/* -------------------------------- FIXTURES --------------------------------- */

/**
 * Build a strict/equivalent object and all text renderings (JSON / JSON5 / YAML),
 * plus relaxed variants for YAML and parseJSON5relaxed only.
 * @param {number} n number of items
 */
function makeFixtures(n) {
  const items = new Array(n);
  for (let i = 0; i < n; i++) {
    items[i] = {
      id: i + 1,
      name: `Item ${i + 1}`,
      qty: (i % 10) + 1,           // integer
      price: Number((Math.imul(i + 123, 77) % 1000) + '.' + ((i * 9301 + 49297) % 100)).valueOf(), // number-ish
      tags: [`t${i % 5}`, `t${(i + 2) % 5}`],
      active: (i % 3) === 0
    };
  }
  const obj = {
    meta: {
      version: 3,
      generatedAt: new Date('2024-01-02T10:30:00Z').toISOString(),
      note: 'Benchmark payload; numbers intentionally simple.'
    },
    items
  };

  // Strict payloads (equivalent across parsers)
  const jsonText = JSON.stringify(obj);

  // JSON5 string with same semantics (quoted keys, standard)
  const json5Lines = ['{', '  "meta": {',
    '    "version": 3,',
    `    "generatedAt": "${obj.meta.generatedAt}",`,
    `    "note": "Benchmark payload; numbers intentionally simple."`,
    '  },',
    '  "items": ['];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const trailing = i === items.length - 1 ? '' : ',';
    json5Lines.push(
      `    { "id": ${it.id}, "name": "${it.name}", "qty": ${it.qty}, "price": ${it.price}, "tags": ${JSON.stringify(it.tags)}, "active": ${it.active} }${trailing}`
    );
  }
  json5Lines.push('  ]', '}');
  const json5Text = json5Lines.join('\n');

  // YAML (equivalent semantics)
  const yamlLines = [
    'meta:',
    '  version: 3',
    `  generatedAt: "${obj.meta.generatedAt}"`,
    `  note: "Benchmark payload; numbers intentionally simple."`,
    'items:'
  ];
  for (const it of items) {
    yamlLines.push(`  - id: ${it.id}`);
    yamlLines.push(`    name: "${it.name}"`);
    yamlLines.push(`    qty: ${it.qty}`);
    yamlLines.push(`    price: ${it.price}`);
    yamlLines.push(`    tags: [${it.tags.map(t => `"${t}"`).join(', ')}]`);
    yamlLines.push(`    active: ${it.active ? 'true' : 'false'}`);
  }
  const yamlText = yamlLines.join('\n');

  // Relaxed payloads — ONLY for parseJSON5relaxed and YAML
  // Unquoted keys + unquoted numbers + unquoted ISO dates; other values quoted.
  const relaxedJson5Lines = [
    '{',
    '  meta: {',
    '    version: 3,',
    `    generatedAt: ${obj.meta.generatedAt},`, // unquoted ISO
    `    note: "Benchmark payload; numbers intentionally simple.",`,
    '  },',
    '  items: ['
  ];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const trailing = i === items.length - 1 ? '' : ',';
    const tagList = it.tags.map(t => `"${t}"`).join(', ');
    // numbers unquoted; booleans quoted (as per request: "other values quoted")
    relaxedJson5Lines.push(
      `    { id: ${it.id}, name: "${it.name}", qty: ${it.qty}, price: ${it.price}, tags: [${tagList}], active: "${String(it.active)}" }${trailing}`
    );
  }
  relaxedJson5Lines.push('  ]', '}');
  const relaxedJson5Text = relaxedJson5Lines.join('\n');

  const relaxedYamlLines = [
    'meta:',
    '  version: 3',
    `  generatedAt: ${obj.meta.generatedAt}`, // unquoted ISO -> YAML timestamp
    `  note: "Benchmark payload; numbers intentionally simple."`,
    'items:'
  ];
  for (const it of items) {
    relaxedYamlLines.push(`  - id: ${it.id}`);
    relaxedYamlLines.push(`    name: "${it.name}"`);
    relaxedYamlLines.push(`    qty: ${it.qty}`);
    relaxedYamlLines.push(`    price: ${it.price}`);
    relaxedYamlLines.push(`    tags: [${it.tags.map(t => `"${t}"`).join(', ')}]`);
    relaxedYamlLines.push(`    active: "${String(it.active)}"`);
  }
  const relaxedYamlText = relaxedYamlLines.join('\n');

  return {
    data: obj,
    jsonText,
    json5Text,
    yamlText,
    relaxedJson5Text,
    relaxedYamlText
  };
}

/* --------------------------------- BENCH ----------------------------------- */

/**
 * Run a single benchmark block.
 * Hashing (when validate=true) mimics "baseline" construction:
 * per-iteration hashing of canonical JSON + '\n'.
 * @param {string} name
 * @param {() => any} parseFn
 * @param {string} text
 * @param {number} iterations
 * @param {boolean} validate
 * @param {string} expectedDigest already computed expected digest for this block
 * @returns {Promise<BenchResult>}
 */
async function runBlock(name, parseFn, text, iterations, validate, expectedDigest) {
  const bytes = typeof Buffer !== 'undefined'
    ? Buffer.byteLength(text)
    : new TextEncoder().encode(text).length;

  let digest = undefined;
  let acc = '';
  const t0 = nowMs();
  for (let i = 0; i < iterations; i++) {
    const value = parseFn();
    if (validate) acc += canonicalJSON(value) + '\n';
  }
  const t1 = nowMs();
  if (validate) {
    digest = await sha256Hex(acc);
    if (digest !== expectedDigest) {
      throw new Error(`${name} produced a different digest:\n  expected=${expectedDigest}\n  actual  =${digest}`);
    }
  }
  const ms = t1 - t0;
  const opsSec = (iterations / (ms / 1000));
  return { name, ms, opsSec, bytes, digest };
}

/* ---------------------------------- CLI ------------------------------------ */

function parseArgs(argv) {
  const out = new Map();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = (k === 'validate') ? true : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
      out.set(k, v);
    }
  }
  return out;
}

/* --------------------------------- MAIN ------------------------------------ */

async function main() {
  const { jsonText, json5Text, yamlText, relaxedJson5Text, relaxedYamlText } = makeFixtures(N);

  console.log('=== Parser Benchmark ===');
  console.log(`records (n): ${N}`);
  console.log(`iterations : ${ITER}`);
  console.log(`validate   : ${VALIDATE ? 'on' : 'off'}`);
  console.log(`JSON bytes : ${fmtBytes(byteLen(jsonText))}`);
  console.log(`JSON5 bytes: ${fmtBytes(byteLen(json5Text))}`);
  console.log(`YAML bytes : ${fmtBytes(byteLen(yamlText))}`);
  console.log(`relaxed JSON5 bytes (relaxed only): ${fmtBytes(byteLen(relaxedJson5Text))}`);
  console.log(`relaxed YAML  bytes (relaxed only): ${fmtBytes(byteLen(relaxedYamlText))}`);
  console.log('');

  // Build baseline digest for strict/equivalent payloads from JSON.parse(jsonText)
  const baselineUnit = canonicalJSON(JSON.parse(jsonText)) + '\n';
  const baselineDigest = await sha256Hex(baselineUnit.repeat(ITER));

  /** @type {Block[]} */
  const blocks = [
    { name: 'JSON.parse',        parseFn: () => JSON.parse(jsonText),        text: jsonText },
    { name: 'parseJSON5strict',  parseFn: () => parseJSON5strict(json5Text), text: json5Text },
    { name: 'parseYAML',         parseFn: () => parseYAML(yamlText),         text: yamlText },
    // --- relaxed only ---
    { name: 'parseJSON5relaxed (relaxed payload)', parseFn: () => parseJSON5relaxed(relaxedJson5Text), text: relaxedJson5Text },
    { name: 'parseYAML (relaxed payload)',         parseFn: () => parseYAML(relaxedYamlText),         text: relaxedYamlText }
  ];

  /** @type {BenchResult[]} */
  const results = [];
  for (const b of blocks) {
    await sleep(25);
    const isRelaxed = /relaxed payload/.test(b.name);
    let expectedDigest = baselineDigest;
    if (VALIDATE && isRelaxed) {
      // compute the relaxed block's own digest shape
      const once = b.parseFn();
      const unit = canonicalJSON(once) + '\n';
      expectedDigest = await sha256Hex(unit.repeat(ITER));
    }
    const r = await runBlock(b.name, b.parseFn, b.text, ITER, VALIDATE, expectedDigest);
    results.push(r);
  }

  // Print results
  const rows = [
    ['Parser', 'ms', 'ops/sec', 'bytes'],
    ...results.map(r => [
      r.name,
      r.ms.toFixed(1),
      Math.round(r.opsSec).toLocaleString('en-US'),
      fmtBytes(r.bytes)
    ])
  ];
  printTable(rows);
}

function byteLen(s) {
  return typeof Buffer !== 'undefined'
    ? Buffer.byteLength(s)
    : new TextEncoder().encode(s).length;
}

function printTable(rows) {
  const colW = [];
  for (const row of rows) {
    row.forEach((cell, i) => {
      colW[i] = Math.max(colW[i] || 0, String(cell).length);
    });
  }
  for (let r = 0; r < rows.length; r++) {
    const line = rows[r].map((cell, i) => {
      const s = String(cell);
      const pad = ' '.repeat(colW[i] - s.length);
      return i === 0 ? s + pad : pad + s;
    }).join('  ');
    if (r === 1) {
      const underline = colW.map(w => '-'.repeat(w)).join('  ');
      console.log(underline);
    }
    console.log(line);
  }
}

main().catch(err => {
  console.error(err.stack || String(err));
  if (typeof Deno !== 'undefined') Deno.exit(1);
  else process.exit(1);
});
