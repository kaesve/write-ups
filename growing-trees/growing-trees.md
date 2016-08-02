# Growing trees with JavaScript

My favorite browser feature is the Canvas API. It is a simple 2D graphics API, that allows you to programmatically draw things in the browser. I have used it to render star systems, bird flocks, games and interactive widgets. I'd love to give you a hands-on introduction, using my first 'serious' project with the API.

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

By now you might be wondering what any of this has to do with plants and trees. If you hoped that L-Systems will create beautiful flora *automagically* for you, you may be a little disappointed. In reality, you take the string that comes out of an L-System and then decide how to draw it *yourself*. It is up to you to decide how you want to interpret each symbol. Even our example is growing a tree, if you interpret `A` to be a branch segment, `B` a branch segment with a leaf, `L` as starting a new branch to the left and `R` as starting a new branch to the right. If you are not convinced, the rest of the article shows you how to draw this out, using the canvas API.

## A blank canvas

Let's start with the basics. First of all, you need a `<canvas>` element. After that, you need to obtain a render context object as follows:

``` javascript
// Assume the html contains <canvas id="my-canvas"></canvas>
var canvasElem = document.getElementById("my-canvas");
var ctx = canvasElem.getContext('2d');
```

We use `ctx` as a shorthand, because we will be typing it *a lot*. The object we get gives us access to raw pixel data displayed in the canvas, and also has a whole range of procedures we can call, to draw to the canvas.

We want to draw something based on the output of our system, and more specifically, we want to do some drawing operations of every symbol in a given symbol string. We can do that by writing a drawing procedure per symbol, and store them in an object, similar to how we store the rules of our system. This is outlined in the example below:

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

With our infrastructure in place, we only need do write our actual drawing code. Let's take a moment to think what we want to do here. 

For example, it can be used to draw a line:

``` javascript
// A line
ctx.beginPath();
ctx.moveTo(10, 10);
ctx.lineTo(30, 10);
ctx.stroke();
```

There are a few things to notice about this piece of code. If you look closely at your screen, you'll see the canvas coordinate system starts in the top left, and increases to the right and the bottom. Moreover, it shows a pretty typical workflow for doing things with the canvas; We clear any existing state regarding paths, configure a new state, and then do one drawing operation.



this example shows that the context object we work with has a lot of state. We first tell it we want to draw a new shape, with `ctx.beginPath();`, then we tell it to construct a shape (in this case a line), and finally we call `ctx.stroke();` to call