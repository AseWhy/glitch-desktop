const isPowerOf2 = n => n == 1 || (n & (n-1)) == 0
	, range = 15
	, distace = 1;

function mod(a, b){
	let full = a / b;
	return full - Math.floor(full);
}

function getMountTag(index){
	switch(index){
		case 0:
            return "January";
		case 1:
            return "February";
		case 2:
            return "March";
		case 3:
            return "April";
		case 4:
            return "May";
		case 5:
            return "June";
		case 6:
            return "July";
		case 7:
            return "August";
		case 8:
            return "September";
		case 9:
            return "October";
		case 10:
            return "November";
		case 11:
            return "December";
	}
}

exports = class Plugin extends UIPugin {
	constructor(path){
		super('Audio', path);

		const self = this;

		self.audio_buffer = [];
		self.smooth_buffer = [];
		self.track_info = "Unknown track - Unknown artist";
		self.fps = [];
		self.drawviso = false;
		self.speed = 0;
		self.smiles = [
            "⚊",
            "⚌",
            "☰",
		]
    }
    
    onAudioData(buffer, speed, drawviso){
        this.drawviso = drawviso;
        this.speed = speed;
        this.audio_buffer = buffer;
    }

	onDraw(ctx, frame, delta, ox, oy){
		let date = new Date()
			, smile, fps, buffer_1, minutes, hours, leng, step, data, cur_step
			, x = ox + window.screen.availWidth * posit[SETTINGS.ui_align][0]
			, y = oy + window.screen.availHeight * posit[SETTINGS.ui_align][1]			
			, text_size = window.screen.availHeight * 0.015625
			, width = window.screen.availWidth * 0.4
			, height = window.screen.availHeight * 0.2;

		this.fps.push(delta / 16.6666 * 60);

		if(this.fps.length > 60)
			this.fps.splice(0, 1);

        fps = "fps: " + average(this.fps).toFixed(0);

        if(this.track_info.length > range)
            buffer_1 = 
                this.track_info.substring(mod(frame, 256) * (this.track_info.length - range), mod(frame, 256) * (this.track_info.length - range) + range)  + "  " + fps;
        else
            buffer_1 = this.track_info  + "  " + fps;

        data = "Now " + date.getDate() + "th " + getMountTag(date.getMonth()) + ", " + date.getFullYear();

        ctx.font = text_size + "px Cyberpunk"
        
        ctx.fillStyle = SETTINGS.ui_text_color;
        ctx.strokeStyle = SETTINGS.ui_text_color;

        // now track
        ctx.fillText(
            buffer_1,
            width - ctx.measureText(buffer_1).width - 15 + x,
            height - 18 + y
        );

        ctx.font = (window.screen.availHeight * 0.1) + "px Pixeles"

        // Time
        minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
        hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();

        ctx.fillText(
            hours,
            x + 15,
            (window.screen.availHeight * 0.05) + y
        );

        leng = ctx.measureText(minutes).width;

        ctx.fillText(
            minutes,
            x + 15,
            (window.screen.availHeight * 0.15) + y
        );

        ctx.font = text_size + "px Cyberpunk"
        // Date 
        ctx.fillText(
            data,
            x + leng + 30,
            height - 18 + y
        );

        // ownername
        ctx.font = text_size + "px Cyberpunk"

        ctx.fillText(
            SETTINGS.ownername,
            x + (leng / 2) - (ctx.measureText(SETTINGS.ownername).width / 2) + 15,
            height - 18 + y
        );

        if(this.drawviso){
            // -***
			step = (width * 0.75) / (SETTINGS.rects) - distace;
			cur_step = 0;

            // separator

            ctx.font = text_size + "px Calibri";
            
            smile = "--- " + this.smiles[Math.round((this.smiles.length - 1) * (this.speed > 0 ? this.speed : 0))] + " ---";

            ctx.fillText(
                smile,
                x + (leng / 2) - (ctx.measureText(smile).width / 2) + 15,
                y + (window.screen.availHeight * 0.05) + (text_size)
            );

            for(let i = 0, dh = 0;i < SETTINGS.rects;i++){
                dh = 1 + this.audio_buffer[i] * (ctx.canvas.height * 0.175);

                ctx.fillRect(
                    x + cur_step + leng + 30,
                    y + height * 0.75 - dh,
                    step,
                    dh
                );

                cur_step += distace + step;
            }
        } else {
			// separator
			
            ctx.font = text_size + "px Calibri";

            smile = "--  --";

            ctx.fillText(
                smile,
                x + (leng / 2) - (ctx.measureText(smile).width / 2) + 15,
                y + (window.screen.availHeight * 0.05) + (text_size)
            );
        }
	}
}