//	Copyright (C) 2019 ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE, Switzerland
//
//		Multimedia Signal Processing Group (MMSPG)
//
//		This program is free software: you can redistribute it and/or modify
//		it under the terms of the GNU General Public License as published by
//		the Free Software Foundation, either version 3 of the License, or
//		(at your option) any later version.
//
//		This program is distributed in the hope that it will be useful,
//		but WITHOUT ANY WARRANTY; without even the implied warranty of
//		MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//		GNU General Public License for more details.
//
//		You should have received a copy of the GNU General Public License
//		along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// 	Author: Evangelos Alexiou
// 	Email: evangelos.alexiou@epfl.ch


// ===============================================================
// VARIABLES
// ===============================================================

var CONFIG = './config/config002.json';
var models = [];
var modelIndex = 0;
var randView = true;
// var submitted = false;
var btnIDs = [ 'btnLeft', 'btnMid', 'btnRight' ];
var btnFormNames = ["entry.590586709", "entry.458448786", "entry.1771053463"];
// var btnFormNames = ["entry.458448786", "entry.458448786", "entry.458448786"];
var storeBtn = new Array(btnFormNames.length);
var currentTab = 0; // Current tab is set to be the first tab (0)
var numTabs = 1 + btnFormNames.length;


// ===============================================================
// FUNCTIONS
// ===============================================================

function animate( ){
	request = requestAnimationFrame( animate );

	if ( showStats ){
		stats.update( );
	}

	if ( camZoomLimit ){
		if ( camera.zoom >= camZoomMax ){
			camera.zoom = camZoomMax;
		}
		else if ( camera.zoom <= camZoomMin ){
			camera.zoom = camZoomMin;
		}
	}

	controls.update( );

	rendererRef.render( sceneRef, camera );
	rendererDist.render( sceneDist, camera );
}


function initializeScene( ){
	// Choose side of reference content
	if ( models[modelIndex].reference.side == 'L' ){
		canvasRef = document.getElementById( 'canvasA' );
		canvasDist = document.getElementById( 'canvasB' );
		textRef = document.getElementById( 'textA' );
		textDist = document.getElementById( 'textB' );
	}
	else{
		canvasRef = document.getElementById( 'canvasB' );
		canvasDist = document.getElementById( 'canvasA' );
		textRef = document.getElementById( 'textB' );
		textDist = document.getElementById( 'textA' );
	}
	canvasExit = document.getElementById( 'canvasC' );

	// Set size of canvas
	canvasRef.width = rendererWidth;
	canvasRef.height = rendererHeight;
	canvasDist.width = rendererWidth;
	canvasDist.height = rendererHeight;

	// Set annotations
	textRef.width = rendererWidth;
	textRef.height = 30;
	var ctxRef = textRef.getContext( "2d" );
	ctxRef.font = "25px Arial";
	ctxRef.textAlign = "center";
	ctxRef.margin = "auto";
	ctxRef.fillText( "A", rendererWidth / 2, 30 );

	textDist.width = rendererWidth;
	textDist.height = 30;
	var ctxDist = textDist.getContext( "2d" );
	ctxDist.font = "25px Arial";
	ctxDist.textAlign = "center";
	ctxDist.margin = "auto";
	ctxDist.fillText( "B", rendererWidth / 2, 30 );

	// Set text for the end of the session
	canvasExit.width = window.innerWidth;
	canvasExit.height = window.innerHeight;
	var ctxExit = canvasExit.getContext( "2d" );
	ctxExit.font = "25px Arial";
	ctxExit.textAlign = "center";
	ctxExit.fillText( "The session is finished. Thank you for your participation!", canvasExit.width / 2, canvasExit.height / 4 );

	// Set camera
	camera = new THREE.OrthographicCamera( cameraLeft, cameraRight, cameraTop, cameraBottom, cameraNear, cameraFar );

	// Set controls
	controls = new THREE.OrthographicTrackballControls( camera );
	setControls( );

	// Initialize scenes
	sceneRef = new THREE.Scene( );
	sceneRef.background = new THREE.Color( Number( sceneColor ) );
	sceneDist = new THREE.Scene( );
	sceneDist.background = new THREE.Color( Number( sceneColor ) );

	// Initialize renderers
	rendererRef = new THREE.WebGLRenderer( {
		preserveDrawingBuffer: false, // set true to take snapshots
		canvas: canvasRef,
		antialias: false
	} );
	rendererDist = new THREE.WebGLRenderer( {
		preserveDrawingBuffer: false,	// set true to take snapshots
		canvas: canvasDist,
		antialias: false
	} );
	rendererRef.setPixelRatio( 1 ); //window.devicePixelRatio
	rendererDist.setPixelRatio( 1 ); //window.devicePixelRatio

	// Add window event listeners
	window.addEventListener( 'keypress', onKeyPress );

	// Initialize stats, if user chooses to display
	if ( showStats ){
		stats = new Stats( );
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.zIndex = 100;
		container.appendChild( stats.domElement );
	}

	// Set model-related variables
	setModels( );

	request = requestAnimationFrame( animate );
}


