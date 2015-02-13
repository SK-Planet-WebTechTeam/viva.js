
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

