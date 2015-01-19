

    var bodyPool = [];

    /**
     * @namespace Body
     */
    var BodyManager = {
        /** @private */
        initPool: function () {
            var i;

            for ( i = 0; i < 16; i++ ) {
                bodyPool.push( new body({ x: -1000, y: -1000 }) );
            }
        },
        /** @private */
        expandPool: function () {
            var i,
                newLength = 32;

            for ( i = bodyPool.length; i < newLength; i++ ) {
                bodyPool.push( new body({ x: -1000, y: -1000 }) );
            }
        },
        /**
         * get a body from body pool.
         * please refer to {@link body} for detailed API
         * @function
         * @memberof Body
         *
         * @param {String} type type of a body [ "rectangle" | "circle" ]
         * @param {Object} body's property
         * @example
         * body = viva.Body.create( "circle", {
         *     x: 100,
         *     y: 100,
         *     radius: 10,
         *     mass: 1,
         *     color: pink,
         *     cor: 0.6,
         *     cof: 0.1,
         *     angle: 45 * Math.PI/180 // in radian
         * });
         */
        create: function ( type, option ) {
            if ( bodyPool.length === 0 ) {
                BodyManager.expandPool();
            }

            option.type = type;
            return bodyPool.pop()._set( option );
        },

        /**
         * release a body that is no more in use back to body pool.
         * @function
         * @memberof Body
         */
        release: function ( body ) {
            body._reset();
            bodyPool.push( body );
        }

    };

    var BODY_STATUS = {
        "NORMAL": 1,
        "MOVING": 2,
        "FIXED": 3,
        "STABLE": 4
    };

    /**
     * constructor of body.
     * explicitly create a new body with this constructor is not recommended because of memory management performance (GC).
     * Instead, use Body.create() function to make use of body pool
     * @class
     * @private
     *
     * @param {Object} option body's properties
     */
    var body = function ( option ) {
        this.position = viva.Vector.create( option.x, option.y );
        this.velocity = viva.Vector.create();
        this.acceleration = viva.Vector.create();
        this.prevPosition = viva.Vector.create();
        this.angularVelocity = 0;

        this.cof = option.cof || 0;
        this.cor = option.cor || 0;
        this.mass = option.mass || 0;
        this.angle = option.angle || 0;

        this.type = option.type; // rectangle, polygon, circle
        this.width = option.width;
        this.height = option.height;
        this.radius = option.radius;
        this.world = undefined;
        this.color = option.color;
        this.status = BODY_STATUS.NORMAL;

        this.externalForce = [];
    };

    /**
     * move the body to given position.
     *
     * @param {Vector} vector vector of the position
     */
    body.prototype.move = function( vector ) {
        viva.Vector.release( this.prevPosition );
        this.prevPosition = this.position;
        this.position = vector;

        return this;
    };


    // TODO: find the more proper name for this function..
    body.prototype.do = function () {
        var behaviors = this.world.behaviors,
            i = 0,
            len = behaviors.length,
            behavior,
            netF = viva.Vector.create(),
            f;

        if ( len === 0 ) {
            return this;
        }

        for ( i = 0; i < len; i++ ) {
            behavior = behaviors[ i ];

            f = behavior.behave( this );
            if ( !f ) {
                continue;
            }

            netF.add( f );
            viva.Vector.release( f );
        }

        return netF;
    };


    /**
     * apply the given force (2d vector) to the body.
     *
     * @param {Vector} force a force in 2d vector object
     */
    body.prototype.applyForce = function ( force ) {
        this.externalForce.push( force );
        return this;
    };

    /**
     * accelerate the body with the given amount of acceleration.
     *
     * @param {Vector} a acceleration in 2d vector object
     */
    body.prototype.accelerate = function ( a ) {

        this.acceleration.add( a.scale( this.world.ratio ) );
        viva.Vector.release( a );

        return this;
    };


    /**
     * calculate new velocity, position, acceleration by delta time.
     *
     * @param {Number} dt delta time
     */
    body.prototype.step = function ( dt ) {
        if ( this.status !== BODY_STATUS.NORMAL ) {
            return;
        }
        var force = viva.Vector.create(), // this.do( dt ),
            prevVelocity = viva.Vector.copy( this.velocity ),
            i = 0,
            a = this.acceleration,
            prevAcceleration = viva.Vector.copy( this.acceleration ),
            f;

        if ( this.externalForce.length > 0 ) {
            for ( i = 0; i < this.externalForce.length; i++ ) {
                f = this.externalForce.pop();
                force.add( f );

                viva.Vector.release( f );
            }
        }

        this.prevPosition.set( this.position );

        /* Verlet Integration */
        this.position.add( prevVelocity.scale( dt ) ).add( prevAcceleration.scale( dt * dt / 2 ) );

        this.acceleration = force.scale( 1 / this.mass ).scale( this.world.ratio );
        this.velocity.add( a.add( this.acceleration ).scale( dt ) );

        /* classical method */
        // this.acceleration = force.scale( 1 / this.mass ).scale( this.world.ratio );
        // this.velocity.add( a.scale( dt ) );
        // this.position.add( prevVelocity.add( this.velocity ).scale( dt / 2 ) );

        this.angle += this.angularVelocity * dt;
        // console.log ( this.angularVelocity );

        viva.Vector.release( prevVelocity );
        viva.Vector.release( a );
        viva.Vector.release( prevAcceleration );

        return this;
    };

    /**
     * move the body a little bit to make sure the body is within the world ( no cut off ).
     */
    body.prototype._adjustPosition = function () {
        var x = this.position.x,
            y = this.position.y,
            horizontalDistance = this.radius || this.width/2,
            verticalDistance = this.radius || this.height/2;

        if ( this.velocity.magnitude() === 0 ) {
            return this.position;
        }

        // adjust position
        if (x + horizontalDistance > this.world.width ) {
            this.position.x = Math.floor( this.world.width - horizontalDistance );
        }

        if (x - (this.radius || this.width/2) < 0) {
            this.position.x = Math.ceil( horizontalDistance );
        }

        if (y + verticalDistance > this.world.height ) {
            this.position.y = ( this.world.height - verticalDistance );
        }

        if (this.position.y - (verticalDistance) < 0 ) {
            this.position.y = ( verticalDistance );
        }

        return this;
    };

    body.prototype.contains = function ( x, y ) {
        if ( this.type === "rectangle" ) {
            return x <= this.position.x + this.width/2 && x >= this.position.x - this.width/2 &&
                   y <= this.position.y + this.height/2 && y >= this.position.y - this.height/2;
        }

        if ( this.type === "circle" ) {
            return Math.pow( x - this.position.x, 2 ) + Math.pow( y - this.position.y, 2 ) <= Math.pow( this.radius, 2 );
        }
    };

    /**
     * set body's status.
     *
     * @param {String} status [ "NORMAL" | "MOVING" | "FIXED"| "STABLE" ]
     */
    body.prototype.setStatus = function ( status ) {
        this.status = BODY_STATUS[ status ];

        return this;
    };

    /**
     * set body's property.
     *
     * @param {Object} option
     */
    body.prototype._set = function ( option ) {
        this.position.set( option.x, option.y );
        this.velocity.set( option.vx, option.vy );

        this.angularVelocity = option.angularVelocity || this.angularVelocity;
        this.cof = option.cof  || this.cof;
        this.cor = option.cor || this.cor;
        this.mass = option.mass || this.mass;
        this.angle = option.angle || this.angle;

        this.type = option.type; // rectangle, polygon, circle
        this.width = option.width;
        this.height = option.height;
        this.radius = option.radius;
        this.color = option.color;

        return this;
    };

    /**
     * reset the body's property.
     */
    body.prototype._reset = function () {
        this.position.reset();
        this.velocity.reset();
        this.acceleration.reset();
        this.prevPosition.reset();

        this.angularVelocity = 0;
        this.cof = 0;
        this.cor = 0;
        this.mass = 0;
        this.angle = 0;

        this.type = ""; // rectangle, polygon, circle
        this.width = 0;
        this.height = 0;
        this.radius = 0;
        // this.world = undefined;
        this.color = "fff";

        return this;
    };

    /**
     * check if the body has moved from the previous position.
     *
     * @return {Boolean}
     */
    body.prototype.isChanged = function () {
        return !this.position.isEqual( this.prevPosition );
    };

    viva.Body = BodyManager;
    viva.Body.initPool();
