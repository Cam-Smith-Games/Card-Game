/**
 * returns default value if value provided is not the correct type
 * @template T
 * @param {T} val value to check
 * @param {T} def default value to use if value is not of type
 * @returns 
 */
 export const _default = (val, def) => typeof val === typeof def ? val : def;



 