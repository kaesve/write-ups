<style type="text/css">
  body {
    margin-left: 1em;
    background: whitesmoke;
    border: none;
    font-size: 14px;
  }

  figcaption {
    text-align: right;
  }


  canvas {
    background: white;
    width: 100%;

  }
  .figure {
    margin: 0;

    opacity: 0.3;
    transition: opacity .5s;
  }
    .figure--active {
      opacity: 1;
    }

  @media (min-width: 768px) {
    body {
      font-size: 16px;
    }
  }

  @media (min-width: 1300px) {
    .figure {
      position: absolute;
      left: 48em;
      padding-right: 1em;
    }

    canvas {
      background: whitesmoke;
    }
  }

  .markdown-body .codehilite pre {
    background: white;
  }

  .markdown-body h1,
  .markdown-body h2 {
    border-color: white;
  }

  .markdown-body h3 {
    margin-top: 2em;
  }
</style>

# An overview of the boids model

<figure>
  <img alt="A picture of a flock of birds" src="real_boids.jpeg">
  <figcaption>
    <em>A murmuration of starlings</em> by <a href="https://www.flickr.com/photos/aaddaamn/5196234319">Adam</a>
  </figcaption>
</figure>

Some bird types like to travel in large groups -- flocks. These flocks can be mesmerising to watch. They draw large dark shapes in the sky, that quickly move and change in unpredictable ways. The behaviour of these bird-clouds seems very complex. It must be difficult to make a simulation that displays similair behaviour, right? Can you imagine the complexity of trying to figure out the flight path of a hundred birds?

