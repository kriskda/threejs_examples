var container = document.getElementById("threejs_container");
var width = container.offsetWidth, height = container.offsetHeight;
				   
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
camera.position.x = 5;
camera.position.y = 8;
camera.position.z = 8;
camera.rotation.x = -0.4;
camera.rotation.y = 0.4;
camera.rotation.z = 0.17;

var controls = new THREE.FirstPersonControls(camera);
controls.movementSpeed = 25;
controls.lookSpeed = 0.25;

//var renderer = new THREE.CanvasRenderer({antialias: true, preserveDrawingBuffer: true});
var renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
renderer.setSize( width, height);

container.appendChild(renderer.domElement);
	
/* GRID */
var planeHorizontal = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 20, 20), new THREE.MeshPhongMaterial({color: "rgb(0, 0, 0)", wireframe: true}));
planeHorizontal.rotation.x = - Math.PI / 2;
scene.add(planeHorizontal);
		
/* Lights */
var ambientLight = new THREE.AmbientLight(0x606060);
scene.add( ambientLight );

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(10, 50, 50);
scene.add( directionalLight );

/* Phys initial values */
var L0 = 2.5, stretch = -1, dt = 0.001, k = 6, b = 0.1, m = 0.5;

var simpleSpringView = SimpleSpringView(0, 10, 0, L0, stretch, "rgb(255,0,0)"); 
var simpleSpringModel = SimpleSpringModel(simpleSpringView, 9.81, k, b, m, stretch, 0); 
simpleSpringView.addToScene(scene);

var currentTime = getTimeInSeconds();
var accumulator = 0;
var time = 0;
var clock = new THREE.Clock();

animate();

/* Rendering function */
function animate() {
	newTime = getTimeInSeconds();
	frameTime = newTime - currentTime;
        currentTime = newTime;

        accumulator += frameTime;

	while (accumulator >= dt) {
		simpleSpringModel.calculateTimeStep(dt);
		accumulator -= dt;
		time += dt;
	}
		
	document.getElementById('timer').innerHTML = "t = " + Math.round(time * 100) / 100 + " s ";
	simpleSpringModel.updateView();		
	//controls.update(clock.getDelta());								

	requestAnimationFrame(animate);	
	renderer.render(scene, camera);	
}

function getTimeInSeconds() {
	return new Date().getTime() / 1000;
}

/* Simple spring view which is just sphere and line with multiple vertices connected together  */
function SimpleSpringView(xp, yp, zp, L0, stretch, sphereColor) {
	var sphere, line, yAxis;
	var nodes = 3;
	var CUBE_SIZE = 0.5;
	init();

	function init() {
		var cubeGeometry = new THREE.CubeGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);	
		var cubeMaterial = new THREE.MeshPhongMaterial({ color: sphereColor });
						
		cube = new THREE.Mesh(cubeGeometry, cubeMaterial );

		var lineGeometry = new THREE.Geometry();
		var lineMaterial = new THREE.LineBasicMaterial({color: 0x000000, lineWidth: 1});

		lineGeometry.vertices.push(new THREE.Vector3(xp, yp, zp));
		lineGeometry.vertices.push(new THREE.Vector3(cube.position.x, cube.position.y + 0.5 * CUBE_SIZE, cube.position.z));

		line = new THREE.Line(lineGeometry, lineMaterial);

		var yAxisGeometry = new THREE.Geometry();
		yAxisGeometry.vertices.push(new THREE.Vector3(xp, yp - L0, zp));
		yAxisGeometry.vertices.push(new THREE.Vector3(xp, 0, zp));

		yAxis  = new THREE.Line(yAxisGeometry, new THREE.LineDashedMaterial({color: "rgb(0,150,0)", lineWidth: 2}));

		move(stretch);					
	};

	function addToScene(scene) {
		scene.add(cube);
		scene.add(line);
		scene.add(yAxis);
	};

	function move(stretch) {					
		cube.position.y = yp - L0 - stretch;

		line.geometry.vertices[1].y = cube.position.y + 0.5 * CUBE_SIZE;
		line.geometry.verticesNeedUpdate = true;
	};

	return {
		addToScene: addToScene,
		move: move,
	}
}

/* Simple spring model which contains equation of motion and simple Euler integration scheme. Model updates view more or less as in MVC */
function SimpleSpringModel(view, g, k, b, m, y, v) {				
	var y, v;
			
	function calculateTimeStep(dt) {
		y  = y + v*dt;
		v = v + (-k / m * y - b / m * v + g) * dt;	
	};

	function updateView() {
		view.move(y);
	};

	return {
		calculateTimeStep: calculateTimeStep,
		updateView: updateView,
	}
}
