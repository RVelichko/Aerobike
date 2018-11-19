uniform sampler2D height_texture;
uniform sampler2D route_curve;
varying float f_amount;
varying float f_uvx;
varying vec4 v_route;
varying vec2 v_uv;

void main() {
    v_uv = uv;
    f_uvx = uv.x;
    f_amount = texture2D(height_texture, uv).r;
    v_route = texture2D(route_curve, uv);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
