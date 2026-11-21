const colors = [
  { name: 'Coral', symbol: '●', color: '#fa626d' },
  { name: 'Gold', symbol: '◆', color: '#ffc34d' },
  { name: 'Mint', symbol: '▲', color: '#43d6a0' },
  { name: 'Blue', symbol: '■', color: '#5eaafa' }
];

const levels = [
  [[0, 1, 2, 3, 0], [1, 2, 3, 0, 1], [2, 3, 0, 1, 2], [3, 0, 1, 2, 3]],
  [[2, 0, 3, 1, 2], [3, 1, 0, 2, 3], [0, 2, 1, 3, 0], [1, 3, 2, 0, 1]],
  [[1, 3, 0, 2, 1], [0, 2, 1, 3, 0], [3, 1, 2, 0, 3], [2, 0, 3, 1, 2]]
];

const positions = [
  { x: 27, y: 12, angle: -2.26 },
  { x: 73, y: 12, angle: -0.88 },
  { x: 27, y: 88, angle: 2.26 },
  { x: 73, y: 88, angle: 0.88 }
];
const capacity = 5;
const turn = Math.PI * 2;
const speed = 0.8;
const elements = Object.fromEntries(
  ['level-number', 'progress-text', 'blocks', 'trucks', 'status', 'restart', 'win-modal', 'next-level']
    .map(id => [id, document.getElementById(id)])
);

let levelIndex = 0;
let trucks = [];
let moving = [];
let lastFrame = null;
let won = false;

function startLevel() {
  moving = [];
  won = false;
  lastFrame = null;
  elements.blocks.replaceChildren();
  elements.trucks.replaceChildren();
  elements['win-modal'].hidden = true;
  elements['level-number'].textContent = levelIndex + 1;
  elements.status.textContent = 'Tap a truck to get started!';
  trucks = levels[levelIndex % levels.length].map((load, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'truck';
    button.style.left = `${positions[index].x}%`;
    button.style.top = `${positions[index].y}%`;
    button.addEventListener('click', () => unloadTruck(index));
    elements.trucks.append(button);
    return { load: [...load], active: false, color: null, button };
  });
  renderTrucks();
}

function renderTrucks() {
  trucks.forEach((truck, index) => {
    const complete = truck.active && truck.load.length === capacity;
    truck.button.classList.toggle('active', truck.active);
    truck.button.classList.toggle('complete', complete);
    truck.button.disabled = truck.active;
    const description = truck.load.length
      ? truck.load.map(color => colors[color].name).join(', ')
      : 'empty';
    truck.button.setAttribute('aria-label', `Truck ${index + 1}: ${description}. ${complete ? 'Sorted.' : truck.active ? 'Collecting automatically.' : 'Tap to unload.'}`);
    truck.button.innerHTML = `<span class="truck-bed">${Array.from({ length: capacity }, (_, slot) => {
      const color = colors[truck.load[slot]];
      return color
        ? `<span class="cargo" style="--cargo:${color.color}" aria-hidden="true">${color.symbol}</span>`
        : '<span class="cargo empty" aria-hidden="true"></span>';
    }).join('')}</span><span class="truck-cab" aria-hidden="true"><span></span></span><span class="truck-wheels" aria-hidden="true"></span><span class="truck-label">${complete ? 'SORTED!' : truck.active ? (truck.color === null ? 'WAITING' : colors[truck.color].name.toUpperCase()) : 'TAP TO UNLOAD'}</span>`;
  });
  elements['progress-text'].textContent = `${trucks.filter(truck => truck.active && truck.load.length === capacity).length} / ${trucks.length}`;
}

function unloadTruck(index) {
  const truck = trucks[index];
  if (truck.active || won) return;
  truck.active = true;
  truck.load.forEach((colorIndex, offset) => {
    const block = document.createElement('span');
    block.className = 'block';
    block.style.setProperty('--cargo', colors[colorIndex].color);
    block.textContent = colors[colorIndex].symbol;
    block.setAttribute('aria-label', `${colors[colorIndex].name} block on the loop`);
    elements.blocks.append(block);
    moving.push({ colorIndex, angle: positions[index].angle - offset * 0.15, element: block });
  });
  truck.load = [];
  elements.status.textContent = 'Blocks are moving! Tap another truck to unload it.';
  renderTrucks();
  updateBlocks();
}

function collectAtTruck(block, index) {
  const truck = trucks[index];
  if (!truck.active || truck.load.length === capacity) return false;
  if (truck.color === null) {
    if (trucks.some(other => other !== truck && other.color === block.colorIndex)) return false;
    truck.color = block.colorIndex;
  }
  if (truck.color !== block.colorIndex) return false;
  truck.load.push(block.colorIndex);
  block.element.remove();
  elements.status.textContent = truck.load.length === capacity
    ? `${colors[truck.color].name} truck sorted!`
    : `${colors[truck.color].name} truck: ${truck.load.length} of ${capacity} blocks.`;
  return true;
}

function updateBlocks() {
  moving.forEach(block => {
    block.element.style.left = `${50 + 36 * Math.cos(block.angle)}%`;
    block.element.style.top = `${50 + 25 * Math.sin(block.angle)}%`;
  });
}

function animate(time) {
  if (lastFrame !== null && !won) {
    const distance = Math.min((time - lastFrame) / 1000, 0.05) * speed;
    let collected = false;
    moving = moving.filter(block => {
      const previous = (block.angle + turn) % turn;
      block.angle = (previous + distance) % turn;
      for (let i = 0; i < trucks.length; i++) {
        const target = (positions[i].angle + turn) % turn;
        if ((target - previous + turn) % turn <= distance && collectAtTruck(block, i)) {
          collected = true;
          return false;
        }
      }
      return true;
    });
    updateBlocks();
    if (collected) {
      renderTrucks();
      if (trucks.every(truck => truck.active && truck.load.length === capacity)) {
        won = true;
        elements.status.textContent = 'All trucks sorted!';
        elements['win-modal'].hidden = false;
        elements['next-level'].focus();
      }
    }
  }
  lastFrame = time;
  requestAnimationFrame(animate);
}

elements.restart.addEventListener('click', startLevel);
elements['next-level'].addEventListener('click', () => {
  levelIndex++;
  startLevel();
  trucks[0].button.focus();
});
startLevel();
requestAnimationFrame(animate);
