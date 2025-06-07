const Utils = {
    qs: (selector, parent = document) => parent.querySelector(selector),
    qsa: (selector, parent = document) => parent.querySelectorAll(selector),
    
    // Simple random number generator
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    // Debounce function (from Lodash or implement simply)
    debounce: (func, delay) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    },
    // More utilities as needed...
};