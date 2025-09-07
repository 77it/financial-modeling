// bench-parsers.mjs
// Benchmark JSON.parse vs JSON5 vs YAML parse on equivalent payloads.
// Requires: npm i json5 yaml

import JSON5 from 'json5';
import * as YAML from 'yaml';
import { createHash } from 'crypto';

/**
 * @typedef {Object} BenchResult
 * @property {string} name - Parser name.
 * @property {number} iterations - Number of parses performed.
 * @property {number} bytesTotal - Total bytes parsed across iterations.
 * @property {number} ns - Elapsed nanoseconds for the measured block.
 * @property {number} opsPerSec - Iterations per second.
 * @property {number} mbPerSec - Megabytes per second (MiB).
 * @property {string} digest - Hash of concatenated canonical JSON (when validate=true).
 */

/**
 * High-res monotonic time in nanoseconds.
 * @returns {bigint}
 */
function nowNs() {
  return process.hrtime.bigint();
}

/**
 * Sleep a tiny bit to let the CPU settle (best-effort).
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Generate equivalent data and its 3 textual representations (JSON / JSON5 / YAML).
 * Sizes scale with record count + string sizes, but keep structure comparable.
 * @param {'tiny'|'small'|'medium'|'large'|'xl'} size
 */
function makeFixtures(size) {
  /** @type {Record<string, number>} */
  const sizes = { tiny: 10, small: 200, medium: 2_000, large: 20_000, xl: 100_000 };
  const n = sizes[size] ?? sizes.small;

  // Deterministic pseudo-random-ish generator to keep content stable across runs.
  let seed = 1337;
  const rand = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 0xffffffff;

  /** @type {{id:number, name:string, qty:number, price:number, tags:string[], active:boolean}[]} */
  const items = [];
  for (let i = 0; i < n; i++) {
    const qty = (i % 7) + 1;
    const price = Math.round((rand() * 1000 + (i % 11)) * 100) / 100;
    const tagCount = (i % 5);
    const tags = Array.from({ length: tagCount }, (_, k) => `t${(i * 17 + k) % 101}`);
    items.push({
      id: i + 1,
      name: `item_${i}_${Math.floor(rand() * 1e6)}`,
      qty,
      price,
      tags,
      active: (i % 3) !== 0
    });
  }

  const obj = {
    meta: {
      version: 3,
      generatedAt: new Date(1700000000000).toISOString(), // fixed for stability
      note: "Benchmark payload; numbers intentionally simple."
    },
    items
  };

  // JSON is a standard stringified version.
  const json = JSON.stringify(obj);

  // JSON5: use comments, trailing commas, and single quotes to exercise the parser.
  // Keep it semantically identical to the JSON payload.
  const json5 = [
    `// demo root comment`,
    `{`,
    `  // metadata`,
    `  meta: {`,
    `    version: 3, // trailing comma allowed`,
    `    generatedAt: '${obj.meta.generatedAt}',`,
    `    note: 'Benchmark payload; numbers intentionally simple.',`,
    `  },`,
    `  items: [`,
    ...items.map((it, idx, arr) => {
      const trailing = idx === arr.length - 1 ? '' : ',';
      const tagList = it.tags.map(t => `'${t}'`).join(', ');
      return `    { id: ${it.id}, name: '${it.name}', qty: ${it.qty}, price: ${it.price}, tags: [${tagList}], active: ${it.active} }${trailing}`;
    }),
    `  ],`,
    `}`,
  ].join('\n');

  // YAML: straightforward block YAML equivalent.
  // We keep numbers & booleans plain, strings quoted when needed.
  const yamlLines = [
    `meta:`,
    `  version: 3`,
    `  generatedAt: "${obj.meta.generatedAt}"`,
    `  note: "Benchmark payload; numbers intentionally simple."`,
    `items:`
  ];
  for (const it of items) {
    yamlLines.push(`  - id: ${it.id}`);
    yamlLines.push(`    name: "${it.name}"`);
    yamlLines.push(`    qty: ${it.qty}`);
    yamlLines.push(`    price: ${it.price}`);
    yamlLines.push(`    tags: [${it.tags.map(t => `"${t}"`).join(', ')}]`);
    yamlLines.push(`    active: ${it.active}`);
  }
  const yaml = yamlLines.join('\n');

  return {
    size,
    data: obj,
    jsonText: json,
    json5Text: json5,
    yamlText: yaml
  };
}

/**
 * Canonicalize JS value to stable JSON for digest/validation.
 * @param {unknown} v
 * @returns {string}
 */
function canonicalJSON(v) {
  return JSON.stringify(v, (key, value) => {
    // Ensure stable order for objects (shallow stable stringify).
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const sorted = {};
      for (const k of Object.keys(value).sort()) sorted[k] = value[k];
      return sorted;
    }
    return value;
  });
}

/**
 * Run one timed benchmark block for a given parser and text input.
 * @param {string} name
 * @param {() => any} parseFn - Function that parses the current text.
 * @param {string} text
 * @param {number} iterations
 * @param {boolean} validate
 * @param {string} [expectedDigest] - If provided, we verify the parsed output digest matches.
 * @returns {BenchResult}
 */
