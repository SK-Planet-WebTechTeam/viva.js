

    var bodyPool = [];

    /**
     * @mixin
     * @namespace Body
     * @memberof viva
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
        this.position = viva.vector.create( option.x, option.y );
        this.velocity = viva.vector.create();
        this.acceleration = viva.vector.create();
        this.prevPosition = viva.vector.create();
        this.angularVelocity = 0;

        this.cof = option.cof || 0;
        this.cor = option.cor || 0;
        this.mass = option.mass || 0;
        this.angle = option.angle || 0;

        this.type = option.type; // rectangle, polygon, circle
        this.width = option.width;
        this.height = option.height;
        this.radius = option.radius;
        this.color = option.color;
        this.aabb = new viva.AABB();
        this.status = BODY_STATUS.NORMAL;
        this.world = undefined;
        this.uuid = -1;

        this.externalForce = [];
    };

    /**
     * move the body to given position.
     *
     * @param {vector} vector vector of the position
     */
    body.prototype.move = function( vector ) {
        viva.vector.release( this.prevPosition );
        this.prevPosition = this.position;
        this.position = vector;

        this._updateAABB();

        return this;
    };


    // TODO: find the more proper name for this function..
    body.prototype.do = function () {
        var behaviors = this.world.behaviors,
            i = 0,
            len = behaviors.length,
            behavior,
            netF = viva.vector.create(),
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
            viva.vector.release( f );
        }

        return netF;
    };


    /**
     * apply the given force (2d vector) to the body.
     *
     * @param {vector} force a force in 2d vector object
     */
    body.prototype.applyForce = function ( force ) {
        this.externalForce.push( force );
        return this;
    };

    /**
     * accelerate the body with the given amount of acceleration.
     *
     * @param {vector} a acceleration in 2d vector object
     */
    body.prototype.accelerate = function ( a ) {

        this.acceleration.add( a.scale( this.world.ratio ) );
        viva.vector.release( a );

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
        var force = viva.vector.create(), // this.do( dt ),
            prevVelocity = viva.vector.copy( this.velocity ),
            i = 0,
            a = this.acceleration,
            prevAcceleration = viva.vector.copy( this.acceleration ),
            f;

        if ( this.externalForce.length > 0 ) {
            for ( i = 0; i < this.externalForce.length; i++ ) {
                f = this.externalForce.pop();
                force.add( f );

                viva.vector.release( f );
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

        viva.vector.release( prevVelocity );
        viva.vector.release( a );
        viva.vector.release( prevAcceleration );

        this._updateAABB();
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

    body.prototype._updateAABB = function () {
        if ( this.type === "circle" ) {
            this.aabb.set( this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2 );
        }

        if ( this.type === "rectangle" ) {
            var top_most,
                left_most,
                bottom_most,
                right_most,
                center = this.position.clone(),
                tl = center.clone().add( {x: - this.width/2, y: -this.height/2} ).sub( center ),
                tr = center.clone().add( {x: + this.width/2, y: -this.height/2} ).sub( center ),
                bl = center.clone().add( {x: - this.width/2, y: this.height/2} ).sub( center ),
                br = center.clone().add( {x: + this.width/2, y: this.height/2} ).sub( center ),
                degree_rad = Math.PI / 180;

            if ( this.angle <= 90* degree_rad ) {
                top_most = tl.rotate( this.angle );
                left_most = bl.rotate( this.angle );
                bottom_most = br.rotate( this.angle );
                right_most = tr.rotate( this.angle );
            } else if ( this.angle <= 180* degree_rad ) {
                top_most = bl.rotate( this.angle );
                left_most = br.rotate( this.angle );
                bottom_most = tr.rotate( this.angle );
                right_most = tl.rotate( this.angle );
            } else if ( this.angle <= 270* degree_rad ) {
                top_most = br.rotate( this.angle );
                left_most = tr.rotate( this.angle );
                bottom_most = tl.rotate( this.angle );
                right_most = bl.rotate( this.angle );
            } else {
                top_most = tr.rotate( this.angle );
                left_most = tl.rotate( this.angle );
                bottom_most = bl.rotate( this.angle );
                right_most = br.rotate( this.angle );
            }

            top_most.add( center );
            left_most.add( center );
            bottom_most.add( center );
            right_most.add( center );

            this.aabb.set( left_most.x, top_most.y, right_most.x - left_most.x, bottom_most.y - top_most.y );

            viva.vector.release( tl );
            viva.vector.release( tr );
            viva.vector.release( bl );
            viva.vector.release( br );
            viva.vector.release( center );

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
        this._updateAABB();

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
        this.uuid = -1;

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

    viva.body = BodyManager;
    viva.body.initPool();
