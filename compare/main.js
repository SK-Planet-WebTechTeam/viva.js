(function () {
    //
    // Basket of verlet constraints
    //
    Physics(function (world) {

        // bounds of the window
        var viewportBounds,
            edgeBounce,
            renderer;


        // create a renderer
        renderer = Physics.renderer('canvas', {
            el: 'viewport'
        });

        // add the renderer
        world.add(renderer);
        // render on each step
        world.on('step', function () {
            world.render();
        });

        viewportBounds = Physics.aabb(0, 0, renderer.width, renderer.height);

        // constrain objects to these bounds
        edgeBounce = Physics.behavior('edge-collision-detection', {
            aabb: viewportBounds,
            restitution: 1,
            cof: 0
        });

        // resize events
        window.addEventListener('resize', function () {

            // as of 0.7.0 the renderer will auto resize... so we just take the values from the renderer
            viewportBounds = Physics.aabb(0, 0, renderer.width, renderer.height);
            // update the boundaries
            edgeBounce.setAABB(viewportBounds);

        }, true);

        // falling boxes
        var bodies = [], body;

        for ( var i = 0, l = 100; i < l; ++i ) {
            body = Physics.body('circle', {
                x: 20 * (i % 10) + 30,
                y: 20 * Math.floor(i / 10) + 30,
                radius: 10,
                mass: i+1,
                // color: "pink",
                restitution: 0.9
            });

            body.applyForce( {x: 10 * Math.random() + 30,y: - (10 * Math.random() + 20) });
            bodies.push( body );
        }


        for ( var i = 0, l = 100; i < l; ++i ) {
            body = Physics.body('rectangle', {
                x: 20 * (i % 10) + 300,
                y: 20 * Math.floor(i / 10) + 30,
                width:20,
                height:20,
                mass: i+1,
                // color: "pink",
                restitution: 1
            });


            body.applyForce( {x: 1 * Math.random() + 3,y: - (1 * Math.random() + 2) });
            bodies.push( body );
        }

        world.add( bodies );

        // add things to the world
        world.add([
            Physics.behavior('interactive', { el: renderer.el }),
            Physics.behavior('constant-acceleration'),
            Physics.behavior('body-impulse-response'),
            Physics.behavior('body-collision-detection'),
            // Physics.behavior('sweep-prune'),
            edgeBounce
        ]);

        // subscribe to ticker to advance the simulation
        Physics.util.ticker.on(function( time ) {
            world.step( time );
        });
    });
})();

