uniform sampler2D route_texture;
uniform sampler2D ocean_texture;
uniform sampler2D sandy_texture;
uniform sampler2D grass_texture;
uniform sampler2D rocky_texture;
uniform float route_width;
varying vec2 v_uv;
varying vec4 v_route;
varying float f_amount;
varying float f_uvx;

void main() {
    float _rx = v_route.x;
    float _sub_rw = route_width * 5.0;
    float _a = (_rx - route_width * 10.0);
    float _b = (_rx - _sub_rw);
    float _c = (_rx + _sub_rw);
    float _d = (_rx + route_width * 10.0);
    vec4 _water = texture2D(ocean_texture, v_uv * 50.0) * (smoothstep(0.0, 0.007, f_amount) - smoothstep(0.001, 0.009, f_amount));
    vec4 _sandy = texture2D(sandy_texture, v_uv * 20.0) * (smoothstep(0.004, 0.010, f_amount) - smoothstep(0.006, 0.070, f_amount));
    vec4 _grass = texture2D(grass_texture, v_uv * 59.0) * (smoothstep(0.010, 0.070, f_amount) - smoothstep(0.050, 0.450, f_amount));
    vec4 _rocky = texture2D(rocky_texture, v_uv * 60.0) * (smoothstep(0.120, 0.450, f_amount) - smoothstep(0.400, 0.900, f_amount));
    vec4 _col = vec4(0.0, 0.0, 0.0, 1.0) + _water + _sandy + _grass + _rocky;
    vec4 _route = texture2D(route_texture, v_uv * 30.0);
    float k = (smoothstep(_a, _b, f_uvx) - smoothstep(_c, _d, f_uvx));
    _col *= 1.0 - k;
    _route *= k;
    _col += _route;
    _col.a = smoothstep(0.0, 0.01, f_amount);
    gl_FragColor = _col;
}
