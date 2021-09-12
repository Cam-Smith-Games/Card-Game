"use strict";
const keys = {};
window.addEventListener("keydown", e => keys[e.key.toUpperCase()] = true);
window.addEventListener("keyup", e => delete keys[e.key.toUpperCase()]);
/**
 * takes a key binding map to execute specified funcitons whne specified keys are currently pressed
 * @param {Record<string,()=>void)>} map object mapping key to a function to run if it's pressed
 *
export function bindKeys(map: Record<string,()=>void>) {
    // TODO

    // ALSO: how to handle key combos? i.e. ctrl+key? split by "+" or something?
}*/ 
