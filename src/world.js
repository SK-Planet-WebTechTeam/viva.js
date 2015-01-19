
    /**
     * world class which has all the bodies and behaviors to simulate.
     * @class
     */
    var World = function () {
        this.bodies = [];
        this.behaviors = [];
        this.renderer = undefined;
        this.paused = true;
        this.ratio = 100; // pixels/meter
        this.width = 600;
        this.height = 500;

        this.movingBody = null;
        this.lastStep = 0;
        this.lastMove = 0;

        /* event handlers */
        this.onMove = this._onMove.bind( this );
        this.onEnd = this._onEnd.bind( this );
    };

    World.prototype.init = function () {

    };

    /**
     * start the world
     */
    World.prototype.start = function () {
        if ( !this.paused ) {
            return;
        }
        this.lastStep = now();

        raf( this._step.bind( this ) );

        this.paused = false;
    };

    /**
     * step function which is called by requestAnimationFrame at every frame
     * all the simulation is done in this function by time step of each step function
     * @private
     */
    World.prototype._step = function() {
        var i, body,
            thisStep = now(),
            dt = ( thisStep - this.lastStep ) / 1000; // in seconds

        this.lastStep = thisStep;

        for ( i = 0; i < this.behaviors.length; i++ ) {
            for ( var j = 0; j < this.bodies.length; j++ ) {
                body = this.bodies[ j ];
                this.behaviors[ i ].behave( body );
            }
        }

        for ( i = 0; i < this.bodies.length; i++ ) {
            body = this.bodies[ i ];
            body.step( dt );
        }

        if ( this.renderer ) {
            this.renderer.draw( this.bodies );
        }

        if ( !this.paused ) {
            raf( this._step.bind( this ) );
        }
    };

    /**
     * add a body to the world
     *
     * @param {Object} body
     */
    World.prototype.add = function( body ) {
        body.world = this;
        this.bodies.push( body );
    };

    /**
     * apply a behavior to the world
     *
     * @param {Object} behavior
     */
    World.prototype.apply = function( behavior ) {
        this.behaviors.push( behavior );
    };

    /**
     * set renderer of the world
     *
     * @param {Object} renderer
     */
    World.prototype.setRenderer = function ( renderer ) {
        this.renderer = renderer;
        this.width = this.renderer.width;
        this.height = this.renderer.height;

        this.renderer.on( startEvent, this._onClick.bind( this ) );
    };

    /**
     * pause simulation
     */
    World.prototype.pause = function () {
        this.paused = true;
    };

    /**
     * resume paused simulation
     */
    World.prototype.resume = function () {
        this.start();
    };


    /**
     * mousedown/touchstart event handler.
     * if clicked on a body, the body stops simulation and stays at the mouse pointer
     * as if the user is holding it
     * @private
     */
    World.prototype._onClick = function ( e ) {
        var offset = this.renderer.el.getBoundingClientRect(),
            x = e.pageX || e.touches[0].pageX - offset.left,
            y = e.pageY || e.touches[0].pageY - offset.top,
            body,
            i;

        if ( this.paused ) {
            return;
        }

        // Consider the later a body is added to the world, the higher z-index it has.
        for ( i = this.bodies.length - 1; i >= 0; i-- ) {
            body = this.bodies[ i ];
            if ( body.contains( x, y ) ) {
                body.setStatus( "MOVING" );
                body.angularVelocity = 0;
                this.movingBody = body;

                this.renderer.on( moveEvent, this.onMove );
                this.renderer.on( endEvent, this.onEnd );

                return;
            }
        }
    };

    /**
     * mousemove/touchmove event handler.
     * there the user is holding a body, moves the body along the pointer
     * @private
     */
    World.prototype._onMove = function ( e ) {
        var offset = this.renderer.el.getBoundingClientRect(),
            x = isMobile ? e.touches[0].pageX - offset.left : e.pageX,
            y = isMobile ? e.touches[0].pageY - offset.top : e.pageY,
            moveTime = now(),
            dt = moveTime - this.lastMove,
            body = this.movingBody,
            velocity;

        e.preventDefault();
        e.stopPropagation();

        if ( !body ) {
            this.lastMove = 0;
            return;
        }

        if ( !this._isMovable( body, x, y ) ) {
            this.lastMove = 0;
            return;
        }

        // calculate the velocity of movement
        body.prevPosition.set( x, y );
        body.move( viva.Vector.create( x, y ) );
        velocity = viva.Vector.copy( body.position ).sub( body.prevPosition ).scale( 1000 / dt );

        viva.Vector.release( body.velocity );
        body.velocity = velocity;

        this.lastMove = moveTime;
    };


    /**
     * check if the body is within the boundary
     * @private
     *
     * @param {Object} body
     * @param {Number} x x-coordinate of mouse pointer
     * @param {Number} y y-coordinate of mouse pointer
     */
    World.prototype._isMovable = function ( body, x, y ) {
        var horizontalDistance = body.radius || body.width/2,
            verticalDistance = body.radius || body.height/2,
            boundary = this.renderer.el.getBoundingClientRect();

        if ( x + horizontalDistance >= boundary.left + boundary.width ) {
            return false;
        }
        if ( x - horizontalDistance <= boundary.left  ) {
            return false;
        }
        if ( y + verticalDistance >= boundary.top + boundary.height ) {
            return false;
        }
        if ( y - verticalDistance <= boundary.top ) {
            return false;
        }

        return true;
    };

    /**
     * mouseend/touchend event handler.
     * let the body go
     * @private
     */
    World.prototype._onEnd = function () {
        if ( now() - this.lastMove > 200 ) {
            this.movingBody.velocity.reset();
        }

        this.movingBody.setStatus( "NORMAL" );
        this.movingBody = null;
        this.renderer.off( moveEvent, this.onMove );
        this.renderer.off( endEvent, this.onEnd );
    };

    viva.World = World;
