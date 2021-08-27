export class Rectangle {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     */
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * @param {import('./vector').default} point 
     */
    containsPoint(point) {
        return (
            this.x <= point.x && point.x <= this.x + this.width 
            &&
            this.y <= point.y && point.y <= this.y + this.height
        );
    }
}