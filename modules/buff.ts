import { Character } from "./character.js";

interface BuffArgs {
    /** name of the buff (this should be a basic name disregarding values. the description will contain values) */
    name: string;
    /** detailed description of the buff, including actual values being applied */
    desc: string;
    /** number of turns to apply this before before removing. default = 1 */
    duration?: number;
    /** delegate to apply this effect to specified object (can be a player or a character) */
    apply?:  (c:Character) => Promise<any>|void;
}


/** base buff class that can modify a character in some way (this includes debuffs) */
export class Buff {

    duration?: number;
    apply: (c:Character) => Promise<any>|void;

    constructor(args: BuffArgs) {
        this.duration = args.duration ?? 1;
        this.apply = args.apply ?? (_ => {});
    }
}

/**
 * @callback OperatorApplyCallback
 * @param {number} base base number being operated on
 * @param {number} scalar scalar value being applied to base value
 * @returns {number}
 */
/**
 * @callback OperatorLabelCallback
 * @param {string} base string describing base number being operated on
 * @param {number} scalar scalar value being applied to base value
 * @returns {string}
 */

/**
 * @typedef {Object} Operator
 * @property {OperatorLabelCallback} label
 * @property {OperatorApplyCallback} apply
 */

interface OperatorLabelCallback {
    /**
     * @param {string} base string describing base number being operated on
     * @param {number} scalar scalar value being applied to base value
     */
    (base:string, scalar: number) : string;
}
interface OperatorApplyCallback {
    /**
     * @param {number} base base number being operated on
     * @param {number} scalar scalar value being applied to base value
     */
     (base: number, scalar: number) : number;
}
interface Operator {
    label: OperatorLabelCallback,
    apply: OperatorApplyCallback
}

 export const operators: { [name:string]: Operator } = {
    "MULTIPLY": {
        label: (base,scalar) => `Multiplies ${base} by ${scalar}.`,
        apply: (base,scalar) => base * scalar,
    },
    "DIVIDE":{
        label:(base,scalar) => `Divides ${base} by ${scalar}.`,
        apply: (base,scalar) => base / scalar,
    },
    "ADD": {
        label: (base,scalar) => `Increases ${base} by ${scalar}.`,
        apply: (base,scalar) => base + scalar,
    },    
    "SUBTRACT": {
        label: (base,scalar) => `Reduces ${base} by ${scalar}.`,
        apply: (base,scalar) => base - scalar
    } 
};

/** @enum {string} */
export const stats = {
    /** increases base physical damage */
    "STRENGTH": "STRENGTH",
    /** increases mana regen */
    "WISDOM": "WISDOM",
    /** increases base mana pol */
    "INTELLECT": "INTELLECT",
    /** increases dodge and crit chance */
    "AGILITY": "AGILITY",
    /** increases base health pool */
    "ENDURANCE": "ENDURANCE"
}

/** applies scalar to character's specified stat */
export class StatBuff extends Buff {

    constructor(stat: string, operator: Operator, value: number, duration: number = 1) {
        super({
            // TODO: better name
            name: stat,
            desc: operator.label(stat, value),
            duration: duration,
            apply: character => {
                // @ts-ignore
                let statValue = character.stats[stat];
                let modified = operator.apply(statValue, value);
                // @ts-ignore
                players.stats[stat] = modified;
            }
        });
    }
}

// reduce AP by 5 for 3 for 3 turns...
//const apBuff = new StatBuff("AP", operators.SUBTRACT, 5, 3);

