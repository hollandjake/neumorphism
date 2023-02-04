import mixbox from "https://scrtwpns.com/mixbox.esm.js";

export class Constants {
    static css(obj = document.documentElement, field) {
        return getComputedStyle(obj).getPropertyValue(`--${field}`).trim();
    }
}

export const isHover = (e) => Array.from(e.parentElement.querySelectorAll(":hover")).some(h => h === e);
export const isFocus = (e) => Array.from(e.parentElement.querySelectorAll(":focus")).some(h => h === e);
export const isActive = (e) => Array.from(e.parentElement.querySelectorAll(":active")).some(h => h === e);

export class Color {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    static fromHex(hexString) {
        if (!/^#([\dA-F]{6}|[\dA-F]{3})$/i.test(hexString)) {
            throw Error(`'${hexString}' is not a valid hex string`)
        }
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hexString = hexString.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexString);
        return result ? new Color(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)) : null;
    }

    brighten(amount) {
        return new Color(
            Math.min(Math.max(0, this.r + this.r * amount), 255),
            Math.min(Math.max(0, this.g + this.g * amount), 255),
            Math.min(Math.max(0, this.b + this.b * amount), 255),
        )
    }

    get contrast() {
        return (this.r * 299 + this.g * 587 + this.b * 114) / 1000
    }

    get isDark() {
        return this.contrast < 128;
    }

    get isLight() {
        return this.contrast >= 128;
    }

    toString() {
        return this.toHex();
    }

    toHex() {
        return `#${Math.floor(this.r).toString(16).padStart(2, "0") + Math.floor(this.g).toString(16).padStart(2, "0") + Math.floor(this.b).toString(16).padStart(2, "0")}`;
    }

    lerp(other, amount) {
        let mix = mixbox.lerp(this, other, amount);
        return new Color(mix[0], mix[1], mix[2])
    }
}

export class CubicBezier {
    epsilon = 1e-6; // Precision

    constructor(p1x, p1y, p2x, p2y) {
        // pre-calculate the polynomial coefficients
        // First and last control points are implied to be (0,0) and (1.0, 1.0)
        this.cx = 3.0 * p1x;
        this.bx = 3.0 * (p2x - p1x) - this.cx;
        this.ax = 1.0 - this.cx - this.bx;

        this.cy = 3.0 * p1y;
        this.by = 3.0 * (p2y - p1y) - this.cy;
        this.ay = 1.0 - this.cy - this.by;
    }

    sampleCurveX(t) {
        return ((this.ax * t + this.bx) * t + this.cx) * t;
    }

    sampleCurveY(t) {
        return ((this.ay * t + this.by) * t + this.cy) * t;
    }

    sampleCurveDerivativeX(t) {
        return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
    }

    solveCurveX(x) {
        let t0, t1, t2, x2, d2, i;

        // First try a few iterations of Newton's method -- normally very fast.
        for (t2 = x, i = 0; i < 8; i++) {
            x2 = this.sampleCurveX(t2) - x;
            if (Math.abs(x2) < this.epsilon) return t2;
            d2 = this.sampleCurveDerivativeX(t2);
            if (Math.abs(d2) < this.epsilon) break;
            t2 = t2 - x2 / d2;
        }

        // No solution found - use bi-section
        t0 = 0.0;
        t1 = 1.0;
        t2 = x;

        if (t2 < t0) return t0;
        if (t2 > t1) return t1;

        while (t0 < t1) {
            x2 = this.sampleCurveX(t2);
            if (Math.abs(x2 - x) < this.epsilon)
                return t2;
            if (x > x2) t0 = t2;
            else t1 = t2;

            t2 = (t1 - t0) * .5 + t0;
        }

        // Give up
        return t2;
    }

    // Find new T as a function of Y along curve X
    at(x) {
        return this.sampleCurveY(this.solveCurveX(x));
    }
}