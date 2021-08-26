



// #region keys
/** @type {Object<string,boolean>} */
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toUpperCase()] = true);
window.addEventListener("keyup", e => delete keys[e.key.toUpperCase()]);
// #endregion



/**
 * takes a key binding map to execute specified funcitons whne specified keys are currently pressed
 * @param {Object<string,function>} map object mapping key to a function to run if it's pressed 
 */
export function bindKeys(map) {
    // TODO

    // ALSO: how to handle key combos? i.e. ctrl+key? split by "+" or something?
}