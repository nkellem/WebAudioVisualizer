(function(){
		"use strict";
		
        //map function that maps one range of numbers to another
        //extends the base Number class so it can be called by any number variable
        //taken from user August Miller at http://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
        Number.prototype.mapRange = function(in_min, in_max, out_min, out_max) {
            return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        }
    
		var NUM_SAMPLES = 256;
        var music = ['media/AMFAD.mp3', 'media/PGSP.mp3', 'media/B.mp3']; //array that holds all of the paths for the songs
        var artist = "Noah Kellem"; //display name for the artist
        var songTitle; //variable that holds the song title so that it can be displayed
        var musicIndex = 0; //keeps track of the current song being played
		var audioElement; //holds the audio html element
		var analyserNode; //node from the Web Audio API that allows us the analyze audio data
		var canvas,ctx; //holds the canvas element and the drawing context
        var waveform = false; //these keep track of the current various states of the audio and canvas
        var paused = false;//
        var gradient = false;//
        var greyscale = false;//
        var bezier = false;//
        var colorGradient; //holds the color gradient to draw on the display
        var delayAmount = 0.0; //the delay effect value
        var delayNode; //node that allows us to apply the delay effect
        var bassAmount = 0.0; //the bass effect value
        var bassNode; //allows for the application of bass boost/decrease
        var trebleNode; //allows for the application of treble boost/decrease
        var trebleAmount = 0.0; //treble effect value
        var gainNode; //allows the volume to be turned up and down
        var dragging = false; //keeps track of whether or not the mouse is down
        var sp1; //speaker variables to hold speaker objects
        var sp2; //
        var audioCtx, sourceNode; //keep track of the audio context and allows us to start an audio change
        //object that holds everything to do with the radio
        var radio = {
            //various properties that keep track of the radio's general attributes
            ctx: undefined,
            canvas: undefined,
            WIDTH: 640, 
            HEIGHT: 400,
            x: undefined,
            y: 0,
            bodyColor: makeColor(79,49,39,1.0),
            buttonColor: makeColor(173,106,22,1.0),
            buttonTextColor: "black",
            //the display portion of the radio where the audio visualization occurs
            display: {
                //display attributes
                width: 540,
                height: 200,
                offsetX: 50,
                offsetY: 30,
                backgroundColor: makeColor(0,0,0,0.9),
                lineColor: makeColor(255,255,255, 0.1),
                //draw function that sets up the display on the canvas
                draw: function(ctx){
                    ctx.save();
                    //fills in the background of the display
                    ctx.strokeStyle = radio.buttonColor;
                    ctx.strokeRect(this.offsetX - 2, this.offsetY - 2, this.width + 4, this.height + 4);
                    ctx.fillStyle = this.backgroundColor;
                    ctx.fillRect(this.offsetX, this.offsetY, this.width,
                    this.height);
                    //sets up the grid on the display
                    ctx.fillStyle = this.lineColor;
                    for (var i = this.offsetX; i < this.width + this.offsetX - 1; i+= 10){
                        ctx.fillRect(i, this.offsetY, 1, this.height);
                    }
                    for(var i = this.offsetY; i < this.height + this.offsetY - 1; i += 10){
                        ctx.fillRect(this.offsetX, i, this.width, 1);
                    }
                    ctx.restore();
                },
            },
            //the previous song button
            prevButton: {
                //the attributes of the button
                width: 50,
                height: 30,
                border: 2,
                x: undefined,
                y: undefined,
                //method that draws the button
                draw: function(ctx){
                    //sets the correct display attributes for the button
                    this.x = canvas.width/2 - this.width*3;
                    this.y = radio.display.offsetY + radio.display.height + this.border*2;
                    ctx.save();
                    ctx.lineWidth = this.border;
                    ctx.strokeStyle = makeColor(38,38,38,1.0);
                    ctx.fillStyle = radio.buttonColor;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                    ctx.fillRect(this.x + this.border, this.y + this.border, this.width - this.border, this.height - this.border*2);
                    ctx.font = "20px Orbitron";
                    ctx.fillStyle = radio.buttonTextColor;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "center";
                    ctx.fillText("<<", this.x + this.width/2 + this.border/2, this.y + this.height/2 - this.border/2);  
                    
                    ctx.restore();
                },
            },
            //the pause song button
            pauseButton: {
                //attributes for the button
                width: 50,
                height: 30,
                border: 2,
                x: undefined,
                y: undefined,
                //method that draws the button on screen
                draw: function(ctx){
                    //sets the correct display attributes for the button
                    this.x = radio.prevButton.x + radio.prevButton.width;
                    this.y = radio.prevButton.y;
                    ctx.save();
                    ctx.lineWidth = this.border;
                    ctx.strokeStyle = makeColor(38,38,38,1.0);
                    ctx.fillStyle = radio.buttonColor;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                    ctx.fillRect(this.x + this.border, this.y + this.border, this.width - this.border, this.height - this.border*2);
                    ctx.font = "20px Orbitron";
                    ctx.fillStyle = radio.buttonTextColor;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "center";
                    ctx.fillText("I I", this.x + this.width/2, this.y + this.height/2);  
                    
                    ctx.restore();
                },
            },
            //the next song button
            nextButton: {
                //attributes for the button
                width: 50,
                height: 30,
                border: 2,
                x: undefined,
                y: undefined,
                //method that draws the button on screen
                draw: function(ctx){
                    //sets the correct display attributes for the button
                    this.x = radio.pauseButton.x + radio.pauseButton.width;
                    this.y = radio.pauseButton.y;
                    ctx.save();
                    ctx.lineWidth = this.border;
                    ctx.strokeStyle = makeColor(38,38,38,1.0);
                    ctx.fillStyle = radio.buttonColor;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                    ctx.fillRect(this.x + this.border, this.y + this.border, this.width - this.border, this.height - this.border*2);
                    ctx.font = "20px Orbitron";
                    ctx.fillStyle = radio.buttonTextColor;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "center";
                    ctx.fillText(">>", this.x + this.width/2, this.y + this.height/2 - this.border/2); 
                    ctx.restore();
                },
            },
            //the button that toggles waveform display mode
            waveButton: {
                //attributes for the button
                width: 50,
                height: 30,
                border: 2,
                x: undefined,
                y: undefined,
                //method that draws the button on screen
                draw: function(ctx){
                    //sets the correct display attributes for the button
                    this.x = radio.nextButton.x + radio.nextButton.width;
                    this.y = radio.nextButton.y;
                    ctx.save();
                    ctx.lineWidth = this.border;
                    ctx.strokeStyle = makeColor(38,38,38,1.0);
                    ctx.fillStyle = radio.buttonColor;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                    ctx.fillRect(this.x + this.border, this.y + this.border, this.width - this.border * 2, this.height - this.border*2);
                    ctx.fillStyle = radio.buttonTextColor;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "center";
                    ctx.font = "12px Orbitron";
                    ctx.fillText("wave", this.x + this.width/2, this.y + this.height/2);
                    ctx.restore();
                },
            },
            //button that toggles on and off gradient fillStyle
            gradientButton: {
                //attributes for the button
                width: 50,
                height: 30,
                border: 2,
                x: undefined,
                y: undefined,
                //method that draws the button on screen
                draw: function(ctx){
                    //sets the correct display attributes for the button
                    this.x = radio.waveButton.x + radio.waveButton.width;
                    this.y = radio.waveButton.y;
                    ctx.save();
                    ctx.lineWidth = this.border;
                    ctx.strokeStyle = makeColor(38,38,38,1.0);
                    ctx.fillStyle = radio.buttonColor;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                    ctx.fillRect(this.x + this.border, this.y + this.border, this.width - this.border * 2, this.height - this.border*2);
                    
                    //create color gradient
                    var gradient = ctx.createLinearGradient(this.x + 10, 0, this.x + this.width - 15, 0);
                    gradient.addColorStop(0, "red");
                    gradient.addColorStop(0.2, "orange");
                    gradient.addColorStop(0.4, "yellow");
                    gradient.addColorStop(0.6, "green");
                    gradient.addColorStop(0.7, "blue");
                    gradient.addColorStop(0.9, "indigo");
                    gradient.addColorStop(1.0, "violet");
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(this.x + 10, this.y + 5, this.width - 20, this.height - 10);
                    ctx.restore();
                },
            },
            //button that starts greyscale
            greyButton: {
                //attributes for the button
                width: 50,
                height: 30,
                border: 2,
                x: undefined,
                y: undefined,
                //method that draws the button on screen
                draw: function(ctx){
                    //sets the correct display attributes for the button
                    this.x = radio.gradientButton.x + radio.gradientButton.width;
                    this.y = radio.gradientButton.y;
                    ctx.save();
                    ctx.lineWidth = this.border;
                    ctx.strokeStyle = makeColor(38,38,38,1.0);
                    ctx.fillStyle = radio.buttonColor;
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                    ctx.fillRect(this.x + this.border, this.y + this.border, this.width - this.border * 2, this.height - this.border*2);
                    
                    //create color gradient
                    var greydient = ctx.createLinearGradient(this.x + 10, 0, this.x + this.width - 15, 0);
                    greydient.addColorStop(0, "black");
                    greydient.addColorStop(1.0, "grey");
                    
                    ctx.fillStyle = greydient;
                    ctx.fillRect(this.x + 10, this.y + 5, this.width - 20, this.height - 10);
                    ctx.restore();
                },
            },
            //knob that controls the treble amount
            trebleKnob: {
                //attributes for the knob
                radius: 25,
                border: 2,
                x: undefined,
                y: undefined,
                rimColor: makeColor(173,106,22,1.0),
                knobColor: makeColor(75,75,75, 1.0),
                //draws the knob on screen
                draw: function(ctx){
                    ctx.save();
                    ctx.lineWidth = this.border;
                    //checks to see if the user is interacting with the knob
                    //makes it so that the button stays where it is when the canvas is translated
                    if(dragging){
                        this.x = 0;
                        this.y = 0;
                    }
                    else{
                        //sets the correct display attributes for the knob
                        this.x = canvas.width/2 + 30 + this.radius*2;
                        this.y = radio.display.offsetY + radio.display.height + this.radius + this.border + 75;
                        ctx.fillStyle = radio.buttonColor;
                        ctx.textBaseline = "middle";
                        ctx.textAlign = "center";
                        ctx.font = "14px Orbitron";
                        ctx.fillText("Treble", this.x, this.y - 38);
                    }
                    //draws the knob
                    ctx.strokeStyle = this.rimColor;
                    ctx.fillStyle = this.knobColor;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = this.rimColor;
                    ctx.fillRect(this.x, this.y - this.radius, 2, this.radius);
                    ctx.restore();
                },
            },
            //knob that controls the volume amount
            volumeKnob: {
                //attributes for the knob
                radius: 25,
                border: 2,
                x: undefined,
                y: undefined,
                rimColor: makeColor(173,106,22,1.0),
                knobColor: makeColor(75,75,75, 1.0),
                //draws the knob on screen
                draw: function(ctx){
                    ctx.save();
                    ctx.lineWidth = this.border;
                    //checks to see if the user is interacting with the knob
                    //makes it so that the button stays where it is when the canvas is translated
                    if(dragging){
                        this.x = 0;
                        this.y = 0;
                    }
                    else{
                        //sets the correct display attributes for the knob
                        this.x = radio.trebleKnob.x - this.radius*2 - 30;
                        this.y = radio.trebleKnob.y;
                        ctx.fillStyle = radio.buttonColor;
                        ctx.textBaseline = "middle";
                        ctx.textAlign = "center";
                        ctx.font = "14px Orbitron";
                        ctx.fillText("Vol", this.x, this.y - 38);
                    }
                    //draws the knob
                    ctx.strokeStyle = this.rimColor;
                    ctx.fillStyle = this.knobColor;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = this.rimColor;
                    ctx.fillRect(this.x, this.y - this.radius, 2, this.radius);
                    ctx.restore();
                },
            },
            //knob that controls the bass amount
            bassKnob: {
                //attributes for the knob
                radius: 25,
                border: 2,
                x: undefined,
                y: undefined,
                rimColor: makeColor(173,106,22,1.0),
                knobColor: makeColor(75,75,75, 1.0),
                //draws the knob on screen
                draw: function(ctx){
                    ctx.save();
                    ctx.lineWidth = this.border;
                    //checks to see if the user is interacting with the knob
                    //makes it so that the button stays where it is when the canvas is translated
                    if(dragging){
                        this.x = 0;
                        this.y = 0;
                    }
                    else{
                        //sets the correct display attributes for the knob
                        this.x = radio.volumeKnob.x - this.radius*2 - 30;
                        this.y = radio.volumeKnob.y;
                        ctx.fillStyle = radio.buttonColor;
                        ctx.textBaseline = "middle";
                        ctx.textAlign = "center";
                        ctx.font = "14px Orbitron";
                        ctx.fillText("Bass", this.x, this.y - 38);
                    }
                    //draws the knob
                    ctx.strokeStyle = this.rimColor;
                    ctx.fillStyle = this.knobColor;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = this.rimColor;
                    ctx.fillRect(this.x, this.y - this.radius, 2, this.radius);
                    ctx.restore();
                },
            },
            
            draw: function(ctx){
                //draw background for the radio
                this.x = canvas.width / 2 - this.WIDTH / 2;
                radio.display.offsetX = this.x + 50;
                ctx.save();
                ctx.fillStyle = this.bodyColor;
                ctx.fillRect(this.x,this.y,this.WIDTH, this.HEIGHT);
                ctx.restore();
                //draw the rest of the components individually
                this.prevButton.draw(ctx);
                this.pauseButton.draw(ctx);
                this.nextButton.draw(ctx);
                this.waveButton.draw(ctx);
                this.gradientButton.draw(ctx);
                this.greyButton.draw(ctx);
                this.trebleKnob.draw(ctx);
                this.volumeKnob.draw(ctx);
                this.bassKnob.draw(ctx);
                this.display.draw(ctx);
                ctx.restore();
            },
            //method that checks the index in the music array to see what song is playing
            //determines the title of the song based on the index
            determineSongTitle: function(ctx){
                ctx.save();
                ctx.fillStyle = radio.buttonColor;
                //sets where the song title should be displayed
                var x = radio.display.offsetX + 10;
                var y = radio.display.offsetY + 15;
                ctx.font = "20px Orbitron";
                //handles the determination of which song is playing
                switch(musicIndex){
                    case 0: songTitle = "All My Friends Are Dead"
                    break;
                    case 1: songTitle = "Paper Globes and Sugar Pyramids"
                                        ctx.font = "18px Orbitron";
                    break;
                    case 2: songTitle = "Blech"
                    break;
                    default: songTitle = "Default"
                    break;
                }
                //draws the text on screen
                ctx.textBaseline = "middle";
                ctx.textAlign = "left";
                ctx.fillText(songTitle + " - " + artist, x, y);
                ctx.restore();
                
            },
            
        };
        //class that sets up speaker objects
        var speaker = function(x, y, width, height, radius){
            //sets the attributes of the class according to the parameters in the constructor
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.bodyColor = makeColor(117,73,57,1.0);
            this.speakerOutputColor1 = makeColor(82, 79,79,1.0);
            this.speakerOutputColor2 = makeColor(51,49,49,1.0);
            this.outputRadius = radius;
            //method that draws the speaker on screen
            this.draw = function(ctx){
                ctx.save();
                //draws the speaker box
                ctx.fillStyle = this.bodyColor;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = this.speakerOutputColor1;
                //draws the general shape of the actual amp part of the speaker
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.outputRadius, 0, Math.PI * 2, false);
                ctx.closePath();
                ctx.fill();
                //draws the center of the amp
                ctx.fillStyle = this.speakerOutputColor2;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.outputRadius/5, 0, Math.PI * 2, false);
                ctx.closePath();
                ctx.fill();
                ctx.lineWidth = 3;
                //draws the ring in the amp
                ctx.strokeStyle = this.speakerOutputColor2;
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.outputRadius/1.3, 0, Math.PI * 2, false);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            };
        };
        
        
		function init(){
			// set up canvas stuff
			canvas = document.querySelector('canvas');
            radio.canvas = canvas;
            //WIDTH = canvas.width;
            //HEIGHT = canvas.height;
			ctx = canvas.getContext("2d");
			
			// get reference to <audio> element on page
			audioElement = document.querySelector('audio');
			
			// call our helper function and get an analyser node
			analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
			
			// get sound track <select> and Full Screen button working
			setupUI();
			
			// load and play default sound into audio element
			playStream(audioElement,music[musicIndex]);
            
            //draws the radio
            ctx.save();
            radio.draw(ctx);
            ctx.restore();
            //sets up the speaker objects and draws them
            sp1 = new speaker(0, 0, radio.x, radio.HEIGHT, 100);
            sp2 = new speaker(radio.x + radio.WIDTH, 0, sp1.width, sp1.height, 100);
            ctx.save();
            sp1.draw(ctx);
            ctx.restore();
            sp2.draw(ctx);
            
            //sets up the color gradient
            colorGradient = ctx.createLinearGradient(radio.display.offsetX, 0, radio.display.width + radio.display.offsetX, 0);
            colorGradient.addColorStop(0, "red");
            colorGradient.addColorStop(0.2, "orange");
            colorGradient.addColorStop(0.4, "yellow");
            colorGradient.addColorStop(0.6, "green");
            colorGradient.addColorStop(0.7, "blue");
            colorGradient.addColorStop(0.9, "indigo");
            colorGradient.addColorStop(1.0, "violet");
            
			// start animation loop
			update();
		}
		
		
		function createWebAudioContextWithAnalyserNode(audioElement) {
			// create new AudioContext
			// The || is because WebAudio has not been standardized across browsers yet
			// http://webaudio.github.io/web-audio-api/#the-audiocontext-interface
			audioCtx = new (window.AudioContext || window.webkitAudioContext);
			
			// create an analyser node
			analyserNode = audioCtx.createAnalyser();
			
			/*
			We will request NUM_SAMPLES number of samples or "bins" spaced equally 
			across the sound spectrum.
			
			If NUM_SAMPLES (fftSize) is 256, then the first bin is 0 Hz, the second is 172 Hz, 
			the third is 344Hz. Each bin contains a number between 0-255 representing 
			the amplitude of that frequency.
			*/ 
			
			// fft stands for Fast Fourier Transform
			analyserNode.fftSize = NUM_SAMPLES;
			
			// this is where we hook up the <audio> element to the analyserNode
			sourceNode = audioCtx.createMediaElementSource(audioElement); 
			sourceNode.connect(analyserNode);
			//create delayNode instance
            delayNode = audioCtx.createDelay();
            delayNode.delayTime.value = delayAmount;
            
            //create bassNode instance
            bassNode = audioCtx.createBiquadFilter();
            bassNode.type = "lowshelf";
            bassNode.frequency.value = 400;
            bassNode.gain.value = bassAmount;
            
            //create trebleNode instance
            trebleNode = audioCtx.createBiquadFilter();
            trebleNode.type = "highshelf";
            trebleNode.frequency.value = 1000;
            trebleNode.gain.value = trebleAmount;
            
            //define gain node
            gainNode = audioCtx.createGain();
            
            //connect source node directly to speakers so we can hear the unaltered source in this channel
            sourceNode.connect(audioCtx.destination);
            //this channel will play and visualize the delay
            sourceNode.connect(gainNode);
            gainNode.connect(delayNode);
            delayNode.connect(bassNode);
            bassNode.connect(trebleNode);
            trebleNode.connect(analyserNode);
			// here we connect to the destination i.e. speakers
			analyserNode.connect(audioCtx.destination);  
			return analyserNode;
		}
		
		function setupUI(){            
            //allows the use to change color schemes based on an HTML select
            document.querySelector("#schemeSelect").onchange = function(e){
                switch(e.target.value){
                    case "wood":
                        radio.bodyColor = makeColor(79,49,39,1.0);
                        radio.buttonColor = makeColor(173,106,22,1.0);
                        radio.buttonTextColor = "black";
                        radio.volumeKnob.rimColor = radio.buttonColor;
                        radio.trebleKnob.rimColor = radio.buttonColor;
                        radio.bassKnob.rimColor = radio.buttonColor;
                        radio.display.backgroundColor = makeColor(0,0,0,0.9);
                        radio.display.lineColor = makeColor(255,255,255, 0.1);
                        sp1.bodyColor = makeColor(117,73,57,1.0);
                        sp1.speakerOutputColor1 = makeColor(82, 79,79,1.0);
                        sp1.speakerOutputColor2 = makeColor(51,49,49,1.0);
                        sp2.bodyColor = makeColor(117,73,57,1.0);
                        sp2.speakerOutputColor1 = makeColor(82, 79,79,1.0);
                        sp2.speakerOutputColor2 = makeColor(51,49,49,1.0);
                        radio.draw(ctx);
                        sp1.draw(ctx);
                        sp2.draw(ctx);
                        break;
                    case "metal":
                        radio.bodyColor = makeColor(214,207,206,1.0);
                        radio.buttonColor = makeColor(173,167,167,1.0);
                        radio.buttonTextColor = "black";
                        radio.volumeKnob.rimColor = radio.buttonColor;
                        radio.trebleKnob.rimColor = radio.buttonColor;
                        radio.bassKnob.rimColor = radio.buttonColor;
                        radio.display.backgroundColor = makeColor(0,0,0,0.9);
                        radio.display.lineColor = makeColor(255,255,255, 0.1);
                        sp1.bodyColor = makeColor(110,106,106,1.0);
                        sp1.speakerOutputColor1 = makeColor(214, 207,206,1.0);
                        sp1.speakerOutputColor2 = makeColor(0,0,0,1.0);
                        sp2.bodyColor = makeColor(110,106,106,1.0);
                        sp2.speakerOutputColor1 = makeColor(214, 207,206,1.0);
                        sp2.speakerOutputColor2 = makeColor(0,0,0,1.0);
                        radio.draw(ctx);
                        sp1.draw(ctx);
                        sp2.draw(ctx);
                        break;
                    case "red":
                        radio.bodyColor = makeColor(2504,26,43,1.0);
                        radio.buttonColor = makeColor(0,0,0,1.0);
                        radio.buttonTextColor = "white";
                        radio.volumeKnob.rimColor = radio.buttonColor;
                        radio.trebleKnob.rimColor = radio.buttonColor;
                        radio.bassKnob.rimColor = radio.buttonColor;
                        radio.display.backgroundColor = "white";
                        radio.display.lineColor = "grey";
                        sp1.bodyColor = makeColor(145,18,31,1.0);
                        sp1.speakerOutputColor1 = makeColor(0, 0,0,1.0);
                        sp1.speakerOutputColor2 = makeColor(232,232,232,1.0);
                        sp2.bodyColor = makeColor(145,18,31,1.0);
                        sp2.speakerOutputColor1 = makeColor(0, 0,0,1.0);
                        sp2.speakerOutputColor2 = makeColor(232,232,232,1.0);
                        radio.draw(ctx);
                        sp1.draw(ctx);
                        sp2.draw(ctx);
                        break;
                }
            };
            
            //setting up onclick events for the canvas element
            canvas.addEventListener("click", function(e){
                //gets the position of the mouse on the canvas in relation to the page
                var x = e.pageX - canvas.offsetLeft;
                var y = e.pageY - canvas.offsetTop;
                //allows the next button to be clicked and increments the music array index
                if(x > radio.nextButton.x && x < radio.nextButton.width + radio.nextButton.x){
                    if(y > radio.nextButton.y && y < radio.nextButton.height + radio.nextButton.y){
                        musicIndex++;
                        if(musicIndex > 2){
                            musicIndex = 0;
                        }
                        playStream(audioElement, music[musicIndex]);
                    }
                }
                //allows the previous button to be clicked and decrements the music array index
                if(x > radio.prevButton.x && x < radio.prevButton.width + radio.prevButton.x){    
                    if(y > radio.prevButton.y && y < radio.prevButton.height + radio.prevButton.y){
                        musicIndex--;
                        if(musicIndex < 0){
                            musicIndex = 2;
                        }
                        playStream(audioElement, music[musicIndex]);
                    }
                }
                //allows the pause button to be clicked and pauses or unpauses the song
                if(x > radio.pauseButton.x && x < radio.pauseButton.width + radio.pauseButton.x){ 
                    if(y > radio.pauseButton.y && y < radio.pauseButton.height + radio.pauseButton.y){
                        if(!paused){
                            paused = true;
                            audioElement.pause();
                        }
                        else{
                            paused = false;
                            audioElement.play();
                        }
                    }
                }
                
                //allows the wave button to be clicked and toggles the waveform display mode
                if(x > radio.waveButton.x && x < radio.waveButton.width + radio.waveButton.x){
                    if(y > radio.waveButton.y && y < radio.waveButton.height + radio.waveButton.y){
                        if(!waveform){
                            waveform = true;
                        }
                        else{
                            waveform = false;
                        }
                    }
                }
                //allows the gradient button to be clicked and toggles the gradient display mode
                if(x > radio.gradientButton.x && x < radio.gradientButton.width + radio.gradientButton.x){
                    if(y > radio.gradientButton.y && y < radio.gradientButton.height + radio.gradientButton.y){
                        if(!gradient){
                            gradient = true;
                        }
                        else{
                            gradient = false;
                        }
                    }
                }
                //allows the greyScale button to be clicked and toggles the greyscale display mode
                if(x > radio.greyButton.x && x < radio.greyButton.width + radio.greyButton.x){
                    if(y > radio.greyButton.y && y < radio.greyButton.height + radio.greyButton.y){
                        if(!greyscale){
                            greyscale = true;
                        }
                        else{
                            greyscale = false;
                        }
                    }
                }
            });
            
            //setting up interaction for the knobs
            canvas.addEventListener("mousedown", function(e){
                //gets the position of the mouse on the canvas in relation to the page
                var x = e.pageX - canvas.offsetLeft;
                var y = e.pageY - canvas.offsetTop;
                //allowing for the rotation of the volume knob
                var dx; //store current x difference from mouse to center
                var dy; //store current y difference from mouse to center
                var lastDx = 0; //store last x difference value
                var lastDy = 0; //store last y difference value
                if(pointInsideCircle(x, y, radio.volumeKnob)){
                    //canvas.addEventListener("mousemove", function(e){
                    doMousedown(e);
                    if(dragging){ //while the user is holding mouse down
                        dx = x - radio.volumeKnob.x;  //take current x difference from mouse to center
                        dy = y - radio.volumeKnob.y;  //take current y difference from mouse to center
                        var origXLoc = radio.volumeKnob.x;//stores the original x and y locations of the knob
                        var origYLoc = radio.volumeKnob.y;//
                        if(lastDx!=undefined && lastDy!=undefined){ //makes sure these have values before trying to compute angles from them
                            var angleX = dx - lastDx;  //compute angle between differences
                            var angleY = dy - lastDy;
                            var mag = Math.sqrt(angleX*angleX + angleY*angleY); //get the magnitude of the vector
                            angleX/=mag; //find the unit vector
                            angleY/=mag;
                            ctx.save();
                            ctx.translate(radio.volumeKnob.x, radio.volumeKnob.y); //translate the context to the center of the knob
                            var angle = Math.atan2(angleX, angleY*=-1) //gets the angle of rotation
                            //clamps the value of the rotation angle to set between the bounds of -2 and 2
                            if(angle > 2.0){
                                angle = 2.0;
                            }
                            else if(angle < -2.0){
                                angle = -2.0;
                            }
                            
                            //maps the value of the angle to the range of the volume modifier and applies it
                            var volume = angle.mapRange(-2.0, 2.0, 0, 7);
                            gainNode.gain.value = volume.toFixed(2); //rounds the volume amount to two decimal places
                            
                            ctx.rotate(angle); //rotate by the angle computed from the unit vector
                            ctx.beginPath();
                            ctx.fillStyle = radio.bodyColor;
                            ctx.arc(0,0,radio.volumeKnob.radius + radio.volumeKnob.border, 0, Math.PI * 2, false);
                            ctx.closePath();
                            ctx.fill();
                            radio.volumeKnob.draw(ctx); //draw the volume knob
                            ctx.restore();
                        }
                        lastDx = dx; //keep track of the last difference
                        lastDy = dy; //
                        radio.volumeKnob.x = origXLoc;//resets the location of the knob
                        radio.volumeKnob.y = origYLoc;//
                    }
                }
                //bass knob
                if(pointInsideCircle(x, y, radio.bassKnob)){
                    //canvas.addEventListener("mousemove", function(e){
                    doMousedown(e);
                    if(dragging){ //while the user is holding mouse down
                        dx = x - radio.bassKnob.x;  //take current x difference from mouse to center
                        dy = y - radio.bassKnob.y;  //take current y difference from mouse to center
                        var origXLoc = radio.bassKnob.x;
                        var origYLoc = radio.bassKnob.y;
                        if(lastDx!=undefined && lastDy!=undefined){ //makes sure these have values before trying to compute angles from them
                            var angleX = dx - lastDx;  //compute angle between differences
                            var angleY = dy - lastDy;
                            var mag = Math.sqrt(angleX*angleX + angleY*angleY); //get the magnitude of the vector
                            angleX/=mag; //find the unit vector
                            angleY/=mag;
                            ctx.save();
                            ctx.translate(radio.bassKnob.x, radio.bassKnob.y); //translate the context to the center of the knob
                            var angle = Math.atan2(angleX, angleY*=-1) //gets the angle of the rotation
                            //clamps the value of the rotation angle to set between the bounds of -2 and 2
                            if(angle > 2.0){
                                angle = 2.0;
                            }
                            else if(angle < -2.0){
                                angle = -2.0;
                            }
                            
                            //maps the value of the angle to the range of the bass modifier and applies it
                            var volume = angle.mapRange(-2.0, 2.0, -25, 25);
                            bassNode.gain.value = volume.toFixed(2); //rounds the volume amount to two decimal places
                            
                            ctx.rotate(angle); //rotate by the angle computed from the unit vector
                            ctx.beginPath();
                            ctx.fillStyle = radio.bodyColor;
                            ctx.arc(0,0,radio.bassKnob.radius + radio.bassKnob.border, 0, Math.PI * 2, false);
                            ctx.closePath();
                            ctx.fill();
                            radio.bassKnob.draw(ctx); //draw the volume knob
                            ctx.restore();
                        }
                        lastDx = dx; //keep track of the last difference
                        lastDy = dy;
                        radio.bassKnob.x = origXLoc;//resets the location of the knob
                        radio.bassKnob.y = origYLoc;//
                    }
                }
                //treble knob
                if(pointInsideCircle(x, y, radio.trebleKnob)){
                //canvas.addEventListener("mousemove", function(e){
                    doMousedown(e);
                    if(dragging){ //while the user is holding mouse down
                        dx = x - radio.trebleKnob.x;  //take current x difference from mouse to center
                        dy = y - radio.trebleKnob.y;  //take current y difference from mouse to center
                        var origXLoc = radio.trebleKnob.x;
                        var origYLoc = radio.trebleKnob.y;
                        if(lastDx!=undefined && lastDy!=undefined){ //makes sure these have values before trying to compute angles from them
                            var angleX = dx - lastDx;  //compute angle between differences
                            var angleY = dy - lastDy;
                            var mag = Math.sqrt(angleX*angleX + angleY*angleY); //get the magnitude of the vector
                            angleX/=mag; //find the unit vector
                            angleY/=mag;
                            ctx.save();
                            ctx.translate(radio.trebleKnob.x, radio.trebleKnob.y); //translate the context to the center of the knob
                            var angle = Math.atan2(angleX, angleY*=-1) //clamps the value of the rotation angle to set between the bounds of -2 and 2
                            //clamps the value of the rotation angle to set between the bounds of -2 and 2
                            if(angle > 2.0){
                                angle = 2.0;
                            }
                            else if(angle < -2.0){
                                angle = -2.0;
                            }
                            
                            //maps the value of the angle to the range of the treble modifier and applies it
                            var volume = angle.mapRange(-2.0, 2.0, -25, 25);
                            trebleNode.gain.value = volume.toFixed(2); //rounds the volume amount to two decimal places
                            
                            ctx.rotate(angle); //rotate by the angle computed from the unit vector
                            ctx.beginPath();
                            ctx.fillStyle = radio.bodyColor;
                            ctx.arc(0,0,radio.trebleKnob.radius + radio.trebleKnob.border, 0, Math.PI * 2, false);
                            ctx.closePath();
                            ctx.fill();
                            radio.trebleKnob.draw(ctx); //draw the volume knob
                            ctx.restore();
                        }
                        lastDx = dx; //keep track of the last difference
                        lastDy = dy;
                        radio.trebleKnob.x = origXLoc;//resets the location of the knob
                        radio.trebleKnob.y = origYLoc;//
                    }
                }
            });
            
            canvas.onmouseup = doMouseup;
		}
		
        //keeps track of when the user is interacting with the knobs
        function doMousedown(e){
            dragging = true;
        }
        
        function doMouseup(e){
            dragging = false;
        }
    
		function playStream(audioElement,path){
			audioElement.src = path;
			audioElement.play();
			audioElement.volume = 0.2;
		}
		
		function update() { 
			// this schedules a call to the update() method in 1/60 seconds
			requestAnimationFrame(update);
			
			/*
				Nyquist Theorem
				http://whatis.techtarget.com/definition/Nyquist-Theorem
				The array of data we get back is 1/2 the size of the sample rate 
			*/
			
			// create a new array of 8-bit integers (0-255)
			var data = new Uint8Array(NUM_SAMPLES/2); 
			
			// DRAW!
			ctx.clearRect(radio.display.offsetX,radio.display.offsetY,radio.display.width,radio.display.height); //clears the display so it can be redrawn
            ctx.save();
            radio.display.draw(ctx); //draws the display
            radio.determineSongTitle(ctx); //draws the title on screen
            ctx.restore();
            //sets up attributes for drawing the frequency data for bars
			var barWidth = 4;
			var barSpacing = 1;
			var barHeight = 20;
			var topSpacing = 50;
			var xStep = radio.display.width/(NUM_SAMPLES/2);
            
            //populates the data with waveform data
            analyserNode.getByteTimeDomainData(data)
            ctx.save();
            for(var i=0; i<data.length; i++){
                //makes the speakers look like they're bumping to the volume
                sp1.outputRadius = (sp1.outputRadius + data[i]/15);
                if(sp1.outputRadius > sp1.width/2){
                    sp1.outputRadius = sp1.width/2;
                }
                sp1.draw(ctx);
                sp1.outputRadius = 100;
                sp2.outputRadius = (sp2.outputRadius + data[i]/15);
                if(sp2.outputRadius > sp2.width/2){
                    sp2.outputRadius = sp2.width/2;
                }
                sp2.draw(ctx);
                sp2.outputRadius = 100;
            }
            ctx.restore();
            
            //checks to see if waveform display mode is on and if so draws lines to represent it
            if(waveform){
                //populates the data array with frequency data
                analyserNode.getByteTimeDomainData(data); // waveform data
                ctx.beginPath();
                ctx.moveTo(radio.display.offsetX, radio.display.offsetY + radio.display.height - data[i]);
                // loop through the data and draw!
			    for(var i=0; i<data.length; i++) {
                    if(gradient){
                        ctx.strokeStyle = colorGradient;
                    }
                    else{
                        ctx.strokeStyle = radio.buttonColor;
                    } 
                
                    //compute y value of the data
                    var yVal = radio.display.offsetY + radio.display.height - data[i] * (0.30 * (radio.display.height/100));
                    //limit the max y value
                    if(yVal < radio.display.offsetY){
                        yVal = radio.display.offsetY;
                    }
                    //limits the min y value
                    if(yVal > radio.display.height + radio.display.offsetY - ctx.lineWidth && waveform){
                        yVal = radio.display.height + radio.display.offsetY - ctx.lineWidth - 5;
                    }
                    if(bezier){
                        ctx.moveTo(radio.display.offsetX,radio.display.height + radio.display.offsetY);
                        ctx.bezierCurveTo(radio.display.offsetX + 20, yVal,radio.display.width + radio.display.offsetX - 20, yVal, radio.display.offsetX + radio.display.width, radio.display.height + radio.display.offsetY);
                    }
                    else{
                        ctx.lineTo(i * xStep + radio.display.offsetX + 1, yVal);
                    }
                
			     }
                ctx.stroke();
            }
            else{
                analyserNode.getByteFrequencyData(data);
                // loop through the data and draw!
			    for(var i=0; i<data.length; i++) {
                    if(gradient){
                        ctx.fillStyle = colorGradient;
                    }
                    else{
                        ctx.fillStyle = radio.buttonColor; 
                    }
                
                    //compute y value of the data
                    var yVal = radio.display.offsetY + radio.display.height - data[i] * (0.30 * (radio.display.height/100));
                    //limit the max y value
                    if(yVal < radio.display.offsetY){
                        yVal = radio.display.offsetY;
                    }
                    //limit the min y value
                    if(yVal > radio.display.height + radio.display.offsetY - ctx.lineWidth && waveform){
                        yVal = radio.display.height + radio.display.offsetY - ctx.lineWidth - 5;
                    }
                
                    // the higher the amplitude of the sample (bin) the taller the bar
				    // remember we have to draw our bars left-to-right and top-down
                    barHeight = (radio.display.height + radio.display.offsetY - yVal);
                    if(barHeight == 0){
                        barHeight = -2;
                    }
				    ctx.fillRect(i * xStep + radio.display.offsetX,yVal,barWidth,barHeight);
                
			    }
            }
            
            ctx.restore();
            manipulatePixels();
            
		} 
    
		// HELPER
		function makeColor(red, green, blue, alpha){
   			var color='rgba('+red+','+green+','+blue+', '+alpha+')';
   			return color;
		}
        
        //method that checks for the mouse position overlapping the knob position
        function pointInsideCircle(x,y,I){
            var dx = x - I.x;
            var dy=  y-I.y;
            return dx*dx + dy*dy<=I.radius*I.radius;
        };
		
        function manipulatePixels(){
            //get all the rgba pizel data
            var imageData = ctx.getImageData(radio.display.offsetX,radio.display.offsetY,radio.display.width, radio.display.height);
            
            //imageData.data is an 8-bit typed array with values ranging from 0-255
            //contains 4 values per pixel
            var data = imageData.data;
            var length = data.length;
            var width = imageData.width;
            
            for(var i = 0; i < length; i+=4){
                //this takes the image data of the display and converts it to greyscale
                if(greyscale){
                    var red = data[i] * 0.2;
                    var green = data[i + 1] * 0.7;
                    var blue = data[i + 2] * 0.2;
                    data[i] = red + green + blue;
                    data[i + 1] = red + green + blue;
                    data[i + 2] = red + green + blue;
                }
            }
            
            ctx.putImageData(imageData,radio.display.offsetX,radio.display.offsetY);
        }
		
		window.addEventListener("load",init);
}());