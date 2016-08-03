window.onresize = function() {
	canvasEl.width  = window.innerWidth;
	canvasEl.height = window.innerHeight;
	console.log(window.innerHeight, window.innerWidth);
};


function Meteor(radius, dRadius, x, y, vx, vy, ax, ay, color) {

	this.animate = function(dt) {
		radius += dt * dRadius;
		vx     += dt * ax;
		vy     += dt * ay;
		x      += dt * vx;
		y      += dt * vy;
	};

	this.getState = function() {
		return { x: x, y: y, radius: radius, color: color };
	};

	this.split = function(force) {

		radius = radius / Math.sqrt(2);
		var out = new Meteor(radius, dRadius, x, y, vx, vy - force, ax, ay, color);
		vy += force;
		return out;
	};
}



function Shaker() {

	var mx = 0,
		my = 0,
		dmx = 0,
		dmy = 0,
		hz = 1,
		t = 0;

	this.shake = function(_mx, _my, _hz, _t) {
		mx = _mx;
		my = _my;
		hz = _hz;
		t  = _t;
		dmx = - (mx / t);
		dmy = - (my / t);
	};

	this.step = function(dt) {
		t -= dt;

		var dx = 0, dy = 0;

		if (t >= 0) {

			mx += dmx * dt;
			my += dmy * dt;

			dx = Math.sin(Math.PI * t * hz) * mx;
			dy = Math.cos(Math.PI * t * hz) * my;
		}

		return { dx: dx, dy: dy };
	};
}



Meteor.Factory = function(radius, dRadius, x, y, vx, vy, ax, ay, color) {

	this.radius  = radius;
	this.dRadius = dRadius;
	this.x       = x;
	this.y       = y;
	this.vx      = vx;
	this.vy      = vy;
	this.ax      = ax;
	this.ay      = ay;
	this.color   = color;

	function ifndef (value, def) {
		return (value === undefined ? def : value);
	}

	this.make = function(obj) {
		obj = obj || {};
		return new Meteor(
			ifndef(obj.radius, this.radius),
			ifndef(obj.dRadius, this.dRadius),
			ifndef(obj.x, this.x),
			ifndef(obj.y, this.y),
			ifndef(obj.vx, this.vx),
			ifndef(obj.vy, this.vy),
			ifndef(obj.ax, this.ax),
			ifndef(obj.ay, this.ay),
			ifndef(obj.color, this.color.clone()));
	};
}

function PropertyPhaser(target, property, center, magnitude, frequency) {
	var t = 0;

	this.center = center;
	this.magnitude = magnitude;
	this.frequency = frequency;

	this.step = function(dt) {
		t += dt;
		target[property] = center + (Math.sin(Math.PI * t * frequency) * magnitude);
	};
}

var canvasEl = document.getElementById('canvas'),
	context = canvasEl.getContext('2d'),
	HYPOTENUSE_LENGTH = 50,
	steppers = [],
	shaker = new Shaker(),
	diamondCanvas = new DiamondCanvas(context, HYPOTENUSE_LENGTH),
	gravity = 300,
	meteorFactory = new Meteor.Factory(5, 10, 200, 0, 500, 700, 0, -700, new Color(255, 255, 255)),
	meteors = [],

	timer = new AnimationTimer(function(dt) {

		var shake = shaker.step(dt);

		steppers.forEach(function(stepper) {
			stepper.step(dt);
		});

		diamondCanvas.translate(- 100 * dt, 0);

		context.beginPath();
		context.moveTo(0, 0);
		context.lineTo(canvasEl.width, 0);
		context.lineTo(canvasEl.width, canvasEl.height);
		context.lineTo(0, canvasEl.height);
		context.fillStyle = 'rgba(0, 0, 0, ' + ((dt / 1).toString()) + ')';
		context.fill();

		meteors.forEach(function(meteor) {
			meteor.animate(dt);
			var meteorCoords = meteor.getState(),
				split,
				radius = meteorCoords.radius;
			var coords = diamondCanvas.getDiamondFromPageCoordinates(meteorCoords.x, meteorCoords.y);

			for (var xO = -1; xO <= 1; xO++) {
				for (var yO = -1; yO <= 1; yO++) {

					// split = meteor.split(dt, 100);
					// if (split) { meteors.push(split); }

					// if (Math.random() < dt * 0.020 && meteors.length < 10) {
					// 	meteors.push();
					// }

					var center = diamondCanvas.getPageCoordinatesFromDiamond(coords.x + xO, coords.y + yO);

					var distance = Math.sqrt(
						Math.pow(center.x - meteorCoords.x, 2) +
						Math.pow(center.y - meteorCoords.y, 2)
					);
					var scale = Math.max(0, Math.min(1 - (Math.max(0, distance - radius) / HYPOTENUSE_LENGTH), 1));

					if (scale > 0) {
						var color = meteorCoords.color.lighten(scale);
						diamondCanvas.drawDiamond(coords.x + xO, coords.y + yO, color.toHex(0.5  + (0.5 * scale)), scale);
					}
				}
			}

			canvasEl.style.transform = 'translate(' + shake.dx + 'px, ' + shake.dy + 'px)';
		});
	});

steppers.push(new PropertyPhaser(meteorFactory.color, 'r', 200, 50, .4));
steppers.push(new PropertyPhaser(meteorFactory.color, 'g', 200, 50, .3));
steppers.push(new PropertyPhaser(meteorFactory.color, 'b', 200, 50, .5));

