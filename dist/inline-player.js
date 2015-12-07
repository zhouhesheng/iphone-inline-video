(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.makeVideoPlayableInline = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = makeVideoPlayableInline;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _intervalometer = require('./intervalometer');

var _intervalometer2 = _interopRequireDefault(_intervalometer);

var _preventEvent = require('./prevent-event');

var _preventEvent2 = _interopRequireDefault(_preventEvent);

var _proxyProperty = require('./proxy-property');

/**
 * known issues:
 * it cannot go fullscreen before it's played inline first
 * it cannot keep playing when the src is changed
 * unknown behavior when no audio + slow connection
 */

var _proxyProperty2 = _interopRequireDefault(_proxyProperty);

var isNeeded = /iPhone|iPod/i.test(navigator.userAgent);

/**
 * UTILS
 */

function getAudioFromVideo(video) {
	var audio = new Audio();
	audio.src = video.currentSrc || video.src;
	return audio;
}
function update(timeDiff) {
	console.log('update');
	var player = this;
	if (player.audio) {
		var audioTime = player.audio.currentTime;
		player.video.currentTime = audioTime;
		// console.assert(player.video.currentTime === audioTime, 'Video not updating!')
	} else {
			var nextTime = player.video.currentTime + timeDiff / 1000;
			player.video.currentTime = Math.min(player.video.duration, nextTime);
		}
	if (player.video.ended) {
		player.video.pause();
	}
}
function startVideoBuffering(video) {
	// this needs to be inside an event handler
	video.iaAutomatedEvent = true;
	video._play();
	setTimeout(function () {
		video.iaAutomatedEvent = true;
		video._pause();
	}, 0);
}

/**
 * METHODS
 */

function play() {
	// console.log('play')
	var video = this;
	var player = video.__ivp;
	if (!video.buffered.length) {
		// console.log('Video not ready. Buffering')
		startVideoBuffering(video);
	}
	player.paused = false;
	if (player.audio) {
		player.audio.play();
	} else if (video.currentTime === video.duration) {
		video.currentTime = 0;
	}
	player.updater.start();

	video.dispatchEvent(new Event('play'));
	video.dispatchEvent(new Event('playing'));
}
function pause() {
	// console.log('pause')
	var video = this;
	var player = video.__ivp;
	player.paused = true;
	player.updater.stop();
	if (player.audio) {
		player.audio.pause();
	}
	video.dispatchEvent(new Event('pause'));
	if (video.ended) {
		video.dispatchEvent(new Event('ended'));
	}
}

/**
 * SETUP
 */

function addPlayer(video, hasAudio) {
	var player = video.__ivp = {};
	player.paused = true;
	player.loop = video.loop;
	player.muted = video.muted;
	player.video = video;
	if (hasAudio) {
		player.audio = getAudioFromVideo(video);
	}
	player.updater = (0, _intervalometer2['default'])(update.bind(player));

	// stop programmatic player when OS takes over
	video.addEventListener('webkitbeginfullscreen', function () {
		//@todo: should be on play?
		video.pause();
	});
	if (player.audio) {
		// sync audio to new video position
		video.addEventListener('webkitendfullscreen', function () {
			//@todo: should be on pause?
			player.audio.currentTime = player.video.currentTime;
			// console.assert(player.audio.currentTime === player.video.currentTime, 'Audio not synced');
		});
	}
}

function overloadAPI(video) {
	var player = video.__ivp;
	video._play = video.play;
	video._pause = video.pause;
	video.play = play;
	video.pause = pause;
	(0, _proxyProperty2['default'])(video, 'paused', player);
	(0, _proxyProperty2['default'])(video, 'loop', player);
	(0, _proxyProperty2['default'])(video, 'muted', player);
	(0, _preventEvent2['default'])(video, 'seeking');
	(0, _preventEvent2['default'])(video, 'seeked');
	(0, _preventEvent2['default'])(video, 'play', 'iaAutomatedEvent', true);
	(0, _preventEvent2['default'])(video, 'playing', 'iaAutomatedEvent', true);
	(0, _preventEvent2['default'])(video, 'pause', 'iaAutomatedEvent', true);
}

function makeVideoPlayableInline(video) {
	var hasAudio = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
	var onlyWhenNeeded = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

	if (onlyWhenNeeded && !isNeeded) {
		return;
	}
	addPlayer(video, hasAudio);
	overloadAPI(video);
	// console.log('Video will play inline');
}

module.exports = exports['default'];

},{"./intervalometer":2,"./prevent-event":3,"./proxy-property":4}],2:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = getIntervalometer;

function getIntervalometer(cb) {
	var raf = {
		start: function start() {
			if (!raf.lastCall) {
				raf.lastCall = Date.now();
			}
			cb(Date.now() - raf.lastCall);
			raf.lastCall = Date.now();
			raf.id = requestAnimationFrame(raf.start);
		},
		stop: function stop() {
			cancelAnimationFrame(raf.id);
			delete raf.id;
			delete raf.lastCall;
		}
	};
	return raf;
}

module.exports = exports['default'];

},{}],3:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = preventEvent;

function preventEvent(element, eventName, toggleProperty, preventWithProperty) {
	var handler = function handler(e) {
		var hasProperty = toggleProperty && element[toggleProperty];
		delete element[toggleProperty];
		if (!!hasProperty === !!preventWithProperty) {
			e.stopImmediatePropagation();
			// console.log(eventName, 'prevented on', element);
		}
	};
	element.addEventListener(eventName, handler, false);
	return {
		forget: function forget() {
			return element.removeEventListener(eventName, handler, false);
		}
	};
}

module.exports = exports['default'];

},{}],4:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, '__esModule', {
	value: true
});
exports['default'] = proxyProperty;

function proxyProperty(object, propertyName, sourceObject) {
	Object.defineProperty(object, propertyName, {
		get: function get() {
			return sourceObject[propertyName];
		},
		set: function set(va) {
			return sourceObject[propertyName] = va;
		}
	});
}

module.exports = exports['default'];

},{}]},{},[1])(1)
});