function setControls( ){
	controls = new THREE.OrthographicTrackballControls( camera );
	controls.rotateSpeed = controlsRotateSpeed;
	controls.zoomSpeed = controlsZoomSpeed;
	controls.panSpeed = controlsPanSpeed;
	controls.noPan = controlsNoPan;
	controls.staticMoving = controlsStaticMoving;
	controls.dynamicDampingFactor = controlsDynamicDampingFactor;
}


function setModels( ){
	// Disable submit button
	// document.getElementById( 'button' ).disabled = true;

	fileNameRef = models[ modelIndex ].reference.name;
	isVoxelizedRef = models[ modelIndex ].reference.voxelized;
	geomResolutionRef = models[ modelIndex ].reference.geomResolution;	// For irregular point clouds, a regular grid approximation can be used to set the geomResolutionRef parameter
	splatScalingFactorRef = models[ modelIndex ].reference.splatScalingFactor;
  pixelsPerPointRef = splatScalingFactorRef * rendererWidth * ( 1 / geomResolutionRef );
	splatTypeRef = models[ modelIndex ].reference.splatType;
	pointSizeRef = models[ modelIndex ].reference.pointSize; 						// For fixed splat type, either a number, or a file name can be given. For adaptive splat type, a file name should be given
	sideRef = models[ modelIndex ].reference.side;

  fileNameDist = models[ modelIndex ].distorted.name;
  isVoxelizedDist = models[ modelIndex ].distorted.voxelized;
  geomResolutionDist = models[ modelIndex ].distorted.geomResolution;		// For irregular point clouds, a regular grid approximation can be used to set the geomResolutionDist parameter
  splatScalingFactorDist = models[ modelIndex ].distorted.splatScalingFactor;
  pixelsPerPointDist = splatScalingFactorDist * rendererWidth * ( 1 / geomResolutionDist );
	splatTypeDist = models[ modelIndex ].distorted.splatType;
	pointSizeDist = models[ modelIndex ].distorted.pointSize; 						// For fixed splat type, either a number, or a file name can be given. For adaptive splat type, a file name should be given
	sideDist = models[ modelIndex ].distorted.side;

	if ( splatTypeRef != splatTypeDist ){
		getRenderingModeErrorMessage( );
	}
	else{
		splatType = splatTypeRef;
	}

	if ( typeof(pointSizeRef) === "number" &&  typeof(pointSizeDist) === "number" ){
		sizePerPointRef = pointSizeRef;
		sizePerPointDist = pointSizeDist;

		renderModels( );
	}
	else if ( typeof(pointSizeRef) === "string" &&  typeof(pointSizeDist) === "string" ){
	  readJSON( pathToAssets+pathToMetadata+pointSizeRef, function( text ){
		  sizePerPointRef = JSON.parse( text );

	    readJSON( pathToAssets+pathToMetadata+pointSizeDist, function( text ){
	    	sizePerPointDist = JSON.parse( text );

		    renderModels( );
	    });
		});
	}
}


