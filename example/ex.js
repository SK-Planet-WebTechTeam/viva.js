var world = new viva.world();
world.setRenderer( viva.renderer.canvas( "testdiv" ) );

world.apply( viva.behavior.ConstantAcceleration( 0, 9.8 ) );
world.apply( viva.behavior.BoundaryCollision( {
    x: 0,
    y: 0,
    width: world.renderer.width,
    height: world.renderer.height,
    cor: 1
}));
world.apply( viva.behavior.Collision() );

var body,
    size = 50;

var colors = ["red", "blue", "gray", "magenta", "skyblue", "pink", "orange", "purple", "green", "yellow"];
for ( var i = 0; i < 10; i++ ) {
    body = viva.body.create( "circle", {
        x: (size + 20) * (i % 10) + 50,
        y: (size + 10) * Math.floor(i / 10) + 100,
        radius: size /2,
        // width:size,
        // height:size,
        mass: 1,
        color: "rgb(255," + (i * 20) + ", " + (i * 20) + ")",
        color: colors[i%10],
        cor: 0.8,
        // cof: 0.1,
        angle: 360* Math.random() * Math.PI/180
    });

    world.add( body );
    body.applyForce( viva.vector.create( 10 * Math.random() + 30, - (10 * Math.random() + 20) ));
}

setTimeout ( world.start(), 1000);

