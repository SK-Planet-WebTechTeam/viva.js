var world = new viva.world();
world.setRenderer( viva.renderer.canvas( "viva_demo" ) );

world.apply( viva.behavior.BoundaryCollision( {
	x: 0,
	y: 0,
	width: world.renderer.width,
	height: world.renderer.height,
	cor: 1
}));
world.apply( viva.behavior.Collision() );

var body,
	size = 16,
	width = window.innerWidth,
	height = window.innerHeight,
	len = width / ( size + 10 ),
	maxForce = 300;

var colors = ["red", "blue", "black", "magenta", "skyblue", "pink", "orange", "purple", "green", "yellow"];
for ( var i = 0; i < len; i++ ) {
	body = viva.body.create( "circle", {
		x: Math.random() * width,
		y: Math.random() * height,
		radius: size /2,
		mass: 1,
		color: "#ffc02c",
		cor: 1,
		angle: 45 * Math.PI/180 * i
	});

	world.add( body );

	if ("ontouchstart" in window) {
		maxForce = 30;
	}
	body.applyForce( viva.vector.create( Math.random() * maxForce - maxForce/2, Math.random() * maxForce - maxForce/2 ) );
}

world.start();