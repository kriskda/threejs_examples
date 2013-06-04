var container = document.getElementById("container");
var width = container.offsetWidth;
var height = container.offsetHeight;
				   
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
camera.position.y = 10;
camera.position.z = 25;

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
var theta = Math.PI / 2, v = 0, L = 5, gamma = 0.01, dt = 0.001;

var cameraController = CameraController(camera, height, width);
var pendulumViewA = PendulumView(L, -10, 7, 0, theta, "rgb(255,0,0)");
var pendulumModelA = PendulumModel(pendulumViewA, 9.81, L, theta, v, gamma);
pendulumViewA.addToScene(scene);

var pendulumViewB = PendulumView(L, 10, 7, 0, theta, "rgb(0,255,0)");
var pendulumModelB = PendulumModel(pendulumViewB, 1.57, L, theta, v, gamma);
pendulumViewB.addToScene(scene);

var currentTime = getTimeInSeconds();
var accumulator = 0;
var time = 0;

animate();

/* Rendering function */
function animate() {
	newTime = getTimeInSeconds();
	frameTime = newTime - currentTime;
        currentTime = newTime;

        accumulator += frameTime;

	while (accumulator >= dt) {
		pendulumModelA.calculateTimeStep(dt);
		pendulumModelB.calculateTimeStep(dt);

		accumulator -= dt;
		time += dt;
	}
		
	document.getElementById('timer').innerHTML = "t = " + Math.round(time * 100) / 100 + " s";
	pendulumModelA.updateView();	
	pendulumModelB.updateView();									
	cameraController.updateState();	

	requestAnimationFrame(animate);	
	renderer.render(scene, camera);
}

function getTimeInSeconds() {
	return new Date().getTime() / 1000;
}

/* Pendulum view which is just sphere and line with two vertices connected together  */
function PendulumView(L, x, y, z, theta0, sphereColor) {
	var sphere, line, yAxis;
	init();

	function init() {
		var sphereGeometry = new THREE.SphereGeometry(0.4, 10, 10);
		var sphereMaterial = new THREE.MeshPhongMaterial({ color: sphereColor });
						
		sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );

		var lineGeometry = new THREE.Geometry();
		var lineMaterial = new THREE.LineBasicMaterial({color: 0x000000, lineWidth: 1});

		lineGeometry.vertices.push(new THREE.Vector3(x, y, z));
		lineGeometry.vertices.push(new THREE.Vector3(sphere.position.x, sphere.position.y, sphere.position.z));

		line = new THREE.Line(lineGeometry, lineMaterial);

		var axisGeometry = new THREE.Geometry();
		var axisMaterial = new THREE.LineDashedMaterial({color: "rgb(150,150,150)", lineWidth: 2});
		
		axisGeometry.vertices.push(new THREE.Vector3(x, y, z));
		axisGeometry.vertices.push(new THREE.Vector3(x, 0, z));

		yAxis  = new THREE.Line(axisGeometry, axisMaterial);

		move(theta0);					
	};

	function addToScene(scene) {
		scene.add(sphere);
		scene.add(line);
		scene.add(yAxis);
	};

	function move(theta) {					
		sphere.position.x = x + L*Math.sin(theta);
		sphere.position.y = y - L* Math.cos(theta);

		line.geometry.vertices[1].x = sphere.position.x;
		line.geometry.vertices[1].y = sphere.position.y;
		line.geometry.verticesNeedUpdate = true;
	};

	return {
		addToScene: addToScene,
		move: move,
	}
}

/* Pendulum model which contains equation of motion and simple Euler integration scheme. Model updates view more or less as in MVC */
function PendulumModel(view, g, L, theta, v, gamma) {				
	var theta, v;
			
	function calculateTimeStep(dt) {
		theta  = theta + v*dt;
		v = v + (- g / L * Math.sin(theta)  - gamma * v) * dt;	
	};

	function updateView() {
		view.move(theta);
	};

	return {
		calculateTimeStep: calculateTimeStep,
		updateView: updateView,
	}
}

/* Camera controller controls camera state i.e. rotations, motion and zoom */
function CameraController(camera, height, width) {
	var cameraAngleX, cameraAngleY;
	var isCameraRotating = false;
	var isUpKeyDown = false;
	var isDownKeyDown = false;
	var isLeftKeyDown = false;
	var isRightKeyDown = false;
	var isShiftKeyDown = false;
	var isCtrKeyDown = false;
	var ZOOM_FACTOR= 0.01;
	var MOVE_FACTOR = 0.25;
	init();

	function init() {
		document.addEventListener( 'mousemove', onMouseMove, false );
		document.addEventListener( 'mousedown', onMouseDown, false );
		document.addEventListener( 'mouseup', onMouseUp, false );
		document.addEventListener( 'keydown', onKeyDown, false );
		document.addEventListener( 'keyup', onKeyUp, false );
		document.addEventListener( 'mousewheel', onMouseWhell, false );
	};

	function onMouseMove( event ) {				
		cameraAngleX = cameraLimit((- 2 * event.clientY / height + 1) * Math.PI / 2);
		cameraAngleY = cameraLimit((- 2 * event.clientX / width + 1) * Math.PI / 2);
	};

	function cameraLimit(angle) {
		if (angle > Math.PI / 2) {
			return Math.PI / 2;
		} else if (angle < - Math.PI / 2) {
			return - Math.PI / 2;
		} else {
			return angle;
		}				
	};

	function onMouseDown( event ) {		
		isCameraRotating = true;
	}

	function onMouseUp( event ) {		
		isCameraRotating = false;
	}
			
	function onKeyDown( event ) {
		setKeysState(event, true);
	}

	function onKeyUp( event ) {
		setKeysState(event, false);
	}

	function setKeysState(event, booleanValue) {
		switch ( event.keyCode ) {
			case 16: isShiftKeyDown = booleanValue; break;
			case 17: isCtrKeyDown = booleanValue; break;
			case 37: isLeftKeyDown = booleanValue; break;
			case 38: isUpKeyDown = booleanValue; break;
			case 39: isRightKeyDown = booleanValue; break;
			case 40: isDownKeyDown = booleanValue; break;
		}
	}

	function onMouseWhell( event ) {
		console.log(event);
		camera.fov *= 1.1;
		camera.updateProjectionMatrix();
	}

	function updateState() {
		if (isCameraRotating) {
			camera.rotation.x = cameraAngleX;
			camera.rotation.y = cameraAngleY;
		}

		if (isUpKeyDown) {
			camera.position.x -= MOVE_FACTOR*Math.sin(camera.rotation.y);
			camera.position.z -= MOVE_FACTOR*Math.cos(camera.rotation.y);
		} else if (isDownKeyDown) {
			camera.position.x += MOVE_FACTOR*Math.sin(camera.rotation.y);
			camera.position.z += MOVE_FACTOR*Math.cos(camera.rotation.y);
		} else if (isLeftKeyDown) {
			camera.position.x -= MOVE_FACTOR*Math.cos(-camera.rotation.y);
			camera.position.z -= MOVE_FACTOR*Math.sin(-camera.rotation.y);
		} else if (isRightKeyDown) {
			camera.position.x += MOVE_FACTOR*Math.cos(-camera.rotation.y);
			camera.position.z += MOVE_FACTOR*Math.sin(-camera.rotation.y);
		} else if (isShiftKeyDown) {
			camera.position.y += MOVE_FACTOR;
		} else if (isCtrKeyDown) {
			camera.position.y -= MOVE_FACTOR;
		}	
	};

	return {
		updateState: updateState,
	}
}


