'use strict';

const   GLITCH_CANVAS   = document.getElementById("glitch"),
        UI_CANVAS       = document.getElementById("ui"),
        GL              = GLITCH_CANVAS.getContext("webgl2"),
        UI_CTX          = UI_CANVAS.getContext("2d"),
        buffer          = GL.createBuffer(),
        range           = 15,
        loader          = new ShaderDump();

let programs,
    ui_buffer = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        text_size: 0,
        audio_buffer: [],
        smooth_buffer: [],
        track_info: "Unknown track - Unknown artist",
        fps: "",
        data: "",
        buffer_1: "",
        minutes: "",
        hours: "",
        owner_name: "",
        leng: 0,
        smile: "",
        speed: 0,
        steps: 0,
        drawviso: false,
        last_avg: 0
    },
    frames = 0,
    smiles = [
        "⚊",
        "⚌",
        "☰",
    ],
    startrender = () => {},
    stoprender = () => {};

// normalise
window.onresize = () => {
    GL.canvas.width = window.innerWidth;
    GL.canvas.height = window.innerHeight;

    UI_CTX.canvas.width = window.innerWidth;
    UI_CTX.canvas.height = window.innerHeight;

    GL.viewport(0, 0, GL.canvas.width, GL.canvas.height);
}; window.onresize();

// bind buffers
GL.bindBuffer(GL.ARRAY_BUFFER, buffer);

// Full Screen buffer
GL.bufferData(GL.ARRAY_BUFFER, new Float32Array([
   -1.0, -1.0,
    1.0, -1.0,
   -1.0,  1.0,
    1.0,  1.0
]), GL.STATIC_DRAW);

let isPowerOf2 = n => n == 1 || (n & (n-1)) == 0,
    average = arr => arr.reduce((sume, el) => sume + el, 0) / arr.length;

// load main texture

function getTexture(callback){
    var image = new Image();

    image.crossOrigin = "Anonymous";
    image.src = SETTINGS.path_to_img;

    // Растянуть
    if(SETTINGS.img_size_policy == 1){
        image.width = window.innerWidth;
        image.height = window.innerHeight;

    // Подогнать
    } else if(SETTINGS.img_size_policy == 2){
        let coifx = (window.innerWidth / image.width),
            coify = (window.innerHeight / image.height);

        if(coifx > coify){
            image.width *= coifx;
            image.height *= coifx;
        } else {
            image.width *= coify;
            image.height *= coify;
        }
    }

    image.onload = function() {
        callback(image);
    }
};

function mod(a, b){
    let full = a / b;
    return full - Math.floor(full);
}

function getGliches(){
    return [
        Math.random(), Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(), Math.random(),
        Math.random(), Math.random(), Math.random(), Math.random()
    ]
}

let i = 0,
    step = 0,
    date = null,
    cur_step = 0,
    distace = 1;

function getMountTag(index){
    switch(index){
        case 0: return "January";
        case 1: return "February";
        case 2: return "March";
        case 3: return "April";
        case 4: return "May";
        case 5: return "June";
        case 6: return "July";
        case 7: return "August";
        case 8: return "September";
        case 9: return "October";
        case 10: return "November";
        case 11: return "December";
    }
}