document.body.addEventListener('keydown', function(e) {
	if (e.keyCode == 32) {
		shaker.shake(10, 10, 20, 10000);
	} else if (e.keyCode == 49) {
		var start = 0;
		for (i = 0; i < Math.random() * 10; i++) {

			setTimeout(function() {
				meteors.push(meteorFactory.make({
					x: start,
					ay: 100,
					r: .1,
					dRadius: 25
				}));
				steppers.forEach(function(stepper) { stepper.step(Math.random()); });
				start += Math.random() * 400;
			}, i * Math.random() * 200);


		}
	} else if (e.keyCode == 50) {
		meteors.push(meteorFactory.make());
	} else if (e.keyCode == 51) {
				// new Meteor(7, 50, 50, 1000, 0, 0, gravity, new Color(255, 200, 155)),

		meteors.push(meteorFactory.make({
			r: 7,
			dRadius: 10,
			y: canvas.height,
			vx: 1000,
			vy: -700,
			ax: 0,
			ay: 700
		}));
	} else if (e.keyCode == 52) {
		meteors.push(meteorFactory.make({
			r: Math.random() * 7,
			x: -10,
			y: Math.random() * canvas.height,
			vx: 1000,
			vy: 0,
			ax: 0,
			ay: 100
		}));
	} else if (e.keyCode == 73) { // i
		canvasEl.style.webkitFilter = 'invert(1)';
	} else {
		console.log(e.keyCode);
	}
});
document.body.addEventListener('keyup', function(e) {
	if (e.keyCode == 32) {
		shaker.shake(10, 10, 20, 1);
	} else if (e.keyCode == 73) {
		canvasEl.style.webkitFilter = '';
	}
});

// setTimeout(function() {
// 	timer.stop();
// }, 20000);

function Color(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
	this.toHex = function(alpha) {
		if (alpha !== undefined) {
			return 'rgba(' + this.r + ', ' + this.g + ',' + this.b + ', ' + alpha + ')';
		}
		return '#' + [this.r, this.g, this.b].map(function(c) { return ('00' + c.toString(16)).slice(-2); }).join('');
	};
	this.lighten = function(value) {
		value = Math.max(0, Math.min(1, value));
		return new Color(
			Math.max(0, Math.min(255, parseInt(this.r * value))),
			Math.max(0, Math.min(255, parseInt(this.g * value))),
			Math.max(0, Math.min(255, parseInt(this.b * value)))
		);
	};
	this.clone = function() {
		return new Color(this.r, this.g, this.b);
	}
}


function DiamondCanvas(context, hypotenuseLength) {

	this.translate = function(dx, dy) {
		var imgData = context.getImageData(0,0,canvasEl.width,canvasEl.height);
		canvasEl.width = canvasEl.width;
		context.putImageData(imgData,dx,dy);
	};

	var diamondLength = Math.sqrt(3) * hypotenuseLength,
		diamondHeight = hypotenuseLength,
		diamondHalfLength = diamondLength / 2,
		diamondHalfHeight = diamondHeight / 2,
		slope = 1 / Math.sqrt(3);

	this.getDiamondFromPageCoordinates = function(x, y) {
		var yIndex = -1 * Math.floor(((slope * x - y) / (slope * diamondLength)) + 0.5),
			xIndex = 1 * Math.floor(((y + slope * x) / diamondHeight) + 0.5);

		return { x: xIndex, y: yIndex };
	};

	this.getPageCoordinatesFromDiamond = function(x, y) {
		var ySum = (x + y),
			xSum = (x - y),
			y = ySum * diamondHalfHeight;
			x = xSum * diamondHalfLength;

		return { x: x, y: y };
	};

	this.drawDiamond = function(diamondX, diamondY, color, scale) {

		var centers = this.getPageCoordinatesFromDiamond(diamondX, diamondY);

		context.beginPath();
		context.moveTo(centers.x, centers.y - (scale * diamondHalfHeight));
		context.lineTo(centers.x + (scale * diamondHalfLength), centers.y);
		context.lineTo(centers.x, centers.y + (scale * diamondHalfHeight));
		context.lineTo(centers.x - (scale * diamondHalfLength), centers.y);
		context.fillStyle = color;
		context.fill();
	};
}

function AnimationTimer(callback) {
	var running = false,
		last = null;
		doDraw = function() {
			if (! running) { return; }
			var now = new Date(),
				dt = last ? (now - last) / 1000 : 0;

			last = now;
			callback.call(null, dt);
			requestAnimationFrame(doDraw, dt);
		};

	this.start = function() {
		running = true;
		doDraw();
	};

	this.stop = function() {
		last = null;
		running = false;
	};
}

function hashToHexColor(number) {
	var seed = String(number * 12345),
		arr = [1, 2, 3];

	return '#' + (arr.map(function(i) {
		return Number(seed.charAt(i)).toString(16);
	})).join('');
}

canvasEl.addEventListener('click', function(e) {
	var coords = diamondCanvas.getDiamondFromPageCoordinates(e.pageX, e.pageY);

	diamondCanvas.drawDiamond(coords.x, coords.y, hashToHexColor(Math.random()));
});

var time = new Date();
function draw() {
	requestAnimationFrame(draw);
	var now = new Date(),
		dt = (now - time);

	time = now;
}

timer.start();

window.onresize();

