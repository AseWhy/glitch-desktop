(() => {
    'use strict';

    const   GLITCH_CANVAS   = document.getElementById("glitch"),
            UI_CANVAS       = document.getElementById("ui"),
            GL              = GLITCH_CANVAS.getContext("webgl2"),
            UI_CTX          = UI_CANVAS.getContext("2d"),
            buffer          = GL.createBuffer(),
            loader          = new ShaderDump(GL);

    let programs,
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

    function getGliches(){
        return [
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random()
        ]
    }

    let i = 0;

    function drawUi(delta){
        // Int Overflow Protection
        if(i >= Number.MAX_SAFE_INTEGER)
            i = 0;

            UI_CTX.clearRect(0, 0, UI_CTX.canvas.width, UI_CTX.canvas.height);

        emmitMessage(
            'onDraw',
            UI_CTX,
            i,
            delta,
            SETTINGS.ui_offset_x * window.screen.width + window.screen.availLeft,
            SETTINGS.ui_offset_y * window.screen.height + window.screen.availTop
        )

        i++;
    }

    startrender = () => {
        let d_tex_w = 0,
            d_tex_h = 0;

        const unit_btm = 0;

        //#region Textures
        let bitmap = GL.createTexture();
        let image = null;

        GL.bindTexture(GL.TEXTURE_2D, bitmap);
        
        (update_texture = () => {
            getTexture(data => {
                d_tex_w = data.width;
                d_tex_h = data.height;

                GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, data);

                image = data;
            });
        })();

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
        let last = Date.now();
        let delta = 0;
        let renderallow = true;

        stoprender = () => renderallow = false;

        // draw
        function draw(){
            // Float Overflow Protection
            if(step_c >= 2139095039)
                step_c = 0;

            delta = Date.now() - last

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
                GL.uniform1f(random, 10 + Math.floor(Math.random() * 5));

                GL.uniform4fv(gliches, getGliches());
            }
            
            // draw particle
            GL.drawArrays(GL.TRIANGLE_STRIP, 0, 4);

            if(SETTINGS.ui)
                drawUi(delta);
            else
                UI_CTX.clearRect(0, 0, UI_CTX.canvas.width, UI_CTX.canvas.height);

            step_c += delta / 16.66666;
            last = Date.now();

            frames++;

            if(renderallow)
                requestAnimationFrame(draw);
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
})()