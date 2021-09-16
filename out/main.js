/**
 * main script is in charge of loading content, initiating all game states, then setting initial state
 * Everything else is handled by the GameState's code (states module)
 */
import { PlayerCharacter, NonPlayerCharacter } from "./modules/character.js";
import { ProjectileAbility as ProjectileCard, SimpleCard as SimpleCard, MeleeCard } from "./modules/card.js";
import { Vector } from "./modules/engine/util/vector.js";
import { load } from "./modules/engine/load.js";
import { AnimationSheet } from "./modules/engine/animation.js";
import { RTXGame } from "./modules/states.js";
// #region loading
const resource_paths = {
    field_bg: "img/backgrounds/field.jpg",
    player: "img/mini_fantasy_sprites.png",
    lpc: "img/body_male.png",
    fireball: "img/spells/fireball.png",
    explosion: "img/spells/explosion.png"
};
load(resource_paths, images => init(images));
// #endregion
function getContent(images) {
    // TODO: pull all paths and configs from a separate JSON file.    
    //       This would keep this code specific to actually loading and not configuring    
    //       NOTE: Vectors will need to be "[x,y]" array form in json, all consturcotrs will need to handle arrays OR vectors as input...
    // #region animations
    const sheets = {
        player: new AnimationSheet({
            sheet: images.player,
            frameSize: new Vector(32, 32),
            fps: 6,
            groups: {
                "idle": {
                    row: 4,
                    columns: 4
                },
                "walk": {
                    row: 5,
                    columns: 6
                },
                "attack": {
                    row: 7,
                    columns: 4
                },
                "gold_spirit": {
                    column: 7,
                    row: 6,
                    columns: 8,
                    rows: 2,
                    scale: new Vector(-1, 1),
                    fps: 10,
                },
                "orc_idle": {
                    column: 4,
                    columns: 4,
                    frameSize: new Vector(64, 32),
                    scale: new Vector(-2, 1)
                },
                "orc_walk": {
                    column: 4,
                    row: 3,
                    columns: 6,
                    frameSize: new Vector(64, 32),
                    scale: new Vector(-2, 1)
                },
                "orc_attack": {
                    column: 4,
                    row: 4,
                    columns: 6,
                    frameSize: new Vector(64, 32),
                    scale: new Vector(-2, 1)
                }
            }
        }),
        lpc: new AnimationSheet({
            sheet: images.lpc,
            frameSize: new Vector(64, 64),
            groups: {
                idle: {
                    row: 4,
                    columns: 1
                }
            }
        }),
        fireball: new AnimationSheet({
            sheet: images.fireball,
            frameSize: new Vector(128, 256),
            fps: 10,
            groups: {
                default: {
                    columns: 8,
                    rows: 4,
                    scale: new Vector(6, 3)
                }
            }
        }),
        explosion: new AnimationSheet({
            sheet: images.explosion,
            frameSize: new Vector(128, 128),
            fps: 12,
            groups: {
                default: {
                    columns: 4,
                    rows: 4
                }
            }
        })
    };
    // #endregion
    // #region cards
    const cardList = [
        new MeleeCard({
            name: "Bonk",
            description: "Deal 2 ⚔",
            power: 2,
            type: "physical" /* PHYSICAL */,
            color: "#775533",
            anim: () => sheets.fireball.animations.default.run(),
            icon: "img/spells/icons/bonk.jpg"
        }),
        new ProjectileCard({
            name: "Fireball",
            description: "Deal 4 🔥<br/>(Chance to burn)",
            cost: 2,
            power: 4,
            type: "fire" /* FIRE */,
            critChance: 0.75,
            critMultiplier: 1.5,
            color: "#b11f13",
            anim: () => sheets.fireball.animations.default.run(),
            icon: "img/spells/icons/fireball.jpg",
            offset: new Vector(0, -100)
        }),
        new SimpleCard({
            name: "Explosion",
            description: "Deal 6 🔥",
            power: 6,
            type: "fire" /* FIRE */,
            critChance: 0.5,
            critMultiplier: 2,
            color: "#b11f13",
            anim: () => sheets.explosion.animations.default.run({ numLoops: 1 }),
            icon: "img/spells/icons/explosion.jpg"
        }),
        new ProjectileCard({
            name: "Frostbolt",
            description: "Deal 4 🧊<br/>(Chance to slow)",
            cost: 2,
            power: 4,
            type: "ice" /* ICE */,
            color: "#4298c5",
            icon: "img/spells/icons/frostbolt.jpg"
        }),
        new ProjectileCard({
            name: "Lightning Strike",
            description: "Deal 4 ⚡<br/>(Chance to chain)",
            cost: 3,
            power: 4,
            accuracy: 75,
            type: "lightning" /* LIGHTNING */,
            color: "#ffff00",
            icon: "img/spells/icons/lightning_strike.jpg"
        }),
        new ProjectileCard({
            name: "Cock Punch",
            description: "Punch with cock.",
            power: 15,
            accuracy: 50,
            critChance: 0.5,
            critMultiplier: 5,
            type: "physical" /* PHYSICAL */,
            color: "#ffaa22"
        }),
        new ProjectileCard({
            name: "Holy Light",
            description: "Holy Light.",
            power: -6,
            type: "light" /* LIGHT */,
            color: "#eaea91"
        })
    ];
    const cards = {};
    cardList.forEach(ability => cards[ability.name.replaceAll(" ", "_")] = ability);
    // #endregion
    // #region characters   
    class Troglodyte extends NonPlayerCharacter {
        constructor(args) {
            args.hp = 15;
            args.size = new Vector(32, 32);
            args.scale = new Vector(-5, 5);
            args.deck = [cards.Bonk];
            args.animations = {
                "idle": () => sheets.player.animations["orc_idle"].run(),
                "Bonk": () => sheets.player.animations["orc_attack"].run({ numLoops: 1 })
            };
            super(args);
        }
    }
    class Mage extends NonPlayerCharacter {
        constructor(args) {
            args.hp = 10;
            args.size = new Vector(32, 32);
            args.scale = new Vector(5, 5);
            args.deck = [
                cards.Fireball,
                cards.Frostbolt,
                cards.Lightning_Strike
            ];
            args.animations = {
                "idle": () => sheets.player.animations["idle"].run(),
                "Fireball": () => sheets.player.animations["attack"].run({ numLoops: 1 }),
                "Frostbolt": () => sheets.player.animations["attack"].run({ numLoops: 1 }),
                "Lightning_Strike": () => sheets.player.animations["attack"].run({ numLoops: 1 })
            };
            super(args);
        }
    }
    class Healer extends NonPlayerCharacter {
        constructor(args) {
            super(args);
            args.hp = 15;
            args.size = new Vector(32, 32);
            args.scale = new Vector(5, 5);
            args.deck = [
                cards.Holy_Light
            ];
            args.animations = {
                idle: () => sheets.player.animations["gold_spirit"].run()
            };
        }
    }
    // #endregion
    const content = {
        cards: cards,
        /** the palyers team, TODO: certain dungeon nodes might allow adding new characters to party */
        player: [
            new PlayerCharacter({
                name: "Cam",
                hp: 25,
                size: new Vector(32, 32),
                scale: new Vector(5, 5),
                deck: [
                    cards.Bonk,
                    cards.Fireball,
                    cards.Explosion,
                    cards.Frostbolt,
                    cards.Lightning_Strike
                ],
                animations: {
                    "idle": () => sheets.player.animations["idle"].run(),
                    "Bonk": () => sheets.player.animations["attack"].run({ numLoops: 1 }),
                    "Fireball": () => sheets.player.animations["attack"].run({ numLoops: 1 }),
                    "Explosion": () => sheets.player.animations["attack"].run({ numLoops: 1 }),
                    "Frostbolt": () => sheets.player.animations["attack"].run({ numLoops: 1 }),
                    "Lightning_Strike": () => sheets.player.animations["attack"].run({ numLoops: 1 })
                },
            })
        ],
        monsters: {
            Troglodyte: Troglodyte,
            Mage: Mage
            //Healer:Healer
        }
    };
    return content;
}
function init(images) {
    const content = getContent(images);
    new RTXGame(content);
}