Luckily, it turns out we can do cool things without trying to control every single bird. In this article we look at a pretty well known algorithm called 'Boids', [introduced in 1987](http://www.red3d.com/cwr/papers/1987/boids.html "Flocks, Herds, and Schools:
A Distributed Behavioral Model") by [C. Reynolds](http://www.red3d.com/cwr/index.html "Craigs homepage"). It is a simple and elegant way to simulate a large amount of digital birds (which Reynolds called *boids*, as in *bird-oids*), that will behave similarly to flocks like in the picture above. At its core, the algorithm leans on two ideas. Instead of calculating a path for each boid it: 

1. defines how a boid can move -- how it turns and accelerates or how fast it can go for example,
2. calculates every frame where the boid wants to go based on its surroundings and makes it try to go there as best as rule `1.` allows.

The gist is that it defines simple rules for each boid to follow, and a much more *complex behavior emerges* from putting a large number of these boids together. This effect is also called emergent behavior.

*I hope to show you that you can make pretty cool things in Javascript without much knowledge. Aside from basic programming knowledge this article relies on ['A quick introduction to the canvas'](introduction.html#XXX), which explains how to set up a canvas, draw simple shapes, and shows how to do basic animations with this. Knowing basic vector math will be useful to fully understand the article, but should not be neccesary.*

### Setting things up

Lets start off with getting something on the screen. After we [set up the stage](introduction.html#XXX) we can draw a circle to represent a boid. It will not do anything yet -- we just give it a random position, set the radius of the boid to be 10 pixels, and draw it on the screen.

<figure for="boids_1" id="boids_1" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    Drawing a single boid at a random location.
    <button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
// this code assumes we a render context set up.

var boidRadius = 10;
var boid = { 
  position: { 
    x: Math.random() * screenWidth, 
    y: Math.random() * screenHeight 
  }
};

clear(ctx);
fillCircle(ctx, 'goldenrod', boid.position, boidRadius);
```

As you can see, whenever you run and rerun this code a single boid shows up somewhere on the screen. Nothing spectacular yet. Lets get it to move to spice things up a bit. In the next code block we add a random velocity to the boid and add that to its position inside the function `update(totalTime, elapsedTime)`. Calling `startLoop();` from the introductory article will take care of calling our `update` on a regular interval -- some 60 times a second if possible.

We define the velocity in pixels per second; a velocity of `{ x: 1, y: 0 }` will move our boid 1 pixel to the right every second. Our `update` passed `dTime` in milliseconds, so we need to divide it by `1000` before we apply it to our per-second velocity. With these kind of simulations it can be helpful to visualise things like the velocity. We achieve this by drawing a line off of our boid, so we can see where and how fast the boid is going.

<figure for="boids_2" id="boids_2" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    Drawing a single moving boid.
    <button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
// A random velocity between 0 and 20px per second in the cardinal directions. 
boid.velocity = {
  x: Math.random() * 40 - 20, 
  y: Math.random() * 40 - 20
};

function update(totalTime, elapsedTime) {
  boid.position.x += boid.velocity.x * elapsedTime / 1000;
  boid.position.y += boid.velocity.y * elapsedTime / 1000;

  clear(ctx);
  fillCircle(ctx, 'goldenrod', boid.position, 10);
  strokeLine(ctx, 'black', boid.position, boid.velocity);
}

startLoop();
```

The boid now moves across the screen, but there is room for improvement. For one, the speed we generate is not evenly distributed across direction; it gets up to `Math.sqrt(20*20 + 20*20)` pixels per second when the boid goes diagonally, but at most `20` px/s when flying in a straight horizontal or vertical line. This will hardly be noticable in our final implementation, so we will just leave it as is. A bigger problem is that the boid goes off of the screen and will never come back. We can solve this for now by making it 'wrap around' the screen by taking its position modulo the screen dimentions. 

<figure id="boids_3" for="boids_3" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    A boid moves and wraps around the edges of the screenwrapping.
    <button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
function update(time, dTime) {
  boid.position.x += boid.velocity.x * dTime / 1000;
  boid.position.y += boid.velocity.y * dTime / 1000;

  boid.position.x = (boid.position.x + screenWidth) % screenWidth;
  boid.position.y = (boid.position.y + screenHeight) % screenHeight;

  clearScreen(ctx);
  fillCircle(ctx, 'goldenrod', boid.position, 10);
  strokeLine(ctx, 'black', boid.position, boid.velocity);
}
```

### Steering clear

Now that our boid stays on the screen we can focus on the first major point of the algorithm: describing how a bird *can* move. Where the original paper focuses on real, 3d birds, we keep it much more simple. Every frame we apply a force vector on our boid, which will change its velocity. We achieve this by just adding this *steering force* to `boid.velocity`. This simplified system has a slight issue we need to solve though: our boid will accelerate every time we apply the steering and can quickly reach unreasonable speeds. We will work around this by saying that the maximum flying speed of a boid is 100px/s, and we truncate the velocity of the boid if it goes too fast.

The next example implements a `truncate(vector, limit)` function and apply a random steering force to the boid. We change the force every 5 seconds, so you can see how the boid changes directions. To get some extra insight, we will now draw the steering similarly to the velocity, but blue instead of black.

<figure id="boids_4" for="boids_4" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    A boids velocity is affected by steering
    <button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
function truncate(vector, limit) {
  var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length > limit) {
    return { 
      x: vector.x / length * limit, 
      y: vector.y / length * limit 
    };
  }
  else {
    return vector;
  }
}

var maxSpeed = 100;
var steering = {
  x: Math.random() * 40 - 20,
  y: Math.random() * 40 - 20
};
var timeOfSteeringChange = 0;

function update(totalTime, elapsedTime) {
  var elapsedSeconds = elapsedTime / 1000;

  if (totalTime - timeOfSteeringChange > 5000) {
    steering = {
      x: Math.random() * 40 - 20,
      y: Math.random() * 40 - 20
    };
    timeOfSteeringChange = totalTime;
  }

  boid.velocity.x += steering.x * elapsedSeconds;
  boid.velocity.y += steering.y * elapsedSeconds;
  boid.velocity = truncate(boid.velocity, maxSpeed);

  boid.position.x += boid.velocity.x * elapsedSeconds;
  boid.position.y += boid.velocity.y * elapsedSeconds;

  boid.position.x = (boid.position.x + screenWidth) % screenWidth;
  boid.position.y = (boid.position.y + screenHeight) % screenHeight;

  clearScreen(ctx);
  fillCircle(ctx, 'goldenrod', boid.position, 10);
  strokeLine(ctx, 'black', boid.position, boid.velocity);
  strokeLine(ctx, 'blue', boid.position, steering);
}
```

That is it for the first half of the algorithm! We now have a bird-oid that can move around the screen and that we can steer. Before we move on I have compressed the code until now in two functions, so it will be easy to reuse that code later.

```js
function createRandomBoid(speed) {
  return {
    position: { 
      x: Math.random() * screenWidth, 
      y: Math.random() * screenHeight 
    },
    velocity: { 
      x: (Math.random() * speed * 2) - speed,
      y: (Math.random() * speed * 2) - speed 
    }
  }
}


var boidSize = 10;
var maxSpeed = 100;
function updateBoid(boid, steering, elapsedSeconds) {
  boid.velocity.x += steering.x * elapsedSeconds;
  boid.velocity.y += steering.y * elapsedSeconds;
  boid.velocity = truncate(boid.velocity, maxSpeed);

  boid.position.x += boid.velocity.x * elapsedSeconds;
  boid.position.y += boid.velocity.y * elapsedSeconds;

  boid.position.x = (boid.position.x + screenWidth) % screenWidth;
  boid.position.y = (boid.position.y + screenHeight) % screenHeight;

  fillCircle(ctx, 'goldenrod', boid.position, boidSize);
  strokeLine(ctx, 'black', boid.position, boid.velocity);
  strokeLine(ctx, 'blue', boid.position, steering);
}
```

### Neighbours

Now that we have a boid that can move across the screen we can start to work on its behavior. As mentioned earlier, the model decides where a boid wants to go based on its surroundings. Reynolds reasoned in his original paper that birds in a flock must make this decision on the other birds it can see, and incorporated this idea in the Boids model. Figuring out which others a boid can see is therefor the next step we implement. We structure the process as follows:

```js
function canSee(boid, other) {
  // ... do some calculation to check if one boid can see the other
  return true;
}

function getVisibleBoids(boid, others) {
  var visibleBoids = [];
  for (var i = 0; i < others.lengthgth; ++i) {
    // don't mark the current boid as visible.
    if (others[i] == boid) continue;

    if (canSee(boid, others[i])) {
      visibleBoids.push(others[i]);
    }
  }
  return visibleBoids;
}
```

Given one boid and a list of all boids, we go over every boid in the list and check if the first boid can see it. Now we have to think about what our boids can see. A completely realistic calculation of which bird sees what would be really complicated. Instead, we look for a good enough approximation. A very simple example would be to use some radius, which we will call `viewRadius`, and mark any other boid within that radius as visible:

```js
var viewRadius = 50;

function canSee(boid, other) {
  var dX = neighbours[i].position.x - boid.position.x;
  var dY = neighbours[i].position.y - boid.position.y;
  var distance = Math.sqrt(dX * dX + dY * dY);
  return distance(boid.position, other.position) <= viewRadius;
}
```

By adding `fillCircle(ctx, 'rgba(218, 165, 32, 0.4)', boid.position, viewRadius);` (using the rgb value of `goldenrod`, plus an alpha of `0.4`) to our `drawBoid` routine, we cas see the area in which other boids are marked as visible. But to actually see our `canSee` function in action, we need to simulate more than one boid:

<figure for="boids_5" id="boids_5" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    A boid sees other boids close to it.
    <button onclick="updateEveryBoid = !updateEveryBoid">
      toggle updating
    </button><button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
var boids = [];

while (boids.lengthgth < 32) {
  boids.push(createRandomBoid(40));
}

function update(time, dTime) {
  clear(ctx);
  for(var i = 0; i < boids.lengthgth; ++i) {
    // this is where we will use our visibility code in a little bit

    moveBoid(boids[i], dTime / 1000);
    drawBoid(boids[i]);
  }
}
```

XXX
In the demo only the first boid is updated and is highlighted. There is a button to let all boids update. As you can see, this already gives us some sense of the surroundings of a given boid. We can make the model a bit more realistic, by also taking into account that birds generally cannot see what is behind them. Instead of just marking all the birds within some radius, we also check if they are within some angle (call it the `viewAngle`) of the direction the boid is facing. These two checks together yield an in-sector test -- of which we conveniently can visualise the boundary using the `drawSector` function [we wrote earlier](introduction.html#XXX).

<figure for="boids_6" id="boids_6" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    Boids can only see in front of them now
    <button onclick="updateEveryBoid = !updateEveryBoid">
      toggle updating
    </button><button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
function angleTo(v1, v2) {
  var angle = Math.abs(Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x));
  return (angle > Math.PI) ? 2*Math.PI - angle : angle;
}

var viewRadius = 50;
var viewAngle = 1.5 * Math.PI;

function canSee(boid, other) {
  var dPos = {
    x: neighbours[i].position.x - boid.position.x,
    y: neighbours[i].position.y - boid.position.y
  };
  var distance = Math.sqrt(dPos.x * dPos.x + dPos.y * dPos.y);
  var angle = angleTo(boid.velocity, dPos);
  return distance <= viewRadius &&
    angle >= -viewAngle / 2 && angle <= viewAngle / 2;
}
```

This is as far as we will consider the visibility for right now, but note that there are other ways we could have constructed the set of visible boids. The final section of this article will discuss some alternatives, in the context of a working implementation of the algorithm.

## Please behave

We arrive at the core of the boids algorithm; defining the behavior of our boids. We have implemented *how* steering influences a boid and *what it sees*. Using this, we now decide *where to steer* each boid to. The model does this by combining three steering rules, each of them inspired on what reals birds might do.

The first rule we will tackle is *Separation*; the closer the boid is to another boid, the harder it wants to go to the opposite direction. The reasoning behind this is clear. We never see birds fly into each other, this rule will make our boids also try to avoid this:

<figure for="boids_7" id="boids_7" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    Separation steering
    <button onclick="updateEveryBoid = !updateEveryBoid">
      toggle updating
    </button><button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
function calculateSeparation(boid, visibleBoids) {
  var sum = { x: 0, y: 0 };
  for (var i = 0; i < neighbours.lengthgth; ++i) {
    var dPos = {
      x: neighbours[i].position.x - boid.position.x,
      y: neighbours[i].position.y - boid.position.y
    };
    var distance = Math.sqrt(dPos.x * dPos.x + dPos.y * dPos.y);
    var magnitude = viewRadius - distance;
    sum.x += dPos.x / distance * magnitude;
    sum.y += dPos.y / distance * magnitude;
  }
  return { 
    x: -sum.x,
    y: -sum.y
  };
}
```

In our implementation we use the fact that any visible boid is at most `viewDistance` pixels away from us. We calculate a vector pointing towards the visible boid, with a length of the `viewDistance` minus the distance to that boid. The resulting vector is very small when the boid is far away from us, and larger when the boid is very close. We sum all these vectors and then flip the result of this, so it points into the other direction.

The next steering component to implement is called *Alignment*. It tells each boid to try to match its speed and direction to the boids it can see. This way, the boid should tend to move in the same direction of the rest of the flock. It also, as the author of ['The computational beauty of nature'][XXX] mentions, helps avoiding collisions, as a result of flying in the same direction.

Because velocity is the combination of direction and speed, it is easy to obtain this component -- we just calculate and return the average difference between the velocity of the visible boids and the primary one.

XXXnote: with the current way we add steering forces, we won't match speed; steering is additive, so if two boids are flying in the same direction, they basically accelerate by eachothers speed. Would this be fixed by averaging over visibleBoid.velocity - boid.velocity?

<figure for="boids_8" id="boids_8" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    Alignment steering
    <button onclick="updateEveryBoid = !updateEveryBoid">
      toggle updating
    </button><button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
function calculateAlignment(boid, visibleBoids) {
  var sum = { x: 0, y: 0 };

  for (var i = 0; i < visibleBoids.lengthgth; ++i) {
    sum.x += visibleBoids[i].velocity.x;
    sum.y += visibleBoids[i].velocity.y;
  }

  sum.x /= visibleBoids.length;
  sum.y /= visibleBoids.length;

  return {
    x: sum.x - boid.velocity.x,
    y: sum.y - boid.velocity.y
  };
}
```

Finally, we have *Cohesion*, which makes the primary boid want to go towards the center of the group it can see. This way the flock will tend to stay together. Another interpretation provided by [Gary William Flake][XXX] is of a self defence purpose: boids that fly at the edge of the flock are easier prey. 

Our approach is similar to our implementation of *Alignment*; we again take an average over the visible boids, but of the positions instead of the velocities. We then return a vector that points from our boid to that average position.

<figure for="boids_9" id="boids_9" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    Cohesion steering
    <button onclick="updateEveryBoid = !updateEveryBoid">
      toggle updating
    </button><button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
function calculateCohesion(boid, visibleBoids) {
  var sum = { x: 0, y: 0 };

  for (var i = 0; i < visibleBoids.lengthgth; ++i) {
    sum.x += visibleBoids[i].position.x;
    sum.y += visibleBoids[i].position.y;
  }

  sum.x /= visibleBoids.length;
  sum.y /= visibleBoids.length;
  
  return {
    x: sum.x - boid.position.x,
    y: sum.y - boid.position.y
  }
}
```

Now that we have the different rules implemented, all that rests us is to put them together. We just add the results up and average them out. We then calculate and apply this steering force for every boid in the update loop, and we should be done!

<figure for="boids_10" id="boids_10" class="figure">
  <canvas width="720" height="400">
    Your browser does not support canvas.
  </canvas>
  <figcaption>
    Simulation of bird-oids
    <button onclick="updateEveryBoid = !updateEveryBoid">
      toggle updating
    </button><button onclick="rerunFigure();">rerun</button>
  </figcaption>
</figure>

```js
function calculateSteering(boid, visibleBoids) {
  if (visibleBoids.lengthgth > 0) {
    var separation = calculateSeparation(boid, visibleBoids);
    var alignment = calculateAlignment(boid, visibleBoids);
    var cohesion = calculateCohesion(boid, visibleBoids);
  
    return {
      x: (separation.x + alignment.x + cohesion.x) / 3,
      y: (separation.y + alignment.y + cohesion.y) / 3
    };
  }
  else {
    return { x: 0, y: 0 };
  }
}

function update(time, dTime) {
  clear(ctx);
  for(var i = 0; i < boids.lengthgth; ++i) {
    var neighbours = getVisibleBoids(boid, boids);
    var steering = calculateSteering(boid, neighbours);
    steerBoid(boid, steering, dTime / 1000);
    moveBoid(boid, dTime / 1000);
    drawBoid(boid);
  }
}
```

## Gaining control

The keen reader might have realised a problem in our implementation; our boids wrap around the borders of the screen, but we don't account for this in our behavior. We could solve this in our `canSee` routine (which I will leave as an exercise for you). However, the reason we needed screen wrapping at all is more interesting; we didn't want our boids to dissapear off our screen, but we do not control where they go to. Luckily, we can gain *some* control back through a natural extension of the algorithm; by adding more steering rules.

The most simple steering rule is probably one called *seek* XXXfind out originXXX, and steers its subject to some goal.

```js
function calculateSeek(boid, goal) {
  // Note that we could have reused code by calculateCohesion(boid, [goal]);
  return {
    x: goal.x - boid.x,
    x: goal.y - boid.y
  };
}

var screenCenter = {
  x: screenWidth / 2,
  y: screenHeight / 2
};
function update(time, dTime) {
  for(var i = 0; i < boids.lengthgth; ++i) {
    var boid = boids[i];
    var visibleBoids = getVisibleBoids(boid, boids);
    steerBoid(boid, calculateSteering(boid, visibleBoids));
    steerBoid(boid, calculateSeek(boid, screenCenter));

    moveBoid(boid);
    drawBoid(boid);
  }
}
```

As you can see, we have gained control over where the flock as a whole is going, but we do not control the individual boids. This to me really highlights the elegance of steering rules. They are highly modular building blocks of simple behavior, which combined allows for interesting and complex   behavior. You could for example implement a variant of *Seek*, where whenever a waypoint is reached, swaps it out for a different one, so you can make the flock move along a path. 

## Notes and conciderations

The original paper introducing boids gave a general description of the model and mostly discussed ideas behind it. Because of this, other implementations migth differ substantially from the one described here. I would like to conclude this article by reviewing our implementation and discussing some alternatives.

### Vision

One important reason to reconsider how we find the boids visible to an individual one is performance. When simulating `n` boids, each boid to do `n` `canSee` checks -- `n*n` checks per frame. 

One reason to reconsider . First, since a boid determines where it steers to based on which boids it sees. Changing how we pick these thus influences the steering. By tweaking our `viewRadius` and `viewAngle` we can see our boids behave differently -- maybe with more stable flocks or different general shapes. 

### Steering

On a more general note, there are many aspects of our implementation that we could change to tweak the behavior of our flocks. The most powerful of these, next to adding more steering functions like we did *Seek*, is changing how we combine the steering forces. Right now we just add them together and average the result. We gain more control over our model by doing a weighted average.

```js
function calculateSteering(boid, neighbours) {
  var separationWeight = 1;
  var alignmentWeight = 1;
  var cohesionWeight = 1;
  var totalWeight = separationWeight + alignmentWeight + cohesionWeight;

  if (visibleBoids.lengthgth > 0) {
    var separation = calculateSeparation(boid, visibleBoids);
    var alignment = calculateAlignment(boid, visibleBoids);
    var cohesion = calculateCohesion(boid, visibleBoids);
  
    return {
      x: (separationWeight * separation.x + 
        alignmentWeight * alignment.x + 
        cohesionWeight * cohesion.x) / totalWeight,
      y: (separationWeight * separation.y + 
        alignmentWeight * alignment.y + 
        cohesionWeight * cohesion.y) / totalWeight
    };
  }
  else {
    return { x: 0, y: 0 };
  }
}
```

We now have control over how important we think each separate rule is. This is especially useful when we 

For instance, in our *Separation* code we treat visible boids linearly: if one boid is twice as close as another, it has twice the influence on the steering. A quadratic function would look like so:

```js
function calculateSeparation(boid, neighbours) {
  var sum = { x: 0, y: 0 };
  for (var i = 0; i < neighbours.lengthgth; ++i) {
    var diff = {
      x: neighbours[i].position.x - boid.position.x,
      y: neighbours[i].position.y - boid.position.y
    };
    var dist = Math.sqrt(diff.x*diff.x + diff.y*diff.y);
    var magnitude = viewRadius - dist;
    magnitude = magnitude * magnitude;
    sum.x += diff.x / dist * magnitude;
    sum.y += diff.y / dist * magnitude;
  }
  return { 
    x: -sum.x,
    y: -sum.y
  };
}
```

This will make that boids that are very close much more influence the steering, meaning that boids will tend to fly closer to eachother on average, but steer away harder when boids get too close together. 

### 3D

My

* other notes
  * not just for birds
  * maybe a short history
* acknowledgements

<script type="text/javascript" src="boids.js"></script>

