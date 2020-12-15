#ifdef GL_ES
  precision mediump float;
#endif

#define LINE_RADIUSES 12
#define D_OFFSET 5.0

uniform int       u_step;               // шаг отрисовки
uniform float     u_random;             // Рандомное число кадра
uniform sampler2D u_texture;            // семплер текстуры
uniform vec2      u_texture_resolution; // разрешение текстуры
uniform vec2      u_resolution;         // разрешение экрана
uniform int       u_glitch_power;       // сила помех
uniform vec4      u_gliches[5];         // данные гличей

float f_mod(float x, float y) {
    return x / y - floor(x / y);
}

vec4 getPoint(float x, float y){
    return texture2D(
        u_texture,
        vec2(
            u_resolution.x <= u_texture_resolution.x ? x / u_texture_resolution.x : (x - ((u_resolution.x - u_texture_resolution.x) / 2.0) / u_texture_resolution.x),
            u_resolution.y <= u_texture_resolution.y ? (u_resolution.y - y) / u_texture_resolution.y : ((u_resolution.y - y - ((u_resolution.y - u_texture_resolution.y) / 2.0)) / u_texture_resolution.y)
        )
    );
}

bool isGliched(float x, float y){
    float cx = u_resolution.x * 0.4,
            cy = u_resolution.y * 0.2;

    for(int i = 0;i < 5;i++){
        if(
            x - (u_gliches[i].b * cx / 2.0) < u_gliches[i].x * u_resolution.x &&
            x + (u_gliches[i].b * cx / 2.0) > u_gliches[i].x * u_resolution.x &&
            y - (u_gliches[i].a * cy / 2.0) < u_gliches[i].y * u_resolution.y &&
            y + (u_gliches[i].a * cy / 2.0) > u_gliches[i].y * u_resolution.y
        )
        return true;
    }
    return false;
}


void main(void) {
    float u_fl = f_mod(float(u_step), u_resolution.y);

    if(u_glitch_power >= 0){
        gl_FragColor = getPoint(floor(gl_FragCoord.x), floor(gl_FragCoord.y));
    }

    if(u_glitch_power >= 1)
        if(
            int(gl_FragCoord.y) - LINE_RADIUSES < int(u_resolution.y * u_fl) &&
            int(gl_FragCoord.y) + LINE_RADIUSES > int(u_resolution.y * u_fl)
        ){
            gl_FragColor = getPoint(floor(gl_FragCoord.x + D_OFFSET), floor(gl_FragCoord.y)) + vec4(0.05, 0.0, 0.0, 0.0);
        } else if(u_glitch_power >= 2) {
            if(isGliched(floor(gl_FragCoord.x), floor(gl_FragCoord.y))) {
                if(u_glitch_power >= 4) {
                    vec4 color = getPoint(floor(gl_FragCoord.x + u_random), floor(gl_FragCoord.y));

                    float a = (color.r + color.g + color.b) / float(3);

                    gl_FragColor = vec4(a, a, a, 1);
                } else {
                    gl_FragColor = getPoint(floor(gl_FragCoord.x + u_random), floor(gl_FragCoord.y));
                }
            } else if(u_glitch_power >= 3) {
                if(mod(floor(gl_FragCoord.y), 2.0) != 0.0) {
                    gl_FragColor = getPoint(floor(gl_FragCoord.x), floor(gl_FragCoord.y));
                } else {
                    if(u_glitch_power >= 4 && u_fl > u_gliches[0].a && u_fl < u_gliches[0].b) {
                        gl_FragColor = getPoint(floor(gl_FragCoord.x + u_random * f_mod(gl_FragCoord.y, float(LINE_RADIUSES))), floor(gl_FragCoord.y)) - vec4(0.1, 0.1, 0.1, 0.0);
                    } else {
                        gl_FragColor = getPoint(floor(gl_FragCoord.x + u_random), floor(gl_FragCoord.y)) - vec4(0.1, 0.1, 0.1, 0.0);
                    }
                }
            }
        }
}