#version 330 core

precision highp float;
out vec4 FragColor;

uniform vec2 iResolution;
uniform float iTime;
uniform bool showLighting;


// SDF of a sphere
float funcSphere(vec3 p, vec3 centre, float radius) {
    return length(p - centre) - radius;
}

// SDF of scene (implicit function)
float funcImp(vec3 p) {
    float f1 = funcSphere(p, vec3(sin(iTime / 2.0) * 5.0, 0.0, 40.0), 5.0);
    float f2 = funcSphere(p, vec3(sin(iTime / 2.0) * 5.0 + sin(iTime / 0.5) * 5.0, 4.5, 40.0 + cos(iTime / 0.5) * 4.0), 2.5);
    return min(f1, f2);
}

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
        p = p + rd * d;                                            // otherwise, move along the ray
    }

    if (hit) {
        vec3 n = calcNormal(p);
        FragColor = vec4(abs(vec3(n.z, n.x, n.y)), 1.0);
    } else {
        FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }

}
