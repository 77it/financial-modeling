import { _TEST_ONLY__set } from '../src/lib/decimal_scaled_bigint__dsb.arithmetic_x.js';
import { ROUNDING_MODES } from '../src/config/engine.js';

t('fxAdd (plus) – basics, carries, signs, zeros', () => {
  function _test() {
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
  }
  _TEST_ONLY__set(_test, { decimalScale: SCALE, accountingDecimalPlaces: 4, roundingMode: ROUNDING_MODES.HALF_UP });
});