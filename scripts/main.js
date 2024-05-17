var canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var gl = canvas.getContext("webgl2");

var vertexShader;
var fragmentShader;
var shaderProgram;
var currentTime = Date.now();
var timeSinceUpdate = 0;
var timeOfLastUpdate = Date.now();
var timeOfLastPause = 0;
var previousPauseTime = 0;
var pauseTime = 0;
var paused = true;
var iterationCount;
var colorPeriod;
var initialZ = [0,0];
var initialZC = 0;
var initialZCT = 0;

var juliaPos = [0,0];
var juliaZoom = 1;
var miniJuliaSize = 0.25;
var juliaSize = 0.25;

var positionAttributeLocation;

var positionBuffer = gl.createBuffer();

var pos = [0,0];
var zoom = 1;

const vertexShaderSource = `#version 300 es
in vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;
var windowSizeUniformLocation;
var positionUniformLocation;
var zoomUniformLocation;
function beginShader(){
    if (!gl) {
      return;
    }
  
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  
    var program = createProgram(gl, vertexShader, fragmentShader);
  
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    windowSizeUniformLocation = gl.getUniformLocation(program,"windowSize");
    positionUniformLocation = gl.getUniformLocation(program,"pos");
    zoomUniformLocation = gl.getUniformLocation(program,"zoom");
    timeUniformLocation = gl.getUniformLocation(program,"time");
    iterationCountUniformLocation = gl.getUniformLocation(program,"iterationCount");
    colorPeriodUniformLocation = gl.getUniformLocation(program,"colorPeriod");
    initialZUniformLocation = gl.getUniformLocation(program,"initialZ");
    initialZCUniformLocation = gl.getUniformLocation(program,"initialZC");
    initialZCTUniformLocation = gl.getUniformLocation(program,"initialZCT");


    juliaPositionUniformLocation = gl.getUniformLocation(program,"juliaPos");
    juliaZoomUniformLocation = gl.getUniformLocation(program,"juliaZoom");
    juliaSizeUniformLocation = gl.getUniformLocation(program,"juliaSize");
  
    var positionBuffer = gl.createBuffer();
  
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    var positions = [
      -1, -1,
      1, -1,
      1, 1,
      -1, -1,
      -1, 1,
      1, 1
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    var vao = gl.createVertexArray();
  
    gl.bindVertexArray(vao);
  
    gl.enableVertexAttribArray(positionAttributeLocation);

    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);


    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    gl.useProgram(program);

    gl.uniform2fv(windowSizeUniformLocation, [canvas.width, canvas.height]);
    gl.uniform2fv(positionUniformLocation, pos);
    gl.uniform1f(zoomUniformLocation, zoom);
    gl.uniform1f(timeUniformLocation, timeSinceUpdate);
    gl.uniform1i(iterationCountUniformLocation, iterationCount);
    gl.uniform1f(colorPeriodUniformLocation, colorPeriod);
    gl.uniform2fv(initialZUniformLocation, initialZ);
    gl.uniform1i(initialZCUniformLocation, initialZC);
    gl.uniform1f(initialZCTUniformLocation, initialZCT);

    gl.uniform2fv(juliaPositionUniformLocation, juliaPos);
    gl.uniform1f(juliaZoomUniformLocation, juliaZoom);
    gl.uniform1f(juliaSizeUniformLocation, juliaSize);
    
    gl.bindVertexArray(vao);
    draw()
}

function draw(){
    gl.flush();
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    currentTime = Date.now();
    if(paused){
        pauseTime = previousPauseTime + currentTime - timeOfLastPause;
    }
    timeSinceUpdate = (currentTime - timeOfLastUpdate - pauseTime);
    gl.uniform2fv(windowSizeUniformLocation, [canvas.width, canvas.height]);
    gl.uniform2fv(positionUniformLocation, pos);
    gl.uniform1f(zoomUniformLocation, zoom);
    gl.uniform1f(timeUniformLocation, timeSinceUpdate);
    gl.uniform1i(iterationCountUniformLocation, iterationCount);
    gl.uniform1f(colorPeriodUniformLocation, colorPeriod);
    gl.uniform2fv(initialZUniformLocation, initialZ);
    gl.uniform1i(initialZCUniformLocation, initialZC);
    gl.uniform1f(initialZCTUniformLocation, initialZCT);
    
    gl.uniform2fv(juliaPositionUniformLocation, juliaPos);
    gl.uniform1f(juliaZoomUniformLocation, juliaZoom);
    gl.uniform1f(juliaSizeUniformLocation, juliaSize);
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
}

function createShader(gl, type, source){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

updateFractal();
beginShader()

document.addEventListener("wheel", function(event){
    if(event.clientX > canvas.width || event.clientY > canvas.height){return;}
    scrollDist = event.deltaY * 0.01;
    if(event.clientX > canvas.width*(1-juliaSize) && event.clientY < canvas.height*juliaSize){
        if(scrollDist > 0){
            for(var i = 0; i < scrollDist; i++){
                juliaPos[0] -= ((event.clientX/canvas.width-(1-juliaSize))/juliaSize*4-2)*juliaZoom;
                juliaPos[1] += (event.clientY/canvas.height/juliaSize*4-2) * juliaZoom * canvas.height/canvas.width;
                juliaZoom /= 1.1;
                juliaPos[0] += ((event.clientX/canvas.width-(1-juliaSize))/juliaSize*4-2)*juliaZoom;
                juliaPos[1] -= (event.clientY/canvas.height/juliaSize*4-2) * juliaZoom * canvas.height/canvas.width;
            }
        }
        else{
            for(var i = 0; i > scrollDist; i--){
                juliaPos[0] -= ((event.clientX/canvas.width-(1-juliaSize))/juliaSize*4-2)*juliaZoom;
                juliaPos[1] += (event.clientY/canvas.height/juliaSize*4-2) * juliaZoom * canvas.height/canvas.width;
                juliaZoom *= 1.1;
                juliaPos[0] += ((event.clientX/canvas.width-(1-juliaSize))/juliaSize*4-2)*juliaZoom;
                juliaPos[1] -= (event.clientY/canvas.height/juliaSize*4-2) * juliaZoom * canvas.height/canvas.width;
            }
        }
    }
    else{
        if(scrollDist > 0){
            for(var i = 0; i < scrollDist; i++){
                pos[0] -= (event.clientX/canvas.width*4-2)*zoom;
                pos[1] += (event.clientY/canvas.height*4-2) * zoom * canvas.height/canvas.width;
                zoom /= 1.1;
                pos[0] += (event.clientX/canvas.width*4-2)*zoom;
                pos[1] -= (event.clientY/canvas.height*4-2) * zoom * canvas.height/canvas.width;
            }
        }
        else{
            for(var i = 0; i > scrollDist; i--){
                pos[0] -= (event.clientX/canvas.width*4-2)*zoom;
                pos[1] += (event.clientY/canvas.height*4-2) * zoom * canvas.height/canvas.width;
                zoom *= 1.1;
                pos[0] += (event.clientX/canvas.width*4-2)*zoom;
                pos[1] -= (event.clientY/canvas.height*4-2) * zoom * canvas.height/canvas.width;
            }
        }
    }
    draw();
});
var mouseDown = false;
document.body.onmousedown = function() { 
  mouseDown = true;
}
document.body.onmouseup = function() {
  mouseDown = false;
}
document.addEventListener("mousemove", function(event){
    if(event.clientX > canvas.width || event.clientY > canvas.height){return;}
    if(mouseDown){
        if(event.clientX > canvas.width*(1-juliaSize) && event.clientY < canvas.height*juliaSize){
            juliaPos[0] += (event.movementX/canvas.width*4)*juliaZoom/juliaSize;
            juliaPos[1] -= (event.movementY/canvas.height*4) * juliaZoom * canvas.height/canvas.width/juliaSize;
        }
        else{
            pos[0] += (event.movementX/canvas.width*4)*zoom;
            pos[1] -= (event.movementY/canvas.height*4) * zoom * canvas.height/canvas.width;
        }
        draw();
    }
});

var previewMode = false;

document.addEventListener("keydown", function(event){
    if(event.key == "Escape"){
        if(!previewMode){
            previewMode = true;
            canvas.width = window.innerWidth / 2.5;
            canvas.height = window.innerHeight / 2.5;
        }
        else{
            previewMode = false;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        beginShader();
    }
    if(event.key == ' '){
        if(!paused){
            paused = true;
            timeOfLastPause = Date.now();
        }
        else{
            paused = false;
            previousPauseTime = pauseTime;
        }
    }
    if(event.key == 'r'){
        pos = [0,0];
        zoom = 1;
        juliaPos = [0,0];
        juliaZoom = 1;
        draw();
    }
    if(event.key == 'R'){
        juliaPos = [0,0];
        juliaZoom = 1;
        draw();
    }
    if(event.key == 'j'){
        if(juliaSize == 1){
            juliaSize = 0;
        }
        else if(juliaSize == 0){
            juliaSize = miniJuliaSize;
        }
        else if(juliaSize == miniJuliaSize){
            juliaSize = 1;
        }
        draw();
    }
    if(event.key == 'x'){
        juliaZoom = zoom;
        juliaPos = [...pos];
        draw();
    }
})

var interval = setInterval(function(){
    if(!paused){
        draw();
    }
},1000/60);