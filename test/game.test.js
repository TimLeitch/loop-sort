const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
  constructor() {
    this.children = [];
    this.style = { setProperty() {} };
    this.classList = { toggle() {} };
    this.listeners = {};
  }
  append(child) { this.children.push(child); }
  replaceChildren() { this.children = []; }
  setAttribute() {}
  addEventListener(type, handler) { this.listeners[type] = handler; }
  remove() {}
  focus() {}
}

function createGame() {
  const elements = {};
  const context = vm.createContext({
    document: {
      getElementById(id) { return elements[id] ||= new Element(); },
      createElement() { return new Element(); }
    },
    requestAnimationFrame() {}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8'), context);
  return { context, elements };
}

test('levels have balanced loads and varying truck counts', () => {
  const { context } = createGame();
  const counts = vm.runInContext(`levelTruckCounts.map((count, index) => {
    levelIndex = index;
    startLevel();
    const totals = Array(count).fill(0);
    trucks.forEach(truck => truck.load.forEach(color => totals[color]++));
    if (trucks.length !== count || totals.some(total => total !== capacity)) throw Error('Unbalanced level');
    return count;
  })`, context);
  assert.deepEqual([...new Set(counts)].sort(), [4, 5, 6, 7, 8, 9]);
});

test('every level can be completed in different unload orders', () => {
  const { context } = createGame();
  vm.runInContext(`levelTruckCounts.forEach((count, index) => {
    for (const reverse of [false, true]) {
      levelIndex = index;
      startLevel();
      const order = Array.from({ length: count }, (_, i) => reverse ? count - 1 - i : i);
      order.forEach(unloadTruck);
      for (let time = 0; time < 60000 && !won; time += 50) animate(time);
      if (!won || moving.length || !trucks.every(truck =>
        truck.load.length === capacity && truck.load.every(color => color === truck.color))) {
        throw Error('Level ' + (index + 1) + ' did not complete');
      }
    }
  })`, context);
});

test('restart and next level use the correct truck count', () => {
  const { context, elements } = createGame();
  vm.runInContext('unloadTruck(0); startLevel()', context);
  assert.equal(vm.runInContext('moving.length', context), 0);
  assert.equal(vm.runInContext('trucks.every(truck => !truck.active && truck.load.length === 5)', context), true);
  elements['next-level'].listeners.click();
  assert.equal(vm.runInContext('trucks.length', context), 5);
  assert.equal(elements['progress-text'].textContent, '0 / 5');
});
