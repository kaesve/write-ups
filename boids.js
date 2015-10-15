var canvas;
var ctx;
var screenWidth;
var screenHeight;
var screenCenter;
function initCanvas(canvasOrId) {
  canvas = typeof canvasOrId === 'string' ? 
    document.getElementById(canvasOrId) : canvasOrId;
  ctx = canvas.getContext('2d');
  screenWidth = canvas.width;
  screenHeight = canvas.height;
  screenCenter = { x: screenWidth / 2, y: screenHeight / 2 };
  clear(ctx);
}
function clear(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
function strokeLine(ctx, color, start, end) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.stroke();
}
function strokeParametricLine(ctx, color, p0, p1, t) {
  if (typeof t === "undefined") t = 1;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p0.x + p1.x*t, p0.y + p1.y*t);
  ctx.strokeStyle = color;
  ctx.stroke();
}
function fillCircle(ctx, color, center, radius) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function fillSector(ctx, color, center, radius, start, end) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, start, end);
  ctx.lineTo(center.x, center.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}


var loopToken;
function startLoop() {
  if (loopToken) {
    window.cancelAnimationFrame(loopToken);
    loopToken = null;
  }
  var lastFrameTime = 0;
  function setLastFrameTime(time) {
    lastFrameTime = time;
    loopToken = window.requestAnimationFrame(loop);
  }

  function loop(time) {
    loopToken = window.requestAnimationFrame(loop);
    update(time, time - lastFrameTime);
    lastFrameTime = time;
  }
  loopToken = window.requestAnimationFrame(setLastFrameTime);
}
function stopLoop() {
  window.cancelAnimationFrame(loopToken);
}


var viewRadius = 50;
var halfViewAngle = Math.PI;
function distance(p1, p2)  {
  var dX = p1.x - p2.x;
  var dY = p1.y - p2.y;
  return Math.sqrt(dX * dX + dY * dY);
}
function angleTo(v1, v2) {
  var angle = Math.abs(Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x));
  return (angle > Math.PI) ? 2*Math.PI - angle : angle;
}
function canSee(boid, other) {
  var dPos = {
    x: other.position.x - boid.position.x,
    y: other.position.y - boid.position.y
  }
  var angleBetween = angleTo(boid.velocity, dPos);
  return (dPos.x*dPos.x + dPos.y*dPos.y) <= viewRadius*viewRadius &&
    angleBetween <= halfViewAngle;
}
function getVisibleBoids(boid, others) { 
  var visibleBoids = [];
  for (var i = 0; i < others.length; ++i) {
    if (others[i] === boid) continue;

    if (canSee(boid, others[i])) visibleBoids.push(others[i]);
  }
  return visibleBoids;
}

var separationWeight = 1;
var alignmentWeight = 1;
var cohesionWeight = 1;
function linearSeparation(distance) {
  return (viewRadius - distance);
}
function quadraticSeparation(distance) {
  return (viewRadius - distance)*(viewRadius - distance);
}
var calculateSeparationMagnitude = linearSeparation;
function calculateSeparation(boid, neighbours) {
  var sum = { x: 0, y: 0 };
  for (var i = 0; i < neighbours.length; ++i) {
    var dPos = {
      x: neighbours[i].position.x - boid.position.x,
      y: neighbours[i].position.y - boid.position.y
    };
    var dist = Math.sqrt(dPos.x*dPos.x + dPos.y*dPos.y);
    var magnitude = calculateSeparationMagnitude(dist);
    sum.x += dPos.x/dist*magnitude;
    sum.y += dPos.y/dist*magnitude;
  }
  return { 
    x: -sum.x/neighbours.length,
    y: -sum.y/neighbours.length
  };
}
function calculateAlignment(boid, neighbours) {
  var sum = { x: 0, y: 0 };
  for (var i = 0; i < neighbours.length; ++i) {
    sum.x += neighbours[i].velocity.x;
    sum.y += neighbours[i].velocity.y;
  }
  return {
    x: sum.x/neighbours.length ,//- boid.velocity.x,
    y: sum.y/neighbours.length //- boid.velocity.y
  };
}
function calculateCohesion(boid, neighbours) {
  var sum = { x: 0, y: 0 };
  for (var i = 0; i < neighbours.length; ++i) {
    sum.x += neighbours[i].position.x;
    sum.y += neighbours[i].position.y;
  }
  return { 
    x: sum.x/neighbours.length - boid.position.x,
    y: sum.y/neighbours.length - boid.position.y 
  };
}
function calculateSeek(boid, target) {
  return calculateCohesion(boid, [target]);
}
function calculateSteering(boid, visibleBoids) {
  var totalWeight = separationWeight + alignmentWeight + cohesionWeight;
  if (visibleBoids.length > 0 && totalWeight) {
    var separation = calculateSeparation(boid, visibleBoids);
    var alignment = calculateAlignment(boid, visibleBoids);
    var cohesion = calculateCohesion(boid, visibleBoids);
  
    return {
      x: (separationWeight*separation.x + 
        alignmentWeight*alignment.x + 
        cohesionWeight*cohesion.x)/totalWeight,
      y: (separationWeight*separation.y + 
        alignmentWeight*alignment.y + 
        cohesionWeight*cohesion.y)/totalWeight
    };
  }
  else {
    return { x: 0, y: 0 };
  }
}

