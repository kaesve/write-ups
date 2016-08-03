# Growing trees with JavaScript

My first serious project I wrote in JavaScript, was drawing L-Systems using the Canvas API. It was also the what sparked my love for the canvas, and JavaScript in general. Here, I would like to take you through what L-Systems are, and one way you can leverage the Canvas API to draw cool things without too much effort. To get the most out of this article, you should be familiar with JavaScript, and also the basics of the API. You can read up on that over here [add link].

## L-Systems

L-Systems were invented to describe the growth of plants using abstract symbols. They are now often used in the procedural generation of plants, road plans, buildings and other things. Formally, an L-System is a *generative grammar* with an *axiom* (the start value), a set of *symbols*, and a set of *production rules*. These rules are the most interesting part. A production rule looks something like `A ⇒ A B` and consists of two parts: the *predecessor* (one symbol), and the *successor* (a string of symbols).

These rules are used to generate one string of symbols from another. Given a string of symbols, start with the first symbol from the left and find the rule with the matching predecessor. Add its successor to the new string and repeat the process with the next symbol in the string. For example, take the following rule set:

```
Predecessors   Successors
      A      ⇒    A A
      B      ⇒    A L B R B
      L      ⇒    L
      R      ⇒    R
```

To apply this set to the string `B`, we only need to replace one symbol, and we end up with the new string `A L B R B`. With L-Systems, you start with some string and then apply all the rules, take the result and then apply the same rules on that string, and again and again -- every iteration is a *'generation'*. We find the second generation of the example system, by applying the rule set on the string we just found (`A L B R B`). This step is now a little bit more involved. We first replace the `A` with `A A`, the `L` stays the same, the `B` is then replaced with `A L B R B`, and so forth. Putting these pieces together we should find: `A A L A L B R B R A L B R B`.

You can see the result string grows quickly, and it's already getting tedious to do the replacements by hand. Let's write some code to do this for us.

``` javascript
var startString = 'A';
var ruleSet = {
    'A': 'AB',
    'B': 'BBA'
};

function generate(string, rules) {
    var newString = '';
    for (var i = 0; i < string.length; ++i) {
        var symbol = string[i];

        if (symbol in rules) {
            newString += rules[symbol];
        }
    }
    return newString;
}


// Print the first 5 generated strings of our system.
var symbolString = startString;
for (var counter = 1; counter <= 5; counter++) {
    symbolString = generate(symbolString, ruleSet);
    console.log(counter + ": " + symbolString);
}
```

This outputs:

``` console
1: AB
2: ABBBA
3: ABBBABBABBAAB
4: ABBBABBABBAABBBABBAABBBABBAABABBBA
5: ABBBABBABBAABBBABBAABBBABBAABABBBABBABBAABBBABBAABABBBABBABBAABBBABBAABABBBAABBBABBABBAAB
```

We conveniently can use plain JavaScript objects to describe our rules. Our symbols are also just text characters, so we can use JavaScripts strings for our symbol strings.

By now you might be wondering what any of this has to do with plants and trees. It turns out L-Systems do not create beautiful flora *automagically*. It is up to you how you want to interpret each symbol in a system, and what to do with it. Even our example is growing a tree, if you interpret `A` to be a branch segment, `B` a branch segment with a leaf, `L` as starting a new branch to the left and `R` as starting a new branch to the right. The rules can also be interpreted as a model of the growth of the tree: every step of the system, we see that each leaf is replaced with two new branches, to the left and to the right, and each branch segment is doubled in size. If you are not convinced, the rest of the article shows you how to draw this tree out, using the canvas API.

## A blank canvas

Let's start with the basics. First of all, you need a `<canvas>` element. After that, you need to obtain a render context object as follows:

``` javascript
// Assume the html contains <canvas id="my-canvas"></canvas>
var canvasElem = document.getElementById("my-canvas");
var ctx = canvasElem.getContext('2d');
```

We use `ctx` as a shorthand, because we will be typing it *a lot*. We want to draw something based on the output of our system, and more specifically, we want to do some drawing operations of every symbol in a given symbol string. We can do that by writing a drawing procedure per symbol, and store them in an object, similar to how we store the rules of our system. This is outlined in the example below:

``` javascript
function drawA(ctx) { /* write drawing code here */ }
function drawB(ctx) { /* write drawing code here */ }
function drawL(ctx) { /* write drawing code here */ }
function drawR(ctx) { /* write drawing code here */ }

var drawingRules = {
	A: drawA,
	B: drawB,
	L: drawL,
	R: drawR
};

function drawString(ctx, string, drawingRules) {
	for (var i = 0; i < string.length; ++i) {
        var symbol = string[i];

        if (symbol in drawingRules) {
            newString += drawingRules[symbol];
        }
    }
}
```

With our infrastructure in place, we only need to write our actual drawing code. Let's start with the `A` symbol, of which we said it represents a segment of branch of the tree. To keep it simple, we just want to draw a 2-unit long line along the direction of the branch. The general procedure to draw a line is pretty straight-forward: 

``` javascript
ctx.beginPath();
ctx.moveTo(startX, startY);
ctx.lineTo(endX, endY);
ctx.stroke();
```

So all we need to do is figure out what the start and end coordinates are of our segment. But this is not in any way encoded in the symbol we are currently trying to draw. What we want to do when we encounter an `A` symbol, is draw 2 units from our _current location_ into our _current direction_, and then update the current location. This could be achieved by keeping that state ourselves, and passing that into the drawing procedures, but it turns out we can also leverage the canvas coordinate system, to do this for us. With `ctx.translate(someX, someY)` we say "shift the coordinate system, so that the origin now is at [someX, someY]". We can use this as follows:


``` javascript
function drawA(ctx) {
	ctx.beginPath();
	ctx.moveTo(0,  0);
	ctx.lineTo(0, -2);
	ctx.stroke();

	ctx.translate(0, -2);
}
```

As you can see, we now just always start at `[0, 0]` and then draw a line two units up (note that up is the negative direction in the canvas coordinate system, so that's why we need to use `-2`). After that we make sure that `[0, 0]` occurs at the end of the line segment we just drew, so we are ready for the next operation.

With the `A` symbol done, there are 3 more to go. I told you `L` and `R` symbols are the start of a new branch, growing in the left or right direction, and `B` is the end of a branch, with a leaf. If you look back to the production rule `B ⇒ A L B R B`, you may notice that the `L` and `R` symbols always come in pairs, and are accompanied by two branch ends.


blablabla

``` javascript
function drawL(ctx) {
	ctx.save();
	ctx.rotate(Math.PI/2);
}

function drawR(ctx) {
	ctx.save();
	ctx.rotate(-Math.PI/2);
}

function drawB(ctx) {
	var r = 3;
	ctx.fillStyle = 'green';
	ctx.arc(0, -r, r, 0, Math.PI*2);
	ctx.fill();
	ctx.restore();
}
```