function renderModels( ){
	controls.reset( );

	// Initializations
	previousCameraZoom = -1;
	if ( logInteractionData ){
		timestamps = [];
		logInteractions = [];
	}
	var date = Date.now( );

	// Remove models from scenes
	if ( modelIndex > 0 ){
    sceneRef.remove( pointcloudRef );
    sceneDist.remove( pointcloudDist );

    pointcloudRef = [ ];
    pointcloudDist = [ ];
	}

	// Prepare shader material
	if ( splatType == 'adaptive' ){
			var shaderMaterial = new THREE.ShaderMaterial( {
				vertexShader: document.getElementById( 'vertexshader' ).textContent,
				fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
				vertexColors: true
		} );
	}

	// Load models, start with the reference
	if ( fileNameRef.endsWith( 'pcd' ) ){
		var loaderRef = new THREE.PCDLoader( );
	}
	else{
		var loaderRef = new THREE.PLYLoader( );
	}

	loaderRef.load( pathToAssets+pathToModels+fileNameRef, function ( content ) {
		// Load reference point cloud
		pointcloudRef = loadPointCloud( fileNameRef, splatType, pixelsPerPointRef, shaderMaterial, content );

		if ( fileNameDist.endsWith( 'pcd' ) ){
			var loaderDist = new THREE.PCDLoader( );
		}
		else{
			var loaderDist = new THREE.PLYLoader( );
		}

		loaderDist.load( pathToAssets+pathToModels+fileNameDist, function ( content ) {
			// Load distorted model inside callback function
			pointcloudDist = loadPointCloud( fileNameDist, splatType, pixelsPerPointDist, shaderMaterial, content );

			// Add models in the scenes
			sceneRef.add( pointcloudRef );
			sceneDist.add( pointcloudDist );

			// Scale models
			updateModelsScaling( );

			// Update camera parameters
			initializeCameraParameters( randView );

			// Add controls event listener
			controls.addEventListener( 'change', onPositionChange );

			console.log( 'Loading time: ' + (Date.now( ) - date)/1000 + ' sec' );
		} );
	} );
}


function updateModelsScaling( ){
	var frustumRange = camera.right - camera.left;

	if ( isVoxelizedRef ){
		var contentMaxRangeRef = geomResolutionRef;
	}
	else{
		pointcloudRef.geometry.computeBoundingBox( );
		var dimensionX = pointcloudRef.geometry.boundingBox.max.x - pointcloudRef.geometry.boundingBox.min.x;
		var dimensionY = pointcloudRef.geometry.boundingBox.max.y - pointcloudRef.geometry.boundingBox.min.y;
		var dimensionZ = pointcloudRef.geometry.boundingBox.max.z - pointcloudRef.geometry.boundingBox.min.z;
		var contentMaxRangeRef = Math.max( dimensionX, dimensionY, dimensionZ );	// = max dimension of the min bounding box
	}

	if ( isVoxelizedDist ){
		var contentMaxRangeDist = geomResolutionDist;
	}
	else{
		pointcloudDist.geometry.computeBoundingBox( );
		var dimensionX = pointcloudDist.geometry.boundingBox.max.x - pointcloudDist.geometry.boundingBox.min.x;
		var dimensionY = pointcloudDist.geometry.boundingBox.max.y - pointcloudDist.geometry.boundingBox.min.y;
		var dimensionZ = pointcloudDist.geometry.boundingBox.max.z - pointcloudDist.geometry.boundingBox.min.z;
		var contentMaxRangeDist = Math.max( dimensionX, dimensionY, dimensionZ );	// = max dimension of the min bounding box
	}

	pointcloudRef.geometry.scale( frustumRange / contentMaxRangeRef, frustumRange / contentMaxRangeRef, frustumRange / contentMaxRangeRef );
	pointcloudDist.geometry.scale( frustumRange / contentMaxRangeDist, frustumRange / contentMaxRangeDist, frustumRange / contentMaxRangeDist );
	pointcloudRef.geometry.center( );
	pointcloudDist.geometry.center( );

	pointcloudRef.geometry.computeBoundingBox( );
	pointcloudRef.geometry.computeBoundingSphere( );

	pointcloudRef.geometry.attributes.position.needsUpdate = true;
	pointcloudDist.geometry.attributes.position.needsUpdate = true;
}


