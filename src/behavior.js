
    var ConstantAccelerationBehavior = function ( ax, ay ) {
        this.acceleration = Physics.Vector.create( ax, ay );
        this.appliedBodies = [];
    };

    ConstantAccelerationBehavior.prototype.behave = function ( body ) {
        return Physics.Vector.copy( this.acceleration ).scale( body.mass );
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

        return Physics.Vector.create(); // 0,0
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

    var Behavior = {
        ConstantAcceleration: function ( ax, ay ) {
            return new ConstantAccelerationBehavior( ax, ay );
        },
        BoundaryCollision: function ( boundary ) {
            return new BoundaryCollisionBehavior( boundary );
        }
    };

    Physics.Behavior = Behavior;

