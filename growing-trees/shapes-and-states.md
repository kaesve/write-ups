# The canvas API: shapes and states

The canvas API is a wonderful toolset provided by your browser. It allows you to draw anything you want, do image post processing and tons of other cool things. It is also *very* stateful. It turns out working with the canvas often boils down to set and manipulating parts of that state to your needs and then do one or two actual drawing operations. Let me show you what I mean:

``` html
<canvas id="my-canvas"></canvas>

<script type="text/javascript">
var canvasElem = document.getElementById("my-canvas");
var ctx = canvasElem.getContext('2d');

ctx.lineWidth = 2;
ctx.strokeStyle = 'red';

ctx.beginPath();
ctx.moveTo(10, 10);
ctx.lineTo(30, 10);
ctx.stroke();

</script>
```

To draw a red, 2px wide line, you have to set the width and color of the line, tell the context object to clear any existing path, move it to the start of your desired line, tell it you want a line from there to another point (which also moves the context to that point) and then finally tell it to draw the path you told it to construct, with the properties set before.

There are several more properties you can configure, some of which are a lot more complicated. On top of that, many of these properties, like the path and the current position, are hidden from you: you can set or manipulate them, but there is no way to see the current state. To make it easier to work with the canvas API, I am building a tool to keep track of these properties and visualize them in various ways. Although the tool is still in very early development, and quite unpolished, here are some of the things it can already do:

* track the coordinate system states through rotation, skewing, translation and scaling
* translate between 'render space', 'canvas space', (window space and page space)
* track the current position and path
* track state `.save()`s and `.restore()`s

* visualize the coordinate system by means of a grid overlay
* visualize the normals of the coordinate system

To use it, you first have to instrument the canvas context object that you are interested in. The instrumented object should work just like a normal context object, but it now exposes more of its inner state. There are also several procedures you can call with the instrumented context, to visualize its state in different ways. Here is a complete minimal example that shows how you can use the tool to instrument a context and visualize the transformed coordinate system:

``` html
<!DOCTYPE html>
<title>Minimal example</title>
<canvas id="demo-canvas"></canvas>
<script type="text/javascript" src="canviz.js"></script>
<script type="text/javascript">

	// run this once before you visualize anything
	canviz.init();

	// aqcuire canvas and context the normal way, then instrument the context
	var demoCanvas = document.getElementById('demo-canvas');
	var ctx = demoCanvas.getContext('2d');
	ctx = canviz.instrument(ctx);

	// use the instrumented context as normal
	ctx.rotate(Math.PI/3);
	ctx.translate(10, 0);
	ctx.scale(2, 0.5);

	// visualize the current state
	canviz.drawGrid(ctx, 10, 10, 1);
</script>
```

<figure>
	<canvas id="demo-canvas"></canvas>
	<script type="text/javascript" src="/math.js"></script>
	<script type="text/javascript" src="/utils.js"></script>
	<script type="text/javascript" src="/canviz.js"></script>
	<script type="text/javascript">
		// run this once before you visualize anything
		canviz.init();
	
		// aqcuire canvas and context the normal way, then instrument the context
		var demoCanvas = document.getElementById('demo-canvas');
		var ctx = demoCanvas.getContext('2d');
		ctx = canviz.instrument(ctx);

		// use the instrumented context as normal
		ctx.rotate(Math.PI/3);
		ctx.translate(10, 0);
		ctx.scale(2, 0.5);

		// visualize the current state
		canviz.drawGrid(ctx, 10, 10, 1);
	</script>
	<figcaption>
		result of the sample code
	</figcaption>
</figure>



Read more on how to access or visualize the internal state over on the documentation page [XXX].

There are a lot of things that I have yet to fix add. On my to-do list right now are:

* support 'setTransform()', and handle cases where there is no inverse transformation matrix
* visualize the current stroke and fill style (includig global opacity, gradients, line width, caps, miter, etc)
* visualize the current position and constructed path
* animate between transform states
* log all the calls to the context
* log all input events on the canvas
