
    var isDOMElement = function ( obj ) {
        return ( typeof obj === "object" ) && ( obj.nodeType === 1 ) &&
            ( typeof obj.style === "object" ) && ( typeof obj.ownerDocument ==="object" );
    };

    var CanvasRenderer = function ( element ) {
        if ( typeof inputbox === "string" ) {
            this.el = document.getElementById( element );
        } else if ( isDOMElement(inputbox) ) {
            this.el = element;
        }
        if ( element === undefined ) {
            this.el = document.createElement( "canvas" );
            this.el.style.width= "100%";
            this.el.style.height= "100%";

            document.body.appendChild( this.el );
        }

        this.ctx = this.el.getContext( "2d" );
    };

    CanvasRenderer.prototype.drawBody = function ( body ) {
        var x = body.position.x,
            y = body.position.y;

        if ( body.type === "rectangle" ) {
            var width = body.width,
                height = body.height;

            this.ctx.save();
            this.ctx.rect( x - width/2, y - height/2, width, height );
            this.ctx.fillStyle = "pink";
            this.ctx.fill();
            this.ctx.restore();

        } else if ( body.type === "circle" ) {
            var radius = body.radius;


            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc( x, y, radius, 0, 2 * Math.PI, false );
            this.ctx.fillStyle = "pink";
            this.ctx.fill();
            this.ctx.closePath();
            this.ctx.restore();
        }


    };


    Renderer = {
        canvas: function ( element ) {
            return new CanvasRenderer( element );
        }
    };

    Physics.Renderer = Renderer;

