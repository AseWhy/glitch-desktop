#ifdef GL_ES
  precision mediump float;
#endif

#define LINE_RADIUSES 7
#define D_OFFSET 5.0

uniform int       u_step;               // шаг отрисовки
uniform float     u_random;             // Рандомное число кадра
uniform sampler2D u_texture;            // семплер текстуры
uniform vec2      u_texture_resolution; // разрешение текстуры
uniform vec2      u_resolution;         // разрешение экрана
uniform int       u_glitch_power;       // сила помех
uniform vec4      u_gliches[5];         // данные гличей

//gl_FragCoord - координаты отрисовки

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
  float u_fl = mod(float(u_step), u_resolution.y);
  
  if(u_glitch_power >= 0){
    gl_FragColor = getPoint(floor(gl_FragCoord.x), floor(gl_FragCoord.y));
  }

  if(u_glitch_power >= 1)
    if(
      int(gl_FragCoord.y) - LINE_RADIUSES < int(u_resolution.y * u_fl) &&
      int(gl_FragCoord.y) + LINE_RADIUSES > int(u_resolution.y * u_fl)
    ){
      gl_FragColor = getPoint(floor(gl_FragCoord.x + D_OFFSET), floor(gl_FragCoord.y)) + vec4(0.03, 0.0, 0.0, 0.0); 
    }else
      if(u_glitch_power >= 2)
        if(isGliched(floor(gl_FragCoord.x), floor(gl_FragCoord.y))){
          gl_FragColor = getPoint(floor(gl_FragCoord.x + u_random), floor(gl_FragCoord.y));
        }else
          if(u_glitch_power >= 3)
            if(mod(floor(gl_FragCoord.y), 2.0) != 0.0)
              gl_FragColor = getPoint(floor(gl_FragCoord.x), floor(gl_FragCoord.y));
            else
              gl_FragColor = getPoint(floor(gl_FragCoord.x + u_random), floor(gl_FragCoord.y)) - vec4(0.1, 0.1, 0.1, 0.0);
}