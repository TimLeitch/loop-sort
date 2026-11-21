# Loop Sort

Loop Sort is a browser game about helping colorful blocks find their way home.
Send blocks around a loop, sort them by color, and load five-block stacks into a truck.

## Project status

The game is currently being developed in
[pull request #1](https://github.com/TimLeitch/loop-sort/pull/1). The game files
are not yet present on `main`; the instructions below describe the current
implementation on the game branches, which may change.

GitHub Pages can serve this static game directly from the repository root.
While the game is not on `main`, configure Pages to publish from the game
branch. After merging, switch the Pages source to `main`.

## Play locally

Check out the game branch, then open `index.html` in a modern browser:

```sh
git clone --branch copilot/loop-sort-game https://github.com/TimLeitch/loop-sort.git
cd loop-sort
```

No installation or build step is needed. The game is designed for both desktop
and mobile browsers.

## How to play

1. Select **Send to loop** to launch the next block from the loading dock.
   The dock shows up to five upcoming blocks.
2. When a block approaches its matching station, select that station to sort
   it. Stations and blocks have matching colors and symbols.
3. Each station collects five matching blocks. Once a stack is complete, it is
   loaded into the truck. Load all four stacks to complete the level, then
   select **Next level** to continue.

Each level limits the number of blocks that can be on the loop at once. If the
loop is full, sort a block before sending another. Blocks keep circling if you
miss them, so you can wait for another chance. Use the restart button at the
top of the screen to reset the current level.

## Project files

On the game branch, `index.html` contains the page, `style.css` provides the
styling, and `game.js` handles the levels, animation, and sorting logic.
