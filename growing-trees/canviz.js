var canviz = (function() {

// these are indices, used to access the separate components of a vector.
var X = 0, Y = 1, Z = 2;

function addV3(p1, p2) { return [ p1[X] + p2[X], p1[Y] + p2[Y], p1[Z] + p2[Z] ]; }
function negV3(p1, p2) { return [ p1[X] - p2[X], p1[Y] - p2[Y], p1[Z] - p2[Z] ]; }
function sclV3(p, s)   { return [ p[X]*s, p[Y]*s, p[Z]*s ]; }
function floorV3(v)  { return [ Math.floor(v[X]), Math.floor(v[Y]), Math.floor(v[Z]) ]; }
function dotV3(a, b) { return a[X]*b[X] + a[Y]*b[Z] + a[Z]*b[Z]; }

function mulM3x3V(m, v) {
  return [
    m[0]*v[X] + m[1]*v[Y] + m[2]*v[Z],
    m[3]*v[X] + m[4]*v[Y] + m[5]*v[Z],
    m[6]*v[X] + m[7]*v[Y] + m[8]*v[Z],
  ];
}
function mulM3x3M(a, b) {
  return [
    a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
    a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
    a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8],
  ];
}

var overlayClassname = 'canviz-overlay';
var registerdContextsById = {};
var overlaysById = {};


function init() {
	var style = document.createElement("style");
	style.appendChild(document.createTextNode("")); // WebKit hack
	document.head.appendChild(style);
	var styling = 'position: absolute; pointer-events: none; z-index: 9999;';
	style.sheet.insertRule ? style.sheet.insertRule('.' + overlayClassname + '{' + styling + '}', 0)
		                     : style.sheet.addRule('.' + overlayClassname, styling, 1);
}

function getOrCreateOverlayContext(id) {
	if (!(id in overlaysById)) {
		var overlayCanvas = document.createElement('canvas');
		overlayCanvas.className = overlayClassname;
		overlayCanvas.id = id;
		document.body.appendChild(overlayCanvas);
		overlaysById[id] = overlayCanvas.getContext('2d');
	}
	return overlaysById[id];
}

function alignElementTo(rect, elem) {
	// Assumes elem is positioned absolutely to the window
	for (var p in rect) elem.style[p] = rect[p] + 'px';
}
function alignElements(a, b) {
	var rect = a.getBoundingClientRect();
	// Assumes elem is positioned absolutely to the window
	for (var p in rect) b.style[p] = rect[p] + 'px';
}

function getOverlay(instrumentedCtx) {
	var id = instrumentedCtx.__canvizId;
	if (!id) {
		console.error("cannot draw a grid; argument is not an instrumented render context.");
		return;
	}
	var overlay = getOrCreateOverlayContext(id);
	alignElements(instrumentedCtx.canvas, overlay.canvas);
}

var idHeadChars = '_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var idTailChars = '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function instrument(ctx) {
	var id = idHeadChars[Math.floor(Math.random()*idHeadChars.length)];
	while(id in registerdContextsById)
		idTailChars[Math.floor(Math.random()*idTailChars.length)];

	var instrumented = {};
	for (var prop in ctx) {
		if (typeof ctx[prop] == 'function')
			instrumented[prop] = ctx[prop].bind(ctx);
		else
			instrumented[prop] = ctx[prop];
	}

	var states = [];
	var defaultState = {
		transform: [
			1, 0, 0,
			0, 1, 0,
			0, 0, 1,
		],
		inverse: [
			1, 0, 0,
			0, 1, 0,
			0, 0, 1,
		],
		path: [],
		head: [0, 0],
		fillStyle: "#000",
		strokeStyle: "#000",
	};


	var currentState = Object.assign({}, defaultState);

	function transform(state, m, inv) {
		ctx.transform(
			m[0], m[3], m[1],
			m[4], m[2], m[5]
		);

		state.transform = mulM3x3M(state.transform, m);
		state.inverse = mulM3x3M(inv, state.inverse);
	}

	var proxy = {
		__canvizId: id,
		__ctx: ctx,
		__currentState: currentState,
		beginPath: function() {
			this.__currentState.path = [];
			ctx.beginPath();
		},
		moveTo: function(x, y) {
			this.__currentState.head = [x, y];
			ctx.moveTo(x, y);
		},
		lineTo: function(x, y) {
			if (this.__currentState.path.size == 0) 
				this.__currentState.path.push(this.__currentState.head);

			this.__currentState.head = [x, y];
			this.__currentState.path.push(this.__currentState.head);
			ctx.lineTo(x, y);
		},
		closePath: function() {
			if (this.__currentState.path.size > 1) {
				var head = this.__currentState.path[0];
				this.__currentState.path.push([ head[X], head[Y] ]);
			}
			ctx.closePath();
		},

		translate: function(x, y) {
			var m = [
				1, 0, x,
				0, 1, y,
				0, 0, 1,
			];
			var inv = [
				1, 0, -x,
				0, 1, -y,
				0, 0, 1,
			];

			transform(this.__currentState, m, inv);
			// proxy.trans(transform);
		},
		scale: function(x, y) {
			if (typeof y == 'undefined') y = x;
			var m = [
				x, 0, 0,
				0, y, 0,
				0, 0, 1,
			];
			var inv = [
				1/x,   0, 0,
				  0, 1/y, 0,
				  0,   0, 1,
			];
			transform(this.__currentState, m, inv);
		},
		rotate: function(a) {
			var c = Math.cos(a);
			var s = Math.sin(a);
			var m = [
				c, -s, 0,
				s,  c, 0,
				0,  0, 1,
			];


			c = Math.cos(-a);
			s = Math.sin(-a);
			var inv = [
				c, -s, 0,
				s,  c, 0,
				0,  0, 1,
			];
			transform(this.__currentState, m, inv);
		},
		transform: function(m) {
			// TODO: implement inverse
			transform(this.__currentState, m, [
				1, 0, 0,
				0, 1, 0,
				0, 0, 1,
				]);
		},

		save: function() {
			states.push(this.__currentState);
			this.__currentState = currentState = Object.assign({}, currentState);
			ctx.save();
		},
		restore: function() {
			this.__currentState = currentState = states.pop();
			ctx.restore();
		}
	};

	Object.assign(instrumented, proxy);

	return instrumented;
}

function clearOverlay(instrumented) {
	var id = instrumented.__canvizId;
	if (!id) {
		console.error("cannot draw a grid; argument is not an instrumented render context.");
		return;
	}

	var ctx = overlaysById[id];
	if (!ctx) return;

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawNormals(instrumentedCtx, length, width) {
	if (!length) length = 10;
	if (!width)  width  =  1;

	var id = instrumentedCtx.__canvizId;
	if (!id) {
		console.error("cannot draw a grid; argument is not an instrumented render context.");
		return;
	}
	var ctx = getOrCreateOverlayContext(id);
	alignElements(instrumentedCtx.canvas, ctx.canvas);

	var currentState = instrumentedCtx.__currentState;

	var m = Object.assign([], currentState.transform);
	m[2] = 0.5*ctx.canvas.width;
	m[5] = 0.5*ctx.canvas.height;

	ctx.save();
	ctx.lineWidth = width;

	var origin = mulM3x3V(m, [0, 0, 1]);
	var xAxis  = mulM3x3V(m, [length, 0, 1]);
	var yAxis  = mulM3x3V(m, [0, length, 1]);

	ctx.strokeStyle = colorTable.xAxis;
	ctx.beginPath();
	ctx.moveTo(origin[X], origin[Y]);
	ctx.lineTo( xAxis[X],  xAxis[Y]);
	ctx.stroke();
	
	ctx.strokeStyle = colorTable.yAxis;
	ctx.beginPath();
	ctx.moveTo(origin[X], origin[Y]);
	ctx.lineTo( yAxis[X],  yAxis[Y]);
	ctx.stroke();

	ctx.restore();
}

function drawGrid(instrumentedCtx, stepX, stepY, lineWidth) {
	var id = instrumentedCtx.__canvizId;
	if (!id) {
		console.error("cannot draw a grid; argument is not an instrumented render context.");
		return;
	}
	var ctx = getOrCreateOverlayContext(id);
	alignElements(instrumentedCtx.canvas, ctx.canvas);

	var currentState = instrumentedCtx.__currentState;
	var bounds = ctx.canvas.getBoundingClientRect();

	// corners of canvas in render space
	var tl = mulM3x3V(currentState.inverse, [            0,             0, 1 ]);
	var tr = mulM3x3V(currentState.inverse, [ bounds.width,             0, 1 ]);
	var br = mulM3x3V(currentState.inverse, [ bounds.width, bounds.height, 1 ]);
	var bl = mulM3x3V(currentState.inverse, [            0, bounds.height, 1 ]);

	var parallelogram = [ tl, tr, br, bl ];

	var minXI = 0, minX = tl[X];
	var minYI = 0, minY = tl[Y];
	var i;
	for (i = 1; i < parallelogram.length; ++i) {
		var p = parallelogram[i];
		if (p[X] < minX) {
			minXI = i;
			minX = p[X];
		}
		if (p[Y] < minY) {
			minYI = i;
			minY = p[Y];
		}
	}

	function wrap(i) { return (i + 4) % 4; }
	var p00, p01, p10, p11;

	// draw vertical lines first, from left to right.
	stepX = Math.abs(stepX);
	var xBefore = Math.floor(minX / stepX)*stepX;

	p00 = parallelogram[minXI];
	p11 = parallelogram[wrap(minXI + 2)];

	p01 = parallelogram[wrap(minXI + 1)];
	p10 = parallelogram[wrap(minXI - 1)];
	if (p10[X] > p01[X]) {
		p01 = parallelogram[wrap(minXI - 1)];
		p10 = parallelogram[wrap(minXI + 1)];
	}

	var d0001 = negV3(p01, p00);
	var a = d0001[Y]/d0001[X];

	var d0010 = negV3(p10, p00);
	var span = [0, d0010[Y] + a*(-d0010[X]), 0];
	var dp = [ stepX, stepX*a, 0 ];

	ctx.save();

	ctx.lineWidth = lineWidth;

	for (var pnow = [ xBefore, p00[Y] - a*(p00[X] - xBefore), 1 ];
		pnow[X] <= p11[X]; pnow = addV3(pnow, dp)) {


		if (pnow[X] == 0) {
			ctx.lineWidth = lineWidth*2;
			ctx.strokeStyle = colorTable.xAxis;
		} else {
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = colorTable.gridLines;
		}

		var pnow0 = mulM3x3V(currentState.transform, pnow);
		var pnow1 = mulM3x3V(currentState.transform, addV3(pnow, span));

		ctx.beginPath();
		ctx.moveTo(pnow0[X], pnow0[Y]);
		ctx.lineTo(pnow1[X], pnow1[Y]);
		ctx.stroke();
	}
	// draw vertical lines first, from left to right.
	stepY = Math.abs(stepY);
	var yBefore = Math.floor(minY / stepY)*stepY;

	p00 = parallelogram[minYI];
	p11 = parallelogram[wrap(minYI + 2)];

	p01 = parallelogram[wrap(minYI + 1)];
	p10 = parallelogram[wrap(minYI - 1)];
	if (p10[Y] > p01[Y]) {
		p01 = parallelogram[wrap(minYI - 1)];
		p10 = parallelogram[wrap(minYI + 1)];
	}

	d0001 = negV3(p01, p00);
	a = d0001[X]/d0001[Y];
	dp = [ stepY*a, stepY, 0 ];

	d0010 = negV3(p10, p00);
	span = [d0010[X] + a*(-d0010[Y]), 0, 0];

	ctx.lineWidth = lineWidth;

	for (pnow = [ p00[X] - a*(p00[Y] - yBefore), yBefore, 1 ];
		pnow[Y] <= p11[Y]; pnow = addV3(pnow, dp)) {

		if (pnow[Y] == 0) {
			ctx.lineWidth = lineWidth*2;
			ctx.strokeStyle = colorTable.yAxis;
		} else {
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = colorTable.gridLines;
		}

		var pnow0 = mulM3x3V(currentState.transform, pnow);
		var pnow1 = mulM3x3V(currentState.transform, addV3(pnow, span));

		ctx.beginPath();
		ctx.moveTo(pnow0[X], pnow0[Y]);
		ctx.lineTo(pnow1[X], pnow1[Y]);
		ctx.stroke();
	}

	var origin = mulM3x3V(currentState.transform, [0, 0, 1]);
	ctx.beginPath();
	ctx.arc(origin[X], origin[Y], 3, 0, TAU);
	ctx.fill();

	ctx.restore();

}

var colorTable = {
	xAxis: 'rgb(0, 255, 0)',
	yAxis: 'rgb(255, 0, 0)',
	gridLines: 'rgba(20, 20, 20, 0.5)',
	origin: 'black',
};

return {
	colorTable:   colorTable,
	getOverlay:   getOverlay,
	clearOverlay: clearOverlay,
	instrument:   instrument,
	drawNormals:  drawNormals,
	drawGrid:     drawGrid,
	init:         init,
};
})();