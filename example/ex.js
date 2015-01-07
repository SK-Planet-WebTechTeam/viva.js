var world = new Physics.World();
world.setRenderer( Physics.Renderer.canvas() );

world.apply( Physics.Behavior.ConstantAcceleration( 0, 9.8 ) );
world.apply( Physics.Behavior.BoundaryCollision( {
	x: 0,
	y: -100,
	width: world.renderer.width,
	height: world.renderer.height + 100
}));

// world.apply( Physics.Behavior.ConstantAcceleration( 20, 0 ) );
var body;

// for ( var i = 0; i < 1; i++ ) {
// 	body = Physics.Body.create( "rectangle", {
// 		x: 30 * (i % 10) + 300,
// 		y: 30 * Math.floor(i / 10) + 30,
// 		width: 20,
// 		height: 20,
// 		mass: 3,
// 		color: "red"
// 	});

// 	world.add( body );
// }


for ( var i = 0; i < 10; i++ ) {
	body = Physics.Body.create( "circle", {
		x: 20 * (i % 10) + 30,
		y: 20 * Math.floor(i / 10) + 30,
		radius: 10,
		mass: i+1,
		color: "pink",
		cor: 0.8
	});

	world.add( body );

	// body.applyForce( Physics.Vector.create( 20, 0 ));
	// body.applyForce( Physics.Vector.create( 0, 9.8 ));

}

setTimeout ( world.start(), 100);
