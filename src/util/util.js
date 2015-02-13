
    var isMobile = "ontouchstart" in window,
        startEvent = isMobile ? "touchstart" : "mousedown",
        moveEvent = isMobile ? "touchmove" : "mousemove",
        endEvent = isMobile ? "touchend" : "mouseup";

    var now = Date.now;

    window.raf = (function(){
        return window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                function( callback ) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();

    var isArray = function (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    var extend = function ( dest, src ) {
        var i, len;

        if (arguments.length === 1) {
            src = dest;
            dest = {};
        }

        if((len = arguments.length) >= 3) {
            for(i = 1; i < len; i++){
                deepCopy(dest, arguments[i]);
            }
        } else {
            deepCopy(dest, src);
        }

        return dest;
    };

    var deepCopy = function ( dest, src ) {
        if (arguments.length === 1) {
            src = dest;
            dest = {};
        }

        if (!src || typeof src !== "object") {
            return src;
        }
        if(isArray(src)) {
            dest = [];
            var i = 0,
                len = src.length;
            for (i = 0; i < len; i++) {
                if (typeof src[i] === "object" && src[i] !== null) {
                    if (src[prop] instanceof Date) {
                        dest[i] = new Date(src[i]);
                    } else {
                        dest[i] = deepCopy(src[i]);
                    }
                }
                dest[i] = src[i];
            }
            return dest;
        }

        for (var prop in src) {
            if (src.hasOwnProperty(prop)) {
                if (typeof src[prop] === "object" && src[prop] !== null) {
                    if (src[prop] instanceof Date) {
                        dest[prop] = new Date(src[prop]);
                    } else {
                        dest[prop] = deepCopy(src[prop]);
                    }
                } else {
                    dest[prop] = src[prop];
                }
            }
        }
        return dest;
    };
