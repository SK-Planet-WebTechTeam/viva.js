
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