function drawUi(fps, clear){
    date = new Date();

    ui_buffer.x = SETTINGS.ui_offset_x * window.screen.width + window.screen.availLeft + window.screen.availWidth * posit[SETTINGS.ui_align][0];
    ui_buffer.y = SETTINGS.ui_offset_y * window.screen.height + window.screen.availTop + window.screen.availHeight * posit[SETTINGS.ui_align][1];

    ui_buffer.text_size = window.screen.availHeight * 0.015625;
    ui_buffer.width = window.screen.availWidth * 0.4;
    ui_buffer.height = window.screen.availHeight * 0.2;

    ui_buffer.fps = "fps: " + fps;

    if(ui_buffer.track_info.length > range)
        ui_buffer.buffer_1 = 
            ui_buffer.track_info.substring(mod(i, 256) * (ui_buffer.track_info.length - range), mod(i, 256) * (ui_buffer.track_info.length - range) + range)  +
            "  " + ui_buffer.fps;
    else
        ui_buffer.buffer_1 = ui_buffer.track_info  + "  " + ui_buffer.fps;

    ui_buffer.data = "Now " + date.getDate() + "th " + getMountTag(date.getMonth()) + ", " + date.getFullYear();

    UI_CTX.font = ui_buffer.text_size + "px Cyberpunk"
    
    if(clear) 
        UI_CTX.clearRect(0, 0, UI_CTX.canvas.width, UI_CTX.canvas.height);
    
    UI_CTX.fillStyle = SETTINGS.ui_text_color;
    UI_CTX.strokeStyle = SETTINGS.ui_text_color;

    // now track
    UI_CTX.fillText(
        ui_buffer.buffer_1,
        ui_buffer.width - UI_CTX.measureText(ui_buffer.buffer_1).width - 15 + ui_buffer.x,
        ui_buffer.height - 11 + ui_buffer.y
    );

    UI_CTX.font = (window.screen.availHeight * 0.1) + "px Pixeles"

    // Time
    ui_buffer.minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    ui_buffer.hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();

    UI_CTX.fillText(
        ui_buffer.hours,
        ui_buffer.x + 15,
        (window.screen.availHeight * 0.05) + ui_buffer.y
    );

    ui_buffer.leng = UI_CTX.measureText(ui_buffer.minutes).width;

    UI_CTX.fillText(
        ui_buffer.minutes,
        ui_buffer.x + 15,
        (window.screen.availHeight * 0.15) + ui_buffer.y
    );

    UI_CTX.font = ui_buffer.text_size + "px Cyberpunk"
    // Date 
    UI_CTX.fillText(
        ui_buffer.data,
        ui_buffer.x + ui_buffer.leng + 30,
        ui_buffer.height - 11 + ui_buffer.y
    );

    // ownername
    UI_CTX.font = ui_buffer.text_size + "px Cyberpunk"

    UI_CTX.fillText(
        SETTINGS.ownername,
        ui_buffer.x + (ui_buffer.leng / 2) - (UI_CTX.measureText(SETTINGS.ownername).width / 2) + 15,
        ui_buffer.height - 11 + ui_buffer.y
    );

    if(ui_buffer.drawviso){
        // -***
        step = (ui_buffer.width * 0.75) / (SETTINGS.rects) - distace;
        cur_step = 0;

        // separator

        UI_CTX.font = ui_buffer.text_size + "px Calibri";
        
        ui_buffer.smile = "--- " + smiles[Math.round((smiles.length - 1) * (ui_buffer.speed > 0 ? ui_buffer.speed : 0))] + " ---";

        UI_CTX.fillText(
            ui_buffer.smile,
            ui_buffer.x + (ui_buffer.leng / 2) - (UI_CTX.measureText(ui_buffer.smile).width / 2) + 15,
            ui_buffer.y + (window.screen.availHeight * 0.05) + (ui_buffer.text_size)
        );

        for(let i = 0, dh = 0;i < SETTINGS.rects;i++){
            dh = 1 + ui_buffer.audio_buffer[i] * (UI_CTX.canvas.height * 0.175);

            UI_CTX.fillRect(
                ui_buffer.x + cur_step + ui_buffer.leng + 30,
                ui_buffer.y + ui_buffer.height * 0.75 - dh,
                step,
                dh
            );

            cur_step += distace + step;
        }
    } else {
        // separator

        UI_CTX.font = ui_buffer.text_size + "px Calibri";

        ui_buffer.smile = "--  --";

        UI_CTX.fillText(
            ui_buffer.smile,
            ui_buffer.x + (ui_buffer.leng / 2) - (UI_CTX.measureText(ui_buffer.smile).width / 2) + 15,
            ui_buffer.y + (window.screen.availHeight * 0.05) + (ui_buffer.text_size)
        );
    }
    i++;
}

