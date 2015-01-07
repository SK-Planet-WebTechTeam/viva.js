
    var isDOMElement = function ( obj ) {
        return ( typeof obj === "object" ) && ( obj.nodeType === 1 ) &&
            ( typeof obj.style === "object" ) && ( typeof obj.ownerDocument ==="object" );
    };

    var CanvasRenderer = function ( element ) {
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
    };

    CanvasRenderer.prototype.draw = function ( bodies ) {
        var i,
            len = bodies.length,
            _this = this;

        if ( bodies.some( function ( v ) { return _this._isInCanvas( v ); }) ) {
            this.ctx.clearRect( 0, 0, this.width, this.height );
        }

        // for( i = 0; i < len; i++ ){
        //     this._clearBody( bodies[ i ] );
        // }

        for( i = 0; i < len; i++ ){
            this._drawBody( bodies[ i ] );
        }
    };

    CanvasRenderer.prototype._drawBody = function ( body ) {
        var position = this._getPosition( body ),
            x = Math.round( position.x ),
            y = Math.round( position.y );

        if ( !this._isInCanvas( body ) ) {
            return;
        }

        if ( body.type === "rectangle" ) {
            var width = body.width,
                height = body.height;

            this.ctx.save();
            this.ctx.rect( Math.round( x - width/2 ), Math.round( y - height/2 ), width, height );
            this.ctx.fillStyle = body.color;
            this.ctx.fill();
            this.ctx.restore();

        } else if ( body.type === "circle" ) {
            var radius = body.radius;

            // this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc( x, y, radius, 0, 2 * Math.PI, false );
            this.ctx.closePath();
            this.ctx.fillStyle = body.color;
            this.ctx.fill();

            // this.ctx.restore();
        }
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo( x, y );
        this.ctx.lineTo( body.topPosition.x, body.topPosition.y );
        this.ctx.closePath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "#000";
        this.ctx.stroke();
    };

    CanvasRenderer.prototype._clearBody = function ( body ) {

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

    CanvasRenderer.prototype._isInCanvas = function ( body ) {
        if ( body.type === "rectangle" ) {
            return this.width * 2 >= body.position.x + body.width/2 &&
                 this.height * 2 >= body.position.y + body.height/2;
        }

        if ( body.type === "circle" ) {
            return this.width * 2 >= body.position.x + body.radius/2 &&
                 this.height * 2 >= body.position.y + body.radius/2;
        }
    };

    CanvasRenderer.prototype._getPosition = function ( body ) {
            // return body.position;
        var x = Math.round( body.position.x ),
            y = Math.round( body.position.y ),
            horizontalDistance = body.radius || body.width/2,
            verticalDistance = body.radius || body.height/2;

        if ( body.velocity.x === 0 && body.velocity.y === 0 ) {
            return body.position;
        }

        // adjust position
        if (x + horizontalDistance > body.world.width ) {
            x = Math.floor( body.world.width - horizontalDistance );
        }

        if (x - (body.radius || body.width/2) < 0) {
            x = Math.ceil( horizontalDistance );
        }

        if (y + verticalDistance > body.world.height ) {
            y = ( body.world.height - verticalDistance );
        }

        // if (this.position.y - (verticalDistance) < 0 ) {
        //     console.log(1);
        //     this.position.y = ( verticalDistance );
        // }

        body.topPosition.set( x, y - ( verticalDistance ) );

        return {x: x, y: y};
    };


    Renderer = {
        canvas: function ( element ) {
            return new CanvasRenderer( element );
        }
    };

    Physics.Renderer = Renderer;

