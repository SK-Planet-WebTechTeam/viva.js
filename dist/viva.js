(function(window, undefined) {
    var isMobile = "ontouchstart" in window,
        startEvent = isMobile ? "touchstart" : "mousedown",
        moveEvent = isMobile ? "touchmove" : "mousemove",
        endEvent = isMobile ? "touchend" : "mouseup";

    var now = Date.now;

    window.raf = (function(){
        return window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                function( callback ) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();

    var isArray = function (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    var extend = function ( dest, src ) {
        var i, len;

        if (arguments.length === 1) {
            src = dest;
            dest = {};
        }

        if((len = arguments.length) >= 3) {
            for(i = 1; i < len; i++){
                deepCopy(dest, arguments[i]);
            }
        } else {
            deepCopy(dest, src);
        }

        return dest;
    };

    var deepCopy = function ( dest, src ) {
        if (arguments.length === 1) {
            src = dest;
            dest = {};
        }

        if (!src || typeof src !== "object") {
            return src;
        }
        if(isArray(src)) {
            dest = [];
            var i = 0,
                len = src.length;
            for (i = 0; i < len; i++) {
                if (typeof src[i] === "object" && src[i] !== null) {
                    if (src[prop] instanceof Date) {
                        dest[i] = new Date(src[i]);
                    } else {
                        dest[i] = deepCopy(src[i]);
                    }
                }
                dest[i] = src[i];
            }
            return dest;
        }

        for (var prop in src) {
            if (src.hasOwnProperty(prop)) {
                if (typeof src[prop] === "object" && src[prop] !== null) {
                    if (src[prop] instanceof Date) {
                        dest[prop] = new Date(src[prop]);
                    } else {
                        dest[prop] = deepCopy(src[prop]);
                    }
                } else {
                    dest[prop] = src[prop];
                }
            }
        }
        return dest;
    };


	/**
	 * namespace for viva.js.
	 * everything including world, body, behavior, etc should be called as viva.World, etc.
	 * @namespace
	 */
    var viva = window.viva = {};






    var AABB = function ( x, y, width, height ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.left = x;
        this.top = y;
        this.right = x + width;
        this.bottom = y + height;
    };

    AABB.prototype.overlap = function ( aabb ) {
        return ( ( this.right >= aabb.left && this.right <= aabb.right ) || ( aabb.right >= this.left && aabb.right <= this.right ) ) &&
                ( ( this.bottom >= aabb.top && this.bottom <= aabb.bottom ) || ( aabb.bottom >= this.top && aabb.bottom <= this.bottom ) );
    };

    AABB.prototype.set = function ( x, y, width, height ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.left = x;
        this.top = y;
        this.right = x + width;
        this.bottom = y + height;
    };

    AABB.prototype.contains = function ( aabb ) {
        return this.left <= aabb.left &&
                this.right >= aabb.right &&
                this.top <= aabb.top &&
                this.bottom >= aabb.bottom;
    };

    viva.AABB = AABB;

    /**
     * quadtree implementation for broad-phase collision detection
     * @constructor
     * @param {Object} bound an AABB object
     */
    var Quadtree = function ( bound ) {
        this.root = new QuadNode( 0, bound );
        this.bound = bound;
    };

    /**
     * insert a body to quadtree
     * @param {Object} body a body object
     */
    Quadtree.prototype.insert = function ( body ) {
        this.root.insert( body );
    };

    /**
     * retrieve a set of bodies which possibly engaged in collision with the given body
     * @param {Object} body a body object
     */
    Quadtree.prototype.retrieve = function ( body ) {
        return this.root.retrieve( body );
    };

    /**
     * clear the quadtree
     */
    Quadtree.prototype.clear = function () {
        this.root.clear();
    };

    /**
     * Node implementation for Quadtree
     * Each Quadnode can have exactly 4 child nodes
     * @constructor
     *
     * @param level {Number} level of the node in the quadtree
     * @param bound {Object} an AABB object which reperesents the boundary this node occupies
     */
    var QuadNode = function ( level, bound ) {
        this.max_objects = 10;
        this.max_level = 5;
        this.bodies = [];
        this.children = [];
        this.residue = [];
        this.aabb = bound || new viva.AABB();
        this.level = level;
    };

    QuadNode.TOP_LEFT = 0;
    QuadNode.TOP_RIGHT = 1;
    QuadNode.BOTTOM_RIGHT = 2;
    QuadNode.BOTTOM_LEFT = 3;

    /**
     * If the number of bodies in current node exceeds max_objects, make child nodes and distribute bodies into children
     */
    QuadNode.prototype.split = function () {
        var width = this.aabb.width/2,
            height = this.aabb.height/2,
            x = this.aabb.x,
            y = this.aabb.y;

        this.children[0] = QuadNodePool.allocate( this.level + 1, x, y, width, height );// new QuadNode( this.level + 1, new viva.AABB( x, y, width, height ) );
        this.children[1] = QuadNodePool.allocate( this.level + 1, x + width, y, width, height );// new QuadNode( this.level + 1, new viva.AABB( x + width, y, width, height ) );
        this.children[2] = QuadNodePool.allocate( this.level + 1, x + width, y + height, width, height );// new QuadNode( this.level + 1, new viva.AABB( x + width, y + height, width, height ) );
        this.children[3] = QuadNodePool.allocate( this.level + 1, x, y + height, width, height );// new QuadNode( this.level + 1, new viva.AABB( x, y + height, width, height ) );
    };

    /**
     * Determines in which quadrant the body should go
     *
     * @param {Object} body a body object
     */
    QuadNode.prototype.findIndex = function ( body ) {
        if ( !body ) {
            return;
        }

        var bodyIsInTopHalf = body.position.y < this.aabb.y + this.aabb.height/2,
            bodyIsInBottomHalf = !bodyIsInTopHalf,
            bodyIsInLeftHalf = body.position.x < this.aabb.x + this.aabb.width/2,
            bodyIsInRightHalf = !bodyIsInLeftHalf;

        if ( bodyIsInTopHalf && bodyIsInLeftHalf ) {
            return QuadNode.TOP_LEFT;
        }
        if ( bodyIsInTopHalf && bodyIsInRightHalf ) {
            return QuadNode.TOP_RIGHT;
        }
        if ( bodyIsInBottomHalf && bodyIsInLeftHalf ) {
            return QuadNode.BOTTOM_LEFT;
        }
        if ( bodyIsInBottomHalf && bodyIsInRightHalf ) {
            return QuadNode.BOTTOM_RIGHT;
        }
    };

    // QuadNode.prototype._checkOverlap = function ( body, index ) {
    //     var right, left, top, bottom;
    //     switch ( index ) {
    //         case 0:
    //             left = this.aabb.x;
    //             right = this.aabb.x + this.aabb.width/2;
    //             top = this.aabb.y;
    //             bottom = this.aabb.

    //     }
    //     return ( ( this.right >= body.left && this.right <= body.right ) || ( body.right >= this.left && body.right <= this.right ) ) &&
    //             ( ( this.bottom >= body.top && this.bottom <= body.bottom ) || ( body.bottom >= this.top && body.bottom <= this.bottom ) );
    // }

    /**
     * Insert a new body to the node
     *
     * @param {Object} body a body object
     */
    QuadNode.prototype.insert = function ( body ) {
        if ( this.bodies.length <= this.max_objects && this.children.length === 0 ) {
            this.bodies.push( body );
            return;
        }

        var index, i, len;
        if ( this.bodies.length > this.max_objects ) {
            this.bodies.push( body );
            this.split();

            i = 0;
            len = this.bodies.length;

            for ( i = 0; i < len; i++ ) {
                body = this.bodies.pop();
                index = this.findIndex( body );
                this.children[ index ].insert( body );
            }

            return;
        }

        if ( this.children.length > 0 ) {
            index = this.findIndex( body );
            var child = this.children[ index ];
            if ( child.aabb.contains( body.aabb ) ) {
                child.insert( body );
            } else {
                this.residue.push( body );
            }
        }
    };

    /**
     * retrieve a set of bodies which possibly engaged in collision with the given body
     *
     * @param {Object} body a body object
     */
    QuadNode.prototype.retrieve = function ( body ) {
        var index = this.findIndex( body ),
            result = [];

        if ( this.children.length > 0 && index >= 0 ){
            if ( this.children[ index ].aabb.contains( body.aabb ) ) {
                Array.prototype.push.apply( result, this.children[ index ].retrieve( body ) );
            } else {

                if ( body.aabb.x <= this.children[ QuadNode.TOP_RIGHT ].aabb.x ) {
                    if ( body.aabb.y <= this.children[ QuadNode.BOTTOM_LEFT ].aabb.y ) {
                        Array.prototype.push.apply( result, this.children[ QuadNode.TOP_LEFT ].retrieve( body ) );
                    }

                    if ( body.aabb.y + body.aabb.height > this.children[ QuadNode.BOTTOM_LEFT ].aabb.y) {
                        Array.prototype.push.apply( result, this.children[ QuadNode.BOTTOM_LEFT ].retrieve( body ) );
                    }
                }

                if ( body.aabb.x + body.aabb.width > this.children[ QuadNode.TOP_RIGHT ].aabb.x) {//position+width bigger than middle x
                    if ( body.aabb.y <= this.children[ QuadNode.BOTTOM_RIGHT ].aabb.y) {
                        Array.prototype.push.apply( result, this.children[ QuadNode.TOP_RIGHT ].retrieve( body ) );
                    }

                    if ( body.aabb.y + body.aabb.height > this.children[ QuadNode.BOTTOM_RIGHT ].aabb.y ) {
                        Array.prototype.push.apply( result, this.children[ QuadNode.BOTTOM_RIGHT ].retrieve( body ) );
                    }
                }
            }
        }

        Array.prototype.push.apply( result, this.bodies );
        Array.prototype.push.apply( result, this.residue );

        return result;
    };

    /**
     * clear node
     */
    QuadNode.prototype.clear = function () {
        this.bodies = [];
        this.residue = [];

        if (this.children.length > 0 ) {
            this.children[ 0 ].clear();
            this.children[ 1 ].clear();
            this.children[ 2 ].clear();
            this.children[ 3 ].clear();
            QuadNodePool.release( this.children[ 0 ] );
            QuadNodePool.release( this.children[ 1 ] );
            QuadNodePool.release( this.children[ 2 ] );
            QuadNodePool.release( this.children[ 3 ] );
            this.children = [];
        }
    };

    var QuadNodePool = {};

    var nodecnt = window.nodecnt = 0;
    QuadNodePool.pool = [];
    QuadNodePool.size = 16;
    QuadNodePool.allocate = function ( level, x, y, width, height ) {
        if ( QuadNodePool.pool.length === 0 ) {
            QuadNodePool.expand();
        }
        var node = QuadNodePool.pool.pop();

        node.aabb.set( x, y, width, height );
        node.level = level;

        nodecnt++;
        return node;
    };

    QuadNodePool.expand = function () {
        for ( var i = 0; i < QuadNodePool.size; i++ ) {
            QuadNodePool.pool.push( new QuadNode( -1 ) );
        }
    };

    QuadNodePool.release = function( node ) {
        nodecnt--;
        QuadNodePool.pool.push( node );
    };

    viva.Quadtree = Quadtree;



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






    var bodyPool = [];

    /**
     * @mixin
     * @namespace Body
     * @memberof viva
     */
    var BodyManager = {
        /** @private */
        initPool: function () {
            var i;

            for ( i = 0; i < 16; i++ ) {
                bodyPool.push( new body({ x: -1000, y: -1000 }) );
            }
        },
        /** @private */
        expandPool: function () {
            var i,
                newLength = 32;

            for ( i = bodyPool.length; i < newLength; i++ ) {
                bodyPool.push( new body({ x: -1000, y: -1000 }) );
            }
        },
        /**
         * get a body from body pool.
         * please refer to {@link body} for detailed API
         * @function
         * @memberof Body
         *
         * @param {String} type type of a body [ "rectangle" | "circle" ]
         * @param {Object} body's property
         * @example
         * body = viva.Body.create( "circle", {
         *     x: 100,
         *     y: 100,
         *     radius: 10,
         *     mass: 1,
         *     color: pink,
         *     cor: 0.6,
         *     cof: 0.1,
         *     angle: 45 * Math.PI/180 // in radian
         * });
         */
        create: function ( type, option ) {
            if ( bodyPool.length === 0 ) {
                BodyManager.expandPool();
            }

            option.type = type;
            return bodyPool.pop()._set( option );
        },

        /**
         * release a body that is no more in use back to body pool.
         * @function
         * @memberof Body
         */
        release: function ( body ) {
            body._reset();
            bodyPool.push( body );
        }

    };

    var BODY_STATUS = {
        "NORMAL": 1,
        "MOVING": 2,
        "FIXED": 3,
        "STABLE": 4
    };

    /**
     * constructor of body.
     * explicitly create a new body with this constructor is not recommended because of memory management performance (GC).
     * Instead, use Body.create() function to make use of body pool
     * @class
     * @private
     *
     * @param {Object} option body's properties
     */
    var body = function ( option ) {
        this.position = viva.vector.create( option.x, option.y );
        this.velocity = viva.vector.create();
        this.acceleration = viva.vector.create();
        this.prevPosition = viva.vector.create();
        this.angularVelocity = 0;

        this.cof = option.cof || 0;
        this.cor = option.cor || 0;
        this.mass = option.mass || 0;
        this.angle = option.angle || 0;

        this.type = option.type; // rectangle, polygon, circle
        this.width = option.width;
        this.height = option.height;
        this.radius = option.radius;
        this.color = option.color;
        this.aabb = new viva.AABB();
        this.status = BODY_STATUS.NORMAL;
        this.world = undefined;
        this.uuid = -1;

        this.externalForce = [];
    };

    /**
     * move the body to given position.
     *
     * @param {vector} vector vector of the position
     */
    body.prototype.move = function( vector ) {
        viva.vector.release( this.prevPosition );
        this.prevPosition = this.position;
        this.position = vector;

        this._updateAABB();

        return this;
    };


    // TODO: find the more proper name for this function..
    body.prototype.do = function () {
        var behaviors = this.world.behaviors,
            i = 0,
            len = behaviors.length,
            behavior,
            netF = viva.vector.create(),
            f;

        if ( len === 0 ) {
            return this;
        }

        for ( i = 0; i < len; i++ ) {
            behavior = behaviors[ i ];

            f = behavior.behave( this );
            if ( !f ) {
                continue;
            }

            netF.add( f );
            viva.vector.release( f );
        }

        return netF;
    };


    /**
     * apply the given force (2d vector) to the body.
     *
     * @param {vector} force a force in 2d vector object
     */
    body.prototype.applyForce = function ( force ) {
        this.externalForce.push( force );
        return this;
    };

    /**
     * accelerate the body with the given amount of acceleration.
     *
     * @param {vector} a acceleration in 2d vector object
     */
    body.prototype.accelerate = function ( a ) {

        this.acceleration.add( a.scale( this.world.ratio ) );
        viva.vector.release( a );

        return this;
    };


    /**
     * calculate new velocity, position, acceleration by delta time.
     *
     * @param {Number} dt delta time
     */
    body.prototype.step = function ( dt ) {
        if ( this.status !== BODY_STATUS.NORMAL ) {
            return;
        }
        var force = viva.vector.create(), // this.do( dt ),
            prevVelocity = viva.vector.copy( this.velocity ),
            i = 0,
            a = this.acceleration,
            prevAcceleration = viva.vector.copy( this.acceleration ),
            f;

        if ( this.externalForce.length > 0 ) {
            for ( i = 0; i < this.externalForce.length; i++ ) {
                f = this.externalForce.pop();
                force.add( f );

                viva.vector.release( f );
            }
        }

        this.prevPosition.set( this.position );

        /* Verlet Integration */
        this.position.add( prevVelocity.scale( dt ) ).add( prevAcceleration.scale( dt * dt / 2 ) );

        this.acceleration = force.scale( 1 / this.mass ).scale( this.world.ratio );
        this.velocity.add( a.add( this.acceleration ).scale( dt ) );

        /* classical method */
        // this.acceleration = force.scale( 1 / this.mass ).scale( this.world.ratio );
        // this.velocity.add( a.scale( dt ) );
        // this.position.add( prevVelocity.add( this.velocity ).scale( dt / 2 ) );

        this.angle += this.angularVelocity * dt;

        viva.vector.releaseAll( [ prevVelocity, a, prevAcceleration ] );

        this._updateAABB();
        return this;
    };

    /**
     * move the body a little bit to make sure the body is within the world ( no cut off ).
     */
    body.prototype._adjustPosition = function () {
        var x = this.position.x,
            y = this.position.y,
            horizontalDistance = this.radius || this.width/2,
            verticalDistance = this.radius || this.height/2;

        if ( this.velocity.magnitude() === 0 ) {
            return this.position;
        }

        // adjust position
        if (x + horizontalDistance > this.world.width ) {
            this.position.x = Math.floor( this.world.width - horizontalDistance );
        }

        if (x - (this.radius || this.width/2) < 0) {
            this.position.x = Math.ceil( horizontalDistance );
        }

        if (y + verticalDistance > this.world.height ) {
            this.position.y = ( this.world.height - verticalDistance );
        }

        if (this.position.y - (verticalDistance) < 0 ) {
            this.position.y = ( verticalDistance );
        }

        return this;
    };

    body.prototype.contains = function ( x, y ) {
        if ( this.type === "rectangle" ) {
            return x <= this.position.x + this.width/2 && x >= this.position.x - this.width/2 &&
                   y <= this.position.y + this.height/2 && y >= this.position.y - this.height/2;
        }

        if ( this.type === "circle" ) {
            return Math.pow( x - this.position.x, 2 ) + Math.pow( y - this.position.y, 2 ) <= Math.pow( this.radius, 2 );
        }
    };

    body.prototype._updateAABB = function () {
        if ( this.type === "circle" ) {
            this.aabb.set( this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2 );
        }

        if ( this.type === "rectangle" ) {
            var top_most,
                left_most,
                bottom_most,
                right_most,
                center = this.position.clone(),
                tl = center.clone().add( {x: - this.width/2, y: -this.height/2} ).sub( center ),
                tr = center.clone().add( {x: + this.width/2, y: -this.height/2} ).sub( center ),
                bl = center.clone().add( {x: - this.width/2, y: this.height/2} ).sub( center ),
                br = center.clone().add( {x: + this.width/2, y: this.height/2} ).sub( center ),
                degree_rad = Math.PI / 180,
                angle = this.angle % (360 * degree_rad);

            if ( angle <= 90 * degree_rad ) {
                top_most = tl.rotate( this.angle );
                left_most = bl.rotate( this.angle );
                bottom_most = br.rotate( this.angle );
                right_most = tr.rotate( this.angle );
            } else if ( angle <= 180 * degree_rad ) {
                top_most = bl.rotate( this.angle );
                left_most = br.rotate( this.angle );
                bottom_most = tr.rotate( this.angle );
                right_most = tl.rotate( this.angle );
            } else if ( angle <= 270 * degree_rad ) {
                top_most = br.rotate( this.angle );
                left_most = tr.rotate( this.angle );
                bottom_most = tl.rotate( this.angle );
                right_most = bl.rotate( this.angle );
            } else {
                top_most = tr.rotate( this.angle );
                left_most = tl.rotate( this.angle );
                bottom_most = bl.rotate( this.angle );
                right_most = br.rotate( this.angle );
            }

            top_most.add( center );
            left_most.add( center );
            bottom_most.add( center );
            right_most.add( center );

            this.aabb.set( left_most.x, top_most.y, right_most.x - left_most.x, bottom_most.y - top_most.y );

            viva.vector.releaseAll( [ tl, tr, bl, br, center ] );
        }
    };

    /**
     * set body's status.
     *
     * @param {String} status [ "NORMAL" | "MOVING" | "FIXED"| "STABLE" ]
     */
    body.prototype.setStatus = function ( status ) {
        this.status = BODY_STATUS[ status ];

        return this;
    };

    /**
     * set body's property.
     *
     * @param {Object} option
     */
    body.prototype._set = function ( option ) {
        this.position.set( option.x, option.y );
        this.velocity.set( option.vx, option.vy );

        this.angularVelocity = option.angularVelocity || this.angularVelocity;
        this.cof = option.cof  || this.cof;
        this.cor = option.cor || this.cor;
        this.mass = option.mass || this.mass;
        this.angle = option.angle || this.angle;

        this.type = option.type; // rectangle, polygon, circle
        this.width = option.width;
        this.height = option.height;
        this.radius = option.radius;
        this.color = option.color;
        this._updateAABB();

        return this;
    };

    /**
     * reset the body's property.
     */
    body.prototype._reset = function () {
        this.position.reset();
        this.velocity.reset();
        this.acceleration.reset();
        this.prevPosition.reset();

        this.angularVelocity = 0;
        this.cof = 0;
        this.cor = 0;
        this.mass = 0;
        this.angle = 0;

        this.type = ""; // rectangle, polygon, circle
        this.width = 0;
        this.height = 0;
        this.radius = 0;
        // this.world = undefined;
        this.color = "fff";
        this.uuid = -1;

        return this;
    };

    /**
     * check if the body has moved from the previous position.
     *
     * @return {Boolean}
     */
    body.prototype.isChanged = function () {
        return !this.position.isEqual( this.prevPosition );
    };

    viva.body = BodyManager;
    viva.body.initPool();


    /**
     * world class which has all the bodies and behaviors to simulate.
     * @class
     */
    var world = function () {
        this.bodies = [];
        this.behaviors = [];
        this.renderer = undefined;
        this.paused = true;
        this.ratio = 100; // pixels/meter
        this.width = 600;
        this.height = 500;

        this.movingBody = null;
        this.lastStep = 0;
        this.lastMove = 0;
        this.uuid = 0;

        this.quadtree = new viva.Quadtree( new viva.AABB( 0, 0, 0, 0 ) );

        /* event handlers */
        this.onMove = this._onMove.bind( this );
        this.onEnd = this._onEnd.bind( this );
    };

    world.prototype.init = function () {

    };

    /**
     * start the world
     */
    world.prototype.start = function () {
        if ( !this.paused ) {
            return;
        }
        this.lastStep = now();

        raf( this._step.bind( this ) );

        this.paused = false;
    };

    /**
     * step function which is called by requestAnimationFrame at every frame
     * all the simulation is done in this function by time step of each step function
     * @private
     */
    world.prototype._step = function() {
        var i, body,
            thisStep = now(),
            dt = ( thisStep - this.lastStep ) / 1000; // in seconds

        this.lastStep = thisStep;

        for ( i = 0; i < this.behaviors.length; i++ ) {
            for ( var j = 0; j < this.bodies.length; j++ ) {
                body = this.bodies[ j ];
                this.behaviors[ i ].behave( body );
            }
        }

        this.quadtree.clear();
        for ( i = 0; i < this.bodies.length; i++ ) {
            body = this.bodies[ i ];
            body.step( dt );
            this.quadtree.insert( body );
        }

        if ( this.renderer ) {
            this.renderer.draw( this.bodies );
        }

        if ( !this.paused ) {
            raf( this._step.bind( this ) );
        }
    };

    /**
     * add a body to the world
     *
     * @param {Object} body
     */
    world.prototype.add = function( body ) {
        body.world = this;
        body.uuid = this.uuid++;
        this.bodies.push( body );
        this.quadtree.insert( body );
    };

    /**
     * apply a behavior to the world
     *
     * @param {Object} behavior
     */
    world.prototype.apply = function( behavior ) {
        this.behaviors.push( behavior );
    };

    /**
     * set renderer of the world
     *
     * @param {Object} renderer
     */
    world.prototype.setRenderer = function ( renderer ) {
        this.renderer = renderer;
        this.width = this.renderer.width;
        this.height = this.renderer.height;

        this.renderer.on( startEvent, this._onClick.bind( this ) );
        this.quadtree.bound.set( 0, 0, this.width, this.height );
    };

    /**
     * pause simulation
     */
    world.prototype.pause = function () {
        this.paused = true;
    };

    /**
     * resume paused simulation
     */
    world.prototype.resume = function () {
        this.start();
    };


    /**
     * mousedown/touchstart event handler.
     * if clicked on a body, the body stops simulation and stays at the mouse pointer
     * as if the user is holding it
     * @private
     */
    world.prototype._onClick = function ( e ) {
        var offset = this.renderer.el.getBoundingClientRect(),
            x = e.pageX || e.touches[0].pageX - offset.left,
            y = e.pageY || e.touches[0].pageY - offset.top,
            body,
            i;

        if ( this.paused ) {
            return;
        }

        // Consider the later a body is added to the world, the higher z-index it has.
        for ( i = this.bodies.length - 1; i >= 0; i-- ) {
            body = this.bodies[ i ];
            if ( body.contains( x, y ) ) {
                body.setStatus( "MOVING" );
                body.angularVelocity = 0;
                this.movingBody = body;

                this.renderer.on( moveEvent, this.onMove );
                this.renderer.on( endEvent, this.onEnd );

                return;
            }
        }
    };

    /**
     * mousemove/touchmove event handler.
     * there the user is holding a body, moves the body along the pointer
     * @private
     */
    world.prototype._onMove = function ( e ) {
        var offset = this.renderer.el.getBoundingClientRect(),
            x = isMobile ? e.touches[0].pageX - offset.left : e.pageX,
            y = isMobile ? e.touches[0].pageY - offset.top : e.pageY,
            moveTime = now(),
            dt = moveTime - this.lastMove,
            body = this.movingBody,
            velocity;

        e.preventDefault();
        e.stopPropagation();

        if ( !body ) {
            this.lastMove = 0;
            return;
        }

        if ( !this._isMovable( body, x, y ) ) {
            this.lastMove = 0;
            return;
        }

        // calculate the velocity of movement
        body.prevPosition.set( x, y );
        body.move( viva.vector.create( x, y ) );
        velocity = viva.vector.copy( body.position ).sub( body.prevPosition ).scale( 1000 / dt );

        viva.vector.release( body.velocity );
        body.velocity = velocity;

        this.lastMove = moveTime;
    };

    /**
     * check if the body is within the boundary
     * @private
     *
     * @param {Object} body
     * @param {Number} x x-coordinate of mouse pointer
     * @param {Number} y y-coordinate of mouse pointer
     */
    world.prototype._isMovable = function ( body, x, y ) {
        var horizontalDistance = body.radius || body.width/2,
            verticalDistance = body.radius || body.height/2,
            boundary = this.renderer.el.getBoundingClientRect();

        if ( x + horizontalDistance >= boundary.left + boundary.width ) {
            return false;
        }
        if ( x - horizontalDistance <= boundary.left  ) {
            return false;
        }
        if ( y + verticalDistance >= boundary.top + boundary.height ) {
            return false;
        }
        if ( y - verticalDistance <= boundary.top ) {
            return false;
        }

        return true;
    };

    /**
     * mouseend/touchend event handler.
     * let the body go
     * @private
     */
    world.prototype._onEnd = function () {
        if ( now() - this.lastMove > 300 ) {
            this.movingBody.velocity.reset();
        }

        this.movingBody.setStatus( "NORMAL" );
        this.movingBody = null;
        this.renderer.off( moveEvent, this.onMove );
        this.renderer.off( endEvent, this.onEnd );
    };

    viva.world = world;


    var isDOMElement = function ( obj ) {
        return ( typeof obj === "object" ) && ( obj.nodeType === 1 ) &&
            ( typeof obj.style === "object" ) && ( typeof obj.ownerDocument ==="object" );
    };

    /**
     * canvas renderer
     * @class
     *
     * @param {String|DOM} element an id of canvas element or container element.
     *                     Or, the DOM element itself of canvas element or container element
     */
    var canvasRenderer = function ( element ) {
        var el, parent = document.body;
        if ( typeof element === "string" ) {
            el = document.getElementById( element );
        } else if ( isDOMElement( element ) ) {
            el = element;
        }

        if ( el && el.tagName === "canvas" ) {
            this.el = el;
        } else if ( el ) {
            parent = el;
        }

        this.width = ( this.el && this.el.width ) || window.innerWidth;
        this.height = ( this.el && this.el.height ) || window.innerHeight;

        if ( this.el === undefined ) {
            this.el = document.createElement( "canvas" );
            this.el.width = this.width;
            this.el.height = this.height;

            parent.appendChild( this.el );
        }

        this.el.style.transform = "translate3d(0,0,0)";
        this.el.style[ "-webkit-transform" ] = "translate3d(0,0,0)";

        this.ctx = this.el.getContext( "2d" );

        this.on( moveEvent, function (e) {
            e.preventDefault();
        });
    };

    /**
     * draw bodies
     */
    canvasRenderer.prototype.draw = function ( bodies ) {
        var i,
            len = bodies.length;

        this.ctx.strokeStyle = "#000";
        this.ctx.lineWidth = 1;

        // if ( bodies.some( function ( v ) { return v.isChanged(); }) ) {
            this.ctx.clearRect( 0, 0, this.width, this.height );
        // }

        // for( i = 0; i < len; i++ ){
        //     this._clearBody( bodies[ i ] );
        // }

        for( i = 0; i < len; i++ ){
            this._drawBody( bodies[ i ] );
        }
    };

    /**
     * draw a body
     * @private
     */
    canvasRenderer.prototype._drawBody = function ( body ) {
        var position = body.position,
            width = body.width,
            height = body.height,
            radius = body.radius,
            x = Math.round( position.x ),
            y = Math.round( position.y );

        // if ( !this._isInCanvas( body ) || !body.isChanged() ) {
        //     return;
        // }

        this.ctx.save();

        this.ctx.translate( x, y );
        this.ctx.rotate( body.angle );

        this.ctx.beginPath();

        if ( body.type === "rectangle" ) {
            this.ctx.rect ( Math.round( -width/2 ), Math.round( -height/2 ), width, height );
        } else if ( body.type === "circle" ) {
            this.ctx.arc( 0, 0, radius, 0, 2 * Math.PI, false );
        }

        this.ctx.closePath();
        this.ctx.fillStyle = body.color;
        this.ctx.fill();
        // this.ctx.stroke();


        // if ( body.angle ) {
            this.ctx.beginPath();
            this.ctx.moveTo( 0, 0 );
            this.ctx.lineTo( 0, -( radius || height/2 ) );
            this.ctx.closePath();
            this.ctx.stroke();
        // }

        this.ctx.restore();
        /* AABB */
        // this.ctx.rect ( body.aabb.x, body.aabb.y, body.aabb.width, body.aabb.height );
        // this.ctx.stroke();
    };

    canvasRenderer.prototype.drawQuadtree = function ( tree ) {
        var node = tree.root || tree,
            bound = node.aabb;
        if ( node.children.length > 0 ) {
            this.drawQuadtree( node.children[0] );
            this.drawQuadtree( node.children[1] );
            this.drawQuadtree( node.children[2] );
            this.drawQuadtree( node.children[3] );
        }


        this.ctx.rect( bound.x, bound.y, bound.width, bound.height );
        this.ctx.stroke();
    };

    /**
     * clear a body
     * @private
     */
    canvasRenderer.prototype._clearBody = function ( body ) {

        if ( !this._isInCanvas( body ) ) {
            return;
        }

        if ( body.type === "rectangle" ) {
            var width = body.width,
                height = body.height;

            this.ctx.clearRect( body.prevPosition.x - width/2 * 1.1, body.prevPosition.y - height/2 * 1.1, width * 1.1, height * 1.1 );

        } else if ( body.type === "circle" ) {
            var radius = body.radius;

            this.ctx.clearRect( body.prevPosition.x - radius * 1.1, body.prevPosition.y - radius * 1.1, radius * 2.1, radius * 2.1 );
        }
    };

    /**
     * draw a body
     * @private
     */
    canvasRenderer.prototype._isInCanvas = function ( body ) {
        if ( body.type === "rectangle" ) {
            return this.width  >= body.position.x + body.width/2 &&
                 this.height  >= body.position.y + body.height/2;
        }

        if ( body.type === "circle" ) {
            return this.width >= body.position.x + body.radius/2 &&
                 this.height >= body.position.y + body.radius/2;
        }
    };

    /**
     * add an event listener to the canvas element
     *
     * @param {String} event event name
     * @param {function} callback callback function
     */
    canvasRenderer.prototype.on = function ( event, callback ) {
        this.el.addEventListener( event, callback );
    };

    /**
     * remove an event listener to the canvas element
     *
     * @param {String} event event name
     * @param {String} functionName name of the callback function
     */
    canvasRenderer.prototype.off = function ( event, functionName ) {
        this.el.removeEventListener( event, functionName );
    };

    /**
     * @namespace renderer
     */
    var renderer = {
        canvas: function ( element ) {
            return new canvasRenderer( element );
        }
    };

    viva.renderer = renderer;




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
        var bodies = body.world.quadtree.retrieve( body ),// body.world.bodies,
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

        if ( bodyA.type === "rectangle" || bodyB.type === "rectangle" ) {
            if( bodyA.aabb.overlap( bodyB.aabb ) ) {
                point = viva.vector.copy( cB );

                if ( cB.magnitude() === 0 ) {
                    return;
                }

                collision = {
                    bodyA : bodyA,
                    bodyB : bodyB,
                    point : point.scale( (bodyA.aabb.width/2) / cB.magnitude() ).add( cA )
                };
            }
        }

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


})(window);