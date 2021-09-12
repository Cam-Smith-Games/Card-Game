export class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    containsPoint(point) {
        return (this.x <= point.x && point.x <= this.x + this.width
            &&
                this.y <= point.y && point.y <= this.y + this.height);
    }
}
