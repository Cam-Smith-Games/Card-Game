/** base buff class that can modify a character in some way (this includes debuffs) */
export class Buff {
    constructor(args) {
        var _a, _b;
        this.duration = (_a = args.duration) !== null && _a !== void 0 ? _a : 1;
        this.apply = (_b = args.apply) !== null && _b !== void 0 ? _b : (_ => { });
    }
}
export const operators = {
    "MULTIPLY": {
        label: (base, scalar) => `Multiplies ${base} by ${scalar}.`,
        apply: (base, scalar) => base * scalar,
    },
    "DIVIDE": {
        label: (base, scalar) => `Divides ${base} by ${scalar}.`,
        apply: (base, scalar) => base / scalar,
    },
    "ADD": {
        label: (base, scalar) => `Increases ${base} by ${scalar}.`,
        apply: (base, scalar) => base + scalar,
    },
    "SUBTRACT": {
        label: (base, scalar) => `Reduces ${base} by ${scalar}.`,
        apply: (base, scalar) => base - scalar
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
};
/** applies scalar to character's specified stat */
export class StatBuff extends Buff {
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
