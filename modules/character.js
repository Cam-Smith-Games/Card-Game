import Announcement from "./announce.js";
import { GameObject } from "./gameobject.js";
import { getRandom, getRandomN } from "./random.js";
import Transform from "./transform.js";
import Vector from "./vector.js";

/** 
 * @typedef {import("./card").Card} Card
 * @typedef {import("./card").Resistance} Resistance
 * @typedef {import('./battle').Battle} Battle
 * @typedef {import('./animation').AnimationTask} AnimationTask
 * @typedef {import('./animation').SpriteAnimation} SpriteAnimation
 * @typedef {import('./buff').Buff} Buff
 *
 * @typedef {Object} CharacterArgs
 * @property {string} name
 * @property {number} hp
 * @property {Card[]} deck
 * @property {Object<string,function():AnimationTask>} animations
 * @property {string} [anim] name of animation to default to. (defaults to idle)
 * @property {Resistance} [defense] mapping damage types to resistances. each point reduces damage by 1
 * @property {number} [dodge] 0-1 chance to dodge. defaults to 0
 * @property {Transform} [transform]
 * @property {Buff[]} [buffs] list of buffs (including debuffs) to apply to this character 
 * @property {number} [baseAP] base numbner of action points per turn. This can be modified by buffs/debuffs
 * @property {boolean} [flipped] if true, character is flipped horizontally to face opposite direction
 */

export class Character extends GameObject {

    #maxHP = 0;
    #hp = 0;

    /** set to true when user clicks on this character */
    selected = false;

    /** @param {CharacterArgs} args  */
    constructor(args) {
        super({});

        this.name = args.name;
        this.#hp = args.hp;
        this.#maxHP = args.hp;

        this.baseAP = args.baseAP ?? 5;
        this.buffs = args.buffs ?? [];


        this.deck = args.deck;
        this.draw_pile = this.deck;
        /** @type {Card[]} */
        this.discard_pile = [];

        /** @type {Resistance} */
        this.defense = args.defense ?? {};

        this.dodge = args.dodge ?? 0;

        // this get set later once battle starts (positions based on team positioning)
        this.transform = args.transform ?? null;

        // defaulting animation
        this.animations = args.animations ?? {};
        /** @type {AnimationTask} */
        this.anim = null;

        if (args.anim in this.animations) {
            this.anim = this.animations[args.anim]();
        } else if ("idle" in this.animations) {
            this.anim = this.animations["idle"]();
        } else {
            let animations = Object.values(this.animations);
            if (animations?.length) {
                this.anim = animations[0]();
            }
        }

        this.flipped = args.flipped ?? false;

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
        super.update(deltaTime);

        // update spritesheet animation
        if (this.anim) {
            this.anim.update(deltaTime);
        }

        // TODO: wait for death animation, if any
        return this.hp < 0;
    }



