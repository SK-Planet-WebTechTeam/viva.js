
    var World = function () {
        this.bodies = [];
        this.behaviors = [];
        this.renderer = undefined;
        this.paused = true;
        this.ratio = 100; // pixels/meter
        this.width = 600;
        this.height = 500;
    };

    World.prototype.init = function () {
    };

    World.prototype.start = function () {
        if ( !this.paused ) {
            return;
        }
        this.lastStep = new Date().getTime();

        raf( this.step.bind( this ) );

        this.paused = false;
    };

    World.prototype.step = function() {
        var i, body,
            now = new Date().getTime(),
            dt = ( now - this.lastStep ) / 1000; // in seconds

        this.lastStep = now;

        for ( i = 0; i < this.bodies.length; i++ ) {
            body = this.bodies[ i ];
            body.step( dt );
        }

        if ( this.renderer ) {
            this.renderer.draw( this.bodies );
        }

        if ( !this.paused ) {
            raf( this.step.bind( this ) );
        }
    };

    World.prototype.add = function( body ) {
        body.world = this;
        this.bodies.push( body );
    };

    World.prototype.apply = function( behavior ) {
        this.behaviors.push ( behavior );
    };

    World.prototype.setRenderer = function ( renderer ) {
        this.renderer = renderer;
        this.width = this.renderer.width;
        this.height = this.renderer.height;
    };

    World.prototype.pause = function () {
        this.paused = true;
    };

    World.prototype.resume = function () {
        this.paused = false;
        raf( this.step.bind( this ) );
    };

    Physics.World = World;
