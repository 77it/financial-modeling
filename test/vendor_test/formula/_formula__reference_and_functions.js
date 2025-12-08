export { functions, reference_returnAny }

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

/** @param {string} name @returns {(ctx: any) => any} */
const reference_returnAny = (name) => {
  return () => returnAny(name);
};