    /** @param {CanvasRenderingContext2D} ctx */
    render(ctx) {
        super.render(ctx);

        this.transform.render(ctx, () => {
            if (this.anim) {
                if (this.flipped) ctx.scale(-1, 1);
                this.anim.render(ctx, this.transform.size);
                if (this.flipped) ctx.scale(-1, 1);
            }
            else {
                ctx.strokeStyle = this.selected ? "yellow" : "#aaa";
                ctx.lineWidth = 2;
                ctx.strokeRect(-(this.transform.size.x / 2) + 1, (-this.transform.size.y / 2) + 1, this.transform.size.x - 2, this.transform.size.y);    
            }
             
            // NAME
            //ctx.fillStyle = "#aaa";
            //ctx.fillRect(-this.transform.size.x / 2, this.transform.size.y / 2, this.transform.size.x, 32);
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.font = "32px Arial";
            ctx.fillText(this.name, 0, -this.transform.size.y / 2 - 12, this.transform.size.x);
    
    
            // HEALTH BAR
            ctx.fillStyle = "red";
            ctx.fillRect(-this.transform.size.x / 2, this.transform.size.y / 2 + 8, this.transform.size.x, 18);
            ctx.fillStyle = "green";
            ctx.fillRect(-this.transform.size.x / 2, this.transform.size.y / 2 + 8, this.transform.size.x * (this.#hp / this.#maxHP), 18);
    
            //ctx.fillStyle = "red";
            //ctx.fillRect(-2, -2, 4, 4);    

        });
    }


    /** 
     * @param {Battle} battle
     * @param {Character[]} friends
     * @param {Character[]} enemies
     */
    async doTurn(battle, friends, enemies) {

        // announce beginning of characters turn
        // NOTE: not waiting on announcement
        console.group(`${this.name} turn`);
        Announcement.Promise({
            parent: battle,
            text: `${this.name}'s Turn`,
            transform: new Transform({
                pos: new Vector(
                    battle.ctx.canvas.width / 2,
                    battle.ctx.canvas.height / 2,
                )
            }),
            r: 255, g: 255, b: 255,
            font: "72px Arial",
            outline: false
        });
        
        // apply all buffs (they might trigger an animation to wait for)
        for (let buff of this.buffs) {
            await buff.apply(this);
        }
    }
    
      
}



/** NPC is a Character that uses AI to decide what turn to take
 * @todo implement actual logic instead of picking a random ability and target
 */
export class NonPlayerCharacter extends Character {
    /** @param {CharacterArgs} args */
    constructor(args) {
        super(args)
    }

    /**
     * @param {Battle} battle
     * @param {Character[]} friends
     * @param {Character[]} enemies
     * @returns {Promise<any>}
     */
    async doTurn (battle, friends, enemies) {
        super.doTurn(battle, friends, enemies);

        // basic NPC logic: 
        //  1. get random ability
        //  2. get random target(s) to cast ability on
        const ability = getRandom(this.deck);
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

/** Player Character */
export class PlayerCharacter extends Character {
    /** @param {CharacterArgs} args */
    constructor(args) {
        super(args)
    }


    /** 
     * @param {Battle} battle
     * @param {Character[]} friends
     * @param {Character[]} enemies
     */
    async doTurn(battle, friends, enemies) {
        await super.doTurn(battle, friends, enemies);
        // render UI
        //      do a flex grid of abilities
        //      future: disable / gray-out buttons lacking charges or viable targets
        
        //  click ability button: highlights targetable targets
        //          click target: casts ability, ends turn

        //  click skip button: ends turn

        return this.#showCards(battle, friends, enemies).then(() => console.groupEnd());
    }


    /** 
     * @param {Battle} battle
     * @param {Character[]} friends
     * @param {Character[]} enemies
     */
    #showCards(battle, friends, enemies) {
        const character = this;
        const characters = friends.concat(enemies);
        const $hand = $("#hand").html("");

        return new Promise(resolve => {

            for (let card of this.deck) {
                console.log(card);
                // TODO: need to calculate AP separate from "baseAP"
                $hand.append(
                    card.getCard()
                    .wrap("<div class='card-container'></div>").parent()
                    .on("click", function() {
                        const $card = $(this).addClass("selected").on("click", function() {
                            $hand.removeClass("collapsed");
                            $card.removeClass("selected");
                        });

                        $hand.addClass("collapsed");
                        character.#generateButtons(battle, card, characters).then(() => {
                            $hand.html("").removeClass("collapsed");
                            resolve();
                        });   
                    })
                );
            }
  
            this.fanHand();


            // TODO: add end turn button that that also resolves

            /*$("#abilities").off().html(html).on("click", "button", function() {
                const name = $(this).data("name");
                const ability = character.abilities.filter(a => a.name == name)[0];  
                console.log("SELECTED: ", {
                    name: name,
                    ability: ability
                });                
                character.#generateButtons(battle, ability, characters).then(() => resolve());   
            });*/
    
        });

        // TODO: skip turn button
    }

    fanHand() {
        const $hand = $("#hand");
        const $cards = $hand.find(" > .card-container");
 

        // TODO: calculate range based on # of cards
        let cards = $cards.length;
        let range = Math.pow(cards, 1.5) * 2;        
        let increment = range / (cards - 1);


        $cards.each(function(i) {
            const $card = $(this);
            let angle = (increment * i) - range/2;

            // lerping origin across bottom edge
            let height = $card.outerWidth();
            let left = new Vector(0, height);
            let right = new Vector($card.outerWidth(),  height);
            let origin = Vector.lerp(right, left, i / (cards-1));

            $card.css({
                "transform": `rotate(${angle}deg)`,
                "transform-origin": `${origin.x}px ${origin.y}px`
            });
        });

        $hand.css("width", `calc(var(--card-width)*${cards-1}.5)`);
    }
    /**
     * Creates invisible buttons for clicking targetable characters. This is run after selecting an ability
     * @param {Battle} battle
     * @param {Card} ability
     * @param {Character[]} characters 
     */
    #generateButtons(battle, ability, characters) {
        const me = this;
        const $buttons = $("#buttons").html("");

        // TODO: how to select multi-target abilities? or should AOE just do everyone?

        return new Promise(resolve => {
            const $window = $(window);

            characters.forEach(char => {
                const $button =
                    $(`<button></button>`)
                    .on("click", function() {
                        $buttons.html("");

                        ability.cast(battle, me, [char]).then(() => {
                            $window.off("resize");
                            resolve();
                        });
                    })
                    .on("mouseenter", function() {
                        char.selected = true;
                    })
                    .on("mouseleave", function() {
                        char.selected = false;
                    });
                
                $buttons.append($button);

                function resize() {
                    let scale = battle.ctx.canvas.offsetWidth / battle.ctx.canvas.width;
                    $button.css({
                        // @ts-ignore
                        left: (((char.transform.pos.x - (char.transform.size.x/2)) * scale))  + "px",
                        // @ts-ignore
                        top: (((char.transform.pos.y - (char.transform.size.y/2)) * scale))  + "px",
                        width: (char.transform.size.x * scale) + "px",
                        height: (char.transform.size.y * scale) + "px"
                    })
                }
                $window.on("resize", resize);
                resize();
            });




        });

    }
}