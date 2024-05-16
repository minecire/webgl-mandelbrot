var fragmentShaderSourcePreedit = `#version 300 es

precision highp float;

// float dthreshold = pow(2., -20.);

// void dfix(vec2 a)
// {
//     while(a.y > dthreshold*a.x)
//     {
//         a.y -= dthreshold*a.x;
//         a.x += dthreshold*a.x;
//     }
// }

// vec2 dmult(vec2 a, vec2 b)
// {
//     vec2 o = vec2(a.x*b.x, a.y*b.x+b.y*a.x+a.y*b.y);
//     dfix(o);
//     return o;
// }

// vec2 ddiv(vec2 a, vec2 b)
// {
//     vec2 o = vec2(a.x/b.x, a.y/b.x);
//     dfix(o);
//     return o;
// }

vec2 cadd(vec2 a, vec2 b)
{
    return vec2(a.x+b.x, a.y+b.y);
}
vec2 csub(vec2 a, vec2 b)
{
    return vec2(a.x-b.x, a.y-b.y);
}
vec2 cmult(vec2 a, vec2 b)
{
    return vec2(a.x*b.x-a.y*b.y, a.y*b.x+a.x*b.y);
}
vec2 cdiv(vec2 a, vec2 b)
{
    return vec2((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y),(a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y));
}
vec2 csqr(vec2 a)
{
    return cmult(a, a);
}
vec2 cpow(vec2 a, vec2 b)
{
    vec2 polara = vec2(sqrt(dot(a,a)), atan(a.y/a.x));
    return vec2(pow(polara.x, b.x) * exp(-b.y*polara.y)*cos(b.x*polara.y+b.y*log(polara.x)), pow(polara.x, b.x) * exp(-b.y*polara.y)*sin(b.x*polara.y+b.y*log(polara.x)));
}

vec2 real(vec2 a)
{
    return vec2(a.x, 0);
}

vec2 imaginary(vec2 a)
{
    return vec2(a.y, 0);
}

vec2 cabs(vec2 a)
{
    return vec2(sqrt(a.x*a.x+a.y*a.y), 0);
}

uniform float time;

vec2 func(vec2 z, vec2 c)
{
    return {{function}};
}

float distFunc(vec2 z)
{
    return({{distanceAlgorithm}});
}

// vec4[] controlPoints = vec4[6](
//     vec4(0,0./255.,7./255.,100./255.),
//     vec4(1600,32./255.,107./255.,203./255.),
//     vec4(4200,237./255.,255./255.,255./255.),
//     vec4(6400,255./255.,170./255.,0./255.),
//     vec4(8500,0./255.,2./255.,0./255.),
//     vec4(10000,0./255.,7./255.,100./255.)
// );
{{controlPoints}}

vec3 lerp(vec3 p1, vec3 p2, float d){
    return vec3((p2.x-p1.x)*d+p1.x, (p2.y-p1.y)*d+p1.y, (p2.z-p1.z)*d+p1.z);
}

vec4 calcColor(float value){
    int i = 0;
    while(value < 0.){
        value += 10000.;
    }
    if(int(value) % 10000 == 0){
        return(vec4(controlPoints[0].yzw,1));
    }
    while(int(controlPoints[i].x) < (int(value) % 10000)){
        i++;
    }
    float start = controlPoints[i-1].x;
    float end = controlPoints[i].x;
    float newValue = (float(int(value) % 10000)-(start))/((end)-(start));
    vec3 color = lerp(controlPoints[i-1].yzw, controlPoints[i].yzw, newValue);
    return(vec4(color, 1));
}

out vec4 outColor;
uniform vec2 windowSize;
uniform vec2 pos;
uniform float zoom;
uniform int iterationCount;
uniform float colorPeriod;
uniform vec2 juliaPos;
uniform float juliaZoom;
uniform float juliaSize;
uniform vec2 initialZ;
uniform bool initialZC;
uniform float initialZCT;

void main() {
    vec2 normCoord = vec2((gl_FragCoord.x/windowSize.x*4.-2.)*zoom-pos.x, (gl_FragCoord.y/windowSize.y*4.-2.)*zoom*windowSize.y/windowSize.x-pos.y);
    int i = 0;
    vec2 z;
    vec2 c;
    float zsize;
    if(gl_FragCoord.x/windowSize.x > 1.-juliaSize && gl_FragCoord.y/windowSize.y > 1.-juliaSize){
        vec2 miniFragCoord = vec2(gl_FragCoord.x-(1.-juliaSize)*windowSize.x, gl_FragCoord.y-(1.-juliaSize)*windowSize.y);
        vec2 miniWindowSize = vec2(windowSize.x * juliaSize, windowSize.y * juliaSize);
        z = vec2((miniFragCoord.x/miniWindowSize.x*4.-2.)*juliaZoom-juliaPos.x, (miniFragCoord.y/miniWindowSize.y*4.-2.)*juliaZoom*windowSize.y/windowSize.x-juliaPos.y);
        c = vec2(-pos.x, -pos.y);
    }
    else{
        z = initialZ;
        if(initialZC){
            z.x+=normCoord.x;
            z.y+=normCoord.y;
        }
        if(initialZCT != 0.){
            z.x+=normCoord.x*initialZCT*time;
            z.y+=normCoord.y*initialZCT*time;
        }
        c = normCoord;
    }
    {{coloringAlgorithm}}
}
`;

var escapeTimeAlgorithm = `
    for(i = 0; i < iterationCount; i++){
        z = func(z, c);
        if(dot(z,z) > 1000.){
            break;
        }
    }
    if(i == iterationCount){
        outColor = vec4(0,0,0,1);
    }
    else{
        outColor = calcColor(float(i)*10000./colorPeriod);
    }
`;

var orbitTrapAlgorithm = `
float mindist = 10000.;
    for(i = 0; i < iterationCount; i++){
        z= func(z, c);
        float dist = distFunc(z);
        if(dist < mindist){
            mindist = dist;
        }
    }
    outColor = calcColor(log(mindist+0.0000001)*10000./colorPeriod);
`;

var distancePoint = `dot(z,z)`;
var distanceCircle = `abs(dot(z,z)-1.)`;
var distanceCross = `min(abs(z.x), abs(z.y))`;
var distanceFourCircles = `abs(dot(vec2(abs(z.x)-1., abs(z.y)-1.),vec2(abs(z.x)-1., abs(z.y)-1.))-1.)`;