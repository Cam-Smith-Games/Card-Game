import { AnimationTask } from "./engine/animation.js";
import Announcement from "./engine/objects/announce.js";
import { Battle } from "./battle.js";
import { Buff } from "./buff.js";
import { Card, Resistance } from "./card.js";
import { GameObject, GameObjectArgs } from "./engine/objects/gameobject.js";
import { getRandom, getRandomN } from "./engine/util/random.js";
import { Vector } from "./engine/util/vector.js";
import { OvalLight } from "./engine/objects/light.js";



export interface CharacterArgs extends GameObjectArgs {
    name: string;
    hp?: number;
    deck?: Card[];
    animations?: Record<string, () => AnimationTask>,
    anim?: string,
    defense?: Resistance,
    dodge?: number,
    buffs?: Buff[],
    baseAP?: number,
}

export class Character extends GameObject {

    #maxHP = 0;
    #hp = 0;

    /** set to true when user clicks on this character */
    selected = false;
   
    hand: Card[] = [];
    discardPile: Card[] = [];
    drawPile: Card[];
    deck: Card[];

    name: string;
    baseAP: number;
    ap: number;
    buffs: Buff[];

    defense: Resistance;
    dodge: number;
    animations: Record<string, () => AnimationTask>;
    anim: AnimationTask;

    flipped: boolean = false;