function initializeCameraParameters( randomize ){
	var theta;
	var phi;
	if ( randomize ){
		theta = Math.random( ) * Math.PI; 	// \theta \in [0, \pi] - inclination
		phi = Math.random( ) * 2 * Math.PI; // \phi \in [0, 2 \pi] - azimuth
	}
	else{
		theta = 0;
		phi = 0;
	}

	pointcloudRef.geometry.computeBoundingSphere( );
	var radius = 2 * pointcloudRef.geometry.boundingSphere.radius;

	var x = radius * Math.sin( theta ) * Math.cos( phi );
	var y = radius * Math.sin( theta ) * Math.sin( phi );
	var z = radius * Math.cos( theta );

	camera.zoom = cameraZoom;
	camera.position.set( x, y, z );
	camera.lookAt( pointcloudRef.geometry.boundingSphere.center.x, pointcloudRef.geometry.boundingSphere.center.y, pointcloudRef.geometry.boundingSphere.center.z );
	camera.near = cameraNear;
	camera.far = cameraFar;

	camera.updateProjectionMatrix( );
	onPositionChange( );
}


function onPositionChange ( ev ) {
	// Adjust size of splats
	if ( previousCameraZoom != camera.zoom ){
		if ( splatType == 'adaptive' ){
			var splatsizeRef = pointcloudRef.geometry.attributes.size.array;
			if ( sizePerPointRef.length != splatsizeRef.length ){
				getNumberPointsErrorMessage( );
			}
			for ( var i = 0; i < splatsizeRef.length; i++ ){
				splatsizeRef[ i ] = camera.zoom * pixelsPerPointRef * sizePerPointRef[i];
			}

			var splatsizeDist = pointcloudDist.geometry.attributes.size.array;
			if ( sizePerPointDist.length != splatsizeDist.length ){
				getNumberPointsErrorMessage( );
			}
			for ( var i = 0; i < splatsizeDist.length; i++ ){
				splatsizeDist[ i ] = camera.zoom * pixelsPerPointDist * sizePerPointDist[i];
			}

			pointcloudRef.geometry.attributes.size.needsUpdate = true;
			pointcloudDist.geometry.attributes.size.needsUpdate = true;
		}
		else{
			pointcloudRef.material.size = camera.zoom * pixelsPerPointRef * sizePerPointRef;
			pointcloudDist.material.size = camera.zoom * pixelsPerPointDist * sizePerPointDist;

			pointcloudRef.material.needsUpdate = true;
			pointcloudDist.material.needsUpdate = true;
		}
	}

	// Store new camera positions with corresponding timestamps, after the models are rendered to obtain correct camera parameters
	if ( logInteractionData ){
		requestAnimationFrame( updateLogInteractionData );
	}
}


function updateLogInteractionData( ){
 var cam = {
		left: camera.left,
		right: camera.right,
		bottom: camera.bottom,
		top: camera.top,
		near: camera.near,
		far: camera.far,
		up: camera.up.toArray( ),
		zoom: camera.zoom,
		matrix: camera.matrix.toArray( )
	};
	timestamps.push( Date.now( ) );
	logInteractions.push( cam );
	previousCameraZoom = camera.zoom;
}


function onKeyPress( e ) {
	if ( e.code == "KeyR" ){
		controls.reset( );
		initializeCameraParameters( randView );
	}

	// if ( e.code == "KeyS" ){
	// 	takeScreenshot( canvasRef, 'snapshotRef', canvasDist, 'snapshotDist' );
	// }

	if ( e.code == "KeyH"){
		setControls( );
		initializeCameraParameters( randView );
		controls.addEventListener( 'change', onPositionChange );
	}
}