window.wallpaperRegisterAudioListener && window.wallpaperRegisterAudioListener(data => {
    let max_value = 0;
    let step = 63 / SETTINGS.rects, cur_step = 0;
    let cs = 0;

    for(var i = 0;i < 63;i++){
        if(data[i] > max_value)
            max_value = data[i];
    }

    for(let i = 0;i < SETTINGS.rects;i++){
        cs = Math.round(cur_step);

        ui_buffer.audio_buffer[i] = data[cs] / max_value;

        cur_step += step;
    }

    ui_buffer.speed = average(data) / max_value;

    if(ui_buffer.speed === ui_buffer.last_avg){
        ui_buffer.steps++;

        if(ui_buffer.steps == 2){
            ui_buffer.drawviso = false;
            ui_buffer.steps = 0;
        }
    }else{
        ui_buffer.drawviso = true;
        ui_buffer.steps = 0;
    }

    ui_buffer.last_avg = ui_buffer.speed;
})

startrender = () => {
    let d_tex_w = 0,
        d_tex_h = 0;

    const unit_btm = 0;

    //#region Textures
    let bitmap = GL.createTexture();
    let image = null;

    GL.bindTexture(GL.TEXTURE_2D, bitmap);
    
    update_texture = () => {
        getTexture(data => {
            d_tex_w = data.width;
            d_tex_h = data.height;

            GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, data);

            image = data;
        });
    }

    update_texture();

    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
    //#endregion

    // uniforms
    let step         = GL.getUniformLocation(programs.particle, "u_step"),
        texture      = GL.getUniformLocation(programs.particle, "u_texture"),
        resolution_t = GL.getUniformLocation(programs.particle, "u_texture_resolution"),
        gliches      = GL.getUniformLocation(programs.particle, "u_gliches"),
        resolution   = GL.getUniformLocation(programs.particle, "u_resolution"),
        glitch_power = GL.getUniformLocation(programs.particle, "u_glitch_power"),
        random       = GL.getUniformLocation(programs.particle, "u_random");

    // attrs random
    let position = GL.getAttribLocation(programs.particle, "a_position");

    // other
    let step_c = 0;
    let FPS = 0;
    let last = Date.now();
    let renderallow = true;

    stoprender = () => renderallow = false;

    setInterval(() => {
        FPS = frames;
        frames = 0;
    }, 1000);

    // draw
    function draw(){
        // Float Overflow Protection
        if(step_c >= 2139095039)
            step_c = 0;

        console.log(step_c)

        if(SETTINGS.glitch_power > 0){
            // clear
            GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
            GL.bindBuffer(GL.ARRAY_BUFFER, buffer);

            // program particle
            GL.useProgram(programs.particle);

            // active texture
            GL.uniform1i(texture, unit_btm);
            GL.activeTexture(GL.TEXTURE0 + unit_btm);
            GL.bindTexture(GL.TEXTURE_2D, bitmap);

            // attrs
            GL.enableVertexAttribArray(position);
            GL.vertexAttribPointer(position, 2, GL.FLOAT, false, 0, 0);

            // uniforms 
            GL.uniform1i(step, step_c);
            GL.uniform1i(glitch_power, SETTINGS.glitch_power)
            GL.uniform2f(resolution_t, d_tex_w, d_tex_h);
            GL.uniform2f(resolution, window.innerWidth, window.innerHeight);

            // random
            if(Math.floor(step_c) % (5 + Math.floor(Math.random() * 10)) == 0){
                GL.uniform1f(random, 10 + Math.floor(Math.random() * 5))
                GL.uniform4fv(gliches, getGliches());
            }
            
            // draw particle
            GL.drawArrays(GL.TRIANGLE_STRIP, 0, 4);

            if(SETTINGS.ui)
                drawUi(FPS, true);
            else
                UI_CTX.clearRect(0, 0, UI_CTX.canvas.width, UI_CTX.canvas.height);
        }else if(image != null){
            UI_CTX.drawImage(image, 0, 0, image.width, image.height)

            if(SETTINGS.ui)
                drawUi(FPS, false);
        }


        step_c += (Date.now() - last) / 16.66666;
        last = Date.now();

        frames++;

        if(renderallow) requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}

function UpdateShaders(){
    stoprender();

    loader.load("glitch").then(() => {
        programs = {
            particle: loader.result("glitch")
        };

        startrender();
    });
}

UpdateShaders();