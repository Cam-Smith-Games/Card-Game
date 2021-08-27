export default class Vector {
    /**
     * 
     * @param {number} [x]
     * @param {number} [y]
     */
    constructor(x, y) {
        this.x = x ?? 0;
        this.y = y ?? 0;
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    /**
     * 
     * @param {number} angle 
     * @param {Vector} [pivot]
     * @returns 
     */
    rotate(angle, pivot = null) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let x, y;

        if (pivot) {
            x = Math.round(
                (cos * (this.x - pivot.x)) -
                (sin * (this.y - pivot.y)) +
                pivot.x
            );

            y = Math.round(
                (sin * (this.x - pivot.x)) +
                (cos * (this.y - pivot.y)) +
                pivot.y
            );

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

    /** @param {Vector} vec */
    add(vec) {
        if (vec instanceof Vector) {
            return new Vector(this.x + vec.x, this.y + vec.y);
        }
        return this;
    }

    /** @param {Vector} vec */
    subtract(vec) {
        if (vec instanceof Vector) {
            return new Vector(this.x - vec.x, this.y - vec.y);
        }
        return this;
    }

    /** @param {Vector} vec */
    dist(vec) {
        if (vec instanceof Vector) {
            return this.subtract(vec).length();
        }
        return 0;
    }

    /** @param {number} scalar */
    multiply(scalar) {
        if (typeof scalar === "number") {
            return new Vector(this.x * scalar, this.y * scalar);
        }
        return this;
    }

    /** @param {Vector} vec */
    dot(vec) {
        if (vec instanceof Vector) {
            return this.x * vec.x + this.y * vec.y;
        }
        return 0;
    }

    /** @param {Vector|number} vec */
    divide (vec) {
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

    /** @param {number} value */
    roundTo(value) {
        return new Vector(roundNumTo(this.x, value), roundNumTo(this.y, value));
    }

    /** @param {Vector} vec */
    angleTo(vec) {
        let x_diff = this.x - vec.x;
        let y_diff = this.y - vec.y;
        return Math.atan2(y_diff, x_diff) - (Math.PI / 2);;
    }
}

/**
 * rounds number to nearest multiple of x
 * @param {number} num 
 * @param {number} x 
 * @returns 
 */
function roundNumTo (num, x) { 
    return Math.floor(num / x) * x;
}

// static method to convert array ([0,1] etc) to list of Vectors
/**
 * 
 * @param {{0: number, 1: number, length: 2}[]} array 
 * @returns 
 */
Vector.fromArray = (array = []) => array.map(arr => new Vector(arr[0], arr[1]));