    constructor(args: CharacterArgs) {
        super(args);

        this.name = args.name;
        this.#hp = args.hp;
        this.#maxHP = args.hp;

        this.baseAP = args.baseAP ?? 4;
        this.ap = this.baseAP;
        this.buffs = args.buffs ?? [];


        this.deck = args.deck;
        this.drawPile = this.deck;


        this.defense = args.defense ?? {};

        this.dodge = args.dodge ?? 0;

        // defaulting animation
        this.animations = args.animations ?? {};

        
        // adding shaddow
        let shadowWidth = this.size.x * 0.75;
        this.children.push(new OvalLight ({
            radius: new Vector(shadowWidth, shadowWidth / 5),
            pos: new Vector(0, this.size.y/2),
            mode: "destination-out"
        }));  

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


    update(deltaTime: number) {
        super.update(deltaTime);

        // update spritesheet animation
        if (this.anim) {
            this.anim.update(deltaTime);
        }

        // TODO: wait for death animation, if any
        return this.hp < 0;
    }


    render(ctx : CanvasRenderingContext2D) {
        super._render(ctx, () => {
            if (this.anim) {
                this.anim.render(ctx);
            }
            else {
                ctx.strokeStyle = "magenta";
                ctx.lineWidth = 2;
                ctx.strokeRect(-(this.size.x / 2) + 1, (-this.size.y / 2) + 1, this.size.x - 2, this.size.y);    
            }
             
            // have to unflip for text / healthbars
            const flipped = this.scale.x < 0;
            if (flipped) ctx.scale(-1, 1);

            // NAME
            //ctx.fillStyle = "#aaa";
            //ctx.fillRect(-this.size.x / 2, this.size.y / 2, this.size.x, 32);
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.font = "4px PressStart, Arial";   
            ctx.fillText(this.name, 0, -this.size.y / 2 - 4, this.size.x);

            //ctx.strokeStyle = "#555";
            //ctx.strokeText(this.name, 0, -this.size.y / 2 - 12, this.size.x);

    
            // HEALTH BAR
            ctx.fillStyle = "red";
            ctx.fillRect(-this.size.x / 2, this.size.y / 2 + 4, this.size.x, 6);
            ctx.fillStyle = "green";
            ctx.fillRect(-this.size.x / 2, this.size.y / 2 + 4, this.size.x * (this.#hp / this.#maxHP), 6);
    
            //ctx.fillStyle = "red";
            //ctx.fillRect(-2, -2, 4, 4);    

            if (flipped) ctx.scale(-1, 1);

        });
    }


    // @ts-ignore
    async doTurn(battle: Battle, friends: Character[], enemies: Character[]) {

        // announce beginning of characters turn
        // NOTE: not waiting on announcement
        console.group(`${this.name} turn`);
        Announcement.Promise({
            parent: battle,
            text: `${this.name}'s Turn`,
            pos: new Vector(
                battle.ctx.canvas.width / 2,
                battle.ctx.canvas.height / 2,
            ),
            r: 255, g: 255, b: 255,
            font: "72px Arial",
            outline: false
        });
        
        // set to base AP, this might get modified from buffs/debuffs (i.e. exhaust etc)
        this.ap = this.baseAP;
        
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
    constructor(args: CharacterArgs) {
        super(args)
    }


    // @ts-ignore
    async doTurn (battle: Battle, friends: Character[], enemies: Character[]) {
        await super.doTurn(battle, friends, enemies);

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
    constructor(args: CharacterArgs) {
        super(args)
    }


    async doTurn(battle: Battle, friends: Character[], enemies: Character[]) {
        await super.doTurn(battle, friends, enemies);


        const character = this;
        const characters = friends.concat(enemies);
        const $hand = $("#hand").html(""); // .addClass("no-anim")
        const $energy = $("#energy").html(this.ap.toString()).show();

        
        await new Promise(resolve => setTimeout(resolve, 1000));

        return new Promise(resolve => {

            this.draw();

            $hand.addClass("drawing");

            const animTime = 100;

            // draw card 1 by 1, delay between each loop to wait for animation to finish
            this.hand.forEach((card, i) => {
                setTimeout(() => {

                    // TODO: need to calculate AP separate from "baseAP"
                    $hand.append(
                        card.getCard()
                        .wrap("<div class='card-container'></div>").parent()
                        .on("click", function()  {

                            if (card.cost > character.ap) {
                                return;
                            }

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
                                    // end turn if: no playable cards left OR no enemies left
                                    if (!character.hand.filter(card => card.cost <= character.ap).length || !enemies.filter(e => e.hp > 0).length) {
                                        resolve(null);
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
                $("#btnEndTurn").off().on("click", function() {
                    resolve(null);
                });
                //$hand.removeClass("no-anim");
            }, animTime * this.hand.length);

  
    
        })
        .then(() => {
            // put previous cards in discard pile, then empty hand
            for (let card of this.hand) {
                this.discardPile.push(card);
            };
            this.hand = [];

            $hand.empty();
            $energy.empty().hide();
            $("#discard").attr("data-count", this.discardPile.length);
            $("#draw").attr("data-count", this.drawPile.length);

            console.groupEnd();
        });
    }


    /** inner draw method: gets run a second time if draw pile didn't have enough cards and a discard transfer was necessary */
    _draw(num = 2) {
        let numToDraw = Math.min(this.drawPile.length, num)

        for(let i = 0; i < numToDraw; i++) {
            let card = getRandom(this.drawPile);
            if (card) {
                this.hand.push(card);
                this.drawPile.splice(this.drawPile.indexOf(card), 1);
            }
        }
    }

    /**
     * draws specified number of cards
     * @param {number} num number of cards to draw 
     */
    draw(num = 5) {
        
        // TODO: number of cards based on card draw attribute

        // put previous cards in discard pile, then empty hand
        for (let card of this.hand) {
            this.discardPile.push(card);
        };
        this.hand = [];

        this._draw(num);
        let remainder = num - this.hand.length;
        if (remainder) {
            // transfer entire discard pile to draw pile
            this.drawPile.push(...this.discardPile);
            this.discardPile = [];
            
            this._draw(remainder);
        }
      
        $("#discard").attr("data-count", this.discardPile.length);
        $("#draw").attr("data-count", this.drawPile.length);
    }

    discard($card: JQuery<HTMLElement>) {

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
        let numCards = $cards.length;
        let range = Math.pow(numCards, 1.5) * 2;        
        let increment = numCards > 1 ? (range / (numCards - 1)) : 0;

        $cards.each(function(i) {
            const $card = $(this);
            let angle = (increment * i) - range/2;

            // lerping origin across bottom edge
            let height = $card.outerWidth();
            let left = new Vector(0, height);
            let right = new Vector($card.outerWidth(),  height);
            let origin = Vector.lerp(right, left, i / (numCards-1));

            let rad = angle * Math.PI / 180;

            $card.css({
                "transform": `rotate(${angle}deg)`,
                "transform-origin": `${origin.x}px ${origin.y}px`,
                "bottom": `${(Math.cos(angle) * 20) - 20}px`,
                "left": `${Math.sin(rad) * 100}px`
            });
        });

        $hand.css("width", `calc(var(--card-width)*${numCards-1}.5)`);
    }


    /**
     * Creates buttons for clicking targetable characters. This is run after selecting an ability
     * @param {Battle} battle
     * @param {Card} card
     * @param {Character[]} characters 
     * @param {function():void} callback function to call immediately upon click (doesnt wait for aniamtion)
     */
    renderTargetBoxes(battle: Battle, card: Card, characters: Character[], callback: ()=>void) {
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
                        me.ap -= card.cost;
                        $("#energy").html(me.ap.toString());
                        card.cast(battle, me, [char]).then(() => resolve(null));
                    });
                
                $buttons.append($button);

                function resize() {
                    let scale = battle.ctx.canvas.offsetWidth / battle.ctx.canvas.width;

                    let size = char.size.multiply(char.scale.abs());
                    $button.css({
                        // @ts-ignore
                        left: (((char.pos.x - (size.x/2)) * scale))  + "px",
                        // @ts-ignore
                        top: (((char.pos.y - (size.y/2)) * scale))  + "px",
                        width: (size.x * scale) + "px",
                        height: (size.y * scale) + "px"
                    })
                }
                $window.on("resize", resize);
                resize();
            });

        });

    }
}