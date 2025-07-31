export { FmlObj };

// TODO work in progress
class FmlObj {
  /**
   * [NOT YET IMPLEMENTED] Returns formula value
   * @returns {*}
   */
  get () {
    throw new Error('get() method not yet implemented');
  }

  /*
  Handles all primitive coercion with a single return value (ignoring the hint).:

  String(FmlObj)  // hint 'string' -> coerces to string
  `${FmlObj}`     // hint 'string' -> coerces to string
  Number(FmlObj)  // hint 'number' -> coerces to number
  +FmlObj         // hint 'number' -> coerces to number
  FmlObj + 0      // hint 'default' -> no coercion, returns the value as is
  0 + FmlObj      // hint 'default' -> no coercion, returns the value as is
  FmlObj + ""     // hint 'default' -> coerces to string
  "" + FmlObj     // hint 'default' -> coerces to string
  FmlObj == 42    // hint 'default' -> coerces to the type of the right operand
  FmlObj == '42'  // hint 'default' -> coerces to the type of the right operand
   */
  [Symbol.toPrimitive](hint) {
    return this.get();
  }
}
