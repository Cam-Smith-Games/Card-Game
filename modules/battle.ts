import { Character } from './character.js';
import { GameObject } from './engine/objects/gameobject.js';
import { Vector } from "./engine/util/vector.js";


export interface BattleArgs {
    team1: Character[];
    team2: Character[];
    background?: HTMLImageElement
}
export class Battle extends GameObject {

    #previousTime = 0;
    #team_index = -1;
    #turn_index = 0;

    container: HTMLElement;
    ctx: CanvasRenderingContext2D;
    objects: GameObject[] = [];
    teams: Character[][];
    background: HTMLImageElement;

    loop_handle:number;

    /** promise to reoslve fight is complete. result will be true when game is over (player dies) */
    resolve: (value:boolean) => void;

    constructor(ctx: CanvasRenderingContext2D, args:BattleArgs) {
        super({
            children: [...args.team1, ...args.team2]
        });

        this.ctx = ctx;
        this.teams = [args.team1, args.team2];
        this.background = args.background;    
    }

    start() {
        this.placeCharacters();

        const promise = new Promise<boolean>(resolve => {
            this.resolve = resolve;
        });


        //this.teams[1].forEach(char => char.scale.x *= -1);
        
        // begin update loop (recursive)
        window.requestAnimationFrame(time => this.loop(time));

        // begin first turn (recursive)
        this.turn();

        // set resolver to resolve once this fight is complete (used for auto-exiting game state)
        return promise;
        
    }


    stop() {
        console.log(`FIGHT COMPLETE: Team ${this.#team_index+1} Wins!`);        
        window.cancelAnimationFrame(this.loop_handle);

        let gameOver = this.#team_index == 0;
        this.resolve(gameOver);
    }

    /** positions characters on battlefield */
    placeCharacters() {
        // TODO: justify characters from center 
        // TODO: allow specifying rows/columns instead of simply stacking
  
        this.teams.forEach((team, i) => {
            let x = 50;
            let y = this.ctx.canvas.height - 150;
            let maxCharWidth = 0;
            team.forEach((char, _) => {

                let size = char.size.multiply(char.scale.abs());

                if (size.x > maxCharWidth) {
                    maxCharWidth = size.x;
                }

                // second team gets flipped to face left (this can't be solved with transform.scale because that would flip the text and everything)
                char.flipped = i > 0;
                if (char.flipped) {
                    char.scale.x *= -1;
                }

                let cx =  x + size.x / 2;

                console.log(x);

                char.pos = new Vector(
                    (i == 0 ? cx : this.ctx.canvas.width - cx), 
                    y - size.y / 2
                );

                // 50 = 18+32 (name bar + health bar)
                y -= (size.y + 50) + 50;
                
                if (y > this.ctx.canvas.height - 50) {
                    console.log(maxCharWidth);
                    x += (50 + maxCharWidth) * (i > 0 ? -1 : 1); // first time goes right, second time goes left
                    y = this.ctx.canvas.height - 50;
                    maxCharWidth = 0;
                }

            })
        });
    }


    /**
     * main game loop triggers update/render functions every frame
     * @param {number} time current time in milliseconds. used to calculate deltaTime
     */
    loop(time: number) {
        // dividing by 1000 to convert milliseconds to seconds 
        //   this is so we can use "FPS" for animations instead of "FPMS"
        const deltaTime = (time - this.#previousTime) / 1000;
        this.#previousTime = time;

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.update(deltaTime);
        this.render(this.ctx);

        this.loop_handle = window.requestAnimationFrame(t => this.loop(t));

    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.background) {
            ctx.drawImage(this.background, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        super.render(ctx);
    }

    async turn() {
        this.#turn_index++;
        this.#team_index = ++this.#team_index % this.teams.length;
        const enemy_index = (this.#team_index + 1) % this.teams.length;

        console.group(`%c---------- Turn ${this.#turn_index} (Team ${this.#team_index+1}) ----------`, "color:cyan");

        const friends = this.teams[this.#team_index];
        const enemies = this.teams[enemy_index];

        const friends_alive = friends.filter(char => char.hp > 0);
        if (!friends_alive.length) {
            this.stop();
            return;
        }

        for (let friend of friends_alive) {
            // need to re-evaluate enemy livelihood after each individual turn because they can die each time 
            const enemies_alive = enemies.filter(char => char.hp > 0);
            if (!enemies_alive.length) {
                this.stop();
                return;
            }

            await friend.doTurn(this, friends_alive, enemies_alive);
        }

        console.groupEnd();
        this.turn();
    }

}

