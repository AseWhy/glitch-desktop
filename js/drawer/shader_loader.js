'use strict';

function FromLocal(url){
    return new Promise((res, rej) => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);

        xhr.send();
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;
            
            if (xhr.status === 200 || xhr.status === 0) {
                res(xhr.responseText);
            } else {
                console.log(xhr.status)
                rej(xhr.status);
            }
        }
    });
}

function createShader(gl, sourceCode, type) {
    let shader = GL.createShader(type);
    GL.shaderSource(shader, sourceCode);
    GL.compileShader(shader);

    if ( !GL.getShaderParameter(shader, GL.COMPILE_STATUS) ) {
        let info = GL.getShaderInfoLog( shader );
        throw 'Could not compile WebGL program. \n\n' + info;
    }

    return shader;
}

function toProgram(gl, vx, fg){
    let program = GL.createProgram();

    GL.attachShader(program, createShader(gl, vx, GL.VERTEX_SHADER));
    GL.attachShader(program, createShader(gl, fg, GL.FRAGMENT_SHADER));

    GL.linkProgram(program);

    if ( !GL.getProgramParameter( program, GL.LINK_STATUS) ) {
        let info = GL.getProgramInfoLog(program);
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
    constructor(){
        this.headers = [];
        this.result_v  = null;
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

            console.log(header)

            // safty value
            buffer.fill(false);

            function FLoad(i){
                load(dataline[i], "vertex").then(data =>{
                    buffer[i * 2] = data;
                    
                    if(buffer[i * 2] && buffer[i * 2 + 1])
                        programs[dataline[i]] = toProgram(GL, buffer[i * 2], header + buffer[i * 2 + 1]);
                    
                    if(checkAll(buffer)){
                        self.result_v = programs;
                        res(programs);
                    }
                });

                load(dataline[i], "fragment").then(data =>{
                    buffer[i * 2 + 1] = data;
                    
                    if(buffer[i * 2] && buffer[i * 2 + 1])
                    programs[dataline[i]] = toProgram(GL, buffer[i * 2], header + buffer[i * 2 + 1]);
                    
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