import { PC, NPC } from "./modules/character.js";
import { ability_map } from "./modules/ability.js";
import Vector from "./modules/vector.js";
import { Team, Battle } from "./modules/battle.js";


/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");



const team1 = new Team([
    new NPC({
        name: "Graem",
        hp: 100,
        abilities: [
            ability_map.Lightning_Strike
        ]
    }),
    new NPC({
        name: "Adrian",
        hp: 150,
        abilities: [
            ability_map.Fireball,
            ability_map.Frostbolt
        ]
    }),
    new PC({
        name: "Cam",
        hp: 200,
        abilities: [
            ability_map.Fireball,
            ability_map.Frostbolt,
            ability_map.Lightning_Strike
        ]
    })
]);

const team2 = new Team([
    new NPC({
        name: "Josh",
        hp: 150,
        abilities: [
            ability_map.Fireball,
            ability_map.Lightning_Strike
        ]
    }),
    new NPC({
        name: "Jake",
        hp: 150,
        abilities: [
            ability_map.Holy_Light
        ]
    }),
    new NPC({
        name: "Austin",
        hp: 150,
        abilities: [
            ability_map.Frostbolt,
            ability_map.Lightning_Strike
        ]
    }),
]);


const battle = new Battle(ctx, team1, team2);
battle.start();



const mouse = new Vector();
document.onmousemove = function handleMouseMove(event) {
    //mouse.x = event.pageX;
    //mouse.y = event.pageY;
    mouse.x = Math.min(canvas.width, Math.max(0,  event.pageX - canvas.offsetLeft));
    mouse.y = Math.min(canvas.height, Math.max(0, event.pageY - canvas.offsetTop));
}