function onSelecting( n ){
	
	for ( var i = 0; i < btnIDs.length; i++ ){
		document.getElementById( btnIDs[i] ).name = btnFormNames[n];
	}
	
}

function onRating( n ){
	//ultima tentativa: tentar criar tres botoes identicos aos que existiam antes (pra cada tab) e remover os existentes
	for ( var i = 0; i < btnIDs.length; i++ ){
		if ( document.getElementById( btnIDs[ i ] ).checked ) {
			score = document.getElementById( btnIDs[ i ] ).value;
			document.getElementById( btnIDs[ i ] ).checked = false;
			//storeBtn[n] = document.getElementById( btnIDs[ i ] );
			

		}
		// if (n+1 == btnFormNames.length) document.getElementById( btnIDs[i] ).name = "butao";
	}
	//create new div for the new buttons
	var newDiv = document.createElement("div");
	newDiv.id = "Field_" + n.toString();
	var form = document.getElementById("Gform");
	form.appendChild(newDiv);

	var values = [-1, 0, 1];
	for ( var i = 0; i < btnIDs.length; i++ ){
		var btn = document.createElement("input");
		btn.name = btnFormNames[n];
		btn.value = values[i];
		btn.type = "radio";
		if (values[i] == score) btn.checked = true;
		else btn.checked = false;
		btn.hidden = true;

		// var label = document.createElement('label');
		// label.htmlFor = 'q'+ i.toString();
		// var description = document.createTextNode(btnIDs[i]);
		// label.appendChild(description);

		newDiv.appendChild(btn);
		// newDiv.appendChild(label)
	}

	

	if ( logInteractionData ){
		updateLogInteractionData( );
	}

	if ( logScores ){
		storeRecordings( );
	}

	modelIndex++;

	updateProgressBar( modelIndex, modelNum );

	if (modelIndex < modelNum){
		controls.removeEventListener( 'change', onPositionChange );
		setModels( );
	}
	else{
		controls.removeEventListener( 'change', onPositionChange );
		closeSession( );
	}
}


function updateProgressBar( cur, len ){
	var elem = document.getElementById("bar");
	elem.style.width = ( cur / len ) * 100 + '%';
}


function storeRecordings( ){
	var xhr = new XMLHttpRequest( );
  xhr.open( "POST", 'https://tomasborges.github.io/php/storeData.php', true );
  xhr.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );

 	// Constructor for object
  function dataObject( ts, cam ){
  	this.timestamp = ts;
  	this.camera = cam;
  }

	// Information at each time instance
	var recInteractivity = [ ];
	if ( logInteractionData ){
		for ( var i = 0; i < timestamps.length; i++ ){
			var res = new dataObject( timestamps[ i ], logInteractions[ i ] );
			recInteractivity.push( res );
		}
	}

	// Store data in JSON format
	var obj = {
		user_id: CONFIG,
   	stimuli_id: modelIndex,
   	user_score: score,
   	reference: {name:fileNameRef, voxelized:isVoxelizedRef, geomResolution:geomResolutionRef, splatScalingFactor:splatScalingFactorRef.toFixed(3), splatType:splatType, pointSize:pointSizeRef, side:sideRef},
   	distorted: {name:fileNameDist, voxelized:isVoxelizedDist, geomResolution:geomResolutionDist, splatScalingFactor:splatScalingFactorDist.toFixed(3), splatType:splatType, pointSize:pointSizeDist, side:sideDist},
		camera: {left:camera.left, right:camera.right, bottom:camera.bottom, top:camera.top, near:camera.near, far:camera.far},
		scene_background: sceneColor,
   	user_interactivity: recInteractivity,
   	renderer: {width:rendererWidth, height:rendererHeight}
	};
	jsonData = JSON.stringify( obj, null, "\t" );

	console.log( "Uploading data..." );
	xhr.send( jsonData );
}


