var world = new Physics.World();
world.setRenderer( Physics.Renderer.canvas( "testdiv" ) );

world.apply( Physics.Behavior.ConstantAcceleration( 0, 9.8 ) );
world.apply( Physics.Behavior.Collision() );
world.apply( Physics.Behavior.BoundaryCollision( {
	x: 0,
	y: 0,
	width: world.renderer.width,
	height: world.renderer.height
}));

var body,
	size = 40;

// for ( var i = 0; i < 10; i++ ) {
// 	body = Physics.Body.create( "rectangle", {
// 		x: (size + 10) * (i % 10) + 330,
// 		y: (size + 10) * Math.floor(i / 10) + 100,
// 		width: size,
// 		height: size,
// 		mass: 3,
// 		color: "skyblue",
// 		cor: 0.9
// 	});

// 	world.add( body );
// 	body.applyForce( Physics.Vector.create( 100 * Math.random() + 300, - (100 * Math.random() + 200) ));
// }


for ( var i = 0; i < 10; i++ ) {
	body = Physics.Body.create( "circle", {
		x: (size + 10) * (i % 10) + 30,
		y: (size + 10) * Math.floor(i / 10) + 100,
		radius: size/2,
		mass: 1,
		// color: "rgb(255," + (i * 20) + ", " + (i * 20) + ")",
		color: "pink",
		cor: 0.9,
		angle: 45 * Math.PI/180 * i
	});

	world.add( body );
	// body.applyForce( Physics.Vector.create( 100 * Math.random() + 300, - (100 * Math.random() + 200) ));
}

setTimeout ( world.start(), 1000);
