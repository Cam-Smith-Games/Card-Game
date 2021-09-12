import { Battle, BattleArgs } from "./battle.js";
import { Card } from "./card.js";
import { Character, NonPlayerCharacter } from "./character.js";
import { Game, GameState } from "./engine/game.js";
import { Vector } from "./engine/util/vector.js";
import { DungeonMap, MonsterNode } from "./map.js";

/** 
 * this class contains content specific to this game (all characters, cards, etc)
 *      game state logic can retrieve whatever is needed from this big dictionary  
 */
export interface Content {
    cards: Record<string, Card>,
    player: Character[],
    monsters: Record<string, typeof NonPlayerCharacter> 
}

export class RTXGame extends Game {
    BATTLE_STATE: BattleState;
    MAP_STATE: MapState;

    content: Content;
    
    constructor(content:Content) {
        super();
        this.content = content;

        this.BATTLE_STATE = new BattleState();
        this.MAP_STATE = new MapState(this, content);
        
        this.setState(this.MAP_STATE);
    }
}

export class MapState implements GameState {
    map: DungeonMap;

    constructor(game:RTXGame, content:Content) {

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

export class BattleState implements GameState {
    battle:Battle = null;

    container:HTMLElement;
    canvas:HTMLCanvasElement;
    ctx:CanvasRenderingContext2D;

    mouse:Vector = new Vector();

    constructor() {

        // #region getting elements
        this.container = document.querySelector<HTMLElement>(".battle");
        this.canvas = document.querySelector<HTMLCanvasElement>("#canvas");
        this.ctx = this.canvas.getContext("2d");
        // IMPORTANT: THIS DISABLES SMOOTHING WHEN SCALING PIXELS
        //            this can also be achieved by setting the CSS "image-rendering:pixelated" on the canvas
        //            and not upscaling the images in the code
        this.ctx.imageSmoothingEnabled = false;
        // #endregion

        // #region mouse tracking
        document.onmousemove = (event) => {
            this.mouse.x = Math.min(this.canvas.width, Math.max(0,  event.pageX - this.canvas.offsetLeft));
            this.mouse.y = Math.min(this.canvas.height, Math.max(0, event.pageY - this.canvas.offsetTop));
        }
        // #endregion

    }

    setBattle(args: BattleArgs) {
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
        if (this.battle) this.battle.stop();
    }
}
