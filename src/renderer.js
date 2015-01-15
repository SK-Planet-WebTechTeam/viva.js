
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

        this.on( moveEvent, function (e) {
            e.preventDefault();
        });
    };

    CanvasRenderer.prototype.draw = function ( bodies ) {
        var i,
            len = bodies.length,
            _this = this;

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

    CanvasRenderer.prototype._drawBody = function ( body ) {
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
            return this.width  >= body.position.x + body.width/2 &&
                 this.height  >= body.position.y + body.height/2;
        }

        if ( body.type === "circle" ) {
            return this.width >= body.position.x + body.radius/2 &&
                 this.height >= body.position.y + body.radius/2;
        }
    };

    CanvasRenderer.prototype.on = function ( event, callback ) {
        this.el.addEventListener( event, callback );
    };

    CanvasRenderer.prototype.off = function ( event, functionName ) {
        this.el.removeEventListener( event, functionName );
    };

    var Renderer = {
        canvas: function ( element ) {
            return new CanvasRenderer( element );
        }
    };

    Physics.Renderer = Renderer;

