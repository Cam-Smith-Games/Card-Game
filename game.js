import { PlayerCharacter, NonPlayerCharacter } from "./modules/character.js";
import { ProjectileAbility as ProjectileCard, elements, SimpleCard as SimpleCard, MeleeCard } from "./modules/card.js";
import Vector from "./modules/vector.js";
import { Battle } from "./modules/battle.js";
import { load } from "./modules/load.js";
import { AnimationSheet } from "./modules/animation.js";
import Transform from "./modules/transform.js";

/** 
 * @typedef {import('./modules/card').Card} Ability
 * @typedef {import('./modules/character').Character} Character
 */


/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


// IMPORTANT: THIS DISABLES SMOOTHING WHEN SCALING PIXELS
//            this can also be achieved by setting the CSS "image-rendering:pixelated" on the canvas
//            and not upscaling the images in the code
ctx.imageSmoothingEnabled = false;




const mouse = new Vector();
document.onmousemove = function handleMouseMove(event) {
    //mouse.x = event.pageX;
    //mouse.y = event.pageY;
    mouse.x = Math.min(canvas.width, Math.max(0,  event.pageX - canvas.offsetLeft));
    mouse.y = Math.min(canvas.height, Math.max(0, event.pageY - canvas.offsetTop));
}





/** @type {Object<string,string>} */
const paths = {
    player: "/img/mini_fantasy_sprites.png",
    lpc: "img/player/body/body_male.png",
    fireball: "img/spells/fireball.png",
    explosion: "img/spells/explosion.png"
};

load(paths, images => {

    
    // TODO: pull all paths and configs from a separate JSON file.    
    //       This would keep this code specific to actually loading and not configuring    
    //       NOTE: Vectors will need to be "[x,y]" array form in json, all consturcotrs will need to handle arrays OR vectors as input...


    // #region ANIMATIONS
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
                "orc": {
                    column: 4,
                    columns: 4,
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
    }
    // #endregion


    // #region CARDS
    /** list of every card in the game */
    const abilities = [
        new MeleeCard({
            name: "Bonk",
            description: "Get Bonked! HAHA!",
            power: 10,
            type: elements.PHYSICAL,
            color: "#775533",
            anim: () => sheets.fireball.animations.default.run(),
            
        }),
        new ProjectileCard({
            name: "Fireball",
            description: "Ball shaped fire. TODO: chance to apply burn.",
            power: 10,
            type: elements.FIRE,
            critChance: 0.75,
            critMultiplier: 1.5,
            color: "#b11f13",
            anim: () => sheets.fireball.animations.default.run(),
            icon: "https://www.wowisclassic.com/media/CACHE/images/wow/talents/03018560-b69a-4aba-914a-2505b55c7ea5/73723ea93d1f214d6df88cc859819627.jpg"
        }),
        new SimpleCard({
            name: "Explosion",
            description: "Explosion",
            power: 10,
            type: elements.FIRE,
            critChance: 0.5,
            critMultiplier: 2,
            color: "#b11f13",
            anim: () => sheets.explosion.animations.default.run({ numLoops: 1 })
        }),
        new ProjectileCard({
            name: "Frostbolt",
            description: "Bolt of frost. TODO: change to apply slow debuff",
            power: 6,
            type: elements.ICE,
            color: "#4298c5"
        }),
        new ProjectileCard({
            name: "Lightning Strike",
            description: "Strike of lightning. High Damage, lower accuracy. TODO: chance to stun",
            power: 15,
            accuracy: 75,
            type: elements.LIGHTNING,
            color: "#ff0"
        }),


        new ProjectileCard({
            name: "Cock Punch",
            description: "Punch with cock.",
            power: 15,
            accuracy: 50,
            critChance: 0.5,
            critMultiplier: 5,
            type: elements.PHYSICAL,
            color: "#fa2"
        }),

        new ProjectileCard({
            name: "Holy Light",
            description: "Holy Light.",
            power: -6,
            type: elements.LIGHT,
            color: "#eaea91"
        })
    ];


    /** @type {Object<string,Ability>} **/
    const cards = {};
    abilities.forEach(ability => cards[ability.name.replaceAll(" ", "_")] = ability);
    // #endregion

    // #region TEAMS
    const team1 = [
            new PlayerCharacter({
                name: "Cam",
                hp: 200,
                transform: new Transform({
                    size: new Vector(150, 150)
                }),
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
                }
            }),
            new NonPlayerCharacter({
                name: "Graem",
                hp: 100,
                transform: new Transform({
                    size: new Vector(150, 150)
                }),
                deck: [
                    cards.Lightning_Strike
                ],
                animations: {
                    "idle": () => sheets.player.animations["idle"].run(),
                    "Lightning_Strike": () => sheets.player.animations["attack"].run({ numLoops: 1 })
                }
            }),
            new NonPlayerCharacter({
                name: "Adrian",
                hp: 150,
                transform: new Transform({
                    size: new Vector(150, 150)
                }),
                deck: [
                    cards.Fireball,
                    cards.Frostbolt
                ],
                animations: {
                    "idle": () => sheets.player.animations["idle"].run(),
                    "Fireball": () => sheets.player.animations["attack"].run({ numLoops: 1 }),
                    "Frostbolt":() => sheets.player.animations["attack"].run({ numLoops: 1 }),
                }
            })
    ];
    const team2 = [
            new NonPlayerCharacter({
                name: "Josh",
                hp: 150,
                transform: new Transform({
                    size: new Vector(150, 150),
                }),
                deck: [
                    cards.Fireball,
                    cards.Lightning_Strike
                ],
                animations: {
                    idle: () => sheets.player.animations["orc"].run()
                }
            }),
            new NonPlayerCharacter({
                name: "Jake",
                hp: 150,
                transform: new Transform({
                    size: new Vector(150, 150)
                }),
                deck: [
                    cards.Holy_Light
                ],
                animations: {
                    idle: () =>  sheets.player.animations["gold_spirit"].run()
                }
            }),
            new NonPlayerCharacter({
                name: "Austin",
                hp: 150,
                transform: new Transform({
                    size: new Vector(150, 150)
                }),
                deck: [
                    cards.Frostbolt,
                    cards.Lightning_Strike
                ],
                animations: {
                    idle: () => sheets.lpc.animations["idle"].run() 

                }
            }),
    ];
    // #endregion

    
    const battle = new Battle(ctx, team1, team2);
    battle.start();
});



$("#hand .card-container").on("click", function() {
    $("#hand .card-container").removeClass("selected");  
    $(this).addClass("selected");

    $("#hand").toggleClass("collapsed");

    // generate target buttons
    
    // click anything besides target button -> unselect card
    // click target button -> cast ability, reset turn 

    // resetturn()
    //  uncollapse hand
    //  render ap
    //  etc
})
