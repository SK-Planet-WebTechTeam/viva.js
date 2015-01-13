

    var bodyPool = [];

    var BodyManager = {

        initPool: function () {
            var i;

            for ( i = 0; i < 16; i++ ) {
                bodyPool.push( new body({ x: -1000, y: -1000 }) );
            }
        },
        expandPool: function () {
            var i,
                newLength = 32;

            for ( i = bodyPool.length; i < newLength; i++ ) {
                bodyPool.push( new body({ x: -1000, y: -1000 }) );
            }
        },
        create: function ( type, option ) {
            if ( bodyPool.length === 0 ) {
                BodyManager.expandPool();
            }

            option.type = type;
            return bodyPool.pop()._set( option );
        },
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

    var body = function ( option ) {
        this.position = Physics.Vector.create( option.x, option.y );
        this.velocity = Physics.Vector.create();
        this.acceleration = Physics.Vector.create();
        this.prevPosition = Physics.Vector.copy( this.position );
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

    body.prototype.move = function( vector ) {
        Physics.Vector.release( this.prevPosition );
        this.prevPosition = this.position;
        this.position = vector;

        return this;
    };

    body.prototype.update = function ( prop, value ) {
        this[ prop ] = value;
        // TODO : observer?

        return this;
    };

    // TODO: find the more proper name for this function..
    body.prototype.do = function () {
        var behaviors = this.world.behaviors,
            i = 0,
            len = behaviors.length,
            behavior,
            netF = Physics.Vector.create(),
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
            Physics.Vector.release( f );
        }

        return netF;
    };

    body.prototype.applyForce = function ( force ) {
        this.externalForce.push( force );
        return this;
    };

    body.prototype.accelerate = function ( a ) {
        // var a = force.scale( 1 / this.mass ).scale( this.world.ratio ); // unit of acceleration is m/s^2 -> convert it to pixel/s^2
        // console.log(a);
        this.acceleration.add( a.scale( this.world.ratio ) );
        Physics.Vector.release( a );
        return this;
    };

    body.prototype.step = function ( dt ) {
        if ( this.status !== BODY_STATUS.NORMAL ) {
            return;
        }
        var force = Physics.Vector.create(), // this.do( dt ),
            prevVelocity = Physics.Vector.copy( this.velocity ),
            i = 0,
            a = this.acceleration,
            prevAcceleration = Physics.Vector.copy( this.acceleration ),
            f;

        if ( this.externalForce.length > 0 ) {
            for ( i = 0; i < this.externalForce.length; i++ ) {
                f = this.externalForce.pop();
                force.add( f );

                Physics.Vector.release( f );
            }
        }

        this.prevPosition.set( this.position );

        // console.log( this.acceleration, force, prevAcceleration );
        /* Verlet Integration */
        this.position.add( prevVelocity.scale( dt ) ).add( prevAcceleration.scale( dt * dt / 2 ) );

        this.acceleration = force.scale( 1 / this.mass ).scale( this.world.ratio );
        this.velocity.add( a.add( this.acceleration ).scale( dt / 2 ) );


        /* classical method */
        // this.acceleration = force.scale( 1 / this.mass ).scale( this.world.ratio );
        // this.velocity.add( a.scale( dt ) );
        // this.position.add( prevVelocity.add( this.velocity ).scale( dt / 2 ) );

        this.angle += this.angularVelocity * dt;
        // console.log ( this.angularVelocity );

        Physics.Vector.release( prevVelocity );
        Physics.Vector.release( a );
        Physics.Vector.release( prevAcceleration );

        var p = Physics.Vector.copy( this.position ),
            deltaP = p.sub( this.prevPosition ).magnitude();
        if ( deltaP < this.cor ) {
            this._adjustPosition();
        }
        Physics.Vector.release( p );
        return this;
    };

    body.prototype._adjustVelocity = function () {
        if ( this.velocity.magnitude() <= 20 ) {
            this.velocity.reset();
            this.acceleration.reset();
            this.status = BODY_STATUS.STABLE;
        }

        return this;
    };

    body.prototype._adjustPosition = function () {
        var x = Math.round( this.position.x ),
            y = Math.round( this.position.y ),
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
            // this.prevPosition.y = this.position.y;
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

    body.prototype.setStatus = function ( status ) {
        this.status = BODY_STATUS[ status ];

        return this;
    };

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
        this.world = undefined;
        this.color = "fff";

        return this;
    };

    body.prototype.isChanged = function () {
        return !this.position.isEqual( this.prevPosition );
    };

    Physics.Body = BodyManager;
    Physics.Body.initPool();
