
    /**
     * 2D vector
     * @typedef {Object} Vector
     * @type {Vector}
     * @property {number} x x-component of a 2d vector
     * @property {number} y y-component of a 2d vector
     */

    /**
     * @class
     * @param {number} x
     * @param {number} y
     */
    var Vector = function ( x, y ) {
        this.x = x || 0;
        this.y = y || 0;
    };

    /**
     * add given vectors to this vector
     *
     * @return this
     */
    Vector.prototype.add = function() {
        for ( var i = 0; i < arguments.length; i++ ) {
            this.x += arguments[ i ].x;
            this.y += arguments[ i ].y;
        }

        return this;
    };

    /**
     * subtract given vectors from this vector
     *
     * @return this
     */
    Vector.prototype.sub = function () {
        for ( var i = 0; i < arguments.length; i++ ) {
            this.x -= arguments[ i ].x;
            this.y -= arguments[ i ].y;
        }

        return this;

    };

    /**
     * scale this vector by given amount
     *
     * @return this
     */
    Vector.prototype.scale = function( constant ) {
        this.x *= constant;
        this.y *= constant;

        return this;
    };

    /**
     * dot product of this vector and the given vector
     *
     * @return {number} dot product
     */
    Vector.prototype.dot = function ( vector ) {
        return this.x * vector.x + this.y * vector.y;
    };

    /**
     * cross product of this vector and the given vector
     *
     * @return {number} cross product
     */
    Vector.prototype.cross = function( vector ) {
        return this.x * vector.y - this.y * vector.x;
    };

    /**
     * multiply each components ( x*x, y*y )
     *
     * @return {number}
     */
    Vector.prototype.mult = function( vector ) {
        this.x *= vector.x;
        this.y *= vector.y;

        return this;
    };

    /**
     * project this vector onto the given vector
     *
     * @return {number} projection vector
     */
    Vector.prototype.projection = function ( vector ) {
        var dotProd = this.dot( vector ),
            magnitude = vector.magnitude(),
            result = viva.Vector.copy( vector );

        result.scale( dotProd / ( magnitude * magnitude ) );

        return result;
    };

    /**
     * angle between two vectors
     *
     * @return {number} angle in degree
     */
    Vector.prototype.angleBetween = function ( vector ) {
        if ( this.isZero() || vector.isZero() ) {
            return 0;
        }
        return Math.acos( this.dot( vector ) / ( this.magnitude() * vector.magnitude() ) );
    };


    /**
     * normalize
     */
    Vector.prototype.normalize = function () {
        this.scale( 1/this.magnitude() );

        return this;
    };

    /**
     * get the magnitude of this vector
     */
    Vector.prototype.magnitude = function () {
        return Math.sqrt( this.x * this.x + this.y * this.y );
    };

    /**
     * rotate vector by given angle.
     * rotation vector R = [ cosA, -sinA
     *                       sinA, cosA ]
     * @param {number} angle in degree
     */
    Vector.prototype.rotate = function ( angle ) {
        var cosA = Math.cos( angle ),
            sinA = Math.sin( angle );


        this.x = cosA * this.x - sinA * this.y;
        this.y = sinA * this.x + cosA * this.y;

        return this;
    };

    /**
     * reset this vector to ( 0, 0 )
     */
    Vector.prototype.reset = function () {
        this.x = 0;
        this.y = 0;

        return this;
    };

    /**
     * set the vector to given components (x, y)
     * @param {number} x
     * @param {number} y
     */
    Vector.prototype.set = function ( x, y ) {
        if ( x === undefined && y === undefined ) {
            return this;
        }

        if ( x.constructor === Vector ) {
            y = x.y;
            x = x.x;
        }

        this.x = x || 0;
        this.y = y || 0;

        return this;
    };

    /**
     * isEqual
     * @return {boolean}
     */
    Vector.prototype.isEqual = function ( vector ) {
        return this.x === vector.x && this.y === vector.y;
    };

    /**
     * isZero
     * @return {boolean}
     */
    Vector.prototype.isZero = function () {
        return this.x === 0 && this.y === 0;
    };

    Vector.prototype.print = function ( tag ) {
        return (tag ? tag + " :: " : "" ) + "{ x: " + this.x + ", y: " +  this.y + "}";
    };

    /**
     * clone
     * @return {Vector} new vector from vector pool with same xy components
     */
    Vector.prototype.clone = function () {
        return viva.Vector.copy( this );
    };

    var vectorPool = [];

    var VectorManager = {

        initVectorPool: function () {
            var index,
                i;

            for ( i = 0; i < 16; i++ ) {
                index = vectorPool.push( new Vector() );
            }
        },
        expandVectorPool: function () {
            var i,
                newLength = 200;

            for ( i = vectorPool.length; i < newLength; i++ ) {
                vectorPool.push( new Vector() );
            }
        },
        create: function ( x, y ) {
            if ( vectorPool.length === 0 ) {
                VectorManager.expandVectorPool();
            }
            vectorcnt++;
            return vectorPool.pop().set( x, y );
        },
        release: function () {
            var vector;
            for ( var i = 0; i < arguments.length; i++ ) {
                vector = arguments[ i ];

                if ( !vector ) {
                    continue;
                }

                vectorPool.push( vector );
                vectorcnt--;
                vector.reset();
            }
        },
        copy: function ( vector ) {
            if ( vectorPool.length === 0 ) {
                VectorManager.expandVectorPool();
            }
            vectorcnt++;
            return vectorPool.pop().set( vector.x, vector.y );
        }
    };


    viva.Vector = VectorManager;
    viva.Vector.initVectorPool();

    window.vectorcnt = 0;



