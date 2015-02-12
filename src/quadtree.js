var Quadtree = function ( bound ) {
    this.root = new QuadNode( 0, bound );
    this.bound = bound;
};

Quadtree.prototype.insert = function ( body ) {
    this.root.insert( body );
};

Quadtree.prototype.retrieve = function ( body ) {
    return this.root.retrieve( body );
};

Quadtree.prototype.clear = function () {
    this.root.clear();
};

var QuadNode = function ( level, bound ) {
    this.max_objects = 10;
    this.max_level = 5;
    this.bodies = [];
    this.children = [];
    this.aabb = bound;
    this.level = level;
};

QuadNode.TOP_LEFT = 0;
QuadNode.TOP_RIGHT = 1;
QuadNode.BOTTOM_RIGHT = 2;
QuadNode.BOTTOM_LEFT = 3;

QuadNode.prototype.split = function () {
    var width = this.aabb.width/2,
        height = this.aabb.height/2,
        x = this.aabb.x,
        y = this.aabb.y;

    this.children[0] = new QuadNode( this.level + 1, new viva.AABB( x, y, width, height ) );
    this.children[1] = new QuadNode( this.level + 1, new viva.AABB( x + width, y, width, height ) );
    this.children[2] = new QuadNode( this.level + 1, new viva.AABB( x + width, y + height, width, height ) );
    this.children[3] = new QuadNode( this.level + 1, new viva.AABB( x, y + height, width, height ) );
};

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
        this.children[ index ].insert( body );
    }
};

QuadNode.prototype.retrieve = function ( body ) {
    var index = this.findIndex( body );

    if ( this.children.length > 0 && index >= 0 ){
        return this.children[ index ].retrieve( body );
    }

    return this.bodies;
};

QuadNode.prototype.clear = function () {
    this.bodies = [];

    if (this.children.length > 0 ) {
        this.children[ 0 ].clear();
        this.children[ 1 ].clear();
        this.children[ 2 ].clear();
        this.children[ 3 ].clear();
        this.children = [];
    }
};

viva.Quadtree = Quadtree;

