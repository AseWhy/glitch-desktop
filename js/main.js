window.plugins = new Array();

class UIPugin {
    constructor(id, path){
        this.id = id;
        this.path = path;
        this.disabled = false;

        window.plugins.push(this);
    }

    onEnable(){

    }

    onDisable(){

    }

    onDraw(ctx, frame_index, delta){

    }
}

function emmitMessage(message, ...args) {
    for(let i = 0, leng = window.plugins.length; i < leng; i++) 
        if(!window.plugins[i].disabled) window.plugins[i][message](...args);
}

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
                rej(xhr.status);
            }
        }
    });
}

async function loadPlugin(path){
    try {
        const Source = '"use strict";let exports = null;' + await FromLocal(path) + ';return exports;'
            , Plugin = Function(Source).call({ UIPugin });

        if(UIPugin.isPrototypeOf(Plugin)){
            console.log('Plugin loaded successfully: ' + path);
    
            return new Plugin(path);
        } else {
            throw new Error("Plugin must be an UIPugin child.");
        }
    } catch (e) {
        console.error(e);

        notify('⚠ Error plugin loading', `An error occurred while loading the plugin '${path}', details can be found in the developer tools`, false, false, true)
    }
}

function setPluginState(id, state){
    console.log(id, state)

    for(let i = 0, leng = window.plugins.length; i < leng; i++)
        if(window.plugins[i].id === id) {
            switch(state){
                case 'disable':
                    if(!window.plugins[i].disabled) {
                        window.plugins[i].disabled = true;

                        window.plugins[i].onDisable();
                    }
                break;
                case 'enable':
                    if(window.plugins[i].disabled) {
                        window.plugins[i].disabled = false;

                        window.plugins[i].onEnable();
                    }
                break;
            }
        }
}

// Settings
let SETTINGS = localStorage.getItem('SETTINGS') != null ? JSON.parse(localStorage.getItem('SETTINGS')) : {
    ui: false,
    glitch_power: 3,
    path_to_img: "./img/default_0.jpg",
    img_size_policy: 1, // Nothing Stretch Increase
    ui_text_color: "yellow",
    ownername: "Anykey",
    ui_plugin_audio_allow: true,
    ui_offset_y: 0,
    ui_offset_x: 0,
    rects: 256,
    player_volume: 0.5,
    ui_align: 8 // bottom right
}, update_texture = () => {};

function UpdateSettings(){
    if(SETTINGS.ui_plugin_audio_allow){
        setPluginState('Audio', 'enable');
    } else {
        setPluginState('Audio', 'disable');
    }

    localStorage.setItem('SETTINGS', JSON.stringify(SETTINGS));
}

function field(name, content, attrs) {
    const element = document.createElement(name);

    element.append(content);

    for(let key in attrs) {
        element[key] = attrs[key];
    }

    return element;
}

function average(data){
    let   leng = data.length
        , index = leng - 1
        , summ = 0;
    
    while(index--)
        summ += data[index];

    return summ / leng;
}

function copyToClipboard(text) {
    const target = document.createElement('textarea');

    target.value = text;

    target.style.position = 'fixed'

    target.style.opacity = 0;

    target.style.width = 0;
    
    target.style.height = 0;

    target.style.top = 0;

    target.style.left = 0;

    target.style.pointerEvents = 'none'

    target.textContent = text;

    document.body.appendChild(target)

    target.focus();

    target.setSelectionRange(0, target.value.length);

    const succeed = document.execCommand("copy");

    document.body.removeChild(target);

    return succeed;
}

function notify(title, message, may_cancel = true, may_ok = true, timed = false) {
    return new Promise((res, rej) => {
        const not_cont = document.getElementById('ui_notify')
            , container = document.createElement('div')
            , header = document.createElement('div')
            , body = document.createElement('div')
            , control = document.createElement('div');

        let elems = 0;

        function resp(v){
            res(v);

            container.classList.add('hide');

            setTimeout(() => not_cont.removeChild(container), 250);
        }

        container.classList.add('ui_notify_row')
        header.classList.add('ui_notify_header');
        body.classList.add('ui_notify_body');
        control.classList.add('ui_notify_control');

        if(may_ok) {
            const ok = document.createElement('button');

            ok.append('OK');

            ok.classList.add('ui_notify_button', 'ui_notify_ok');

            ok.onclick = () => resp(true);

            control.append(ok);

            elems++;
        }

        if(may_cancel) {
            const cancel = document.createElement('button');

            ok.append('CANCEL');

            cancel.classList.add('ui_notify_button', 'ui_notify_cancel');

            cancel.onclick = () => resp(false);

            control.append(cancel);

            elems++;
        }

        if(timed) {
            setTimeout(() => resp(true), 5000);
        }

        switch(elems) {
            case 0:
                control.classList.add('zeroes');
            break;
            case 1:
                control.classList.add('ones');
            break;
        }

        container.append(header, body, control);
        
        header.append(title);
        body.append(message);

        not_cont.appendChild(container);
    })
}