function closeSession( ){
	sceneRef.remove( pointcloudRef );
	sceneDist.remove( pointcloudDist );

	var ctxRef = textRef.getContext( "2d" );
	ctxRef.clearRect(0, 0, textRef.width, textRef.height)

	var ctxDist = textDist.getContext( "2d" );
	ctxDist.clearRect(0, 0, textDist.width, textDist.height)

	rendererRef.clear( );
	rendererDist.clear( );

	canvasRef.style.display = "none";
	canvasDist.style.display = "none";
	document.getElementById( "menu" ).style.display = "none";
	canvasExit.style.display = "block";

	// var btns = document.getElementById("buttons");
	// btns.removeChild(btns.childNodes[1]);
	// btns.removeChild(btns.childNodes[3]);
	// btns.removeChild(btns.childNodes[5]);


}

function loadRenderer( ) {
	if ( THREE.REVISION == '110' ){
		if ( THREE.WEBGL.isWebGLAvailable( ) === false ){
			document.body.appendChild( THREE.WEBGL.getWebGLErrorMessage( ) );
		}
	}
	else if ( THREE.REVISION == '97' ){
		if ( WEBGL.isWebGLAvailable( ) === false ){
			document.body.appendChild( WEBGL.getWebGLErrorMessage( ) );
		}
	}

	readJSON( CONFIG, function( text ){
		config = JSON.parse( text );

		pathToAssets = config.path.assets;
		pathToModels = config.path.models;
		pathToMetadata = config.path.metadata;

		sceneColor = config.sceneColor;

		// rendererWidth = config.renderer.width;
		// rendererHeight = config.renderer.height;
		//var L = Math.min(document.documentElement.clientWidth/2, document.documentElement.clientHeight - 200);
		var L = Math.min((window.innerWidth-5)/2, window.innerHeight - 200);
		rendererWidth = L;
		rendererHeight = L;
		aspectRatio = rendererWidth / rendererHeight;

		cameraLeft = config.camera.left;
		cameraRight = config.camera.right;
		cameraTop = config.camera.top;
		cameraBottom = config.camera.bottom;
		cameraNear = config.camera.near;
		cameraFar = config.camera.far;
		cameraZoom = config.camera.zoom;

		camZoomLimit = config.camZoom.limit;
		camZoomMin = config.camZoom.min;
		camZoomMax = config.camZoom.max;

		controlsRotateSpeed = config.controls.rotateSpeed;
		controlsZoomSpeed = config.controls.zoomSpeed;
		controlsPanSpeed = config.controls.panSpeed;
		controlsNoPan = config.controls.noPan;
		controlsStaticMoving = config.controls.staticMoving;
		controlsDynamicDampingFactor = config.controls.dynamicDampingFactor;

		showStats = true; //config.io.showStats;
		logInteractionData = config.io.logInteractionData; // Note that the software doesn't handle excessive recordings of interactivity information
		logScores = config.io.logScores;

		if ( typeof( config.models.length ) === 'undefined' ){
			modelNum = 1;
			models[modelIndex] = config.models;
		}
		else{
			modelNum = config.models.length;
			models = config.models;
		}

		if ( aspectRatio == 1){
			initializeScene( );
		}
		else{
			getAspectRatioErrorMessage( );
		}
	});
}

function showTab(n) {
	// This function will display the specified tab of the form...
	var x = document.getElementsByClassName("tab");
	if (n <= 1){
		x[n].style.display = "block";
	}
	else {
		x[1].style.display = "block";
	}
	//... and fix the Previous/Next buttons:
	// if (n == 0) {
	// 	document.getElementById("prevBtn").style.display = "none";
	// } else {
	// 	document.getElementById("prevBtn").style.display = "inline";
	// }
	if (n == (numTabs - 1)) {
		document.getElementById("nextBtn").innerHTML = "Submit";
	} else {
		document.getElementById("nextBtn").innerHTML = "Next";
	}
	//... and run a function that will display the correct step indicator:
	// fixStepIndicator(n)

	if (currentTab == 1){ 
		loadRenderer( );
	}
}

