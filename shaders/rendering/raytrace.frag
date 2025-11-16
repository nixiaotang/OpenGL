#version 330 core

precision highp float;
out vec4 FragColor;

uniform vec2 iResolution;
uniform float iTime;
uniform bool showLighting;

const float PI = 3.1415926535897932384626433832795;


struct Ball {
    vec3 center;
    float radius;
};

struct Light {
    vec3 position;
    float intensity;
};


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

float calcE(vec3 p, vec3 n, Light light) {
    vec3 l = normalize(light.position - p);
    float r = length(light.position - p);
    return light.intensity * dot(n, l) / (4.0 * PI * r * r);
}

bool underShadow(vec3 p, Light light, Ball balls[2]) {
    vec3 rd = normalize(light.position - p);
    vec3 ro = p + rd * 0.001;                                                       // offset to avoid self-intersection
    float tmax = length(light.position - p);                                        // max dist to check (past light source)
    vec3 hit;

    for (int i = 0; i < 2; i++) {
        if (intersect(ro, rd, balls[i].center, balls[i].radius, hit) && length(hit - ro) < tmax) {
            return true;
        }
    }
    return false;
}

void main() {

    // Setup scene --------------------------------
    Ball balls[2];
    balls[0] = Ball(vec3(sin(iTime / 2.0) * 5.0, 0.0, 40.0), 5.0);
    balls[1] = Ball(vec3(sin(iTime / 2.0) * 5.0 + sin(iTime / 0.5) * 5.0, 4.5, 40.0 + cos(iTime / 0.5) * 4.0), 2.5);
    Light light = Light(vec3(0.0, 15.0, 15.0), 30000.0);


    // Generate a camera ray --------------------------------
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec3 ro, rd;
    cameraRay(uv, ro, rd); 


    // Ray tracing --------------------------------
    vec3 first_hit = vec3(-1.0, -1.0, -1.0);
    vec3 normal;

    for(int i = 0; i < 2; i++) {                                                    // check for intersections with balls
        vec3 p;
        if (intersect(ro, rd, balls[i].center, balls[i].radius, p)) {
            if (first_hit.z < 0.0 || length(p - ro) < length(first_hit - ro)) {     // check if this is the closest hit so far
                first_hit = p;
                normal = (p - balls[i].center) / balls[i].radius;
            }
        }
    }

    if (first_hit.z >= 0.0) {                                                       // if there was a hit
        float c = 1.0;

        if (showLighting) {                                                         // if lighting is enabled
            float Kd = 1.0;
            c = Kd / PI * calcE(first_hit, normal, light);                          // lambertian shading

            if (underShadow(first_hit, light, balls)) c = min(c, 0.1);              // check for shadows
        }

        FragColor = vec4(c * abs(normal), 1.0);

    } else {
        FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }

}
