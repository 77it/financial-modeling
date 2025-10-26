//@ts-nocheck
import { T } from '../helpers.js'; import { Decimal } from '../decimal.unlocked_vendor_test_only.js';

T('clone', function () {

  function t(expression) {
    T.assert(expression);
  }

  Decimal.config({
    precision: 10,
    rounding: 4,
    toExpNeg: -7,
    toExpPos: 21
  });

  var D1 = Decimal.clone({ precision: 1 });
  var D2 = Decimal.clone({ precision: 2 });
  var D3 = Decimal.clone({ precision: 3 });
  var D4 = Decimal.clone({ precision: 4 });
  var D5 = Decimal.clone({ precision: 5 });
  var D6 = Decimal.clone({ precision: 6 });
  var D7 = Decimal.clone({ precision: 7 });
  var D8 = Decimal.clone();
  D8.config({ precision: 8 });
  var D9 = Decimal.clone({ precision: 9 });

  t(Decimal.prototype === D9.prototype);
  t(Decimal !== D9);

  var x = new Decimal(5);
  var x1 = new D1(5);
  var x2 = new D2(5);
  var x3 = new D3(5);
  var x4 = new D4(5);
  var x5 = new D5(5);
  var x6 = new D6(5);
  var x7 = new D7(5);
  var x8 = new D8(5);
  var x9 = new D9(5);

  t(x1.div(3).eq(1));
  t(x2.div(3).eq(1.6));
  t(x3.div(3).eq(1.66));
  t(x4.div(3).eq(1.666));
  t(x5.div(3).eq(1.6666));
  t(x6.div(3).eq(1.66666));
  t(x7.div(3).eq(1.666666));
  t(x8.div(3).eq(1.6666666));
  t(x9.div(3).eq(1.66666666));
  t(x .div(3).eq(1.666666666));

  var y = new Decimal(3);
  var y1 = new D1(3);
  var y2 = new D2(3);
  var y3 = new D3(3);
  var y4 = new D4(3);
  var y5 = new D5(3);
  var y6 = new D6(3);
  var y7 = new D7(3);
  var y8 = new D8(3);
  var y9 = new D9(3);

  t(x1.div(y1).eq(1));
  t(x2.div(y2).eq(1.6));
  t(x3.div(y3).eq(1.66));
  t(x4.div(y4).eq(1.666));
  t(x5.div(y5).eq(1.6666));
  t(x6.div(y6).eq(1.66666));
  t(x7.div(y7).eq(1.666666));
  t(x8.div(y8).eq(1.6666666));
  t(x9.div(y9).eq(1.66666666));
  t(x .div(y ).eq(1.666666666));

  t(x1.div(y9).eq(1));
  t(x2.div(y8).eq(1.6));
  t(x3.div(y7).eq(1.66));
  t(x4.div(y6).eq(1.666));
  t(x5.div(y5).eq(1.6666));
  t(x6.div(y4).eq(1.66666));
  t(x7.div(y3).eq(1.666666));
  t(x8.div(y2).eq(1.6666666));
  t(x9.div(y1).eq(1.66666666));

  t(Decimal.precision == 10);
  t(D9.precision === 9);
  t(D8.precision === 8);
  t(D7.precision === 7);
  t(D6.precision === 6);
  t(D5.precision === 5);
  t(D4.precision === 4);
  t(D3.precision === 3);
  t(D2.precision === 2);
  t(D1.precision === 1);

  t(new Decimal(9.99).eq(new D5('9.99')));
  t(!new Decimal(9.99).eq(new D3('-9.99')));
  t(!new Decimal(123.456789).tosd().eq(new D3('123.456789').tosd()));
  t(new Decimal(123.456789).toInteger().eq(new D3('123.456789').toInteger()));

  t(new Decimal(1).constructor === new Decimal(1).constructor);
  t(new D9(1).constructor === new D9(1).constructor);
  t(new Decimal(1).constructor !== new D1(1).constructor);
  t(new D8(1).constructor !== new D9(1).constructor);

  T.assertException(function () { Decimal.clone(null) }, "Decimal.clone(null)");
});

