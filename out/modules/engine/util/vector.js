export class Vector {
    constructor(x = 0, y = 0) {
        this.x = x !== null && x !== void 0 ? x : 0;
        this.y = y !== null && y !== void 0 ? y : 0;
    }
    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }
    rotate(angle, pivot = null) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let x, y;
        if (pivot) {
            x = Math.round((cos * (this.x - pivot.x)) -
                (sin * (this.y - pivot.y)) +
                pivot.x);
            y = Math.round((sin * (this.x - pivot.x)) +
                (cos * (this.y - pivot.y)) +
                pivot.y);
        }
        else {
            x = (cos * this.x) - (sin * this.y);
            y = (sin * this.x) + (cos * this.y);
        }
        return new Vector(x, y);
    }
    copy() {
        return new Vector(this.x, this.y);
    }
    abs() {
        return new Vector(Math.abs(this.x), Math.abs(this.y));
    }
    add(vec) {
        if (vec instanceof Vector) {
            return new Vector(this.x + vec.x, this.y + vec.y);
        }
        return this;
    }
    subtract(vec) {
        if (vec instanceof Vector) {
            return new Vector(this.x - vec.x, this.y - vec.y);
        }
        return this;
    }
    dist(vec) {
        if (vec instanceof Vector) {
            return this.subtract(vec).length();
        }
        return 0;
    }
    multiply(scalar) {
        if (typeof scalar === "number") {
            return new Vector(this.x * scalar, this.y * scalar);
        }
        if (scalar instanceof Vector) {
            return new Vector(this.x * scalar.x, this.y * scalar.y);
        }
        return this;
    }
    dot(vec) {
        if (vec instanceof Vector) {
            return this.x * vec.x + this.y * vec.y;
        }
        return 0;
    }
    divide(vec) {
        if (vec instanceof Vector) {
            return new Vector(this.x / vec.x, this.y / vec.y);
        }
        return new Vector(this.x / vec, this.y / vec);
    }
    unit() {
        let length = this.length();
        if (length == 0) {
            return this;
        }
        return this.divide(length);
    }
    roundTo(value) {
        return new Vector(roundNumTo(this.x, value), roundNumTo(this.y, value));
    }
    angleTo(vec) {
        let x_diff = this.x - vec.x;
        let y_diff = this.y - vec.y;
        return Math.atan2(y_diff, x_diff) - (Math.PI / 2);
        ;
    }
    /** converts multi-dimensional array to list of Vectors */
    static fromArray(array = []) {
        return array.map(arr => new Vector(arr[0], arr[1]));
    }
}
/**
 * @param {number} start numnber to start at
 * @param {number} end number to end at
 * @param {number} perc percentage (0-1) between start and end
 */
Vector.lerp_num = (start, end, perc) => (1 - perc) * start + (perc * end);
/**
 * @param {Vector} start vector to start at
 * @param {Vector} end vector to end at
 * @param {number} perc percentage (0-1) between start and end
 */
Vector.lerp = (start, end, perc) => new Vector(Vector.lerp_num(start.x, end.x, perc), Vector.lerp_num(start.y, end.y, perc));
/** rounds number to nearest multiple of x */
function roundNumTo(num, x) {
    return Math.floor(num / x) * x;
}
