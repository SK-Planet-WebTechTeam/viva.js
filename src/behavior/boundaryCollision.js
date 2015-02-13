
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
