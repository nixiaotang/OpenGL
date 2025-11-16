#version 330 core

precision highp float;
out vec4 FragColor;

uniform vec2 iResolution;
uniform float iTime;
uniform bool showLighting;

const float PI = 3.1415926535897932384626433832795;


// Utility functions for rotating and translating --------------------------------
mat3 rotateX(float angle) {
    return mat3(1.0, 0.0, 0.0,
        0.0, cos(angle), sin(angle),
        0.0, -sin(angle), cos(angle));
}

mat3 rotateY(float angle) {
    return mat3(cos(angle), 0.0, -sin(angle),
        0.0, 1.0, 0.0,
        sin(angle), 0.0, cos(angle));
}

mat3 rotateZ(float angle) {
    return mat3(cos(angle), sin(angle), 0.0,
        -sin(angle), cos(angle), 0.0,
        0.0, 0.0, 1.0);
}

vec3 translate(vec3 p, vec3 t) {
    mat4 m = mat4(1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        t.x, t.y, t.z, 1.0);
    return (m * vec4(p, 1.0)).xyz;
}



// SDF functions of common shapes--------------------------------
// From https://iquilezles.org/articles/distfunctions/

float funcSphere(vec3 p, vec3 centre, float radius) {
    return length(p - centre) - radius;
}

