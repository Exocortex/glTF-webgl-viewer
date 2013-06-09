precision highp float;
uniform mat3 u_normalMatrix;
attribute vec3 a_normal;
varying vec3 v_normal;
attribute vec3 a_position;
uniform mat4 u_worldviewMatrix;
uniform mat4 u_projectionMatrix;
void main(void) {
v_normal = normalize(u_normalMatrix * a_normal);
vec4 pos = u_worldviewMatrix * vec4(a_position,1.0);
gl_Position = u_projectionMatrix * pos;
}
