var container = document.getElementById("threejs_container");
var width = container.offsetWidth, height = container.offsetHeight;
				   
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
camera.position.x = 60;
camera.position.y = 5;
camera.position.z = 60;
camera.rotation.x = -0.3;
camera.rotation.y = 0.7;
camera.rotation.z = 0.15;

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
var L0 = 2.5, dt = 0.001, b = 0.1;

var springModelArray = [];

/* Initalizing models and views */
for (var i = -10 ; i <= 10 ; i++) {
	for (var j = -10 ; j <= 10 ; j++) {		
		var stretch = -Math.floor((Math.random()*2) + 1);
		var m = Math.floor((Math.random()*2) + 1);
		var k = Math.floor((Math.random()*10) + 2);
		
		var simpleSpringView = SimpleSpringView(i*5, 10, j*5, L0, stretch, "rgb(255,0,0)"); 
		springModelArray.push(SimpleSpringModel(simpleSpringView, 9.81, k, b, m, stretch, 0));
		simpleSpringView.addToScene(scene);
	}
}

var currentTime = getTimeInSeconds();
var accumulator = 0;
var time = 0;
var clock = new THREE.Clock();

animate();

/* Rendering function */
var modelArrayLength = springModelArray.length;

function animate() {
	newTime = getTimeInSeconds();
	frameTime = newTime - currentTime;
        currentTime = newTime;

        accumulator += frameTime;

	while (accumulator >= dt) {
		for (var i = 0 ; i < modelArrayLength ; i++) {	
			springModelArray[i].calculateTimeStep(dt);
		}
		accumulator -= dt;
		time += dt;
	}
		
	document.getElementById('timer').innerHTML = "t = " + Math.round(time * 100) / 100 + " s ";
	for (var i = 0 ; i < modelArrayLength ; i++) {	
		springModelArray[i].updateView();	
	}	
	//controls.update(clock.getDelta());								

	requestAnimationFrame(animate);	
	renderer.render(scene, camera);	
}

function getTimeInSeconds() {
	return new Date().getTime() / 1000;
}

/* Simple spring view which is just sphere and line with multiple vertices connected together  */
function SimpleSpringView(xp, yp, zp, L0, stretch, sphereColor) {
	var cube, line, yAxis;
	var nodes = 15;
	var CUBE_SIZE = 0.5, DELTA_X = 0.25;
	init();

	function init() {
		var cubeGeometry = new THREE.CubeGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);	
		var cubeMaterial = new THREE.MeshPhongMaterial({ color: sphereColor });
						
		cube = new THREE.Mesh(cubeGeometry, cubeMaterial );
		cube.position.x = xp;
		cube.position.z = zp;

		var lineGeometry = new THREE.Geometry();
		var lineMaterial = new THREE.LineBasicMaterial({color: 0x000000, lineWidth: 1});

		var deltaY2 = (cube.position.y + 0.5 * CUBE_SIZE - yp) / (nodes + 1) * 0.5;
		lineGeometry.vertices.push(new THREE.Vector3(xp, yp, zp));

		var sign = 1, mult = 1;
		for (var i = 1 ; i < (nodes + 1) ; i++) {	
			lineGeometry.vertices.push(new THREE.Vector3(xp + sign * DELTA_X , yp + mult * deltaY2, zp));
			sign *= -1;
			mult += 2;
		}
		lineGeometry.vertices.push(new THREE.Vector3(xp, yp + (mult - 1) * deltaY2, zp));

		line = new THREE.Line(lineGeometry, lineMaterial);

		var yAxisGeometry = new THREE.Geometry();
		yAxisGeometry.vertices.push(new THREE.Vector3(xp, yp, zp));
		yAxisGeometry.vertices.push(new THREE.Vector3(xp, 0, zp));

		yAxis  = new THREE.Line(yAxisGeometry, new THREE.LineDashedMaterial({color: "rgb(100,250,100)", lineWidth: 0.5}));

		move(stretch);					
	};

	function addToScene(scene) {
		scene.add(cube);
		scene.add(line);
		scene.add(yAxis);
	};

	function move(stretch) {				
		cube.position.y = yp - L0 - stretch;

		var deltaY2 = (cube.position.y + 0.5 * CUBE_SIZE - yp)/(nodes + 1)*0.5;

		var index = 1, mult = 1;
		for (var i = 1 ; i <= (nodes + 1) ; i++) {
			line.geometry.vertices[index].y = yp + mult * deltaY2;
			mult += 2;
			index++;
		}
		line.geometry.vertices[nodes + 1].y = yp + (mult - 1) * deltaY2;

		line.geometry.verticesNeedUpdate = true;
	};

	return {
		addToScene: addToScene,
		move: move,
	}
}

/* Simple spring model which contains equation of motion and simple Euler integration scheme. Model updates view more or less as in MVC */
function SimpleSpringModel(view, g, k, b, m, y, v) {				
	var y, v, yNew, vNew;
			
	function calculateTimeStep(dt) {
		yNew  = y + v*dt;
		vNew = v + (-k / m * y - b / m * v + g) * dt;	

		y = yNew;
		v = vNew;
	};

	function updateView() {
		view.move(y);
	};

	return {
		calculateTimeStep: calculateTimeStep,
		updateView: updateView,
	}
}

