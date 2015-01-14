
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
        var norm = this._norm( body ),
            v = body.velocity.clone(),
            j = -( 1 + body.cor ) * v.dot( norm ),
            jn = norm.clone().scale( j );

        if ( !norm.isZero() ) {
            body.velocity.add( jn );
            // console.log(jn);
        }

        Physics.Vector.release( v, jn );
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
        top: Physics.Vector.create( 0, -1 ),
        left: Physics.Vector.create( -1, 0 ),
        bottom: Physics.Vector.create( 0, -1 ),
        right: Physics.Vector.create( -1, 0 ),
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

            vab = Physics.Vector.copy( bodyA.velocity ).sub( bodyB.velocity ), // relative velocity
            ma = bodyA.mass,
            mb = bodyB.mass,
            ra = Physics.Vector.copy( point ).sub( bodyA.position ), // vector from center of A to point of collision
            rb = Physics.Vector.copy( point ).sub( bodyB.position ), // vector from center of B to point of collision
            distance = Physics.Vector.copy( bodyA.position ).sub( bodyB.position ), // vector from center point of A to center point of B
            n = distance.scale( 1 / distance.magnitude() ), // unit normal vector
            vn = vab.projection( n ), // relative velocity projected on normal vector
            vt = vab.sub( vn ), // tangential velocity
            cor = bodyA.cor * bodyB.cor, // coefficient of restitution
            cof = bodyA.cof * bodyB.cof, // coefficient of friction
            Ia = ma * bodyA.radius * bodyA.radius / 2, // moment of inertia
            Ib = mb * bodyB.radius * bodyB.radius / 2,

            raClone = Physics.Vector.copy( ra ),
            rbClone = Physics.Vector.copy( rb ),
            raClone2 = Physics.Vector.copy( ra ),
            rbClone2 = Physics.Vector.copy( rb ),

            Ira = raClone.scale( raClone.cross( n ) / Ia ),
            Irb = rbClone.scale( rbClone.cross( n ) / Ib ),
            n_copy = Physics.Vector.copy( n ),

            J = - (1 + cor) * vn.magnitude() / ( n.dot( n ) * ( 1/ma + 1/mb ) + n_copy.dot( Ira.add( Irb ) ) ), // impulse

            Jna = Physics.Vector.copy( n ).scale( J ),
            Jnb = Physics.Vector.copy( n ).scale( J ),
            wa = ra.scale( 1/Ia ).cross( Jna ), // angular velocity change
            wb = rb.scale( 1/Ib ).cross( Jnb );


        bodyA.velocity.sub( Jna.scale( 1/ma ) );
        bodyB.velocity.add( Jnb.scale( 1/mb ) );

        bodyA.angularVelocity -= wa;
        bodyB.angularVelocity += wb;

        // if(|Vrt| > u*J) //Dynamic friction
        // Jt = -u*J;
        // else //Static friction
        // Jt = -|Vrt|;

        // Jt = Jt/{1/m1 + 1/m2 + n . [(r1 x t)/I1] x r1 + n . [(r2 x t)/I2] x r2}

        // Jt - The scalar friction impulse
        // Vrt - The tangent component of the relative velocity
        // m1 - The mass of rigid body 1
        // m2 - The mass of rigid body 2
        // t - The tangent normal of the collision
        // r1 - The vector from the center of mass of rigid body 1 to the point of collision
        // r2 - The vector from the center of mass of rigid body 2 to the point of collision
        // I1 - Inertia tensor for rigid body 1
        // I2 - Inertia tensor for rigid body 2

        // Then you apply the friction impulse similar to the frictionless impulse.

        // v1 = v1 + (Jtt)/m1
        // v2 = v2 + (-Jtn)/m2
        // w1 = w1 + (r1 x Jtt)/I1
        // w2 = w2 + (r2 x -Jtt)/I2

        // v1 - Velocity of rigid body 1
        // v2 - Velocity of rigid body 2
        // w1 - Angular velocity of rigid body 1
        // w2 - Angular velocity of rigid body 2

        // This gives results that are really close to what I want, although there is one outstanding issue. The friction impulse will not apply to rotation around the relative contact point vector. This happens because of how the relative velocity is calculated. For example, if I have sphere spinning along the Y Axis on the ground then it will continue to spin forever.

        // Either this means that the above equation is wrong, or I just need to handle the friction for the rotation around the relative contact point separately (which is a simple task). As you can see below the cross product will basically cancel out any rotation along the axis created by the relative contact point.

        // Vr = (v1 + r1 x w1) - (v2 + r2 x w2)

        // Vr - The relative contact velocity

        var Jt,
            fn = vt.clone().scale( -1 / vt.magnitude() );
        if ( vt.magnitude() > cof * J ) {
            // var fn = vt.clone().scale( -1 / vt.magnitude() ),
            //     denom = 1 / ma + 1/Ia * ra
            Jt =  -cof * J;
        } else {
            Jt = -vt.magnitude();
        }

        Jt = Jt / ( (1/ma + 1/mb) + n.dot( raClone2.scale( raClone2.cross( fn )/Ia ) ) + n.dot( rbClone2.scale( rbClone2.cross( fn )/Ib ) ) );

        var Jta = fn.clone().scale( Jt ),
            Jtb = fn.clone().scale( Jt ),
            wta = ra.cross( Jta ), // angular velocity change
            wtb = rb.cross( Jtb );


        bodyA.velocity.sub( Jta.scale( 1/ma ) );
        bodyB.velocity.add( Jtb.scale( 1/mb ) );

        bodyA.angularVelocity -= wta;
        bodyB.angularVelocity += wtb;

        Physics.Vector.release( vab, ra, rb, distance, vn, raClone, rbClone, raClone2, rbClone2, n_copy, Jna, Jnb, point /*, fn,  Jta, Jtb */ );

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

