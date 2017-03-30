var canvas;
var gl;
var lastTime = 0;

var triangleVertexBuffer;
var triangleVertexColorBuffer;
var triRot = 0;

var squareVertexBuffer;
var squareVertexColorBuffer;
var squareRot = 0;

var circleVertexBuffer;
var circleVertexColorBuffer;
var circleRot = 0;

var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var perspectiveMatrix = mat4.create();

// Called when the canvas is created.
function start() {
  canvas = document.getElementById("glcanvas");

  initWebGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working

  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    initShaders();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.

    initBuffers();

    // Set up to draw the scene periodically.

    tick();
  }
};

// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
};

// Initialize the buffers we'll need.
function initTriangleBuffers(){
    let vertices;
    let colors;
    
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
    
    triangleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    triangleVertexColorBuffer.itemSize = 4;
    triangleVertexColorBuffer.numItems = 3;
};

function initSquareBuffers(){
    let vertices;
    let colors;
    
    squareVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    vertices = [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexBuffer.itemSize = 3;
    squareVertexBuffer.numItems = 4;
    
    squareVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
    colors = []
    for (var i = 0; i < 4; i++) {
        colors = colors.concat([0.5, 0.5, 1.0, 1.0]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    squareVertexColorBuffer.itemSize = 4;
    squareVertexColorBuffer.numItems = 4;
};

function initCircleBuffers(){
    let vertices;
    let colors;
    
    circleVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBuffer);
    vertices = [
        0.0, 0.0, 0.0
    ];
    for ( let i = 0; i < 181; i++ ){
        vertices.push(Math.cos(i*Math.PI/90));
        vertices.push(Math.sin(i*Math.PI/90));
        vertices.push(0);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    circleVertexBuffer.itemSize = 3;
    circleVertexBuffer.numItems = 182;
    
    circleVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexColorBuffer);
    colors = [
        1.0, 1.0, 1.0, 1.0
    ];
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
    circleVertexColorBuffer.itemSize = 4;
    circleVertexColorBuffer.numItems = 182;
};

function initBuffers() {
    initTriangleBuffers();
    initSquareBuffers();
    initCircleBuffers();
};

// Draw a single object.
function drawObject( vertexBuffer, colorBuffer, mode ) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);      
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, colorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(mode, 0, vertexBuffer.numItems);
};

// Draw the scene.
function drawScene() {
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Establish the perspective with which we want to view the scene. 
    mat4.perspective(perspectiveMatrix, 45, 640.0/480.0, 0.1, 100.0);
    
    // Move to the position where we want to draw the shape. Load identity
    // moves us to the origin of the canvas.
    loadIdentity();
    
    mvPushMatrix();
        mat4.translate(mvMatrix, mvMatrix, [-2.0, -2.0, -7.0]);
        mat4.rotate(mvMatrix, mvMatrix, degToRad(triRot), [0, 1, 0]);
        drawObject(triangleVertexBuffer, triangleVertexColorBuffer, gl.TRIANGLES);
    mvPopMatrix();

    mvPushMatrix();
        mat4.translate(mvMatrix, mvMatrix, [2.0, -2.0, -7.0]);
        mat4.rotate(mvMatrix, mvMatrix, degToRad(squareRot), [1, 0, 0]);
        drawObject(squareVertexBuffer, squareVertexColorBuffer, gl.TRIANGLE_STRIP);
    mvPopMatrix();

    mvPushMatrix();
        mat4.translate(mvMatrix, mvMatrix, [0.0, 2.0, -7.0]);
        mat4.rotate(mvMatrix, mvMatrix, degToRad(circleRot), [0, 0, 1]);
        drawObject(circleVertexBuffer, circleVertexColorBuffer, gl.TRIANGLE_FAN);
    mvPopMatrix();
};

// Initialize the shaders, so WebGL knows how to light our scene.
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
};

// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.

  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.

  var theSource = "";
  var currentChild = shaderScript.firstChild;

  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }

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
};

function animate() {
    var timeNow = new Date().getTime();
    if( lastTime != 0 ) {
        var elapsed = timeNow - lastTime;
        
        triRot += (90*elapsed) / 1000.0;
        squareRot += (75*elapsed) / 1000.0;
        circleRot += (90*elapsed) / 1000.0;
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimationFrame(tick);
    drawScene();
    animate();
};

// Utility functions
function loadIdentity() {
  mvMatrix = mat4.create();
};

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
};

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.copy( copy, mvMatrix );
    mvMatrixStack.push(copy);
};

function mvPopMatrix() {
    if ( mvMatrixStack.length == 0)
        throw "Invalid pop!";
    mvMatrix = mvMatrixStack.pop();
};

function setMatrixUniforms() {
    var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix));

    var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix));
};

function degToRad(degrees) {
    return degrees * Math.PI / 180;
};
