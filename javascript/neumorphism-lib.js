import {Color, Constants, CubicBezier} from "./utils.js";

const SENTINEL = Object.freeze({});

function lerp(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    if (a instanceof Color && b instanceof Color) {
        return a.lerp(b, t)
    }

    return a + (b - a) * t;
}

const EASE_IN_OUT = new CubicBezier(0.42, 0, 0.58, 1);

function interpolate(a, b, t) {
    return lerp(a, b, EASE_IN_OUT.at(t))
}

export function find_attribute(elem, attribute, defaultVal = undefined, sourceElem = null) {
    if (elem === undefined || elem.dataset === undefined) {
        return undefined;
    }

    const camelifyAttribute = attribute.replace(/-([a-z])/g, g => g[1].toUpperCase())

    // Check data attributes

    if (camelifyAttribute in elem.dataset) {
        return elem.dataset[camelifyAttribute]
    }

    if (`default${camelifyAttribute.charAt(0).toUpperCase() + camelifyAttribute.slice(1)}` in elem.dataset) {
        return elem.dataset[`default${camelifyAttribute.charAt(0).toUpperCase() + camelifyAttribute.slice(1)}`]
    } else {
        const parentAttribute = find_attribute(elem.parentNode, attribute, defaultVal, sourceElem ?? elem);
        if (parentAttribute !== undefined) {
            return parentAttribute;
        }
    }

    // Check CSS variables
    const cssAttribute = Constants.css(sourceElem, attribute) || Constants.css(sourceElem, "default-" + attribute)
    if (cssAttribute) {
        return cssAttribute
    }
    return defaultVal
}

const colorAttributeName = 'neu-background';
const heightAttributeName = 'neu-height';
const pressureAttributeName = 'neu-pressure';
const intensityAttributeName = 'neu-intensity';
const directionAttributeName = 'neu-direction';
const textLightAttributeName = 'neu-text-light';
const textDarkAttributeName = 'neu-text-dark';

export class PressureSensitiveElement {
    constructor({
                    element,
                    height = null,
                    pressure = null,
                    intensity = null,
                    direction = null,
                    background = null,
                    textColorLight = null,
                    textColorDark = null
                }) {
        this.element = element;
        this.currentFrame = null;
        this.defaultBackground = background ?? Color.fromHex(find_attribute(element, colorAttributeName, "#fff"));
        this.defaultTextLight = textColorLight ?? Color.fromHex(find_attribute(element, textLightAttributeName, "#000"));
        this.defaultTextDark = textColorDark ?? Color.fromHex(find_attribute(element, textDarkAttributeName, "#fff"));
        this.defaultHeight = Number(height ?? find_attribute(element, heightAttributeName, 0));
        this.defaultPressure = Number(pressure ?? find_attribute(element, pressureAttributeName, 0));
        this.defaultIntensity = Number(intensity ?? find_attribute(element, intensityAttributeName, 0.3));
        this.defaultDirection = Number(direction ?? find_attribute(element, directionAttributeName, "135deg")?.replace(/[^\d.-]+/g, ''));
        this.currentColor = this.defaultBackground;
        this.currentTextLight = this.defaultTextLight;
        this.currentTextDark = this.defaultTextDark;
        this.currentHeight = this.defaultHeight;
        this.currentPressure = this.defaultPressure;
        this.currentIntensity = this.defaultIntensity;
        this.currentDirection = this.defaultDirection;

        // Ensure element is in default position
        this.animate({
            height: this.defaultHeight,
            pressure: this.defaultPressure,
            intensity: this.defaultIntensity,
            direction: this.defaultDirection,
            color: this.defaultBackground,
            textColorLight: this.defaultTextLight,
            textColorDark: this.defaultTextDark,
            duration: 0
        });
    }

