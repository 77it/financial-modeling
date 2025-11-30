console.log(String([1.55]));
console.log(String([1.66, 7]));


const fn = eval(`
    (function(x, y) {
      return x + y;
    })
  `);

const fn2 = eval(`
    (function(x) {
      return x.a + x.b;
    })
  `);

/**
 * @param {*} z
 * @return {*}
 */
function q(z) {
  return z;
}

export const fn3 = eval(`
    (function() {
      return 10n + 100n + q(20n);
    })
  `);

console.log(fn(5, 10));
console.log(fn2({ a: 999, b: 'mamma' }));
console.log(fn3());