function trunc(f, lim) {
  var sqrLen = f.x*f.x + f.y*f.y;
  if (sqrLen > lim*lim) {
    var len = Math.sqrt(sqrLen);
    return { x: f.x/len*lim, y: f.y/len*lim };
  } else {
    return f;
  }
}

function createRandomBoid(speed) {
  return {
    position: { 
      x: Math.random()*screenWidth, 
      y: Math.random()*screenHeight 
    },
    velocity: { 
      x: Math.random()*speed*2 - speed,
      y: Math.random()*speed*2 - speed 
    }
  }
}
function steerBoid(boid, f, dSeconds) { 
  // boid.velocity.x += f.x*dSeconds;
  // boid.velocity.y += f.y*dSeconds;
  // boid.velocity = trunc(boid.velocity, speed);
}
function moveBoid(boid, steering, dSeconds) {
  boid.position.x += boid.velocity.x*dSeconds// + .2*steering.x*dSeconds*dSeconds;
  boid.position.y += boid.velocity.y*dSeconds// + .2*steering.y*dSeconds*dSeconds;

  boid.position.x = (boid.position.x + screenWidth) % screenWidth;
  boid.position.y = (boid.position.y + screenHeight) % screenHeight;

  boid.velocity.x += steering.x*dSeconds;
  boid.velocity.y += steering.y*dSeconds;
  boid.velocity = trunc(boid.velocity, speed);
}
function drawBoid(boid, color, vColor, visibility) {
  fillCircle(ctx, 'whitesmoke', boid.position, 11);
  fillCircle(ctx, color, boid.position, 10);

  // show visibility
  if (visibility) {
    ctx.globalAlpha = visibility;
    var direction = Math.atan2(boid.velocity.y, boid.velocity.x);
    fillSector(ctx, color, boid.position, 
      viewRadius, direction - halfViewAngle, direction + halfViewAngle);
    ctx.globalAlpha = 1;  
  }

  // show velocity
  if (vColor) strokeParametricLine(ctx, vColor, boid.position, boid.velocity);
}

var updateEveryBoid = false;
var boids;
var update;
function highlightAndSteerUpdate(time, dTime) {
  clear(ctx);
  var neighbours, steering;
  for(var i = 1; i < boids.length; ++i) {
    if (updateEveryBoid) {
      neighbours = getVisibleBoids(boids[i], boids);
      steering = calculateSteering(boids[i], neighbours);
      steerBoid(boids[i], steering, dTime/1000);
      moveBoid(boids[i], steering, dTime/1000);
    } else {
      steering = { x: 0, y: 0 };
    }
    var color = canSee(boids[0], boids[i]) ? 'limegreen' : 'gray';
    drawBoid(boids[i], color, 'gray', 0.075);
    strokeParametricLine(ctx, 'royalblue', boids[i].position, steering);
  }

  neighbours = getVisibleBoids(boids[0], boids);
  steering = calculateSteering(boids[0], neighbours);
  steerBoid(boids[0], steering, dTime/1000);
  moveBoid(boids[0], steering, dTime/1000);
  drawBoid(boids[0], 'goldenrod', 'black', 0.4);
  strokeParametricLine(ctx, 'royalblue', boids[0].position, steering);
}

var speed = 40;
function setUpSimulation(radius, angle, boidCount, separation, alignment, cohesion) {
  updateEveryBoid = false;
  viewRadius = radius;
  halfViewAngle = angle;
  for(boids = []; boids.length < boidCount; boids.push(createRandomBoid(speed)));

  if (arguments.length == 4) cohesion = alignment = separation;
  separationWeight = separation;
  alignmentWeight = alignment;
  cohesionWeight = cohesion;
}
function resetSimulation() {
  setUpSimulation(50, Math.PI, 32, 1);
}


