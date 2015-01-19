
	/**
	 * namespace for bouncy.js.
	 * everything including world, body, behavior, etc should be called as Boucy.World, etc.
	 * @namespace
	 */
    window.Bouncy = {};

    window.raf = (function(){
        return window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                function( callback ) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();



