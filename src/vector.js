
    var Vector = function ( x, y ) {
        this.x = x || 0;
        this.y = y || 0;
    };

    Vector.prototype.add = function( vector ) {
        // var result = new Vector( this.x, this.y );
        for ( var i = 0; i < arguments.length; i++ ) {
            this.x += arguments[ i ].x;
            this.y += arguments[ i ].y;
        }

        return this;
    };

    Vector.prototype.sub = function ( vector ) {
        // var result = new Vector( this.x, this.y );
        for ( var i = 0; i < arguments.length; i++ ) {
            this.x -= arguments[ i ].x;
            this.y -= arguments[ i ].y;
        }

        return this;

    };

    Vector.prototype.scale = function( constant ) {
        // var result = new Vector( this.x, this.y );
        this.x *= constant;
        this.y *= constant;

        return this;
    };

    Vector.prototype.dot = function ( vector ) {
        return this.x * vector.x + this.y * vector.y;
    };

    Vector.prototype.cross = function( vector ) {
        return this.x * vector.y - this.y * vector.x;
    };

    Vector.prototype.mult = function( vector ) {
        this.x *= vector.x;
        this.y *= vector.y;

        return this;
    };

    Vector.prototype.magnitude = function () {
        return Math.sqrt( Math.pow( this.x, 2) + Math.pow( this.y, 2) );
    };

    /**
     * rotate vector by given angle.
     * rotation vector R = [ cosA, -sinA
     *                       sinA, cosA ]
     * @param {number} angle
     */
    Vector.prototype.rotate = function ( angle ) {
        var cosA = Math.cos( angle ),
            sinA = Math.sin( angle );


        this.x = cosA * this.x - sinA * this.y;
        this.y = sinA * this.x + cosA * this.y;

        return this;
    };

    Vector.prototype.reset = function () {
        this.x = 0;
        this.y = 0;

        return this;
    };

    Vector.prototype.set = function ( x, y ) {
        if ( x === undefined || y === undefined ) {
            return this;
        }

        this.x = x || 0;
        this.y = y || 0;

        return this;
    };

    Vector.prototype.isEqual = function ( vector ) {
        return this.x === vector.x && this.y === vector.y;
    };

    Vector.prototype.print = function ( tag ) {
        return (tag ? tag + " :: " : "" ) + "{ x: " + this.x + ", y: " +  this.y + "}";
    };

    var vectorPool = [];
    var emptyVectorSlots = [];

    var VectorManager = {

        initVectorPool: function () {
            var index,
                i;

            for ( i = 0; i < 16; i++ ) {
                index = vectorPool.push( new Vector() );
                // emptyVectorSlots.push( index - 1 );
            }
        },
        expandVectorPool: function () {
            var index,
                i,
                newLength = 256;

            console.log( "vector expand", vectorPool.length, newLength );

            for ( i = vectorPool.length; i < newLength; i++ ) {
                // index = vectorPool.push( new Vector() );
                vectorPool.push( new Vector() );
                // console.log( index );
                // emptyVectorSlots.push( index - 1 );
            }
        },
        create: function ( x, y ) {
            if ( vectorPool.length === 0 ) {
                VectorManager.expandVectorPool();
            }

            // vectorCnt++;
            // console.log(vectorCnt);

            // var index = emptyVectorSlots.pop();

            // if ( index > 2000 ) {
            //     console.log( index, vectorPool.length );
            // }

            return vectorPool.pop().set( x, y );
        },
        release: function ( vector ) {
            // var index = vectorPool.push( vector );
            // emptyVectorSlots.push( index - 1 );
            vectorPool.push( vector );
            // vectorCnt--;

            vector.reset();
        },
        copy: function ( vector ) {
            return VectorManager.create( vector.x, vector.y );
        }
    };


    Physics.Vector = VectorManager;
    Physics.Vector.initVectorPool();
    // window.vectorPool = vectorCnt;



