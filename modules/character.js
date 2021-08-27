import { getRandom, getRandomN } from "./random.js";


/**
 * @typedef {Object} CharacterOptions
 * @property {string} name
 * @property {number} hp
 * @property {import("./ability").Ability[]} abilities
 * @property {import("./ability").Resistance} [defense] mapping damage types to resistances. each point reduces damage by 1
 * @property {number} [dodge] 0-1 chance to dodge. defaults to 0
 * @property {import('./vector.js').default} [pos]
 * @property {import('./vector.js').default} [size]
 */
export class Character {

    #maxHP = 0;
    #hp = 0;

    /** set to true when user clicks on this character */
    selected = false;

    /** @param {CharacterOptions} args */
    constructor(args) {
        this.name = args.name;
        this.#hp = args.hp;
        this.#maxHP = args.hp;

        this.abilities = args.abilities;
        /** @type {import("./ability").Resistance} */
        this.defense = args.defense ?? {};

        this.dodge = args.dodge ?? 0;

        // this get set later once battle starts (positions based on team positioning)
        this.pos = args.pos ?? null;
        this.size = args.size ?? null;

    }

    get hp () { return this.#hp };
    set hp(val) {
        if (val <= 0) {
            console.log(`%c${this.name} dies!`, 'color:#f55');
        }
        else {
            console.log(`${this.name} HP = ${val}.`);
        }
        this.#hp = val;
    }


    /** @param {number} deltaTime time since last frame */
    update(deltaTime) {
        // update spritesheet animation
    }


    /** 
     * @param {import('./battle').Battle} battle
     * @param {Character[]} friends
     * @param {Character[]} enemies
     */
    doTurn(battle, friends, enemies) {
        throw "attempted to execute abstract doTurn method";
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
    */
    render(ctx) {
        // BASE
        // TODO: get frame from spritesheet animation
        ctx.fillStyle = "#aaa";
        ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);


        
        if (this.selected) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.pos.x + 1, this.pos.y + 1, this.size.x - 2, this.size.y - 2);
        }

        // NAME
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2, this.size.x);

 
        // HEALTH BAR
        ctx.fillStyle = "red";
        ctx.fillRect(this.pos.x, this.pos.y + this.size.y, this.size.x, 5);
        ctx.fillStyle = "green";
        ctx.fillRect(this.pos.x, this.pos.y + this.size.y, this.size.x * (this.#hp / this.#maxHP), 5);

    }
}



/** NPC is a Character that uses AI to decide what turn to take
 * @todo implement actual logic instead of picking a random ability and target
 */
export class NPC extends Character {
    /** @param {CharacterOptions} args */
    constructor(args) {
        super(args)
    }

    /** 
     * @param {import('./battle').Battle} battle
     * @param {Character[]} friends
     * @param {Character[]} enemies
     */
    doTurn(battle, friends, enemies) {

        console.group(`${this.name} turn (NPC)`);

        // basic NPC logic: 
        //  1. get random ability
        //  2. get random target(s) to cast ability on
        const ability = getRandom(this.abilities);
        if (ability) {
            // healing abilties target team mates instead of enemies
            const targets = getRandomN(ability.power < 0 ? friends : enemies, ability.maxTargets);
            if (targets?.length) {
                return ability.cast(battle, this, targets).then(() => console.groupEnd());
            }  
        } 

        
        console.groupEnd();
        return Promise.resolve();

    }
}

export class PC extends Character {
    /** @param {CharacterOptions} args */
    constructor(args) {
        super(args)
    }


    /** 
     * @param {import('./battle').Battle} battle
     * @param {Character[]} friends
     * @param {Character[]} enemies
     */
    doTurn(battle, friends, enemies) {

        console.group(`${this.name} turn (Playable Character)`);

        // render UI
        //      do a flex grid of abilities
        //      future: disable / gray-out buttons lacking charges or viable targets
        
        //  click ability button: highlights targetable targets
        //          click target: casts ability, ends turn

        //  click skip button: ends turn

        return this.#showAbilities(battle, friends, enemies).then(() => console.groupEnd());
    }


    /** 
     * @param {import('./battle').Battle} battle
     * @param {Character[]} friends
     * @param {Character[]} enemies
     */
    #showAbilities(battle, friends, enemies) {
        const character = this;
        const characters = friends.concat(enemies);
        const html = this.abilities.map(a => `<button data-name='${a.name}'>${a.name}</button>`).join("");

        return new Promise((resolve, reject) => {

            $("#abilities").off().html(html).on("click", "button", function() {
                const name = $(this).data("name");
                const ability = character.abilities.filter(a => a.name == name)[0];  
                console.log("SELECTED: ", {
                    name: name,
                    ability: ability
                });                
                character.#generateButtons(battle, ability, characters).then(() => resolve());   
            });
    
        });

        // TODO: skip turn button
    }

    /**
     * Creates invisible buttons for clicking targetable characters. This is run after selecting an ability
     * @param {import('./battle').Battle} battle
     * @param {import('./ability').Ability} ability
     * @param {Character[]} characters 
     */
    #generateButtons(battle, ability, characters) {
        const me = this;
        const $buttons = $("#buttons").html("");

        // TODO: how to select multi-target abilities? or should AOE just do everyone?

        return new Promise((resolve, reject) => {
            characters.forEach(char => {
                const $button =
                    $(`<button style='left:${char.pos.x + battle.ctx.canvas.offsetLeft}px;top:${char.pos.y + battle.ctx.canvas.offsetTop}px;width:${char.size.x}px;height:${char.size.y}px'></button>`)
                    .on("click", function() {
                        ability.cast(battle, me, [char]).then(() => resolve());
                    })
                    .on("mouseenter", function() {
                        char.selected = true;
                    })
                    .on("mouseleave", function() {
                        char.selected = false;
                    });
                
                $buttons.append($button);
            });

        });

    }
}