// type conversion, normalization WITHOUT USING ANY LIBRARIES

/**
 * @param {{str: string, num: number, bool:boolean, date:Date}} p
 * @param {boolean} [sanitizeInvalid]  //XXX togliere parametro sanitizeInvalid
 * @returns {{str: string, num: number, bool:boolean, date:Date}}
 */
export function sanitize (p, sanitizeInvalid) {
  //XXX togliere parametro sanitizeInvalid
  if (sanitizeInvalid) {
    return {
      // Set to '' when whitespaces, '', null, undefined, false, 0, -0, 0n, NaN.
      // First condition to check truthy (not: false, 0, -0, 0n, "", null, undefined, and NaN)
      // Second condition to check for whitespaces.
      str: !!(p.str && p.str.toString().trim()) ? String(p.str) : '',
      num: isFinite(Number(p.num)) ? Number(p.num) : 0,
      date: isNaN(new Date(p.date).getTime()) ? new Date(0) : new Date(p.date),
      bool: Boolean(p.bool),
    };
  }

  return {
    str: String(p.str),
    num: Number(p.num),
    date: new Date(p.date),
    bool: Boolean(p.bool),
  };
}
