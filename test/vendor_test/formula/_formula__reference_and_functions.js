export {
  functions,
  reference_returnAny,
  reference__values_fromReference_andFromContext,
  reference__values_fromReference_NOTfromContext,
  reference_with_callCounter,
  setReferenceValues
}
export { getCallCounter, resetCallCounter };

//#region references

/**
 * @param {string} name
 * @returns {(context: any) => any}
 */
const reference_returnAny = (name) => {
  return () => returnAny(name);
};

/**
 * @param {string} name
 * @returns {(context: any) => any}
 */
const reference__values_fromReference_andFromContext = (name) => {
  return (context) => {
    if (context && Object.prototype.hasOwnProperty.call(context, name)) return context[name];
    return getReferenceValues(name);
  };
};

/**
 * @param {string} name
 * @returns {(context: any) => any}
 */
const reference__values_fromReference_NOTfromContext = (name) => {
  return () => getReferenceValues(name);
};

/**
 * @param {string} name
 * @returns {(ctx: any) => any}
 */
const reference_with_callCounter = function (name) {
  // This is called during PARSE - once per reference
  return function(/** @type {any} */ context) {
    // This is called during EVALUATE - every time evaluate() is called
    callCounter++;  // Increment on every EVALUATION

    if (context && Object.prototype.hasOwnProperty.call(context, name)) return context[name];

    switch (name) {
      case 'a':
        return 1 + callCounter;  // return different value on each call
      case 'a.b':
        return 2;
      case 'b':
        return 3;
      case '$':
        return 1;
      case '$.ciao':
        return 4;
      case 'ad$.ciao':
        return 4;
      default:
        throw new Error('unrecognized value');
    }
  };
};

//#endregion references

//#region counter
let callCounter = 0;  // Counter outside the function

function getCallCounter() { return callCounter; }
function resetCallCounter() { callCounter = 0; }
//#endregion counter

//#region functions
/**
 * @param {*} p
 * @return {*}
 */
function returnAny (p) {
  return p;
}

const functions = {
  q: returnAny,
  Q: returnAny,

  /**
   * Sums all arguments (BigInt).
   *
   * @param {...bigint} args - Values to add.
   * @returns {bigint} The sum of all provided values (0n if none).
   */
  sum: function (...args) {
    return args.reduce((a, b) => a + b, 0n);
  },

  /**
   * Computes the integer average (BigInt division, truncating toward 0).
   *
   * @param {...bigint} args - Values to average.
   * @returns {bigint} The average of the provided values.
   * @throws {RangeError} If called with no arguments.
   */
  avg: function (...args) {
    const total = args.reduce((a, b) => a + b, 0n);
    return total / BigInt(args.length);
  }
};
//#endregion functions

//#region internal

let referenceValues = {};
/** Function to set reference values for testing.
 * @param {Object<string, any>} values
 */
function setReferenceValues (values) {
  referenceValues = values;
}

/** Function to get a setting value by name.
 * @param {string} name
 * @returns {any}
 */
function getReferenceValues (name) {
  if (Object.prototype.hasOwnProperty.call(referenceValues, name)) {
    //@ts-ignore // index signature
    return referenceValues[name];
  }
  throw new Error(`Reference ${name} not found`);
}

//#endregion internal
