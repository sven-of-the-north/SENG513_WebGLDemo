var gl = null;
var canvas;
var lastTime = 0;

var triangleVertexBuffer;
var triangleColorBuffer;
var triangleRotation = 0;

var circleVertexBuffer;
var circleColorBuffer;
var circleRotation = 0;

var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function start() {
	canvas = document.getElementById("glcanvas");
	if (!canvas) {
		alert('No drawing canvas!');
		return;	// Nothing to draw on! Just quit.
	}

	gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
	if (!gl) {
		alert('Unable to initialize WebGL. Your browser may not support it.');
		return;	// WebGL isn't working! Just quit.
	}
	
	// Define properties of scene
	gl.clearColor( 0.0, 0.0, 0.0, 1.0 );	// "Empty" color is black
	gl.clearDepth( 1.0 );					// Clear everything
	gl.enable( gl.DEPTH_TEST );				// Enable depth testing
	gl.depthFunc( gl.LEQUAL );				// Enable occlusion
	
	initShaders();	// Initialize the shaders, so WebGL knows how to light our scene.
	initBuffers();	// Initializes buffers (for position and colors)
	
	tick();			// tock.
}

function initTriangleBuffers() {
	let vertices;
    let colors = [];
    
    triangleVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
    vertices = [
        0.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexBuffer.itemSize = 3;
    triangleVertexBuffer.numItems = 3;
	
	triangleColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleColorBuffer);
	for ( let i = 0; i < 3; ++i )
		colors = colors.concat([0.5, 0.0, 1.0, 1.0]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleColorBuffer.itemSize = 4;
    triangleColorBuffer.numItems = 3;
}

function initCircleBuffers() {
	let vertices = [0.0, 0.0, 0.0];
    let colors = [1.0, 1.0, 1.0, 1.0];
    
    circleVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
	
    for ( let i = 0; i < 181; i++ )
		vertices = vertices.concat(Math.cos(i*Math.PI/90), Math.sin(i*Math.PI/90), 0);
	
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    circleVertexBuffer.itemSize = 3;
    circleVertexBuffer.numItems = 182;
    
    circleColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleColorBuffer);
	
    for (var i = 0; i < 60; i++) {
        colors = colors.concat([Math.cos(i*Math.PI/120), Math.sin(i*Math.PI/120), 0, 1.0]);
    }
    for (var i = 0; i < 60; i++) {
        colors = colors.concat([0, Math.cos(i*Math.PI/120), Math.sin(i*Math.PI/120), 1.0]);
    }
    for (var i = 0; i < 60; i++) {
        colors = colors.concat([Math.sin(i*Math.PI/120), 0, Math.cos(i*Math.PI/120), 1.0]);
    }
	
    colors = colors.concat([1.0, 0.0, 0.0, 1.0]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    circleColorBuffer.itemSize = 4;
    circleColorBuffer.numItems = 182;
}

function initBuffers() {
	initTriangleBuffers();
	//initCircleBuffers();
}

function drawObject( vertexBuffer, colorBuffer, mode ) {
	// Set active buffer to vertex buffer to update position information
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	// Set active buffer to color buffer to update position information
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	// Move computation of modelview and perspective matrices to the graphics card
    setMatrixUniforms();
    gl.drawArrays(mode, 0, vertexBuffer.numItems);
}

function drawScene() {
	// Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Establish the perspective with which we want to view the scene. 
    mat4.perspective(pMatrix, 45, 800.0/600.0, 0.1, 100.0);
	
	loadIdentity();
	
	mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -7.0]);
	mat4.rotate(mvMatrix, mvMatrix, degToRad(triangleRotation), [0, 1, 0]);
	drawObject(triangleVertexBuffer, triangleColorBuffer, gl.TRIANGLES);
}

function animate() {
    let timeNow = new Date().getTime();
    if( lastTime != 0 ) {
        let elapsed = timeNow - lastTime;
        triangleRotation += (90*elapsed) / 1000.0;
		circleRotation += (120*elapsed) / 1000.0;
    }
    lastTime = timeNow;
}

function tick () {
	requestAnimationFrame(tick);
    drawScene();
    animate();
}

// ---------- Shader stuff ----------
function initShaders() {
	var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    // Create the shader program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shader));
    }

    gl.useProgram(shaderProgram);

    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    
    vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
	
}

function getShader(gl, id) {
	var shaderScript = document.getElementById(id);

	// Didn't find an element with the specified ID; abort.
	if (!shaderScript)
		return null;

	// Walk through the source element's children, building the
	// shader source string.
	var theSource = "";
	var currentChild = shaderScript.firstChild;

	while(currentChild) {
		if (currentChild.nodeType == 3)
			theSource += currentChild.textContent;
		currentChild = currentChild.nextSibling;
	}

	// Now figure out what type of shader script we have,
	// based on its MIME type.
	var shader;

	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		return null;  // Unknown shader type
	}

	// Send the source to the shader object
	gl.shaderSource(shader, theSource);

	// Compile the shader program
	gl.compileShader(shader);

	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

// ---------- Utility functions ----------
function loadIdentity() {
  mvMatrix = mat4.create();
}

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.copy( copy, mvMatrix );
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if ( mvMatrixStack.length == 0)
        throw "Invalid pop!";
    mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix));

    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix));
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
