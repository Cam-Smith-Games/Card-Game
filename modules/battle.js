import { Rectangle } from './shapes.js';
import Vector from './vector.js';

export class Team {
    /**
     * 
     * @param {import('./character').Character[]} characters 
     */
    constructor(characters) {
        this.characters = characters;
    }
}
export class Battle {

    #previousTime = 0;
    #team_index = -1;
    #turn_index = 0;

    /** @type {import('./projectile').Projectile[]} */
    projectiles = [];


    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Team} team1 left team 
     * @param {Team} team2 right team
     */
    constructor(ctx, team1, team2) {
        this.ctx = ctx;
        this.teams = [team1, team2];    
    }

    start() {

        this.teams.forEach((team, i) => {
            team.characters.forEach((char, j) => {

                                
                // this should be set before battle.start
                //  it can be used to position, because bigger characters will shift others over
                char.size = new Vector(50, 50);

                char.pos = new Vector(
                    i == 0 ? 50 : this.ctx.canvas.width - 100, 
                    50 + (j * 75)
                );

            })
        });

        window.requestAnimationFrame(time => this.render(time));
        this.turn();
    }

    /**
     * 
     * @param {number} time 
     */
    render(time) {
        const deltaTime = time - this.#previousTime;
        this.#previousTime = time;

        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.teams.forEach((team, i) => {
            team.characters.forEach((char, j) => {
                char.update(deltaTime);
                char.render(this.ctx);
            })
        });

        for(let i = this.projectiles.length - 1; i>-1; i--) {
            let proj = this.projectiles[i];
            if (proj.update(deltaTime)) {
                proj.render(this.ctx);
            }
            else {
                this.projectiles.splice(i, 1);
            }
        }
    
        window.requestAnimationFrame(t => this.render(t));
    }


    async turn() {
        this.#turn_index++;
        this.#team_index = ++this.#team_index % this.teams.length;
        const enemy_index = (this.#team_index + 1) % this.teams.length;

        console.group(`%c---------- Turn ${this.#turn_index} (Team ${this.#team_index+1}) ----------`, "color:cyan");

        const friends = this.teams[this.#team_index];
        const enemies = this.teams[enemy_index];

        const friends_alive = friends.characters.filter(char => char.hp > 0);
        if (!friends_alive.length) {
            console.log(`FIGHT COMPLETE: Team ${enemy_index+1} Wins!`);
            return;
        }

        for (let friend of friends_alive) {
            // need to re-evaluate enemy livelihood after each individual turn because they can die each time 
            const enemies_alive = enemies.characters.filter(char => char.hp > 0);
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