    animate({
                height = null,
                pressure = null,
                intensity = null,
                direction = null,
                color = null,
                textColorLight = null,
                textColorDark = null,
                duration = 0,
                callback = null
            } = {}) {
        cancelAnimationFrame(this.currentFrame);

        const fromColor = this.currentColor;
        const fromTextLight = this.currentTextLight;
        const fromTextDark = this.currentTextDark;
        const fromHeight = this.currentHeight;
        const fromPressure = this.currentPressure;
        const fromIntensity = this.currentIntensity;
        const fromDirection = this.currentDirection;
        const toColor = color === SENTINEL ? this.currentColor : (color ?? this.defaultBackground);
        const toTextLight = textColorLight === SENTINEL ? this.currentTextLight : (textColorLight ?? this.defaultTextLight);
        const toTextDark = textColorDark === SENTINEL ? this.currentTextDark : (textColorDark ?? this.defaultTextDark);
        const toHeight = height === SENTINEL ? this.currentHeight : (height ?? this.defaultHeight);
        const toPressure = pressure === SENTINEL ? this.currentPressure : (pressure ?? this.defaultPressure);
        const toIntensity = intensity === SENTINEL ? this.currentIntensity : (intensity ?? this.defaultIntensity);
        const toDirection = direction === SENTINEL ? this.currentDirection : (intensity ?? this.defaultDirection);

        let start;
        const me = this;
        let animation = (timestamp) => {
            if (start === undefined) start = timestamp;
            const p = duration === 0 ? 1 : (timestamp - start) / duration;
            me.currentColor = interpolate(fromColor, toColor, p);
            me.currentTextLight = interpolate(fromTextLight, toTextLight, p);
            me.currentTextDark = interpolate(fromTextDark, toTextDark, p);
            me.currentHeight = interpolate(fromHeight, toHeight, p);
            me.currentPressure = interpolate(fromPressure, toPressure, p);
            me.currentIntensity = interpolate(fromIntensity, toIntensity, p);
            me.currentDirection = interpolate(fromDirection, toDirection, p);
            me.emboss(
                me.currentColor,
                me.currentTextLight,
                me.currentTextDark,
                me.currentHeight,
                me.currentPressure,
                me.currentIntensity,
                me.currentDirection
            );
            if (p < 1) {
                me.currentFrame = requestAnimationFrame(animation);
            } else {
                me.currentFrame = null;
                if (callback) {
                    callback(me)
                }
            }
        };
        this.currentFrame = requestAnimationFrame(animation);
    }

    emboss(color, textColorLight, textColorDark, height = SENTINEL, pressure = SENTINEL, intensity = SENTINEL, direction = SENTINEL, textLightColor = SENTINEL, textDarkColor = SENTINEL) {
        direction = (direction === SENTINEL ? find_attribute(this.element, directionAttributeName) : direction) * Math.PI / 180;
        intensity = Math.max(0, Math.min(intensity === SENTINEL ? find_attribute(this.element, intensityAttributeName) : intensity, 1));

        height = height === SENTINEL ? find_attribute(this.element, heightAttributeName) : height;
        pressure = pressure === SENTINEL ? find_attribute(this.element, pressureAttributeName) : pressure;

        const raised = height >= 0;
        const distance = Math.abs(height);
        const blur = distance * 2;


        // Color
        const shadowColor = color.brighten(-intensity);
        const highlightColor = color.brighten(intensity);

        const upperGradientColor = color.brighten(-pressure);
        const lowerGradientColor = color.brighten(pressure);

        //Lighting
        const posAngle = direction - Math.PI / 2;
        const positionX = Math.sin(posAngle) * distance;
        const positionY = Math.cos(posAngle) * distance;

        Object.assign(this.element.style, {
            "background-image": `linear-gradient(${direction}rad, ${upperGradientColor}, ${lowerGradientColor})`,
            "box-shadow": `${raised ? '' : 'inset'} ${positionX}px ${positionY}px ${blur}px ${shadowColor}, ${raised ? '' : 'inset'} ${-positionX}px ${-positionY}px ${blur}px ${highlightColor}`,
            "color": upperGradientColor.lerp(lowerGradientColor, 0.5).isLight ? textLightColor : textDarkColor
        })
    }
}