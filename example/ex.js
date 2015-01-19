var world = new Bouncy.World();
world.setRenderer( Bouncy.Renderer.canvas( "testdiv" ) );

world.apply( Bouncy.Behavior.ConstantAcceleration( 0, 9.8 ) );
world.apply( Bouncy.Behavior.BoundaryCollision( {
	x: 0,
	y: 0,
	width: world.renderer.width,
	height: world.renderer.height,
	cor: 1
}));
world.apply( Bouncy.Behavior.Collision() );

var body,
	size = 50;

// for ( var i = 0; i < 10; i++ ) {
// 	body = Bouncy.Body.create( "rectangle", {
// 		x: (size + 10) * (i % 10) + 330,
// 		y: (size + 10) * Math.floor(i / 10) + 100,
// 		width: size,
// 		height: size,
// 		mass: 3,
// 		color: "skyblue",
// 		cor: 0.9
// 	});

// 	world.add( body );
// 	body.applyForce( Bouncy.Vector.create( 100 * Math.random() + 300, - (100 * Math.random() + 200) ));
// }

var colors = ["red", "blue", "black", "magenta", "skyblue", "pink", "orange", "purple", "green", "yellow"];
for ( var i = 0; i < 30; i++ ) {
	body = Bouncy.Body.create( "circle", {
		x: (size + 10) * (i % 10) + 10,
		y: (size + 10) * Math.floor(i / 10) + 100,
		radius: size /2,
		mass: 1,
		color: "rgb(255," + (i * 20) + ", " + (i * 20) + ")",
		color: colors[i%10],
		cor: 0.6,
		// cof: 0.1,
		angle: 45 * Math.PI/180 * i
	});

	world.add( body );
	body.applyForce( Bouncy.Vector.create( 10 * Math.random() + 30, - (10 * Math.random() + 20) ));
}

setTimeout ( world.start(), 1000);
