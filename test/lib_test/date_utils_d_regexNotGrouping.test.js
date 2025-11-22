import {
  regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping
} from '../../src/lib/date_utils.js';

import { test } from 'node:test';
import assert from 'node:assert';
/** @type {any} */ const t = typeof Deno !== 'undefined' ? Deno.test : await import('bun:test').then(m => m.test).catch(() => test);

t('regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping', () => {

  // ============================================================
  // VALID: Dates with consistent separators (should match)
  // ============================================================

  // Dash separator
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11'), true, '2025-12-11 should match (dash)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-01-01'), true, '2025-01-01 should match (dash)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-1-1'), true, '2025-1-1 should match (single digit)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-31'), true, '2025-12-31 should match (dash)');

  // Slash separator
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/12/11'), true, '2025/12/11 should match (slash)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/01/01'), true, '2025/01/01 should match (slash)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/1/1'), true, '2025/1/1 should match (single digit)');

  // Dot separator
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.12.11'), true, '2025.12.11 should match (dot)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.01.01'), true, '2025.01.01 should match (dot)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.1.1'), true, '2025.1.1 should match (single digit)');

  // ============================================================
  // INVALID: Dates with mixed separators (should NOT match)
  // ============================================================

  // Mixed dash and dot
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12.11'), false, '2025-12.11 should NOT match (dash then dot)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.12-11'), false, '2025.12-11 should NOT match (dot then dash)');

  // Mixed slash and dash
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/12-11'), false, '2025/12-11 should NOT match (slash then dash)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12/11'), false, '2025-12/11 should NOT match (dash then slash)');

  // Mixed slash and dot
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/12.11'), false, '2025/12.11 should NOT match (slash then dot)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.12/11'), false, '2025.12/11 should NOT match (dot then slash)');

  // ============================================================
  // VALID: DateTime formats with consistent separators
  // ============================================================

  // ISO format with Z (dash separator)
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00Z'), true, '2025-12-11T10:30:00Z should match');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00z'), true, '2025-12-11T10:30:00z should match (lowercase)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-01-15T23:59:59Z'), true, '2025-01-15T23:59:59Z should match');

  // With milliseconds (dash separator)
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00.123Z'), true, '2025-12-11T10:30:00.123Z should match');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00.1Z'), true, '2025-12-11T10:30:00.1Z should match');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00.123456789Z'), true, '2025-12-11T10:30:00.123456789Z should match (9 digits)');

  // With timezone offset (dash separator)
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00+05:30'), true, '2025-12-11T10:30:00+05:30 should match');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00-08:00'), true, '2025-12-11T10:30:00-08:00 should match');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00+0530'), true, '2025-12-11T10:30:00+0530 should match (no colon)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00-0800'), true, '2025-12-11T10:30:00-0800 should match (no colon)');

  // Slash separator with time
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/12/11T10:30:00Z'), true, '2025/12/11T10:30:00Z should match (slash)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/12/11T10:30:00.123Z'), true, '2025/12/11T10:30:00.123Z should match (slash)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/12/11T10:30:00+05:30'), true, '2025/12/11T10:30:00+05:30 should match (slash)');

  // Dot separator with time
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.12.11T10:30:00Z'), true, '2025.12.11T10:30:00Z should match (dot)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.12.11T10:30:00.123Z'), true, '2025.12.11T10:30:00.123Z should match (dot)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.12.11T10:30:00+05:30'), true, '2025.12.11T10:30:00+05:30 should match (dot)');

  // Partial time formats (dash separator)
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30'), true, '2025-12-11T10:30 should match (HH:MM only)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11T10:30:00'), true, '2025-12-11T10:30:00 should match (no timezone)');

  // ============================================================
  // INVALID: DateTime with mixed date separators
  // ============================================================

  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12.11T10:30:00Z'), false, '2025-12.11T10:30:00Z should NOT match (mixed)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025/12-11T10:30:00Z'), false, '2025/12-11T10:30:00Z should NOT match (mixed)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025.12/11T10:30:00.123Z'), false, '2025.12/11T10:30:00.123Z should NOT match (mixed)');

  // ============================================================
  // INVALID: Other invalid patterns
  // ============================================================

  // Wrong format
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('12-11-2025'), false, '12-11-2025 should NOT match (wrong order)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('25-12-11'), false, '25-12-11 should NOT match (short year)');

  // Extra characters
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('x2025-12-11'), false, 'x2025-12-11 should NOT match (prefix)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11x'), false, '2025-12-11x should NOT match (suffix)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test(' 2025-12-11'), false, ' 2025-12-11 should NOT match (leading space)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-11 '), false, '2025-12-11 should NOT match (trailing space)');

  // Invalid date values (regex doesn't validate date logic, only format)
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-13-01'), true, '2025-13-01 should match (regex does not validate month)');
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test('2025-12-32'), true, '2025-12-32 should match (regex does not validate day)');

  // Empty and null
  assert.strictEqual(regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping.test(''), false, 'empty string should NOT match');

  console.log('✓ All regExp_YYYYMMDDTHHMMSSMMMZ_notGrouping tests passed');
});
