export { functions, reference_returnAny, reference_withContext, reference_getOnly, setReferenceValues }

//#region functions
/**
 * @param {*} p
 * @return {*}
 */
function returnAny (p) {
  console.log(p);
  return p;
}

const functions = {
  q: returnAny,
  Q: returnAny
};
//#endregion functions

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
const reference_withContext = (name) => {
  return (context) => {
    if (context && Object.prototype.hasOwnProperty.call(context, name)) return context[name];
    return getSetting(name);
  };
};

/**
 * @param {string} name
 * @returns {(context: any) => any}
 */
const reference_getOnly = (name) => {
  return () => getSetting(name);
};

//#endregion references

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
function getSetting (name) {
  if (Object.prototype.hasOwnProperty.call(referenceValues, name)) {
    //@ts-ignore // index signature
    return referenceValues[name];
  }
  throw new Error(`Reference ${name} not found`);
}

//#endregion internal