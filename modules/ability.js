import { Projectile } from "./projectile.js";
import Vector from "./vector.js";

/** @enum {string} */
const elements = {
    PHYSICAL:  "physical",
    FIRE: "fire",
    ICE: "ice",
    WATER: "water",
    LIGHTNING: "lightning",
    AIR: "air",
    LIGHT: "light",
    DARK: "dark"
};


/** Maps each element to a resistance value (each point of resistance negates 1 damage). 
 * @note This needs to be consistent with elements enum. JSDoc doesn't appear to support {Object<enum,number>}
 * @typedef {Object} Resistance 
 * @property {number} [physical]
 * @property {number} [fire]
 * @property {number} [ice]
 * @property {number} [water]
 * @property {number} [lightning]
 * @property {number} [air]
 * @property {number} [light]
 * @property {number} [dark]
 */



/** 
 * @typedef {Object} AbilityArgs
 * @property {string} name
 * @property {string} description
 * @property {number} power arbitrary number used for calculating effectiveness of ability. Can be healing power, damage multiplier, etc. Depends on the spell
 * @property {number} [charges] number of charges remaining. defaults to max charges
 * @property {number} [maxCharges] max number of charges. defaults to 10
 * @property {number} [maxTargets] max number of targets. defaults to 1 
 * @property {number} [stability] 0-1 rating representing consistency of damage. stability=0 means damage will be very random, ranging from 0 - (2*power), stability=1 means damage will be very consistent, always equal to power. default = 1
 * @property {number} [critChance] 0-1 chance to crit. defaults to 0
 * @property {number} [critMultiplier] multiplier to apply for critical hits. defaults to 1.25.
 * @property {number} [accuracy] 0-1 chance to hit. defaults to 1 
 * @property {elements} [type] type of ability (used to determine which defensive attributes to apply to use when calculating damage). default = physical
 * @property {string} color color to apply when display spell name
*/


/** 
 * @callback AnimateCallback
 * @param {import("./battle").Battle} battle battle container (used to inject projects etc)
 * @param {import("./character").Character} caster character that casted spell
 * @param {import("./character").Character[]} targets targets that were cast on
 * @param {number[]} damage damage dealt to each target (aligned by index)
 * @returns {Promise<any>} resolves once animation is complete
 */

/** 
 * @callback CastCallback
 * @param {import("./character").Character} caster
 * @param {import("./character").Character[]} targets
 * @returns {number[]} damage dealt to each character
 */


// TODO: create an "AbilityDefinition" class thats stripped down to not include "charges" and other character-specific attributes
//      characters would contain instances of AbilityDefinitions in the form a "CharacterAbilities" which contain instance-specific values such as 
//      current charges, multipliers, or w/e else might be unique to a specific characters ability instance

export class Ability {


    /** 
     * @param {AbilityArgs} args
     * @param {CastCallback} cast function to run when executing this ability
     * @param {AnimateCallback} [animate] async function that resolves once animation is complete (called after casting)
    */
    constructor(args, cast, animate) {
        this.name = args.name;
        this.description = args.description;
        this.power = args.power;
        this.maxCharges = args.maxCharges ?? 10;
        this.charges = Math.min(this.maxCharges, args.charges ?? this.maxCharges);
        this.accuracy = args.accuracy ?? 1;
        this.maxTargets = args.maxTargets ?? 1;
        this.critChance = args.critChance ?? 0;
        this.critMultiplier  = args.critMultiplier ?? 1.25;
        this.stability = args.stability ?? 1;
        /** @type {elements} */
        this.type = args.type ?? "physical";
        this.color = args.color ?? "gray";

        this.animate = animate ?? (() => Promise.resolve());

        /** 
         * @param {import('./battle').Battle} battle
         * @param {import("./character").Character} caster
         * @param {import("./character").Character[]} targets
         * @returns {Promise<any>}
         */
        this.cast = function(battle, caster, targets) {
            const damage = cast(caster, targets);
            console.log("hey");
            return this.animate(battle, caster, targets, damage);
        }

    }
}

