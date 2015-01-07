var world = new Physics.World();
world.setRenderer( Physics.Renderer.canvas() );

world.apply( Physics.Behavior.ConstantAcceleration( 0, 9.8 ) );
world.apply( Physics.Behavior.BoundaryCollision( {
	x: 0,
	y: 0,
	width: world.renderer.width,
	height: world.renderer.height
}));

// world.apply( Physics.Behavior.ConstantAcceleration( 20, 0 ) );
var body;

for ( var i = 0; i < 100; i++ ) {
	body = Physics.Body.create( "rectangle", {
		x: 30 * (i % 10) + 300,
		y: 30 * Math.floor(i / 10) + 30,
		width: 20,
		height: 20,
		mass: 3,
		color: "red",
		cor: 1
	});

	world.add( body );
	body.applyForce( Physics.Vector.create( 100 * Math.random() + 300, - (100 * Math.random() + 200) ));
}


for ( var i = 0; i < 100; i++ ) {
	body = Physics.Body.create( "circle", {
		x: 20 * (i % 10) + 30,
		y: 20 * Math.floor(i / 10) + 30,
		radius: 10,
		mass: 1,
		color: "pink",
		cor: 0.9
	});

	world.add( body );
	body.applyForce( Physics.Vector.create( 1000 * Math.random() + 3000, - (1000 * Math.random() + 2000) ));
}

setTimeout ( world.start(), 100);
