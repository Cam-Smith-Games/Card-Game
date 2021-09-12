import { GameObject, GameObjectArgs } from "./gameobject.js";
export { Announcement as default };


interface AnnouncementArgs extends GameObjectArgs {
    text: string;
    font?: string;
    r?: number;
    g?: number;
    b?: number;
    alpha?: number;
    maxWidth?: number;
    outline?: boolean
}

class Announcement extends GameObject {
    
    text: string;
    font: string;
    r: number;
    g: number;
    b: number;
    alpha: number;
    maxWidth?: number;
    outline: boolean

    constructor(args : AnnouncementArgs) {
        super(args);
        
        this.text = args.text;
        this.font = args.font ?? "48px Arial";   

        this.r = args.r ?? 255;
        this.g = args.g ?? 0;
        this.b = args.b ?? 0;
        this.alpha = args.alpha ?? 1;

        this.maxWidth = args.maxWidth;
        this.outline = args.outline ?? true;
    }

    update(deltaTime: number) {
        super.update(deltaTime);
        this.alpha -= deltaTime;
        return this.alpha < 0;  
    }

    render(ctx: CanvasRenderingContext2D) {
        super._render(ctx, () => {
            ctx.font = this.font;
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.alpha})`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.text, 0, 0, this.maxWidth);
    
            if (this.outline) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 0.25;
                ctx.strokeText(this.text, 0, 0, this.maxWidth);
            }
        });
    }


    static Promise(args: AnnouncementArgs) {
        return new Promise(resolve => {
            args.dispose = self => resolve(self);
            new Announcement(args);
        })
    }
}