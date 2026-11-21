# Loop Sort

A compact, ad-free browser puzzle: unload mixed blocks from trucks onto a
looping conveyor and sort them into matching five-block truckloads.

## Play locally

Open `index.html` in a modern browser. No installation or build step is needed.
The game also works when served as a static site, including with GitHub Pages.

## How to play

1. Tap a truck to unload its five blocks onto the loop.
2. Empty trucks automatically collect passing blocks. Each truck takes one
   color, and no two trucks collect the same color.
3. Unload the other trucks and wait for every truck to collect five matching
   blocks. Select **Next level** to continue.

Blocks keep circling until a matching truck is available. Use the restart
button at the top to reset the current level. Levels vary from four to nine
trucks; the sequence repeats as you advance.

`index.html` contains the page, `style.css` provides the styling, and `game.js`
handles the levels, animation, and sorting logic.
