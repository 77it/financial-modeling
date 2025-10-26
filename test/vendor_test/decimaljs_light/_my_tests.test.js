//@ts-nocheck
import { T } from './helpers.js'; import { Decimal } from './decimal.unlocked_vendor_test_only.js';

T('my tests, extra from the one taken from the official decimal.js-light repository', function () {

  function t(expected, value){
    T.assertEqual(expected, new Decimal(value).abs().valueOf());
  }

  Decimal.config({
    precision: 20,
    rounding: 4,
    toExpNeg: -7,
    toExpPos: 21
  });

  T.assertException(() => new Decimal('1_000'), 'Invalid number');
});
