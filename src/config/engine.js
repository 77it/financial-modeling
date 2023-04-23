// engine config

export { DEFAULT_NUMBER_OF_YEARS_FROM_TODAY, ROUNDING_MODE, DECIMAL_PLACES };

// Number of the years from today to set Simulation End Date, if no other value to set this date is provided
const DEFAULT_NUMBER_OF_YEARS_FROM_TODAY = 10;
// Rounding mode to use when storing numbers in the ledger; if true, use Math.round(), otherwise use Math.floor()
const ROUNDING_MODE = true;
// Decimal places to use when storing numbers in the ledger
const DECIMAL_PLACES = 4;