// #region Concrete Abilities 
export class BasicAbility extends Ability {
    /** @param {AbilityArgs} args */
    constructor(args) {
        super(args, 
            // CAST
            (caster, targets) => targets.map(target => {
                /** @type {any} */
                const result = {};
                const damage = this.getDamage(target, result);
                if (result.miss) {
                    console.log(`${caster.name}'s %c${this.name}%c missed ${target.name}!`, { this: this, target: target }, `color:${this.color};font-weight:bold`, '');
                }
                else {
                    const styles = [];
                    let log = "";
                    
                    styles.push(`color:${this.color};font-weight:bold;font-style:italic;text-transform:uppercase;font-size:1.25em;`),
                    log += `${caster.name}'s %c${this.name} `;
            
                    styles.push(``),
                    log += `%c${this.power > 0 ? "hits" : "heals"} ${target.name} for ${this.power > 0 ? damage : damage*-1}!`;
                    
                    if (result.critical) {
                        styles.push("color: #ffaadd; font-style: italic");
                        log += ` %c(CRITICAL ${this.critMultiplier}X DAMAGE) %c`;
                        styles.push("");
                    }
        
                    if (result.resist) {
                        log += ` %c(${result.resist} resisted by ${this.type} reistance)`;
                        styles.push("color: gray; font-style: italic;");
                    }
                    styles.push("");

                    console.log(log, ...styles); //, result)
                    target.hp -= damage;
                }

                return damage;
            }),
            // ANIMATE
            /** 
             * @param {import('./battle').Battle} battle
             * @param {import("./character").Character} caster
             * @param {import("./character").Character[]} targets
             * @param {number[]} damage
             */
            (battle, caster, targets, damage) => {
                // resolves once all animations complete 
                // TODO: upon animation disposal:
                //      render the damage number 
                //      then fade it out
                //      THEN resolve

                console.log("fireball animate");
                
                return Promise.all(
                    targets.map(target => new Promise((resolve, _) => {
                        battle.projectiles.push(
                            new Projectile({
                                color: this.color, 
                                pos: caster.pos,
                                size: new Vector(10, 25),
                                target: target.pos.add(target.size.divide(2)),
                                velocity: new Vector(0, 500),
                                dispose: () => { 
                                    console.log("projectile disposed! resolving ability animation");
                                    resolve();
                                }
                            })
                        );
                    }))
                );
            }
            
        );
    }

    /**
     * calculates damage/healing to apply to target (random given crit chance/multiplier and stability)
     * @param {import("./character").Character}  target
     * @param {any} result result object to inject status into
     * @todo take targets defensive stats into account (i.e. dodge, armor, etc) this is tough because then damage needs to be magic vs physical
     * @todo run simulation test to make sure these percentages are correct
     */
    getDamage(target, result) {
        const random = Math.random();

        // MISS
        const hitChance = this.accuracy * (1 - target.dodge);
        if (random > hitChance) {
            result.miss = true;
            return null;
        }

        let damage = this.power + ((1 - this.stability) * this.power);
        result.damage_initial = damage;

        // CRIT
        if (this.critChance != 0 && random <= this.critChance) {
            result.critical = true;
            damage *= this.critMultiplier;
        }

        // don't apply resistance to healing abilities
        if (this.power > 0) {
            // APPLYING RESISTANCE
            // @ts-ignore
            result.resist = target.defense[this.type] ?? 0;
            damage = Math.max(0, damage - result.resist);
        }

        return damage;  
    }
}



// TODO: AOE Abilities??

// #endregion


/** list of every ability in the game */
export const abilities = [
    new BasicAbility({
        name: "Fireball",
        description: "Ball shaped fire. TODO: chance to apply burn.",
        power: 10,
        type: elements.FIRE,
        critChance: 0.75,
        critMultiplier: 1.5,
        color: "#b11f13"
    }),
    new BasicAbility({
        name: "Frostbolt",
        description: "Bolt of frost. TODO: change to apply slow debuff",
        power: 6,
        type: elements.ICE,
        color: "#4298c5"
    }),
    new BasicAbility({
        name: "Lightning Strike",
        description: "Strike of lightning. High Damage, lower accuracy. TODO: chance to stun",
        power: 15,
        accuracy: 75,
        type: elements.LIGHTNING,
        color: "#ff0"
    }),


    new BasicAbility({
        name: "Cock Punch",
        description: "Punch with cock.",
        power: 15,
        accuracy: 50,
        critChance: 0.5,
        critMultiplier: 5,
        type: elements.PHYSICAL,
        color: "#fa2"
    }),

    new BasicAbility({
        name: "Holy Light",
        description: "Holy Light.",
        power: -6,
        type: elements.LIGHT,
        color: "ff5"
    })
];


/**
 * Dictionary of abilities by name
 * @type {Object<string,Ability>} 
 **/
export const ability_map = {};
abilities.forEach(ability => ability_map[ability.name.replaceAll(" ", "_")] = ability);


