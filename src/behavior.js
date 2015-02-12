

    /**
     * constant acceleration like gravity
     * @class
     *
     * @param {Number} ax acceleration along x-axis
     * @param {Number} ay acceleration along y-axis
     */
    var ConstantAccelerationbehavior = function ( ax, ay ) {
        this.acceleration = viva.vector.create( ax, ay );
    };

    /**
     * apply acceleration to a body
     *
     * @param {Object} body a Body object to which apply constant acceleration
     */
    ConstantAccelerationbehavior.prototype.behave = function ( body ) {
        if ( body.status !== BODY_STATUS.NORMAL ) {
            return;
        }
        // return viva.vector.copy( this.acceleration ).scale( body.mass );
        body.accelerate( viva.vector.copy( this.acceleration ) );
    };


    /**
     * boundary collision
     * @class
     *
     * @param {Object} option boundary info including boundary size, restitution, friction
     *
     * @example
     * viva.behavior.BoundaryCollision ({
     *     x: 0,
     *     y: 0,
     *     width: world.renderer.width,
     *     height: world.renderer.height,
     *     cor: 1
     * })
     */
    var BoundaryCollisionbehavior = function ( option ) {
        this.boundary = {
            top: option.y,
            left: option.x,
            bottom: option.y + option.height,
            right: option.x + option.width
        };
        this.cor = option.cor || 1;
    };


    /**
     * check collision and calculate the post-collision velocity and apply it to a body
     *
     * @param {Object} body a Body object to which apply constant acceleration
     */
    BoundaryCollisionbehavior.prototype.behave = function ( body ) {
        var norm = this._norm( body ),
            v = body.velocity.clone(),
            j = -( 1 + ( body.cor * this.cor ) ) * v.dot( norm ),
            jn = norm.clone().scale( j );

        if ( !norm.isZero() ) {
            body.velocity.add( jn );
            if ( jn.magnitude() < 20 ) {
                body._adjustPosition();
            }
        }

        viva.vector.releaseAll( [ v, jn ] );
    };

    /**
     * get unit normal vector of collision surface
     * @private
     *
     */
    BoundaryCollisionbehavior.prototype._norm = function ( body ) {
        var collisionType = this._checkCollisionType( body );

        return this._norms[ collisionType ];
    };

    /**
     * check which direction is body colliding against
     * @private
     */
    BoundaryCollisionbehavior.prototype._checkCollisionType = function ( body ) {
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


    /**
     * normal vectors
     * @private
     */
    BoundaryCollisionbehavior.prototype._norms = {
        top: viva.vector.create( 0, -1 ),
        left: viva.vector.create( -1, 0 ),
        bottom: viva.vector.create( 0, -1 ),
        right: viva.vector.create( -1, 0 ),
        zero: viva.vector.create( 0, 0 ),
    };



    /**
     * body collision
     * @class
     */
    var Collisionbehavior = function () {
        this.collisions = [];
    };

    /**
     * detect collision and do collision response
     * @private
     *
     * @param {Object} body a body object to check and apply collision
     */
    Collisionbehavior.prototype.behave = function ( body ) {
        this._detect( body );
        this._collisionResponse();
    };

    /**
     * detect collision between a body and other bodies
     * @private
     */
    Collisionbehavior.prototype._detect = function ( body ) {
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

    /**
     * collision response
     * @private
     */
    Collisionbehavior.prototype._collisionResponse = function () {
        var len = this.collisions.length,
            i = 0;

        for ( i = 0; i < len; i++ ) {
            this._collide( this.collisions.pop() );
        }

    };


    /**
     * check if this collision is already in count
     * @private
     *
     * @param {Object} collision a collision object
     */
    Collisionbehavior.prototype._hasCollision = function ( collision ) {
        return this.collisions.some( function ( v ) {
            return ( v.bodyA === collision.bodyA && v.bodyB === collision.bodyB ) ||
                   ( v.bodyB === collision.bodyA && v.bodyA === collision.bodyB );
        });
    };

    /**
     * check if given two bodies are colliding at this time step.
     * currently, only circlular bodies are supported
     * @private
     *
     * @param {Object} bodyA
     * @param {Object} bodyB
     */
    Collisionbehavior.prototype._checkCollision = function ( bodyA, bodyB ) {
        // TODO: other shapes
        var cA = bodyA.position,
            cB = viva.vector.copy( bodyB.position ),
            collision,
            point;

        if ( bodyA.type === "circle" && bodyB.type === "circle" ) {
            if( cB.sub( cA ).magnitude() <= bodyA.radius + bodyB.radius ) {
                point = viva.vector.copy( cB );

                if ( cB.magnitude() === 0 ) {
                    return;
                }

                collision = {
                    bodyA : bodyA,
                    bodyB : bodyB,
                    point : point.scale( bodyA.radius / cB.magnitude() ).add( cA )
                };

            }
        }

        // if ( bodyA.type === "rectangle" || bodyB.type === "rectangle" ) {
        //     if( bodyA.aabb.overlap( bodyB.aabb ) ) {
        //         point = viva.vector.copy( cB );

        //         if ( cB.magnitude() === 0 ) {
        //             return;
        //         }

        //         collision = {
        //             bodyA : bodyA,
        //             bodyB : bodyB,
        //             point : point.scale( (bodyA.aabb.width/2) / cB.magnitude() ).add( cA )
        //         };

        //         console.log( point.print() );

        //     }
        // }

        viva.vector.release( cB );

        return collision;
    };

    /**
     * collide two bodies in collision. calculate and apply post-collision velocity
     * @private
     *
     * @param {Object} collision
     */
    Collisionbehavior.prototype._collide = function ( collision ) {
        var bodyA = collision.bodyA,
            bodyB = collision.bodyB,
            point = collision.point,

            vab = viva.vector.copy( bodyA.velocity ).sub( bodyB.velocity ), // relative velocity

            vab_clone = vab.clone(),
            ma = bodyA.mass,
            mb = bodyB.mass,
            ra = viva.vector.copy( point ).sub( bodyA.position ), // a vector from center of A to point of collision
            rb = viva.vector.copy( point ).sub( bodyB.position ), // a vector from center of B to point of collision
            distance = viva.vector.copy( bodyA.position ).sub( bodyB.position ), // vector from center point of A to center point of B
            n = distance.scale( 1 / distance.magnitude() ), // unit normal vector
            vn = vab.projection( n ), // relative velocity projected on normal vector
            vt = vab.sub( vn ), // tangential velocity
            cor = bodyA.cor * bodyB.cor, // coefficient of restitution
            cof = bodyA.cof * bodyB.cof, // coefficient of friction

            Ia = ma * ra.magnitude() * ra.magnitude() / 2, // moment of inertia
            Ib = mb * rb.magnitude() * rb.magnitude() / 2,

            raClone = viva.vector.copy( ra ),
            rbClone = viva.vector.copy( rb ),
            raClone2 = viva.vector.copy( ra ),
            rbClone2 = viva.vector.copy( rb ),

            Ira = raClone.scale( raClone.cross( n ) / Ia ),
            Irb = rbClone.scale( rbClone.cross( n ) / Ib ),
            n_copy = viva.vector.copy( n ),

            J = - (1 + cor) * vn.magnitude() / ( n.dot( n ) * ( 1/ma + 1/mb ) + n_copy.dot( Ira.add( Irb ) ) ), // impulse

            Jna = viva.vector.copy( n ).scale( J ),
            Jnb = viva.vector.copy( n ).scale( J ),

            wa = ra.scale( 1/Ia ).cross( Jna ), // angular velocity change
            wb = rb.scale( 1/Ib ).cross( Jnb ),
            Jt,
            fn,
            Jta,
            Jtb,
            wta,
            wtb;


        if ( vab_clone.dot( n ) < 0 ) {
            bodyA.velocity.sub( Jna.scale( 1/ma ) );
            bodyB.velocity.add( Jnb.scale( 1/mb ) );

            bodyA.angularVelocity -= wa;
            bodyB.angularVelocity += wb;

            // friction
            Jt;
            fn = vt.clone().scale( -1 / vt.magnitude() );

            if ( vt.magnitude() > cof * J ) {
                Jt =  -cof * J;
            } else {
                Jt = -vt.magnitude();
            }

            if ( vt.magnitude() === 0 ) {
                fn.reset();
            }

            Jt = Jt / ( (1/ma + 1/mb) + n.dot( raClone2.scale( raClone2.cross( fn )/Ia ) ) + n.dot( rbClone2.scale( rbClone2.cross( fn )/Ib ) ) );

            Jta = fn.clone().scale( Jt );
            Jtb = fn.clone().scale( Jt );
            wta = ra.cross( Jta ); // angular velocity change;
            wtb = rb.cross( Jtb );


            bodyA.velocity.sub( Jta.scale( 1/ma ) );
            bodyB.velocity.add( Jtb.scale( 1/mb ) );

            bodyA.angularVelocity -= wta;
            bodyB.angularVelocity += wtb;
        }

        viva.vector.releaseAll( [ vab, ra, rb, distance, vn, raClone, rbClone, raClone2, rbClone2, n_copy, Jna, Jnb, point, vab_clone ] );
        viva.vector.releaseAll( [ fn,  Jta, Jtb ] );

        this._adjustBodyPosition( collision );


    };

    /**
     * if two bodies in collision is overlapped to each other, move bodies a little apart along the center line, according to ratio of their radii
     * @private
     *
     * @param {Object} collision
     */
    Collisionbehavior.prototype._adjustBodyPosition = function ( collision ) {

        var bodyA = collision.bodyA,
            bodyB = collision.bodyB,
            cA = viva.vector.copy( bodyA.position ),
            cB = viva.vector.copy( bodyB.position ),
            distance = cB.sub(cA),
            overlap = bodyA.radius + bodyB.radius - distance.magnitude(),
            ratioA = bodyA.radius/( bodyA.radius + bodyB.radius ),
            ratioB = bodyB.radius/( bodyA.radius + bodyB.radius );

        bodyA._adjustPosition();
        bodyB._adjustPosition();

        if ( bodyA.type === "circle" && bodyB.type === "circle" ) {
            if( overlap > 0 ) {
                distance.normalize().scale( overlap );
                if ( bodyA.position.x < bodyB.position.x ) {
                    bodyA.position.x -= distance.x * ratioA;
                    bodyB.position.x += distance.x * ratioB;
                } else {
                    bodyA.position.x += distance.x * ratioA;
                    bodyB.position.x -= distance.x * ratioB;
                }

                if ( bodyA.position.y < bodyB.position.y ) {
                    bodyA.position.y -= distance.y * ratioA;
                    bodyB.position.y += distance.y * ratioB;
                } else {
                    bodyA.position.y += distance.y * ratioA;
                    bodyB.position.y -= distance.y * ratioB;
                }
            }
        }

        viva.vector.release( cA );
        viva.vector.release( cB );
    };

    /**
     * @namespace
     */
    var behavior = {
        ConstantAcceleration: function ( ax, ay ) {
            return new ConstantAccelerationbehavior( ax, ay );
        },
        BoundaryCollision: function ( boundary ) {
            return new BoundaryCollisionbehavior( boundary );
        },
        Collision: function () {
            return new Collisionbehavior();
        }
    };

    viva.behavior = behavior;

