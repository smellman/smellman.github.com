function Theremin(sampleRate) {
    sampleRate = sampleRate | 0 || 44100;
    this.sampleRate = sampleRate;
    this.frequency = 0;
    this.volume = 1;
    this.preBufferMsec = 250;
    this.phase = 0;
    this.timer = null;
    this.paused = true;
    this.waveForm = 'sine';
}
Theremin.prototype = {
    constructor: Theremin,
    getNextBuffer: function getNextBuffer(length) {
	var buffer = Float32Array(length);
	var freq = this.frequency;
	if (!freq || freq < 0)
	    return buffer;

	var sampleRate = this.audio.mozSampleRate;
	var volume = this.volume;
	var waveForm = this.waveForm;

	var PI_2 = Math.PI * 2;
	var sin = Math.sin;
	var random = Math.random;

	var phaseOffset = this.phase;
	var phase = phaseOffset;
	var value = 0;
	for (var i = 0; i < length; i++) {
	    phase = ((i + 1) * freq / sampleRate + phaseOffset) % 1;
	    switch (waveForm) {
	    case 'sin':
	    case 'sine':
		value = sin(PI_2 * phase);
		break;
	    case 'tri':
	    case 'triangle':
		var zone = phase * 4;
		switch (zone | 0) {
		case 0:
		    value = zone;
		    break;
		case 1:
		case 2:
		    value = 2 - zone;
		    break;
		case 3:
		    value = zone - 4;
		    break;
		}
		break;
	    case 'square':
		value = phase < 0.5 ? 0.5 : -0.5;
		break;
	    case 'saw':
	    case 'sawtooth':
		value = phase < 0.5 ? phase : phase - 1;
		break;
	    case 'white':
	    case 'whitenoise':
		value = random() * 2 - 1;
		break;
	    case 'pink':
	    case 'pinknoise':
		value = pinkNoise();
		break;
	    case 'brown':
	    case 'brownian':
	    case 'brownnoise':
	    case 'browniannoise':
		var v = value + random() / 2 - 0.25;
		value = v < -1 ? -1 : 1 < v ? 1 : v;
		break;
	    default:
		value = 0;
	    }
	    buffer[i] = volume * value;
	}
	this.phase = phase;
	return buffer;
    },
    play: function play() {
	if (!this.paused)
	    this.pause();
	this.paused = false;

	var audio = new Audio();
	audio.mozSetup(1, this.sampleRate);
	this.audio = audio;
	this.phase = 0;
	var samplesPerMsec = this.sampleRate / 1000;
	var rest = 0;

	var self = this;
	var writeAudio = function() {
	    var now = Date.now();
	    var nextBufferLength = samplesPerMsec * (now - lastWriteTime) + rest;
	    audio.mozWriteAudio(self.getNextBuffer(nextBufferLength | 0));
	    rest = nextBufferLength % 1;
	    lastWriteTime = now;
	};
	this.timer = setInterval(writeAudio, 0);
	var lastWriteTime = Date.now() - this.preBufferMsec;
	writeAudio();
    },
    pause: function pause() {
	if (this.paused) return;
	this.paused = true;

	clearInterval(this.timer);
	var audio = this.audio;
	audio.mozWriteAudio(this.getNextBuffer((1 - this.phase) * audio.mozSampleRate / this.frequency | 0));
	audio.mozWriteAudio(Float32Array(audio.mozSampleRate / 2));
    }
};
Theremin.frequencies = (function() {
    var result = {};
    var scale = 'C C# D D# E F F# G G# A A# B'.split(' ');
    for (var i = 0; i < 10; i++) {
	var oct = result[i] = {};
	for (var j = 0; j < 12; j++) {
	    var f = 440 * Math.pow(2, ((i - 4) * 12 + (j - 9)) / 12);
	    oct[j] = oct[scale[j]] = result[scale[j] + i] = f;
	}
    }
    return result;
})();

// http://www.finetune.co.jp/~lyuka/technote/pinknoise/
function PinkNoise() {
    this.init();
}

PinkNoise.prototype = let ({random} = Math) 0 || {
    constructor: PinkNoise,
    init: function init() {
	var z = this._z = [];
	var k = this._k = [];
	this._t = 0;

	for (var i = 0; i < 16; i++)
	    z[i] = 0;

	k[15] = 0.5;
	for (var i = 15; 0 < i; i--)
	    k[i - 1] = k[i]  * 0.25;
    },
    next: function next() {
	var {_z: z, _k: k, _t: t} = this;

	var q = random() < 0.5 ? 1 : -1;
	for (var i = 0; i < 16; i++) {
	    z[i] = q * k[i] + z[i] * (1 - k[i]);
	    q = (q + z[i]) * 0.5;
	}
	t = q * 0.75 + t * 0.25;
	return t < 1e-4 ? t * 1e4 : 1;
    }
};

var pinkNoise = PinkNoise.prototype.next.bind(new PinkNoise());