float funcBox(vec3 p, vec3 b, vec3 pos, vec3 rot) {
    p = translate(p, -pos); // inverse translation of box
    p = rotateX(rot.x) * p;
    p = rotateY(rot.y) * p;
    p = rotateZ(rot.z) * p;

    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float funcBoxFrame( vec3 p, vec3 b, float e, vec3 pos, vec3 rot) {
    p = translate(p, -pos); // inverse translation of box
    p = rotateX(rot.x) * p;
    p = rotateY(rot.y) * p;
    p = rotateZ(rot.z) * p;

    p = abs(p) - b;
    vec3 q = abs(p + e) - e;

    return min(min(
        length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
        length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
        length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

float funcCylinder(vec3 p, float r, float h, vec3 pos, vec3 rot) {
    p = translate(p, -pos); // inverse translation of cylinder
    p = rotateX(-rot.x) * p;
    p = rotateY(-rot.y) * p;
    p = rotateZ(-rot.z) * p;

    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float funcHexPrism( vec3 p, vec2 h, vec3 pos, vec3 rot ) {
    p = translate(p, -pos); // inverse translation of hex prism
    p = rotateX(-rot.x) * p;
    p = rotateY(-rot.y) * p;
    p = rotateZ(-rot.z) * p;

    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p);
    p.xy -= 2.0 * min(dot(k.xy, p.xy), 0.0) * k.xy;
    vec2 d = vec2(length(p.xy - vec2(clamp(p.x, -k.z*h.x, k.z*h.x), h.x)) * sign(p.y-h.x), p.z - h.y);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}



// Smooth union and subtraction functions --------------------------------
// From https://iquilezles.org/articles/distfunctions/

float smoothUnion(float d1, float d2, float k) {
    k *= 4.0;
    float h = max(k - abs(d1 - d2), 0.0);
    return min(d1, d2) - h * h * 0.25/k;
}

float smoothSubtraction(float d1, float d2, float k) {
    k *= 4.0;
    float h = max(k - abs(d1 - d2), 0.0);
    return max(d1, -d2) + h * h * 0.25/k;
}



// Combined SDF functions --------------------------------

float funcObj(vec3 p) {
    float h = 2.0;
    float r = 1.0;
    vec3 pos = vec3(-5.0, 5.0, 20.0);

    // spinning the object
    p = translate(p, -pos);
    p = rotateY(iTime) * p;
    p = translate(p, pos);

    // cylinders
    float c1 = funcCylinder(p, r, h, pos, vec3(0.0));
    float c2 = funcCylinder(p, r, h, pos, vec3(0.0, 0.0, PI/2.0));
    float c3 = funcCylinder(p, r, h, pos, vec3(PI/2.0, 0.0, 0.0));
    float obj1 = min(min(c1, c2), c3);

    // sphere and box
    float s = funcSphere(p, pos, h*1.2);
    float b = funcBox(p, vec3(h*0.9), pos, vec3(0.0));
    float obj2 = max(s, b);

    // subtraction
    return max(-obj1, obj2);
}

float funcObj2(vec3 p) {

    vec3 pos = vec3(6.0, -6.0, 25.0);

    float s = funcSphere(p, pos + vec3(0.0, sin(iTime) * 4.5, 0.0), 1.0);
    float b = funcBox(p, vec3(1.2), pos, vec3(PI/4.0, PI/4.0, 0.0));
    return smoothUnion(s, b, 0.5);
}

float funcObj3(vec3 p) {

    vec3 pos = vec3(-5.0, -5.0, 25.0);

    p = translate(p, -pos);
    p = rotateY(PI/3.0) * p;
    p = rotateX(iTime) * p;
    p = translate(p, pos);

    float s = funcSphere(p, pos, 4.0);
    float s2 = funcSphere(p, pos, 3.5);
    float obj1 = smoothSubtraction(s, s2, 0.2);

    vec2 hexSize = vec2(1.5, 5.0);
    float h = funcHexPrism(p, hexSize, pos, vec3(0.0));
    float h2 = funcHexPrism(p, hexSize, pos, vec3(PI/2.0, 0.0, 0.0));
    float h3 = funcHexPrism(p, hexSize, pos, vec3(0.0, PI/2.0, 0.0));
    float obj2 = smoothUnion(h, smoothUnion(h2, h3, 0.5), 0.5);// min(min(h, h2), h3);
    
    return smoothSubtraction(obj2, obj1, 0.4);
}

float funcObj4(vec3 p) {
    vec3 pos = vec3(4.0, 4.5, 20.0);

    p = translate(p, -pos);
    p = rotateY(PI/7.0) * p;
    p = translate(p, pos);

    float d = 1.0;
    float e = 0.08;

    for(int i = 0; i < 5; i++) {
        float s = float(i)*0.5 + 0.8;
        float r = PI/20.0 * float(5-i) * sin(iTime / 1.5);
        float b = funcBoxFrame(p, vec3(s), e, pos, vec3(0.0, 0.0, r));
        d = smoothUnion(d, b, 0.2);
    }

    return d;
}

float funcImp(vec3 p) {
    float f1 = funcObj(p);
    float f2 = funcObj2(p);
    float f3 = funcObj3(p);
    float f4 = funcObj4(p);

    return min(min(min(f1, f2), f3), f4);
}


// Raymarching functions --------------------------------

// Estimate normal based on finite differences
vec3 calcNormal(vec3 p) {
    const float eps = 0.001; 
    const vec2 h = vec2(eps, 0);
    return normalize(vec3(
        funcImp(p+h.xyy) - funcImp(p-h.xyy),
        funcImp(p+h.yxy) - funcImp(p-h.yxy),
        funcImp(p+h.yyx) - funcImp(p-h.yyx)
    ));
}

void cameraRay(vec2 p, out vec3 ro, out vec3 rd) {
    vec2 cp = p / 2.0 - vec2(0.5, 0.5);
    vec3 pix = vec3(cp, 0.0);
    ro = vec3(0.0, 0.0, -1.0);
    rd = normalize(pix - ro);
}

bool intersect(vec3 ro, vec3 rd, vec3 center, float r, out vec3 p) {
    float a = dot(rd, rd);
    float b = 2.0 * dot(rd, ro - center);
    float c = dot(ro - center, ro - center) - r * r;

    float discriminant = b * b - 4.0 * a * c;
    if (discriminant > 0.0) {
        float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
        float t2 = (-b + sqrt(discriminant)) / (2.0 * a);
        
        if (t1 > 0.0 && t2 > 0.0) {
            p = ro + min(t1, t2) * rd;
            return true;
        } else if (t1 > 0.0) {
            p = ro + t1 * rd;
            return true;
        } else if (t2 > 0.0) {
            p = ro + t2 * rd;
            return true;
        }
    }
    return false;
}

float calcE(vec3 p, vec3 n) {
    vec3 lightOrigin = vec3(0.0, -5.0, 0.0);
    float intensity = 25000.0;

    vec3 l = normalize(lightOrigin - p);
    float r = length(lightOrigin - p);
    return intensity * dot(n, l) / (4.0 * PI * r * r);
}


// Main function --------------------------------
void main() {
    
    // Generate a camera ray --------------------------------
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec3 ro, rd;
    cameraRay(uv, ro, rd); 
    
    // Ray marching (sphere marching) --------------------------------
    int max_steps = 100;
    bool hit = false;
    vec3 p = ro;

    for(int i = 0; i < max_steps; i++) {
        float d = funcImp(p);                                       // distance to nearest surface
        if (abs(d) <= 0.001) {                                      // if we've hit the surface (close enough)
            hit = true;
            break;
        }
        p = p + rd * d;                                             // otherwise, move along the ray
    }

    if (hit) {
        float c = 1.0;
        if (showLighting) {
            float Kd = 1.0;
            c = Kd / PI * calcE(p, calcNormal(p));                  // lambertian shading
        }

        FragColor = vec4(c * abs(calcNormal(p).xy), 0.5, 1.0);

    } else {
        FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}