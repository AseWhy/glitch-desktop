let event = new Event("click");
document.dispatchEvent(event);

function convertMS(ms) {
    var d, h, m, s;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    d = Math.floor(h / 24);
    h = h % 24;
    h += d * 24;
    return (h > 0 ? (h > 9 ? h : "0" + h) + ":" : "") + (m > 0 ? (m > 9 ? m : "0" + m) + ":": "") + (s > 9 ? s : "0" + s);
}

class SCPlayerData {
    constructor (player, chuncks){
        this.src = chuncks;
    }
}

class SCHLSPlayerData {
    constructor (player, chuncks){
        this.srcArray = [];
        this.player = player;

        this.duration = 0;
        this.action = 0; // current chunck 
    }

    nextChunck(){
        let a = this.srcArray[this.action];
        this.action ++;
        return a;
    }
}

class SCPalyer {
    constructor (){
        this.src = null; // SCHLSPlayerData | SCPlayerData

        this.player = new Audio();
        this.listenters = {
            error: [],
            playend: [],
            playstart: []
        };
    }

    mp3 (url) {

    }

    hls (url){

    }

    on (type, callback) {
        if(typeof callback != "function") 
            throw "callback can have only a function type";
    
        switch(type){
            case "error": 
                this.listeners.onerror.push(callback);
            break;
            case "playstart":
                this.listeners.onplaystart.push(callback);
            break;
            case "playend":
                this.listeners.onplayend.push(callback);
            break;
        }
    }

    play () {

    }

    pause () {

    }
}

class SCMediaType {
    constructor (type, client){
        let _ = this;
        this.url = type.url;
        this.protocol = type.format.protocol;
        this.mime_type = type.format.mime_type;
        this.quality = type.quality;
        this.preset = type.preset;
        this.client = client;
    }

    GetStream(){
        return new Promise((res, rej) => {
            fetch(this.url + "?client_id=" + this.client.client.client_id).then(res => res.json()).then(data => {
                res(data.url);
            });
        })
    }
}

class SCUser {
    constructor(userdata){
        if(userdata.kind != "user")
            throw "Invalid user object passed to constructor";

        this.avatar_url = userdata.avatar_url;
        this.city = userdata.city;
        this.created_at = new Date(userdata.created_at);
        this.full_name = userdata.full_name
        this.first_name = userdata.first_name;
        this.last_name = userdata.last_name;
        this.username = userdata.username;
        this.verified = userdata.verified;
        this.urn = userdata.urn;
    }
}

class SCTrack {
    constructor(stream, client){
        if(stream.kind != "track")
            throw "Invalid track object passed to constructor";

        this.duration = {
            full: convertMS(stream.full_duration),
            ms: stream.full_duration,
            sec: stream.full_duration / 1000,
            min: stream.full_duration / 1000 / 60
        }

        this.created_at = new Date(stream.created_at);
        this.title = stream.title;
        this.description = stream.description;
        this.genre = stream.genre;
        this.id = stream.id;
        this.last_modified = stream.last_modified;
        this.publicer = new SCUser(stream.user);
        this.client = client;
        this.media = [];

        for(let i = 0;i < stream.media.transcodings.length;i++){
            this.media[i] = new SCMediaType(stream.media.transcodings[i], client);
        }
    }

    GetPlayTime(){
        return convertMS(this.client.player.currentTime * 1000) + " / " +  this.duration.full;
    }

    Play(){
        for(let i = 0;i < this.media.length;i++){
            if(this.media[i].protocol == "progressive"){
                this.media[i].GetStream().then((stream) => {
                    this.client.player.src = stream;
                    this.client.player.play();
                })
                return true;
            }
        }
        return false;
    }
}

class SCPlayList {
    constructor (data) {
        if(data != undefined){
            this.last_modified = data.last_modified;
            this.title = data.title;
            this.publicer = new SCUser(data.user);
        }

        this.remove_after_play = true;
        this.tracks = [];
        this.listeners = {
            onerror: [],
            onplaystart: [],
            onplayend: [],
            onsqempty: []
        }
    }

    AddTrack(track){
        if(!(track instanceof SCTrack))
            throw "Track object must be transferred [SCTrack]";

        this.tracks.push(track);
    }

