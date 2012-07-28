document.addEventListener('DOMContentLoaded', function() {
    var theremin = new Theremin();
    var hz = document.getElementById('hz').firstChild;
    
    document.addEventListener('mousedown', function() {
	theremin.play();
	hz.nodeValue = theremin.frequency;
    }, false);
    if (window.DeviceMotionEvent) {
	window.addEventListener('devicemotion', function(event) {
	    var acceleration = event.accelerationIncludingGravity;
	    theremin.frequency = 1220 * (Math.abs(acceleration.x) * 2) * (Math.abs(acceleration.z - 10) * 2) | 0;
	    theremin.volume = Math.abs(acceleration.y);
	    if (theremin.paused) return;
	    hz.textContent = theremin.frequency;
	}, false);
    } else {
	var support = document.getElementById('support').firstChild;
	support.textContent = "Not supported on your device or browser.  Sorry.";
    }
    document.addEventListener('mouseup', function() {
	theremin.pause();
    }, false);
    document.addEventListener('keypress', function(event) {
	var index = event.which - 49;
	var waveForm = ['sin', 'tri', 'square', 'saw', 'white', 'pink', 'brown'][index];
	if (!waveForm) return;
	
	theremin.waveForm = waveForm;
	document.querySelector('li.current').classList.remove('current');
	document.querySelector('ol').children[index].classList.add('current');
    }, false);
}, false);