function nextPrev(n) {
	// This function will figure out which tab to display
	var x = document.getElementsByClassName("tab");
	// Exit the function if any field in the current tab is invalid:
	if (currentTab == 0) {
		if (!validateForm()) {
			return false;
		}
	
		// Hide the current tab:
		x[currentTab].style.display = "none";
	}
	if (currentTab >= 1){
		var currentField = currentTab - 1; //discard the form tab 
		onRating(currentField);
	}
	// Increase or decrease the current tab by 1:
	currentTab = currentTab + n;
	// if you have reached the end of the form...
	if (currentTab >= numTabs) { //x.length
		// ... the form gets submitted:
		document.getElementById("Gform").submit();
		return false;
	}
	// Otherwise, display the correct tab:
	showTab(currentTab);

}

function validateForm() {
	// This function deals with validation of the form fields
	var x, y, i, valid = true;
	x = document.getElementsByClassName("tab");
	y = x[currentTab].getElementsByTagName("input");
	// A loop that checks every input field in the current tab:
	for (i = 0; i < y.length; i++) {
		// If a field is empty...
		if (y[i].value == "") {
			// add an "invalid" class to the field:
			y[i].className += " invalid";
			// and set the current valid status to false
			valid = false;
		}
	}
	// If the valid status is true, mark the step as finished and valid:
	// if (valid) {
	// 	document.getElementsByClassName("step")[currentTab].className += " finish";
	// }
	return valid; // return the valid status
}

function fixStepIndicator(n) {
	// This function removes the "active" class of all steps...
	var i, x = document.getElementsByClassName("step");
	for (i = 0; i < x.length; i++) {
		x[i].className = x[i].className.replace(" active", "");
	}
	//... and adds the "active" class on the current step:
	x[n].className += " active";
}

function onWindowResize ( ){
	var L = Math.min((window.innerWidth-5)/2, window.innerHeight - 200);
	rendererWidth = L;
	rendererHeight = L;
	canvasRef.width = rendererWidth;
	canvasRef.height = rendererHeight;
	canvasDist.width = rendererWidth;
	canvasDist.height = rendererHeight;
	pixelsPerPointRef = splatScalingFactorRef * rendererWidth * ( 1 / geomResolutionRef );
	pixelsPerPointDist = splatScalingFactorDist * rendererWidth * ( 1 / geomResolutionDist );

			  // Set annotations
	// textRef = document.getElementById( 'textA' );
	// textDist = document.getElementById( 'textB' );
	textRef.width = rendererWidth;
	// textRef.height = 30;
	var ctxRef = textRef.getContext( "2d" );
	ctxRef.font = "25px Arial";
	ctxRef.textAlign = "center";
	// ctxRef.margin = "auto";
	ctxRef.fillText( "A", rendererWidth / 2, 30 );

	textDist.width = rendererWidth;
	// textDist.height = 30;
	var ctxDist = textDist.getContext( "2d" );
	ctxDist.font = "25px Arial";
	ctxDist.textAlign = "center";
	ctxDist.fillText( "B", rendererWidth / 2, 30 );

	rendererRef.setSize(rendererWidth, rendererHeight);
	rendererDist.setSize(rendererWidth, rendererHeight);
	// setModels( );
	
	
	camera.updateProjectionMatrix( );
	onPositionChange( );

	// controls.reset();
	initializeCameraParameters();

	
	// animate();
	controls = new THREE.OrthographicTrackballControls( camera );
	setControls( );
	controls.addEventListener( 'change', onPositionChange );
	request = requestAnimationFrame( animate );
}

// ---------------------------------------------------------------
// Document Ready
// ---------------------------------------------------------------

showTab(currentTab); // Display the current tab
window.addEventListener('resize',onWindowResize);