    Play(){
        let _ = this, next = null;
        
        function invoke(list, arg){
            for(let i = 0;i < _.listeners["on" + list].length;i++){
                _.listeners["on" + list][i](arg);
            }
        }

        function PlayNext(i){
            invoke("playstart", _.tracks[i]);

            if(!_.tracks[i].Play())
                next();

            next = () => {
                console.log(_.tracks);

                invoke("playend", _.tracks[i]);

                if(_.remove_after_play)
                    _.tracks.splice(0, 1);

                if(0 == _.tracks.length){
                    invoke("sqempty");
                    
                    if(0 == _.tracks.length) return;
                }
                    
                PlayNext(!_.remove_after_play ? i + 1 : i);
            }

            _.tracks[i].client.player.onended = () => {
                next();
            };
        }
        

        PlayNext(0);

        return {
            next: next
        }
    }

    coppy(playlist){
        if(!(playlist instanceof SCPlayList))
            throw "Playlist object must be transferred [SCPlayList]";

        let _ = this;

        for(let i = 0;i < _.tracks.length;i++){
            playlist.AddTrack(_.tracks[i]);
        }
    }

    on(type, callback){
        if(typeof callback != "function") 
            throw "callback can have only a function type";
        
        switch(type){
            case "error": 
                this.listeners.onerror.push(callback);
            break;
            case "playstart":
                this.listeners.onplaystart.push(callback);
            break;
            case "playend":
                this.listeners.onplayend.push(callback);
            break;
            case "sqempty":
                this.listeners.onsqempty.push(callback);
            break;
        }
    }
}

class SCFindResult {
    constructor(searcher){
        this.users = [];
        this.playlists = [];
        this.tracks = [];
        this.next = searcher;
    }

    AddTrack(track){
        if(!(track instanceof SCTrack))
            throw "Track object must be transferred [SCTrack]";

        this.tracks.push(track);
    }

    AddUser(user){
        if(!(user instanceof SCUser))
            throw "User object must be transferred [SCUser]";

        this.users.push(user);
    }

    AddPlayList(list){
        if(!(list instanceof SCPlayList))
            throw "Playlist object must be transferred [SCPlayList]";

        this.playlists.push(list);
    }

    TurnToPlaylist(){
        let _ = this;
        let List = new SCPlayList();

        for(let i = 0;i < _.tracks.length;i++){
            List.AddTrack(_.tracks[i]);
        }

        List.on("sqempty", () => {
            _.next().then(data => {
                data.TurnToPlaylist().coppy(List);
            })
        });

        return List;
    }
}

class SoundCloundClient {
    constructor(){
        let _ = this;

        _.loaded = false;

        function invoke(type){
            for(let i = 0;i < _.listeners["on" + type].length;i++)
                _.listeners["on" + type][i]();
        }

        // Get's public api key and user token
        fetch("https://a-v2.sndcdn.com/assets/48-c9b6f63b-3.js").then(res => res.text()).then(data => {
            data = eval("({" + data.substring(244, data.indexOf("}", 244)).replace("r(27).MS_IN_HOUR", "0") + "})");

            _.client = data;
            _.loaded = true;

            invoke("load");
        });

        _.locale = "en";
        _.search_limit = 10

        _.listeners = {
            onload: [],
            onerror: []
        }

        _.player = new Audio();
    }

    on(type, callback){
        if(typeof callback != "function") 
            throw "callback can have only a function type";
            
        switch(type){
            case "load": 
                if(this.loaded)
                    callback();
                else
                    this.listeners.onload.push(callback);
            break;
            case "error": this.listeners.onerror.push(callback); break;
        }
    }

    find(query, offset = 0, dgenre){
        if(this.loaded){
            let _ = this;

            dgenre = dgenre ? "/" + dgenre : "/tracks";

            let url = this.client.api_v2_host 
                + 'search'
                + dgenre
                + '?q=' + encodeURIComponent(query) 
                + '&client_id=' 
                + this.client.client_id 
                + '&offset=' 
                + offset 
                + '&app_locale=' 
                + this.locale 
                + '&limit='
                + this.search_limit;

            let result = new SCFindResult(() => {
                offset += 10;
                return _.find(query, offset, dgenre);
            });

            function request(url){
                return new Promise((res, rej) => {
                    fetch(url).then(res => res.json()).then(data => {
                        for(let i = 0;i < data.collection.length;i++){
                            switch(data.collection[i].kind){
                                case "user": result.AddUser(new SCUser(data.collection[i], _)); break;
                                case "track": result.AddTrack(new SCTrack(data.collection[i], _)); break;
                                case "playlist": result.AddPlayList(new SCPlayList(data.collection[i], _)); break;
                                default: break;
                            }
                        }
    
                        res(result)
                    });
                })
            }

            return request(url);
        }else
            console.error("Unable to send search request, client is not ready yet");
    }
}