var figuresByTrigger = {};
// Static boid
figuresByTrigger.boids_1 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    drawBoid(createRandomBoid(0), 'goldenrod');
  },
  stop: function() {}
};
// Boid moving one direction, no screen wrap
figuresByTrigger.boids_2 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    var boid = createRandomBoid(speed);
    
    update = function(time, dTime) {
      boid.position.x += boid.velocity.x*dTime/1000;
      boid.position.y += boid.velocity.y*dTime/1000;
      clear(ctx);
      drawBoid(boid, 'goldenrod', 'black');
    };

    startLoop();
  },
  stop: stopLoop
};
// Boid moving, with screen wrap
figuresByTrigger.boids_3 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    var boid = createRandomBoid(speed);
    
    update = function(time, dTime) {
      moveBoid(boid, dTime/1000);
      clear(ctx);
      drawBoid(boid, 'goldenrod', 'black');
    };

    startLoop();
  },
  stop: stopLoop
};
// Boid moving, with static steering
figuresByTrigger.boids_4 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    var boid = createRandomBoid(speed);
    
    update = function(time, dTime) {
      var steering = {
        x: Math.cos(time/1000) * 20,
        y: Math.sin(time/1000) * 20
      }
      steerBoid(boid, steering, dTime/1000);
      moveBoid(boid, dTime/1000);
      clear(ctx);
      drawBoid(boid, 'goldenrod', 'black');
      strokeParametricLine(ctx, 'royalblue', boid.position, steering);
    };

    startLoop();
  },
  stop: stopLoop
};
// Circular vision test
figuresByTrigger.boids_5 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    setUpSimulation(50, Math.PI, 32, 0);
    update = highlightAndSteerUpdate;
    startLoop();
  },
  stop: function() {
    resetSimulation();
    stopLoop();
  }
};
// In-sector vision test
figuresByTrigger.boids_6 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    setUpSimulation(50, 0.75*Math.PI, 32, 0);
    update = highlightAndSteerUpdate;
    startLoop();
  },
  stop: function() {
    resetSimulation();
    stopLoop();
  }
};
// Separation
figuresByTrigger.boids_7 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    setUpSimulation(50, 0.75*Math.PI, 32, 1, 0, 0);
    update = highlightAndSteerUpdate;
    startLoop();
  },
  stop: function() {
    resetSimulation();
    stopLoop();
  }
};
// Alignment
figuresByTrigger.boids_8 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    setUpSimulation(50, 0.75*Math.PI, 32, 0, 1, 0);
    update = highlightAndSteerUpdate;
    startLoop();
  },
  stop: function() {
    resetSimulation();
    stopLoop();
  }
};
// Cohesion
figuresByTrigger.boids_9 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
   setUpSimulation(50, 0.75*Math.PI, 32, 0, 0, 1);
    update = highlightAndSteerUpdate;
    startLoop();
  },
  stop: function() {
    resetSimulation();
    stopLoop();
  }
};
// Boids
figuresByTrigger.boids_10 = {
  start: function(elem) {
    initCanvas(elem.querySelector('canvas'));
    setUpSimulation(50, 0.75*Math.PI, 32, 1, 1, 1);
    update = function(time, dTime) {
      clear(ctx);
      for(var i = 0; i < boids.length; ++i) {
        var neighbours = getVisibleBoids(boids[i], boids);
        var steering = calculateSteering(boids[i], neighbours);
        steerBoid(boids[i], steering, dTime/1000);
        moveBoid(boids[i], steering, dTime/1000);
        drawBoid(boids[i], 'gray', 'gray', 0.075);
      }
    }

    startLoop();
  },
  stop: function() {
    resetSimulation();
    stopLoop();
  }
};


var currentTrigger;
function deactivateFigure(trigger) {
  currentTrigger = undefined;
  if (trigger) {
    var figure = figuresByTrigger[trigger];
    figure.stop();
    figure.elem.classList.remove('figure--active');
  }
}
function activateFigure(trigger) {
  currentTrigger = trigger;
  if (trigger) {
    var figure = figuresByTrigger[trigger];  
    figure.start(figure.elem);
    figure.elem.classList.add('figure--active');
  }
}
function rerunFigure() {
  if (currentTrigger) {
    var figure = figuresByTrigger[currentTrigger];
    figure.stop();
    figure.start(figure.elem);
  }
}

document.addEventListener("DOMContentLoaded", function(event) { 
  var figures = document.querySelectorAll('figure[for]');
  var figureTriggers = [];
  for (var i = 0; i < figures.length; i++) {
    var trigger = figures[i].getAttribute('for');
    figureTriggers.push(document.getElementById(trigger));
    figuresByTrigger[trigger].elem = figures[i];
  }

  ;(function() {
      var throttle = function(type, name, obj) {
          var obj = obj || window;
          var running = false;
          var func = function() {
              if (running) { return; }
              running = true;
              requestAnimationFrame(function() {
                  obj.dispatchEvent(new CustomEvent(name));
                  running = false;
              });
          };
          obj.addEventListener(type, func);
      };

      /* init - you can init any event */
      throttle ("scroll", "optimizedScroll");
  })();

  window.addEventListener('optimizedScroll', function() {
    var highestTrigger;
    for (var i = 0; i < figureTriggers.length; i++) {
      var rect = figureTriggers[i].getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        highestTrigger = figureTriggers[i].id;
        break;
      }
    }

    if (currentTrigger != highestTrigger) {
      console.log('changing figures from %s to %s', 
        currentTrigger, highestTrigger);
      
      deactivateFigure(currentTrigger);
      activateFigure(highestTrigger);
    }
  });
});

