// by default, javascript modulo operator doesn't handle negatives
/** by default, javascript modulo operator doesn't handle negatives
 * @param {number} num  @param {number} mod */
export const mod = (num, mod) => ((num % mod) + mod) % mod;
/** rounds to nearest multiple of x
 * @param {number} num  @param {number} x */
export const roundTo = (num, x) => Math.round(num / x) * x;
/** rounds DOWN to nearest multiple of x
* @param {number} num  @param {number} x */
export const floorTo = (num, x) => Math.floor(num / x) * x;
/** rounds UP to nearest multiple of x
 * @param {number} num @param {number} x */
export const ceilTo = (num, x) => Math.ceil(num / x) * x;
/** clamps number between min and max value
 * @param {number} num @param {number} min @param {number} max */
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
/** @param {number[]} nums */
export const sum = (nums) => nums.reduce((s, total) => total + s, 0);
/** @param {number[]} nums */
export const avg = (nums) => sum(nums) / nums.length;
/** @param {number[]} nums */
export const min = (nums) => Math.min.apply(Math, nums);
/** @param {number[]} nums */
export const max = (nums) => Math.max.apply(Math, nums);
