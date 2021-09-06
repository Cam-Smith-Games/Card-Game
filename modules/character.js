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


    
    /** @type {Card[]} */
    hand = [];

    /** @type {Card[]} */
    discardPile = [];

    /** @param {CharacterArgs} args  */
    constructor(args) {
        super({});

        this.name = args.name;
        this.#hp = args.hp;
        this.#maxHP = args.hp;

        this.baseAP = args.baseAP ?? 5;
        this.buffs = args.buffs ?? [];


        this.deck = args.deck;
        this.drawPile = this.deck;


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

        const character = this;
        const characters = friends.concat(enemies);
        const $hand = $("#hand").html(""); // .addClass("no-anim")

        
        await new Promise(resolve => setTimeout(resolve, 1000));

        return new Promise(resolve => {

            this.draw();

            $hand.addClass("drawing");

            const animTime = 100;


            console.log(this.hand);

            // draw card 1 by 1, delay between each loop to wait for animation to finish
            this.hand.forEach((card, i) => {
                setTimeout(() => {

                    // TODO: need to calculate AP separate from "baseAP"
                    $hand.append(
                        card.getCard()
                        .wrap("<div class='card-container'></div>").parent()
                        .on("click", function()  {

                            if ($hand.hasClass("collapsed")) {
                                $hand.removeClass("collapsed")
                                    .find(".selected").removeClass("selected");

                                $("#buttons").html("");
                            }
                            else {
                                const $card = $(this).addClass("selected");
                                $hand.addClass("collapsed");

                                // todo: don't resolve until:
                                //      no energy
                                //      OR empty hand
                                //      OR "end turn" is clicked
                                character.renderTargetBoxes(battle, card, characters, () => {
                                    character.discard($card);
                                    $hand.removeClass("collapsed");
                                })
                                .then(() => {

                                    // TODO: OR energy == 0
                                    if (!character.hand.length) {
                                        resolve();
                                    }
                                });   
                            }

                        })

                    );

                }, animTime * i);

            })



            // wait for all animations to finish, then fan
            setTimeout(() => {
                this.fanHand();
                $hand.removeClass("drawing");
                //$hand.removeClass("no-anim");
            }, animTime * this.hand.length);

  

            // TODO: add end turn button that that also resolves

    
        })
        .then(() => console.groupEnd());
    }



    /**
     * draws specified number of cards
     * @param {number} num number of cards to draw 
     */
    draw(num = 5) {
        
        // TODO: number of cards based on card draw attribute

        // put any existing cards back in deck        
        for (let card of this.hand) {
            this.drawPile.push(card);
        };

        /** @type {Card[]} */
        this.hand = [];

        let nn = Math.max(this.drawPile.length, num);

        for(let i = 0; i <  nn; i++) {
            let card = getRandom(this.drawPile);
            if (card) {
                this.hand.push(card);
                this.drawPile.splice(this.drawPile.indexOf(card), 1);
            }
        }

        $("#draw").attr("data-count", this.hand.length);
    }

    /** @param {JQuery<HTMLElement>} $card */
    discard($card) {

        const $hand = $("#hand").addClass("no-anim");

 
        $card.addClass("discarding");
        /** @type {Card} */
        const card = $card.find(".card").data("card");

        if (card) {            
            // add card to discard pile and increment discard count
            this.hand.splice(this.hand.indexOf(card), 1);
            this.discardPile.push(card);
            $("#discard").attr("data-count", this.discardPile.length);

            // discard animation takes 1 second
            setTimeout(() => {
                $card.remove();
                $hand.removeClass("no-anim");
                this.fanHand();
            }, 1000);
        }


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

            let rad = angle * Math.PI / 180;

            $card.css({
                "transform": `rotate(${angle}deg)`,
                "transform-origin": `${origin.x}px ${origin.y}px`,
                "bottom": `${(Math.cos(angle) * 20) - 20}px`,
                "left": `${Math.sin(rad) * 100}px`
            });
        });

        $hand.css("width", `calc(var(--card-width)*${cards-1}.5)`);
    }


    /**
     * Creates buttons for clicking targetable characters. This is run after selecting an ability
     * @param {Battle} battle
     * @param {Card} card
     * @param {Character[]} characters 
     * @param {function():void} callback function to call immediately upon click (doesnt wait for aniamtion)
     */
    renderTargetBoxes(battle, card, characters, callback) {
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
                        $window.off("resize");
  
                        callback();
                        card.cast(battle, me, [char]).then(() => resolve());
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