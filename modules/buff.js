/** 
 * @typedef {import('./character').Character} Character

 * @typedef {Object} BuffArgs
 * @property {string} name name of the buff (this should be a basic name disregarding values. the description will contain values)
 * @property {String} desc detailed description of the buff, including actual values being applied
 * @property {number} [duration] number of turns to apply this before before removing. default = 1
 * @property {function(Character):Promise<any>|void} [apply] delegate to apply this effect to specified object (can be a player or a character)
 */

/** base buff class that can modify a character in some way (this includes debuffs) */
export class Buff {

    /** @param {BuffArgs} args */
    constructor(args) {
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

/**
 * @enum {Operator}
 * @type {Object<string,Operator>}
 */
 export const operators = {
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
    /**
     * 
     * @param {string} stat stat to apply to 
     * @param {Operator} operator operator to use when applying value to stat
     * @param {number} value value to add to stat
     * @param {*} duration 
     */
    constructor(stat, operator, value, duration = 1) {
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