function runBlock(name, parseFn, text, iterations, validate, expectedDigest) {
  // Warm-up: short run to trigger JIT & caches (avoids cold-start noise).
  for (let i = 0; i < Math.min(500, Math.ceil(iterations * 0.02)); i++) {
    parseFn();
  }

  // Measured block
  const start = nowNs();
  // When validating, build a combined hash of parsed canonical JSON to also
  // ensure the parser produced equivalent objects.
  const hash = validate ? createHash('sha256') : null;

  for (let i = 0; i < iterations; i++) {
    const parsed = parseFn();
    if (hash) {
      hash.update(canonicalJSON(parsed));
      hash.update('\n');
    }
  }
  const end = nowNs();

  const ns = Number(end - start);
  const bytesTotal = Buffer.byteLength(text, 'utf8') * iterations;
  const opsPerSec = (iterations * 1e9) / ns;
  const mbPerSec = (bytesTotal / (1024 * 1024)) / (ns / 1e9);
  const digest = hash ? hash.digest('hex') : '';

  if (validate && expectedDigest && digest !== expectedDigest) {
    throw new Error(`${name} produced a different digest:\n  expected=${expectedDigest}\n  actual  =${digest}`);
  }

  return { name, iterations, bytesTotal, ns, opsPerSec, mbPerSec, digest };
}

/**
 * Format human-friendly numbers.
 * @param {number} n
 * @param {number} [digits]
 */
function fmt(n, digits = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/**
 * Entry point CLI.
 */
async function main() {
  const args = new Map(process.argv.slice(2).map(s => {
    const m = s.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? ''] : [s, ''];
  }));

  const size = /** @type {'tiny'|'small'|'medium'|'large'|'xl'} */ (
    ['tiny','small','medium','large','xl'].includes(args.get('size')) ? args.get('size') : 'small'
  );

  const validate = args.has('validate');
  const warmupDisabled = args.has('no-warmup'); // kept for compatibility; we still do a tiny warm-up inside runBlock
  void warmupDisabled; // not used further (we do minimal warmup always)

  /** Default iterations scaled by size (tune for your machine). */
  const defaultIters = { tiny: 50_000, small: 20_000, medium: 3_000, large: 300, xl: 60 };
  const iterations = Number(args.get('iterations') || defaultIters[size]);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    throw new Error(`Invalid --iterations: ${args.get('iterations')}`);
  }

  const { data, jsonText, json5Text, yamlText } = makeFixtures(size);

  // Precompute an expected digest using the plain JSON version as ground truth.
  const baselineDigest = createHash('sha256').update(canonicalJSON(JSON.parse(jsonText))).digest('hex');

  // GC hint (not guaranteed).
  if (global.gc) global.gc();

  console.log(`\n=== Parser Benchmark ===`);
  console.log(`size: ${size}`);
  console.log(`iterations per parser: ${iterations}`);
  console.log(`JSON bytes:  ${fmt(Buffer.byteLength(jsonText))}`);
  console.log(`JSON5 bytes: ${fmt(Buffer.byteLength(json5Text))}`);
  console.log(`YAML bytes:  ${fmt(Buffer.byteLength(yamlText))}`);
  console.log(validate ? `validation: enabled (SHA-256 digest alignment)\n` : `validation: disabled\n`);

  // Parsers
  const blocks = [
    {
      name: 'JSON.parse',
      parseFn: () => JSON.parse(jsonText),
      text: jsonText
    },
    {
      name: 'JSON5.parse',
      parseFn: () => JSON5.parse(json5Text),
      text: json5Text
    },
    {
      name: 'YAML.parse',
      parseFn: () => YAML.parse(yamlText),
      text: yamlText
    }
  ];

  /** @type {BenchResult[]} */
  const results = [];

  // Stagger runs to reduce cross-talk (and give the CPU a breath).
  for (const b of blocks) {
    await sleep(30);
    if (global.gc) global.gc();
    results.push(runBlock(b.name, b.parseFn, b.text, iterations, validate, baselineDigest));
  }

  // Output table
  const rows = [
    ['Parser', 'Ops/s', 'MiB/s', 'Time (ms)', 'Bytes/op'],
    ...results.map(r => {
      const ms = r.ns / 1e6;
      const perOpBytes = r.bytesTotal / r.iterations;
      return [
        r.name,
        fmt(r.opsPerSec, 0),
        fmt(r.mbPerSec, 1),
        fmt(ms, 1),
        fmt(perOpBytes, 0)
      ];
    })
  ];

  // Pretty print
  const widths = rows[0].map((_, i) => Math.max(...rows.map(row => String(row[i]).length)));
  const line = (cells) => cells.map((c, i) => String(c).padStart(widths[i])).join('  ');
  console.log(line(rows[0]));
  console.log(line(widths.map(w => '-'.repeat(w))));
  for (let i = 1; i < rows.length; i++) console.log(line(rows[i]));

  // Quick interpretation note (won't always hold but common in practice).
  // JSON.parse is typically fastest; YAML is usually slowest due to richer grammar; JSON5 in between.
}

main().catch(err => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
