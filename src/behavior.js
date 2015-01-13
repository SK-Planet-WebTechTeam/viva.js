
    var ConstantAccelerationBehavior = function ( ax, ay ) {
        this.acceleration = Physics.Vector.create( ax, ay );
    };

    ConstantAccelerationBehavior.prototype.behave = function ( body ) {
        if ( body.status !== BODY_STATUS.NORMAL ) {
            return;
        }
        // return Physics.Vector.copy( this.acceleration ).scale( body.mass );
        body.accelerate( Physics.Vector.copy( this.acceleration ) );
    };

    var BoundaryCollisionBehavior = function ( boundary ) {
        this.boundary = {
            top: boundary.y,
            left: boundary.x,
            bottom: boundary.y + boundary.height,
            right: boundary.x + boundary.width
        };
    };

    BoundaryCollisionBehavior.prototype.behave = function ( body ) {
        var norm = this._norm( body );

        if ( !norm.isZero() ) {
            body.velocity.mult( norm ).scale( body.cor );
            body._adjustVelocity();
        }
    };

    BoundaryCollisionBehavior.prototype._norm = function ( body ) {
        var collisionType = this._checkCollisionType( body );

        return this._norms[ collisionType ];
    };

    BoundaryCollisionBehavior.prototype._checkCollisionType = function ( body ) {
        var x = body.position.x,
            y = body.position.y,
            horizontalDistance = body.radius || body.width/2,
            verticalDistance = body.radius || body.height/2;

        if ( x + horizontalDistance >= this.boundary.right && body.velocity.x > 0 ) {
            return "right";
        }
        if ( x - horizontalDistance <= this.boundary.left && body.velocity.x < 0 ) {
            return "left";
        }
        if ( y + verticalDistance >= this.boundary.bottom && body.velocity.y > 0 ) {
            return "bottom";
        }
        if ( y - verticalDistance <= this.boundary.top && body.velocity.y < 0 ) {
            return "top";
        }

        return "zero";
    };

    BoundaryCollisionBehavior.prototype._norms = {
        top: Physics.Vector.create( 1, -1 ),
        left: Physics.Vector.create( -1, 1 ),
        bottom: Physics.Vector.create( 1, -1 ),
        right: Physics.Vector.create( -1, 1 ),
        zero: Physics.Vector.create( 0, 0 ),
    };

    var CollisionBehavior = function () {

    };

    CollisionBehavior.prototype.behave = function ( body ) {
        var bodies = body.world.bodies,
            len = bodies.length,
            i = 0,
            otherBody,
            collision;

        for ( i = 0; i < len; i++ ) {
            otherBody = bodies[ i ];
            if ( body === otherBody ) {
                continue;
            }
            if ( collision = this._checkCollision( body, otherBody ) ){
                this._collisionResponse( collision );
            }
        }
    };

    CollisionBehavior.prototype._checkCollision = function ( bodyA, bodyB ) {
        var cA = Physics.Vector.copy( bodyA.position ),
            cB = Physics.Vector.copy( bodyB.position ),
            collision;

        if ( bodyA.type === "circle" && bodyB.type === "circle" ) {
            if( cB.sub( cA ).magnitude() <= bodyA.radius + bodyB.radius ) {

                collision = {
                    bodyA : bodyA,
                    bodyB : bodyB,
                    point : cB.scale( -1 * bodyA.radius / cB.magnitude() )
                };

                Physics.Vector.release( cA );
                Physics.Vector.release( cB );

                return collision;
            }
        }
    };

    CollisionBehavior.prototype._collisionResponse = function ( collision ) {
        console.log("1", vectorcnt );
        var bodyA = collision.bodyA,
            bodyB = collision.bodyB,
            point = collision.point,
            vab = Physics.Vector.copy( bodyA.velocity ).sub( bodyB.velocity ),
            ma = bodyA.mass,
            mb = bodyB.mass,
            ra = Physics.Vector.copy( point ).sub( bodyA.position ),
            rb = Physics.Vector.copy( point ).sub( bodyB.position ),
            distance = Physics.Vector.copy( bodyA.position ).sub( bodyB.position ),
            n = distance.scale( 1 / distance.magnitude() ),
            vn = vab.projection( n ),
            cor = bodyA.cor * bodyB.cor,
            Ia = ma * bodyA.radius * bodyA.radius,
            Ib = mb * bodyB.radius * bodyB.radius,

            raClone = Physics.Vector.copy( ra ),
            rbClone = Physics.Vector.copy( rb ),

            Ira = raClone.scale( raClone.cross( n ) / Ia ),
            Irb = rbClone.scale( rbClone.cross( n ) / Ib ),
            n_copy = Physics.Vector.copy( n ),

            J = - (1 + cor) * vn.magnitude() / ( n.dot( n ) * ( 1/ma + 1/mb ) + n_copy.dot( Ira.add( Irb ) ) ),

            na = Physics.Vector.copy( n ),
            nb = Physics.Vector.copy( n );

            // console.log(J);

            bodyA.velocity.sub( na.scale( J/ma ) );
            bodyB.velocity.add( nb.scale( J/mb ) );

            Physics.Vector.release( vab, vn, ra, rb, distance, raClone, rbClone, n_copy, na, nb );
            console.log("2", vectorcnt );

    };

    CollisionBehavior.prototype._adjustBodyPosition = function ( collision ) {

        var bodyA = collision.bodyA,
            bodyB = collision.bodyB,
            point = collision.point,
            cA = Physics.Vector.copy( bodyA.position ),
            cB = Physics.Vector.copy( bodyB.position );

        if ( bodyA.type === "circle" && bodyB.type === "circle" ) {
            if( cB.sub( cA ).magnitude() < bodyA.radius + bodyB.radius ) {
                // 약간씩 밀어내야함
            }
        }
    };

    var Behavior = {
        ConstantAcceleration: function ( ax, ay ) {
            return new ConstantAccelerationBehavior( ax, ay );
        },
        BoundaryCollision: function ( boundary ) {
            return new BoundaryCollisionBehavior( boundary );
        },
        Collision: function () {
            return new CollisionBehavior();
        }
    };

    Physics.Behavior = Behavior;

