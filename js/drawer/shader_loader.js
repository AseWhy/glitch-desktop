'use strict';

function createShader(gl, sourceCode, type) {
    let shader = gl.createShader(type);

    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog( shader );

        throw 'Could not compile WebGL program. \n\n' + info;
    }

    return shader;
}

function toProgram(gl, vx, fg){
    let program = gl.createProgram();

    gl.attachShader(program, createShader(gl, vx, gl.VERTEX_SHADER));
    gl.attachShader(program, createShader(gl, fg, gl.FRAGMENT_SHADER));

    gl.linkProgram(program);

    if (!gl.getProgramParameter( program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);

        throw 'Could not compile WebGL program. \n\n' + info;
    }

    return program;
}

class Header{
    constructor(title, value){
        this.title = title;
        this.value = value;
    }
}

class ShaderDump{
    constructor(GL){
        this.headers = [];
        this.result_v  = null;
        this.gl = GL;
    }

    clear(){
        this.result_v = null;
    }

    setHeader(header, value){
        this.headers.push(new Header(header, value));
    }

    result(name){
        return this.result_v[name];
    }

    load(dataline){
        if(!(dataline instanceof Array))
            dataline = [dataline];

        let self = this;

        function checkAll(dataline){
            for(let i = 0;i < dataline.length;i++)
                if(!dataline[i]) return false;
            return true;
        }

        function getHeaders(){
            let heap = '';
    
            for(let i = 0;i < self.headers.length;i++){
                heap += "#define " + self.headers[i].title + " " + (typeof self.headers[i].value === "string" ? '"' + self.headers[i].value + '"' : self.headers[i].value) + "\n";
            }
    
            return heap;
        }

        return new Promise((res, rej) => {
            let load        = (name, type) => FromLocal("js/shaders/"+name+"/"+type+".glsl"),
                programs    = {},
                buffer      = new Array(dataline.length * 2),
                header      = getHeaders();

            // safty value
            buffer.fill(false);

            function FLoad(i){
                load(dataline[i], "vertex").then(data =>{
                    buffer[i * 2] = data;
                    
                    if(buffer[i * 2] && buffer[i * 2 + 1])
                        programs[dataline[i]] = toProgram(self.gl, buffer[i * 2], header + buffer[i * 2 + 1]);
                    
                    if(checkAll(buffer)){
                        self.result_v = programs;
                        res(programs);
                    }
                });

                load(dataline[i], "fragment").then(data =>{
                    buffer[i * 2 + 1] = data;
                    
                    if(buffer[i * 2] && buffer[i * 2 + 1])
                    programs[dataline[i]] = toProgram(self.gl, buffer[i * 2], header + buffer[i * 2 + 1]);
                    
                    if(checkAll(buffer)){
                        self.result_v = programs;

                        res(programs);
                    }
                });
            }
            
            for(let i = 0;i < dataline.length;i++)
                FLoad(i);
        });
    }
}