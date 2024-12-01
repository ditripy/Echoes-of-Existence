// voice-related variables
let speechRecognition;
let isListening = false;
let mic, delay, filter;
let previousVolume = 0;
let volumeThreshold = 0.01; //sensitivity to volume changes

// object-related variables
let flowers = [];
let saveButton; // button for saving the canvas

//text-related variables
let archivedTexts = []; 
let textToShow = "";

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);
    noStroke();

    mic = new p5.AudioIn(); //get sound from microphone
    delay = new p5.Delay(); // add a delay effect for feedback on the voice input
    filter = new p5.BandPass(); //create a BandPss filter

    mic.start();
    userStartAudio(); //user interaction firsy

    mic.disconnect();//disconnects the mic from previous connections
    mic.connect(delay); //pass the mic through the delay object
    delay.process(mic, 0.3, 0.5); //applies the delay effect
    delay.disconnect();  //disconnect after applying the delay effect
    delay.connect(filter); //filters specific frequencies
    filter.freq(1000); // filter frequency
    filter.res(3); // resonance for clarity

     //ensures browser supports speech recognition
     //use Web Speech APIs
    if ("webkitSpeechRecognition" in window) {
        speechRecognition = new webkitSpeechRecognition();
    } else if ("SpeechRecognition" in window) {
        speechRecognition = new SpeechRecognition();
    } else {
        console.error("Speech Recognition not supported in this browser.");
        return;
    }
    //initialize speech recogntion parameters
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = "en-US";

     //handle the event to convert speech to text 
    speechRecognition.onresult = function (event) {
        if (event.results.length > 0) {
            textToShow = event.results[event.results.length - 1][0].transcript;

             // add new phrase to archived texts
             archivedTexts.push(new TextParticle(textToShow.trim()));
             if (archivedTexts.length > 20) {
                 archivedTexts.shift(); // limit total text particles
             }
        }
    };

    //catch if speech recognition might not work
    speechRecognition.onerror = function (event) {
        console.error("Speech Recognition Error:", event.error);
    };

    // create save button
    saveButton = createButton('Save Art');
    saveButton.position(10, 10);
    saveButton.mousePressed(saveArt);
}

function draw() {
    background(0,20);

    let volume = mic.getLevel();

     //make flower generation based on volume changes
    if (abs(volume - previousVolume) > volumeThreshold) {
        flowers.push(new Flowers(random(width), random(height), volume));
        previousVolume = volume;
    }

    //update flower visuals
    for (let i = flowers.length - 1; i >= 0; i--) {
        flowers[i].update();
        flowers[i].display();
        if (flowers[i].isDone()) {
            flowers.splice(i, 1); // discard finished flowers
        }
    }

     //update floating text particles
     for (let i = archivedTexts.length - 1; i >= 0; i--) {
        archivedTexts[i].update();
        archivedTexts[i].display();
        if (archivedTexts[i].isDone()) {
            archivedTexts.splice(i, 1); // discared old particles
        }
    }

     //display transcribe text
    fill(0, 0, 100);
    textSize(20);
    textAlign(CENTER, CENTER);
    if (textToShow.length > 0) {
        text(textToShow, width / 2, height / 2);
    } else {
        text("Press Space to Start Listening. (Use with headphones)", width / 2, height / 2);
    }
}

// class for floating text
class TextParticle {
    constructor(text) {
        this.text = text;
        this.x = random(width);
        this.y = random(height);
        this.vx = random(-1, 1); // random horizontal speed
        this.vy = random(-1, 1); // random vertical speed
        this.size = random(20, 40); //random initial size
        this.opacity = 255; // full opacity
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.size *= 0.99; // gradual shrinking
        this.opacity -= 2; // gradual fading
    }

    display() {
        fill(255, this.opacity);
        textSize(this.size);
        textAlign(CENTER, CENTER);
        text(this.text, this.x, this.y);
    }

    isDone() {
        return this.opacity <= 0 || this.size <= 5; // discard when too small
    }
}

//this is the flowers class that accepts the random x, y positions and volume
class Flowers {
    constructor(x, y, volume) {
        this.xpos = x;
        this.ypos = y;
        this.distance = random(50, 100);

        //randomized color of orange and purple
        if (random(1) < 0.5) {
            this.col = random(20, 40); // orange range
        } else {
            this.col = random(260, 280); // purple range
        }

        this.colSpeed = random(0.01, 0.05);
        this.lifespan = 255;  // fade of flower
    }

    update() {
        this.lifespan -= 2; // decrement lifespan
    }

    isDone() {
        return this.lifespan <= 0;
    }

    display() {
        //loop for create every single petal of flower object
        for (let i = 0; i < 6; i++) {
            push();
            translate(this.xpos, this.ypos);
            rotate(frameCount * this.colSpeed + PI * i / 3);
            stroke(this.col + 5 * i, 100, 100, this.lifespan / 255 * 100);
            strokeWeight(2);
            noFill();

            // points for bezier curve
            let x1 = this.distance * cos(frameCount * this.colSpeed);
            let y1 = this.distance * sin(frameCount * this.colSpeed);
            let x2 = x1 + random(-50, 50);
            let y2 = y1 + random(-50, 50);
            let x3 = x2 + random(-50, 50);
            let y3 = y2 + random(-50, 50);
            let x4 = this.distance + sin(frameCount * this.colSpeed) * this.distance;
            let y4 = 0;

            // create bezier curve
            bezier(x1, y1, x2, y2, x3, y3, x4, y4);
            pop();
        }
    }
}

function saveArt() {
    saveCanvas('myArt', 'png');
}

// start speech recognition when the spacebar is 
function keyPressed() {
    if (keyCode === 32) { // Spacebar
        if (!isListening) {
            speechRecognition.start();
            isListening = true;
            console.log("Listening...");
        } else {
            speechRecognition.stop();
            isListening = false;
            console.log("Stopped listening.");
        }
    }
}
