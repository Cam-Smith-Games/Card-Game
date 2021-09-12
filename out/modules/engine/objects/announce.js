import { GameObject } from "./gameobject.js";
export { Announcement as default };
class Announcement extends GameObject {
    constructor(args) {
        var _a, _b, _c, _d, _e, _f;
        super(args);
        this.text = args.text;
        this.font = (_a = args.font) !== null && _a !== void 0 ? _a : "48px Arial";
        this.r = (_b = args.r) !== null && _b !== void 0 ? _b : 255;
        this.g = (_c = args.g) !== null && _c !== void 0 ? _c : 0;
        this.b = (_d = args.b) !== null && _d !== void 0 ? _d : 0;
        this.alpha = (_e = args.alpha) !== null && _e !== void 0 ? _e : 1;
        this.maxWidth = args.maxWidth;
        this.outline = (_f = args.outline) !== null && _f !== void 0 ? _f : true;
    }
    update(deltaTime) {
        super.update(deltaTime);
        this.alpha -= deltaTime;
        return this.alpha < 0;
    }
    render(ctx) {
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
    static Promise(args) {
        return new Promise(resolve => {
            args.dispose = self => resolve(self);
            new Announcement(args);
        });
    }
}
