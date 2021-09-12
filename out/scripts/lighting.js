import { CircleLight } from "../modules/light.js";
import * as ImageUtil from "../modules/image.js";
import Vector from "../modules/vector.js";
import { AnimationSheet } from "../modules/animation.js";
import Transform from "../modules/transform.js";
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const mask = document.createElement("canvas").getContext("2d");
const rtx = {
    pos: new Vector(0, 0),
    size: new Vector(500, 500),
    color: "white",
    dir: 1,
    speed: 0.33,
    draw: function (ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    },
    update: function (deltaTime, canvas) {
        this.pos.x += this.dir * this.speed * deltaTime;
        if (this.pos.x < 0) {
            this.dir *= -1;
            this.pos.x = 0;
        }
        else if (this.pos.x + this.size.x > canvas.width) {
            this.dir *= -1;
            this.pos.x = canvas.width - this.size.x;
        }
    }
};
console.log(ImageUtil);
ImageUtil.loadAll({
    "torch": "/img/torch.png",
    "bg": "http://pixelartmaker-data-78746291193.nyc3.digitaloceanspaces.com/image/03ac806323af685.png"
}, images => {
    const torch_sheet = new AnimationSheet({
        sheet: images.torch,
        frameSize: new Vector(32, 64),
        groups: {
            main: { columns: 9 }
        }
    });
    const torch = {
        anim: torch_sheet.animations["main"].run(),
        transform: new Transform({
            pos: new Vector(1200, 350),
            size: new Vector(80, 160)
        })
    };
    mask.canvas.width = canvas.width = images.bg.width;
    mask.canvas.height = canvas.height = images.bg.height;
    rtx.size.x = canvas.width / 2;
    rtx.size.y = canvas.height;
    const lights = [
        new CircleLight({
            transform: new Transform({
                pos: new Vector(1200, 350)
            }),
            radius: 175
        })
    ];
    let previousTime = 0;
    function render(time) {
        const deltaTime = time - previousTime;
        previousTime = time;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(images.bg, 0, 0);
        torch.anim.update(deltaTime);
        torch.transform.render(ctx, () => {
            torch.anim.render(ctx, torch.size);
        });
        mask.clearRect(0, 0, mask.canvas.width, mask.canvas.height);
        lights.forEach(light => light.render(mask));
        mask.fillStyle = "rgba(0,0,0,0.25)";
        mask.fillRect(0, 0, canvas.width, canvas.height);
        rtx.update(deltaTime, canvas);
        rtx.draw(mask);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(mask.canvas, 0, 0, canvas.width, canvas.height);
        window.requestAnimationFrame(render);
    }
    window.requestAnimationFrame(render);
});