(async (body = document.createElement('p')) => {
    let can_coppy = true;

    body.append(
        'Be sure to visit our page in the ',
        field('b', 'steam workshop'), ': ',
        field('a', 'click to copy the address to the clipboard', { 
            onclick: () => {
                if(can_coppy) {
                    copyToClipboard('https://steamcommunity.com/sharedfiles/filedetails/?id=2002507481');

                    notify('Copied successfully!', 'We copied the address of the item to your clipboard!', false, false, true)
                        .then(e => can_coppy = true);

                    can_coppy = false;
                }
            }
        }), ' ',
        'we would be glad to receive your',
        field('b', 'suggestions'), ' and ',
        field('b', 'wishes'), '. ',
        'I would also be grateful if you appreciate this work. ',
        'All the best to you "',
        field('b', 'Glitch desktop'), '" developer - ',
        field('b', 'FFDP p1ramidka'), '. ',
        'This message will no longer be shown after selecting the "',
        field('b', 'OK'),
        '" option.'
    )

    if(localStorage.getItem('welcome_message') !== 'true' && await notify('Thank you for being with us', body, false)) {
        localStorage.setItem('welcome_message', 'true');
    }
})();

(() => {
    let steps, speed, last_avg, drawviso;

    window.wallpaperRegisterAudioListener && window.wallpaperRegisterAudioListener(data => {
        let max_value = 0;
        let step = 63 / SETTINGS.rects, cur_step = 0;
        let cs = 0;
        let buffer = [];
    
        for(var i = 0;i < 63;i++){
            if(data[i] > max_value)
                max_value = data[i];
        }
    
        for(let i = 0;i < SETTINGS.rects;i++){
            cs = Math.round(cur_step);
    
            buffer[i] = data[cs] / max_value;
    
            cur_step += step;
        }
    
        speed = average(data) / max_value;
    
        if(speed === last_avg){
            steps++;
    
            if(steps == 2){
                drawviso = false;
                steps = 0;
            }
        }else{
            drawviso = true;
            steps = 0;
        }
    
        last_avg = speed;

        emmitMessage('onAudioData', buffer, speed, drawviso)
    });
})()

window.wallpaperPropertyListener = {
    applyUserProperties: (properties) => {
        console.log("🚀 ~ file: index.html ~ line 46 ~ properties", properties, SETTINGS)

        if(properties.ui_glitch_power != undefined)
            SETTINGS.glitch_power = parseInt(properties.ui_glitch_power.value);

        if(properties.ui_img_size_policy != undefined){
            SETTINGS.img_size_policy = properties.ui_img_size_policy.value;

            // Immidiate function
            setTimeout(update_texture, 0);
        }
        
        if(properties.ui_path_to_img != undefined){
            SETTINGS.path_to_img = "file:///" + properties.ui_path_to_img.value;

            // Immidiate function
            setTimeout(update_texture, 0);
        }

        if(properties.ui_rects != undefined){
            SETTINGS.rects = parseInt(properties.ui_rects.value);
        }

        if(properties.ui_ui_align != undefined){
            SETTINGS.ui_align = parseInt(properties.ui_ui_align.value);
        }

        if(properties.ui_ui_text_color != undefined){
            let color = properties.ui_ui_text_color.value.split(" ");

            SETTINGS.ui_text_color = `rgb(${parseFloat(color[0]) * 255}, ${parseFloat(color[1]) * 255}, ${parseFloat(color[2]) * 255})`;
        }

        if(properties.ui_ownername != undefined){
            SETTINGS.ownername = properties.ui_ownername.value;
        }

        if(properties.ui_draw_allow != undefined){
            SETTINGS.ui = properties.ui_draw_allow.value;
        }

        if(properties.ui_wp_index != undefined && properties.ui_wp_index.value != undefined){
            SETTINGS.path_to_img = properties.ui_wp_index.value;

            update_texture();
        }

        if(properties.ui_offset_y != undefined) {
            SETTINGS.ui_offset_y = properties.ui_offset_y.value;
        }

        if(properties.ui_offset_x != undefined) {
            SETTINGS.ui_offset_x = properties.ui_offset_x.value;
        }

        if(properties.ui_plugin_audio_allow != undefined) {
            SETTINGS.ui_plugin_audio_allow = properties.ui_plugin_audio_allow.value;
        }

        UpdateSettings();
    }
}


// Screen Position Table
const posit = [
//    left       center        right
    [0, 0.05], [0.3, 0.05], [0.6, 0.05], // up
    [0, 0.4], [0.3, 0.4], [0.6, 0.4],    // center
    [0, 0.8], [0.3, 0.8], [0.6, 0.8]     // down
];

window.addEventListener('load', async () => {
    await loadPlugin('plugins/audio.js');
})