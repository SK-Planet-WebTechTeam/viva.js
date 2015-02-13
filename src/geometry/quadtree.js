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

