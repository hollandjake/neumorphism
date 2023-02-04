import {isActive, isFocus, isHover} from "./javascript/utils.js";
import {PressureSensitiveElement} from "./javascript/neumorphism-lib.js";

const initAnimation = {
    duration: 50000,
    pressure: -0.1,
    height: 10
};
const baseAnimation = Object.assign({}, initAnimation, {
    duration: 500,
    direction: 180,
})
const activeAnimation = Object.assign({}, baseAnimation, {
    pressure: 0.1
});
const hoverAnimation = Object.assign({}, baseAnimation, {
    pressure: 0
});

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".neumorphism-js-animated, .neumorphism-js").forEach(watchElem)

    document.querySelectorAll(".height-anim").forEach(e => {
        const element = new PressureSensitiveElement({element: e});
        const up = {height: 10, duration: 1000}
        const down = {height: -10, duration: 1000}
        let isUp = false
        let nextPhase

        nextPhase = () => {
            if (isUp) {
                isUp = false
                element.animate(Object.assign({}, down, {callback: nextPhase}))
            } else {
                isUp = true
                element.animate(Object.assign({}, up, {callback: nextPhase}))
            }
        }
        nextPhase()
    })

    document.querySelectorAll(".pressure-anim").forEach(e => {
        const element = new PressureSensitiveElement({element: e});
        const up = {height: 10, pressure: 0.5, duration: 1000}
        const down = {height: 10, pressure: -0.5, duration: 1000}
        let isUp = false
        let nextPhase

        nextPhase = () => {
            if (isUp) {
                isUp = false
                element.animate(Object.assign({}, down, {callback: nextPhase}))
            } else {
                isUp = true
                element.animate(Object.assign({}, up, {callback: nextPhase}))
            }
        }
        nextPhase()
    })
})

function watchElem(elem) {
    const element = new PressureSensitiveElement({element: elem});
    if (elem.classList.contains("neumorphism-js-animated")) {
        element.animate(baseAnimation);
        [
            "focusin",
            "focusout",
            "mouseover",
            "mouseleave",
            "mousedown",
            "mouseup",
            "touchstart",
            "touchend"
        ].forEach(x => elem.addEventListener(x, () => {
            if (isFocus(elem) || isActive(elem)) {
                element.animate(activeAnimation)
            } else if (isHover(elem)) {
                element.animate(hoverAnimation)
            } else {
                element.animate(baseAnimation)
            }
        }))
    }
}

new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.classList.contains("neumorphism-js") || node.classList.contains("neumorphism-js-animated")) {
                watchElem(node)
            }
        }
    }
}).observe(document.body, {childList: true, subtree: true})