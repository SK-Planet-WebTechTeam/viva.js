
    /**
     * 2D vector
     * @typedef {Object} vector
     * @type {vector}
     * @property {number} x x-component of a 2d vector
     * @property {number} y y-component of a 2d vector
     */

    /**
     * @class
     * @param {number} x
     * @param {number} y
     */
    var vector = function ( x, y ) {
        this.x = x || 0;
        this.y = y || 0;
    };

    /**
     * add given vectors to this vector
     *
     * @return this
     */
    vector.prototype.add = function() {
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
    vector.prototype.sub = function () {
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
    vector.prototype.scale = function( constant ) {
        this.x *= constant;
        this.y *= constant;

        return this;
    };

    /**
     * dot product of this vector and the given vector
     *
     * @return {number} dot product
     */
    vector.prototype.dot = function ( vector ) {
        return this.x * vector.x + this.y * vector.y;
    };

    /**
     * cross product of this vector and the given vector
     *
     * @return {number} cross product
     */
    vector.prototype.cross = function( vector ) {
        return this.x * vector.y - this.y * vector.x;
    };

    /**
     * multiply each components ( x*x, y*y )
     *
     * @return {number}
     */
    vector.prototype.mult = function( vector ) {
        this.x *= vector.x;
        this.y *= vector.y;

        return this;
    };

    /**
     * project this vector onto the given vector
     *
     * @return {number} projection vector
     */
    vector.prototype.projection = function ( vector ) {
        var dotProd = this.dot( vector ),
            magnitude = vector.magnitude(),
            result = viva.vector.copy( vector );

        result.scale( dotProd / ( magnitude * magnitude ) );

        return result;
    };

    /**
     * angle between two vectors
     *
     * @return {number} angle in degree
     */
    vector.prototype.angleBetween = function ( vector ) {
        if ( this.isZero() || vector.isZero() ) {
            return 0;
        }
        return Math.acos( this.dot( vector ) / ( this.magnitude() * vector.magnitude() ) );
    };


    /**
     * normalize
     */
    vector.prototype.normalize = function () {
        this.scale( 1/this.magnitude() );

        return this;
    };

    /**
     * get the magnitude of this vector
     */
    vector.prototype.magnitude = function () {
        return Math.sqrt( this.x * this.x + this.y * this.y );
    };

    /**
     * rotate vector by given angle.
     * rotation vector R = [ cosA, -sinA
     *                       sinA, cosA ]
     * @param {number} angle in degree
     */
    vector.prototype.rotate = function ( angle ) {
        var cosA = Math.cos( angle ),
            sinA = Math.sin( angle ),
            x = this.x,
            y = this.y;


        this.x = cosA * x - sinA * y;
        this.y = sinA * x + cosA * y;

        return this;
    };

    /**
     * reset this vector to ( 0, 0 )
     */
    vector.prototype.reset = function () {
        this.x = 0;
        this.y = 0;

        return this;
    };

    /**
     * set the vector to given components (x, y)
     * @param {number} x
     * @param {number} y
     */
    vector.prototype.set = function ( x, y ) {
        if ( x === undefined && y === undefined ) {
            return this;
        }

        if ( x.constructor === vector ) {
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
    vector.prototype.isEqual = function ( vector ) {
        return this.x === vector.x && this.y === vector.y;
    };

    /**
     * isZero
     * @return {boolean}
     */
    vector.prototype.isZero = function () {
        return this.x === 0 && this.y === 0;
    };

    vector.prototype.print = function ( tag ) {
        return (tag ? tag + " :: " : "" ) + "{ x: " + this.x + ", y: " +  this.y + "}";
    };

    /**
     * clone
     * @return {vector} new vector from vector pool with same xy components
     */
    vector.prototype.clone = function () {
        return viva.vector.copy( this );
    };

    var vectorPool = [];

    var vectorManager = {

        initvectorPool: function () {
            var index,
                i;

            for ( i = 0; i < 16; i++ ) {
                index = vectorPool.push( new vector() );
            }
        },
        expandvectorPool: function () {
            var i,
                newLength = 200;

            for ( i = vectorPool.length; i < newLength; i++ ) {
                vectorPool.push( new vector() );
            }
        },
        create: function ( x, y ) {
            if ( vectorPool.length === 0 ) {
                vectorManager.expandvectorPool();
            }
            vectorcnt++;
            return vectorPool.pop().set( x, y );
        },
        release: function ( vector ) {
            vectorPool.push( vector );
            vectorcnt--;
            vector.reset();
        },
        releaseAll: function ( vectors ) {
            var vector;
            vectors.length;
            for ( var i = 0; i < vectors.length; i++ ) {
                vector = vectors[ i ];

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
                vectorManager.expandvectorPool();
            }
            vectorcnt++;
            return vectorPool.pop().set( vector.x, vector.y );
        }
    };


    viva.vector = vectorManager;
    viva.vector.initvectorPool();

    var vectorcnt = window.vectorcnt = 0;



