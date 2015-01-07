

    var bodyPool = [];
    var emptySlots = [];


    var BodyManager = {

        initPool: function () {
            var index,
                i;

            for ( i = 0; i < 16; i++ ) {
                index = bodyPool.push( new body({ x: -1000, y: -1000 }) );
                emptySlots.push( index - 1 );
            }
        },
        expandPool: function () {
            var index,
                i,
                newLength = bodyPool.length * 2;

            for ( i = bodyPool.length; i < newLength; i++ ) {
                index = bodyPool.push( new body({ x: -1000, y: -1000 }) );
                emptySlots.push( index - 1 );
            }
        },
        create: function ( type, option ) {
            if ( emptySlots.length === 0 ) {
                BodyManager.expandPool();
            }
            var index = emptySlots.pop();

            option.type = type;
            return bodyPool[ index ]._set( option );
        },
        release: function ( body ) {
            var index = bodyPool.push( body );
            emptySlots.push( index );

            body._reset();
        }

    };

    var body = function ( option ) {
        this.position = Physics.Vector.create( option.x, option.y );
        this.velocity = Physics.Vector.create();
        this.angularVelocity = Physics.Vector.create();
        this.acceleration = Physics.Vector.create();
        this.prevPosition = Physics.Vector.copy( this.position );
        this.cof = option.cof;
        this.cor = option.cor;
        this.mass = option.mass;
        this.type = option.type; // rectangle, polygon, circle
        this.width = option.width;
        this.height = option.height;
        this.radius = option.radius;
        this.world = undefined;
        this.color = option.color;
        this.topPosition = Physics.Vector.create( option.x, option.y - ( this.radius || this.height/2 ) );

        this.externalForce = [];
    };

    body.prototype.move = function( vector ) {
        this.position.add( vector );
        this.topPosition.set( this.position.x, this.position.y - ( this.radius || this.height/2 ) );
        return this;
    };

    body.prototype.update = function ( prop, value ) {
        this[ prop ] = value;
        // TODO : observer?

        return this;
    };

    body.prototype.do = function ( dt ) {
        var behaviors = this.world.behaviors,
            i = 0,
            len = behaviors.length,
            behavior,
            netF = Physics.Vector.create(),
            x,
            y,
            f;

        if ( len === 0 ) {
            return this;
        }

        for ( i = 0; i < len; i++ ) {
            behavior = behaviors[ i ];

            f = behavior.behave( this );
            netF.add( f );
            Physics.Vector.release( f );
        }

        // this.applyForce( netF );
        // Physics.Vector.release( netF );

        return netF;
    };

    body.prototype.applyForce = function ( force ) {
        // var a = force.scale( 1 / this.mass ).scale( this.world.ratio ); // unit of acceleration is m/s^2 -> convert it to pixel/s^2

        // this.acceleration.add( a );
        this.externalForce.push( force );
        return this;
    };

    // body.prototype.applyConstantAcceleration = function ( force ) {
    //     var a = force.scale( 1 / this.mass ).scale( this.world.ratio ); // unit of acceleration is m/s^2 -> convert it to pixel/s^2
    //     this.acceleration.add( a );

    //     return this;
    // };

    body.prototype._resolveForce = function ( force ) {

    }

    body.prototype.step = function ( dt ) {
        var oldV = Physics.Vector.copy( this.velocity ),
            // a = Physics.Vector.copy( this.acceleration ),
            force = this.do( dt ),
            i = 0,
            f;

        if ( this.externalForce.length > 0 ) {
            for ( i = 0; i < this.externalForce.length; i++ ) {
                f = this.externalForce.pop();
                force.add( f );

                Physics.Vector.release();
            }
        }

        a = force.scale( 1 / this.mass ).scale( this.world.ratio );
        // this.do( dt );
        Physics.Vector.release( this.prevPosition );
        this.prevPosition = Physics.Vector.copy( this.position );

        this.velocity.add( a.scale( dt ) );
        this.position.add( oldV.add( this.velocity ).scale( dt / 2 ) );
        this.topPosition.add( oldV );

        Physics.Vector.release( oldV );
        Physics.Vector.release( a );


        // var p = Physics.Vector.copy( this.position );
        // console.log( p.sub( this.prevPosition ).print() );
        // Physics.Vector.release( p );
        return this;
    };

    body.prototype._adjustVelocity = function () {
        if ( this.velocity.magnitude() < 1 ) {
            this.velocity.set( 0, 0 );
            this.acceleration.reset();
        }

        return this;
    };

    body.prototype._set = function ( option ) {
        this.position.set( option.x, option.y );
        this.velocity.set( option.vx, option.vy );
        this.angularVelocity.set( option.wx, option.wy );
        this.cof = option.cof;
        this.cor = option.cor;
        this.mass = option.mass;
        this.type = option.type; // rectangle, polygon, circle
        this.width = option.width;
        this.height = option.height;
        this.radius = option.radius;
        this.color = option.color;
        this.topPosition.set( option.x, option.y - ( this.radius || this.height/2 ) );

        return this;
    };

    body.prototype._reset = function () {
        this.position.reset();
        this.topPosition.reset();
        this.velocity.reset();
        this.angularVelocity.reset();
        this.acceleration.reset();
        this.prevPosition.reset();
        this.cof = 0;
        this.cor = 0;
        this.mass = 0;
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
