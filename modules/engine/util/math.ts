
// by default, javascript modulo operator doesn't handle negatives
/** by default, javascript modulo operator doesn't handle negatives
 * @param {number} num  @param {number} mod */
export const mod = (num:number, mod:number) => ((num % mod) + mod) % mod;

/** rounds to nearest multiple of x
 * @param {number} num  @param {number} x */
export const roundTo = (num:number, x:number) => Math.round(num / x) * x;

 /** rounds DOWN to nearest multiple of x
 * @param {number} num  @param {number} x */
export const floorTo = (num:number, x:number) => Math.floor(num / x) * x;

/** rounds UP to nearest multiple of x 
 * @param {number} num @param {number} x */
export const ceilTo = (num:number, x:number) => Math.ceil(num / x) * x;

/** clamps number between min and max value 
 * @param {number} num @param {number} min @param {number} max */
export const clamp = (num:number,min:number,max:number) => Math.min(Math.max(num, min), max);


/** @param {number[]} nums */
export const sum  = (nums:number[]) => nums.reduce((s, total) => total + s, 0); 

/** @param {number[]} nums */
export const avg = (nums:number[]) => sum(nums) / nums.length;

/** @param {number[]} nums */
export const min = (nums:number[]) => Math.min.apply(Math, nums);

/** @param {number[]} nums */
export const max = (nums:number[]) => Math.max.apply(Math, nums);