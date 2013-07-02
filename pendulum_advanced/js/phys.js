var container = document.getElementById("threejs_container");
var width = container.offsetWidth;
var height = container.offsetHeight;
				   
var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
camera.position.y = 10;
camera.position.z = 25;

//var renderer = new THREE.CanvasRenderer();
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
var theta = Math.PI / 2, v = 0, L = 5, gamma = 0.1, dt = 0.001;

var pendulumViewA = PendulumView(L, -10, 7, 0, theta, "rgb(255,0,0)");
var pendulumModelA = PendulumModel(pendulumViewA, 9.81, L, theta, v, gamma);
pendulumViewA.addToScene(scene);

var pendulumViewB = PendulumView(L, 10, 7, 0, theta, "rgb(0,255,0)");
var pendulumModelB = PendulumModel(pendulumViewB, 1.57, L, theta, v, gamma);
pendulumViewB.addToScene(scene);

var currentTime = getTimeInSeconds();
var accumulator = 0;
var time = 0;
var clock = new THREE.Clock();

/* Here we define plots */
var plotModelDataA = new PlotModelData(30);
var plotModelDataB = new PlotModelData(30);

var plot = jQuery.plot("#placeholder", [], { 
		series: {shadowSize: 0},
		yaxis: {min: -2, max: 2}, 	
		colors: ['red', 'green'],	
});


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
		
	document.getElementById('timer').innerHTML = "t = " + Math.round(time * 100) / 100 + " s ";
	pendulumModelA.updateView();	
	pendulumModelB.updateView();	

	plotModelDataA.addDataPoint(time, pendulumModelA.getTheta());
	plotModelDataB.addDataPoint(time, pendulumModelB.getTheta());

	plot.setData([plotModelDataA.getData(), plotModelDataB.getData()]);
	plot.setupGrid()
	plot.draw();

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
	var theta, v, thetaNew, vNew;
			
	function calculateTimeStep(dt) {
		thetaNew  = theta + v*dt;
		vNew = v + (- g / L * Math.sin(theta)  - gamma * v) * dt;	

		theta = thetaNew;
		v = vNew;
	};

	function updateView() {
		view.move(theta);
	};

	function getTheta() {
		return theta;
	};

	return {
		calculateTimeStep: calculateTimeStep,
		updateView: updateView,
		getTheta: getTheta,
	}
}

/*  */
function PlotModelData(timePeriod) {
	var data = [];

	function addDataPoint(x, y) {
		if (data.length != 0) {
			isAboveTimePeriod = ((x - data[0][0]) > timePeriod);		

			if (isAboveTimePeriod) {data.shift();} 
		}
		
		data.push([x, y]);		
	};

	function getData() {
		return data;
	};

	return {
		getData: getData,
		addDataPoint: addDataPoint,
	}

}



