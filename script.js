// @ts-check

/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("canvas");
/** @type {HTMLCanvasElement} */
// @ts-ignore
const maskCanvas = document.getElementById("maskCanvas");
const ctx = canvas.getContext("2d");
const maskctx = maskCanvas.getContext("2d");

/** @param {string} src */
function newImage(src) {
    var img = new Image();
    img.src = src;
    return img;
}
var bg = newImage("img/bg.png");

// shaders
var night_shade = "rgba(60, 60, 150,";
var black_shade = "rgba(0, 0, 0,";
var shades = [night_shade, black_shade];
var shadeNames = ["night", "black"];

// lights
const red_light = [255, 0, 0];
const orange_light = [255, 127, 0];
const yellow_light = [255, 255, 0];
const white_light = [255, 255, 255];
const teal_light = [0, 255, 175];
const blue_light = [0, 200, 255];
const lights = [red_light, orange_light, yellow_light, white_light, teal_light, blue_light];
const lightNames = ["red", "orange", "yellow", "white", "teal", "blue"];

// filters
var filters = ["lighter", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"];

// position of moveable light source
var x = bg.width/2;
var y = bg.height/2;

class LightingSetting {
    /** @callback SettingChange
     * @param {LightingSetting} self
     * @returns {string} */

    /** @param {number} value 
     *  @param {SettingChange} change */
    constructor(value, change) {
        this.value = value;
        this.change = () => change(this);
    }
}

/** @type {Object<string,LightingSetting>} */
const settings = {
    "light": new LightingSetting(3, self => {
        self.value = (self.value+1)%lights.length; 
        return lightNames[self.value]; 
    }),
    "shade": new LightingSetting(1, self => {
        self.value = (self.value+1)%shades.length;
        return shadeNames[self.value];
    }),
    "intensity": new LightingSetting(1, self => {
        self.value = (self.value+0.05)%1.05; 
        return self.value.toFixed(2);
    }),
    "lintensity": new LightingSetting(1, self => {
        self.value = (self.value+0.05)%1.05; 
        return self.value.toFixed(2); 
    }),
    "filter": new LightingSetting(1, self => {
        self.value = (self.value+1)%filters.length; 
        return filters[self.value]; 
    })
};


$("#buttons > div").on("click", function() {
    const $this = $(this);
    const field = $this.data("field");
    if (field in settings) {
        const text = settings[field].change();
        $this.find(">div").text(text);
    }
});



/** @type {Object<string,boolean>} */
const keys = {};
// key listener
window.addEventListener("keydown", e => keys[e.key.toUpperCase()] = true);
window.addEventListener("keyup", e => delete keys[e.key.toUpperCase()]);
setInterval(function() {

    // wasd keys move light source
    if(keys.W)
        y-=5;
    if(keys.A)
        x-=5;
    if(keys.S)
        y+=5;
    if(keys.D)
        x+=5;

    setupMask();
    render();
}, 1000/30);


// render: draw bg then mask
function render() {
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);
    drawMask();
}


/** draw gradient with given coordinates and radius
 * @param {number} x 
 * @param {number} y 
 * @param {number} radius */
function drawGradient(x, y, radius) {
    var gradient = ctx.createRadialGradient(x, y, radius/2, x, y, radius);
    const lightIndex = settings.light.value;
    const lightIntensity = settings.lintensity.value;

    var r = lights[lightIndex][0] * lightIntensity;
    var g = lights[lightIndex][1] * lightIntensity;
    var b = lights[lightIndex][2] * lightIntensity;
    var color = "rgba("+ Math.round(r) +","+ Math.round(g) +","+ Math.round(b) +",";
    gradient.addColorStop(0, color + "1)");
    gradient.addColorStop(0.5, color + "0.7)");
    gradient.addColorStop(1, color + "0.3)");

    maskctx.fillStyle = gradient;
    maskctx.beginPath();
    maskctx.arc(x, y, radius, 0, Math.PI * 2);
    maskctx.fill();
}

// drawMask: draw the mask canvas onto normal canvas with set filter
function drawMask() {
    ctx.globalCompositeOperation = filters[settings.filter.value];
    ctx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height);
}

// setupMask: draw the 3 gradients to maskCanvas
function setupMask() {
    maskctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    maskctx.fillStyle = shades[settings.shade.value] + settings.intensity.value + ")";
    maskctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGradient(150, bg.height/2, 50);
    drawGradient(bg.width-150, bg.height/2, 50);
    drawGradient(x, y, 50);
}
