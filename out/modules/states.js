import { Battle } from "./battle.js";
import { Game } from "./engine/game.js";
import { Vector } from "./engine/util/vector.js";
import { DungeonMap, MonsterNode } from "./map.js";
export class RTXGame extends Game {
    constructor(content) {
        super();
        this.content = content;
        this.BATTLE_STATE = new BattleState();
        this.MAP_STATE = new MapState(this, content);
        this.setState(this.MAP_STATE);
    }
}
export class MapState {
    constructor(game, content) {
        // exposing entire game's content dictitonary to dungeon map static context so each node can access whatever it needs
        DungeonMap.CONTENT = content;
        this.map = new DungeonMap(node => {
            if (node instanceof MonsterNode) {
                game.BATTLE_STATE.setBattle(node.battleArgs);
                game.setState(game.BATTLE_STATE).then(() => game.setState(game.MAP_STATE));
            }
            console.log("GAMESTATE: MAP NODE SELECTED ", node);
        });
    }
    onEnter() {
        this.map.show();
    }
    onLeave() {
        this.map.hide();
    }
}
export class BattleState {
    constructor() {
        this.battle = null;
        this.mouse = new Vector();
        // #region getting elements
        this.container = document.querySelector(".battle");
        this.canvas = document.querySelector("#canvas");
        this.ctx = this.canvas.getContext("2d");
        // IMPORTANT: THIS DISABLES SMOOTHING WHEN SCALING PIXELS
        //            this can also be achieved by setting the CSS "image-rendering:pixelated" on the canvas
        //            and not upscaling the images in the code
        this.ctx.imageSmoothingEnabled = false;
        // #endregion
        // #region mouse tracking
        document.onmousemove = (event) => {
            this.mouse.x = Math.min(this.canvas.width, Math.max(0, event.pageX - this.canvas.offsetLeft));
            this.mouse.y = Math.min(this.canvas.height, Math.max(0, event.pageY - this.canvas.offsetTop));
        };
        // #endregion
    }
    setBattle(args) {
        console.log("setting battle...", args);
        this.battle = new Battle(this.ctx, args);
    }
    onEnter() {
        this.container.style.display = "flex";
        if (this.battle) {
            return this.battle.start().then(gameOver => {
                if (gameOver) {
                    console.log("GAME OVER!!!!");
                }
            });
        }
        return Promise.resolve();
    }
    onLeave() {
        this.container.style.display = "none";
        if (this.battle)
            this.battle.stop();
    }
}
