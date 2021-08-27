
 
 /**
  * Gets n random items from array
  * @template T
  * @param {T[]} array array to get random items from
  * @param {number} n number of items to get from array
  * @returns {T[]}
  */
  export function getRandomN (array, n = 1) {
    if (!array?.length) return [];
    if (n > array.length) return array;

    const result = new Array(n);
    let len = array.length;
    const taken = new Array(len);

    while (n--) {
        const x = Math.floor(Math.random() * len);
        result[n] = array[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }

    return result;
 } 

/**
 * Gets random item from array
 * @template T
 * @param {T[]} array array to get random items from
 * @returns {T}
 */
export const getRandom = (array) => array?.length ? array[Math.floor(Math.random() * array.length)] : null;
