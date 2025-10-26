// @deno-types="./decimal.d.ts"
import { default as Decimal } from './decimal.mjs';
export { Decimal };

/**
 * Configured Decimal for financial calculations
 * - Precision: 40 significant digits
 * - Rounding: ROUND_HALF_EVEN (banker's rounding)
 *
 * DO NOT import from './decimal.mjs' directly!
 * Always import from this module to ensure correct configuration.
 */
Decimal.config({
  precision: 40,
  rounding: Decimal.ROUND_HALF_EVEN
});

/**
 * LOCK: Prevent any further configuration of Decimal after initial setup.
 * This ensures the decimal configuration remains immutable throughout the application.
 * Any attempt to call .config() after this point will throw an error.
 */
const originalConfig = Decimal.config;  // unused, but kept for clarity
Decimal.config = function () {
  throw new Error(
    'Decimal.config() is locked and cannot be called after initial setup. ' +
    'Configuration is immutable to ensure financial precision is maintained throughout the application. ' +
    'If you need different Decimal configuration, modify the config in vendor/decimaljs/decimal.js'
  );
};

// Ensure the lock function itself is not writable
Object.defineProperty(Decimal, 'config', {
  value: Decimal.config,
  writable: false,
  configurable: false
});
