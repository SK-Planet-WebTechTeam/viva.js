
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
        this.collisions = [];
    };

    CollisionBehavior.prototype.behave = function ( body ) {
        this._detect( body );
        this._collisionResponse();
    };

    CollisionBehavior.prototype._detect = function ( body ) {
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

            collision = this._checkCollision( body, otherBody );
            if ( collision && !this._hasCollision( collision ) ) {
                this.collisions.push( collision );
            }
        }
    };

    CollisionBehavior.prototype._collisionResponse = function () {
        var len = this.collisions.length,
            i = 0;

        for ( i = 0; i < len; i++ ) {
            this._collide( this.collisions.pop() );
        }

    };

    CollisionBehavior.prototype._hasCollision = function ( collision ) {
        return this.collisions.some( function ( v ) {
            return ( v.bodyA === collision.bodyA && v.bodyB === collision.bodyB ) ||
                   ( v.bodyB === collision.bodyA && v.bodyA === collision.bodyB );
        });
    };

    CollisionBehavior.prototype._checkCollision = function ( bodyA, bodyB ) {
        var cA = bodyA.position,
            cB = Physics.Vector.copy( bodyB.position ),
            collision,
            point;

        if ( bodyA.type === "circle" && bodyB.type === "circle" ) {
            if( cB.sub( cA ).magnitude() <= bodyA.radius + bodyB.radius ) {
                point = Physics.Vector.copy( cB );

                collision = {
                    bodyA : bodyA,
                    bodyB : bodyB,
                    point : point.scale( bodyA.radius / cB.magnitude() ).add( cA )
                };

            }
        }

        Physics.Vector.release( cB );

        return collision;
    };

    CollisionBehavior.prototype._collide = function ( collision ) {
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
            cof = bodyA.cof * bodyB.cof,
            Ia = ma * bodyA.radius * bodyA.radius,
            Ib = mb * bodyB.radius * bodyB.radius,

            raClone = Physics.Vector.copy( ra ),
            rbClone = Physics.Vector.copy( rb ),

            Ira = raClone.scale( raClone.cross( n ) / Ia ),
            Irb = rbClone.scale( rbClone.cross( n ) / Ib ),
            n_copy = Physics.Vector.copy( n ),

            J = - (1 + cor) * vn.magnitude() / ( n.dot( n ) * ( 1/ma + 1/mb ) + n_copy.dot( Ira.add( Irb ) ) ),

            Jna = Physics.Vector.copy( n ).scale( J ),
            Jnb = Physics.Vector.copy( n ).scale( J ),
            wa = ra.scale( 1/Ia ).cross( Jna ),
            wb = rb.scale( 1/Ib ).cross( Jnb );

        if ( Math.abs( J ) > 1 ) {

            bodyA.velocity.sub( Jna.scale( 1/ma ) );
            bodyB.velocity.add( Jnb.scale( 1/mb ) );

            bodyA.angularVelocity -= wa;
            bodyB.angularVelocity += wb;
        }

        Physics.Vector.release( vab, ra, rb, distance, vn, raClone, rbClone, n_copy, Jna, Jnb, point );

        this._adjustBodyPosition( collision );

    };

    CollisionBehavior.prototype._adjustBodyPosition = function ( collision ) {

        var bodyA = collision.bodyA,
            bodyB = collision.bodyB,
            cA = Physics.Vector.copy( bodyA.position ),
            cB = Physics.Vector.copy( bodyB.position ),
            distance = cB.sub(cA),
            overlap = bodyA.radius + bodyB.radius - distance.magnitude();

        if ( bodyA.type === "circle" && bodyB.type === "circle" ) {
            if( overlap > 0 ) {
                distance.normalize().scale( overlap );
                if ( bodyA.position.x < bodyB.position.x ) {
                    bodyA.position.x -= distance.x/2;
                    bodyB.position.x += distance.x/2;
                } else {
                    bodyA.position.x += distance.x/2;
                    bodyB.position.x -= distance.x/2;
                }


                if ( bodyA.position.y < bodyB.position.y ) {
                    bodyA.position.y -= distance.y/2;
                    bodyB.position.y += distance.y/2;
                } else {
                    bodyA.position.y += distance.y/2;
                    bodyB.position.y -= distance.y/2;
                }

            }
        }

        Physics.Vector.release( cA );
        Physics.Vector.release( cB );
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

