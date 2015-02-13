
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

