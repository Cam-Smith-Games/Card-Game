import { GameObject } from './gameobject.js';
import Vector from './vector.js';
/** 
 * @typedef {import('./character').Character} Character
 */


export class Battle extends GameObject {

    #previousTime = 0;
    #team_index = -1;
    #turn_index = 0;

    /** @type {GameObject[]} */
    objects = [];


    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Character[]} team1 left team 
     * @param {Character[]} team2 right team
     */
    constructor(ctx, team1, team2) {
        super({
            children: [...team1, ...team2]
        });

        this.ctx = ctx;
        this.teams = [team1, team2];    
    }

    start() {
        this.placeCharacters();

        // begin update loop (recursive)
        window.requestAnimationFrame(time => this.loop(time));

        // begin first turn (recursive)
        this.turn();
    }


    /** positions characters on battlefield */
    placeCharacters() {
        // TODO: justify characters from center 
        // TODO: allow specifying rows/columns instead of simply stacking
  
        this.teams.forEach((team, i) => {
            let y = 50;
            team.forEach((char, j) => {

                // second team gets flipped to face left
                char.flipped = i > 0;

                let x =  50 + char.transform.size.x / 2;

                char.transform.pos = new Vector(
                    (i == 0 ? x : this.ctx.canvas.width - x), 
                    y + char.transform.size.y / 2
                );

                // 50 = 18+32 (name bar + health bar)
                y += (char.transform.size.y + 50) + 50;

            })
        });
    }


    /**
     * main game loop triggers update/render functions every frame
     * @param {number} time current time in milliseconds. used to calculate deltaTime
     */
    loop(time) {
        // dividing by 1000 to convert milliseconds to seconds 
        //   this is so we can use "FPS" for animations instead of "FPMS"
        const deltaTime = (time - this.#previousTime) / 1000;
        this.#previousTime = time;

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.update(deltaTime);
        this.render(this.ctx);

        window.requestAnimationFrame(t => this.loop(t));

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
            console.log(`FIGHT COMPLETE: Team ${enemy_index+1} Wins!`);
            return;
        }

        for (let friend of friends_alive) {
            // need to re-evaluate enemy livelihood after each individual turn because they can die each time 
            const enemies_alive = enemies.filter(char => char.hp > 0);
            if (!enemies_alive.length) {
                console.log(`FIGHT COMPLETE: Team ${this.#team_index+1} Wins!`);
                return;
            }

            await friend.doTurn(this, friends_alive, enemies_alive);
        }

        console.groupEnd();
        this.turn();
    }

}

