const colors = [
  { name: 'Peach', symbol: '●', color: '#e9a58f', border: '#f1ded6', glow: '#f8e5de', angle: -Math.PI / 2, x: 50, y: 9 },
  { name: 'Honey', symbol: '◆', color: '#e9be70', border: '#f2e8d1', glow: '#f9efd8', angle: 0, x: 91, y: 50 },
  { name: 'Lilac', symbol: '✦', color: '#ad9bc3', border: '#e9e2ef', glow: '#eee8f5', angle: Math.PI / 2, x: 50, y: 91 },
  { name: 'Mint', symbol: '▲', color: '#8bbca5', border: '#dcece3', glow: '#e1f1e7', angle: Math.PI, x: 9, y: 50 }
];

const levels = [
  { limit: 3, sequence: [0, 1, 2, 3, 1, 0, 3, 2] },
  { limit: 3, sequence: [2, 0, 3, 1, 2, 3, 0, 1, 3, 2] },
  { limit: 2, sequence: [1, 3, 0, 2, 1, 0, 2, 3, 1, 2, 0, 3] }
];

const elements = Object.fromEntries(
  ['level-number', 'track-count', 'blocks', 'stations', 'progress-text', 'progress-fill', 'queue', 'send', 'hint', 'restart', 'win-modal', 'next-level']
    .map(id => [id, document.getElementById(id)])
);

let levelIndex = 0;
let level;
let nextBlock;
let sorted;
let moving;
let lastFrame;
let won;
const stationButtons = [];
const stationCounts = [];
const turn = Math.PI * 2;
const catchDistance = 0.38;

function colorStyle(color) {
  return `--color:${color.color};--border:${color.border};--glow:${color.glow}`;
}

function startLevel() {
  level = levels[levelIndex % levels.length];
  nextBlock = 0;
  sorted = 0;
  moving = [];
  won = false;
  lastFrame = null;
  elements['win-modal'].hidden = true;
  elements['level-number'].textContent = String(levelIndex + 1).padStart(2, '0');
  elements.stations.replaceChildren();
  elements.blocks.replaceChildren();
  colors.forEach((color, index) => {
    stationCounts[index] = 0;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'station';
    button.style.cssText = `${colorStyle(color)};left:${color.x}%;top:${color.y}%`;
    button.innerHTML = `<span class="station-icon">${color.symbol}</span><span class="station-name">${color.name}<small>0 sorted</small></span>`;
    button.setAttribute('aria-label', `${color.name} station, 0 sorted`);
    button.addEventListener('click', () => sortAtStation(index));
    stationButtons[index] = button;
    elements.stations.append(button);
  });
  render();
}

function render() {
  elements['track-count'].textContent = `${moving.length} / ${level.limit}`;
  elements['progress-text'].textContent = `${sorted} / ${level.sequence.length} sorted`;
  elements['progress-fill'].style.width = `${sorted / level.sequence.length * 100}%`;
  elements.queue.replaceChildren();
  for (let i = 0; i < 5; i++) {
    const slot = document.createElement('div');
    slot.className = 'queue-slot';
    const colorIndex = level.sequence[nextBlock + i];
    if (colorIndex !== undefined) {
      const color = colors[colorIndex];
      const block = document.createElement('span');
      block.className = 'queue-block';
      block.style.cssText = colorStyle(color);
      block.textContent = color.symbol;
      block.setAttribute('aria-label', color.name);
      slot.append(block);
    }
    elements.queue.append(slot);
  }
  updateSendState();
}

function sendBlock() {
  if (elements.send.disabled) return;
  const colorIndex = level.sequence[nextBlock++];
  const color = colors[colorIndex];
  const element = document.createElement('div');
  element.className = 'block';
  element.style.cssText = colorStyle(color);
  element.textContent = color.symbol;
  element.setAttribute('aria-label', `${color.name} block on loop`);
  elements.blocks.append(element);
  moving.push({ colorIndex, angle: Math.PI / 2, element });
  updateBlocks();
  render();
}

function distance(a, b) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function updateSendState() {
  const full = moving.length >= level.limit;
  const empty = nextBlock >= level.sequence.length;
  const launchBusy = moving.some(block => distance(block.angle, Math.PI / 2) < 0.3);
  elements.send.disabled = full || empty || launchBusy || won;
  const message = full
    ? 'The loop is full! Sort a block to make room.'
    : empty
      ? 'All blocks are on their way. Bring them home!'
      : launchBusy
        ? 'Give that block a moment to move along.'
        : 'One at a time! Keep an eye on the loop limit.';
  if (elements.hint.lastChild.textContent !== ` ${message}`) {
    elements.hint.lastChild.textContent = ` ${message}`;
  }
}

function sortAtStation(index) {
  if (won) return;
  const candidates = moving.filter(block => block.colorIndex === index && distance(block.angle, colors[index].angle) <= catchDistance);
  if (!candidates.length) return;
  candidates.sort((a, b) => distance(a.angle, colors[index].angle) - distance(b.angle, colors[index].angle));
  const block = candidates[0];
  block.element.remove();
  moving.splice(moving.indexOf(block), 1);
  sorted++;
  stationCounts[index]++;
  stationButtons[index].querySelector('small').textContent = `${stationCounts[index]} sorted`;
  stationButtons[index].setAttribute('aria-label', `${colors[index].name} station, ${stationCounts[index]} sorted`);
  updateBlocks();
  if (sorted === level.sequence.length) {
    won = true;
    elements['win-modal'].hidden = false;
    elements['next-level'].focus();
  }
  render();
}

function updateBlocks() {
  moving.forEach(block => {
    block.element.style.left = `${50 + 36 * Math.cos(block.angle)}%`;
    block.element.style.top = `${50 + 31 * Math.sin(block.angle)}%`;
  });
  stationButtons.forEach((button, index) => {
    const ready = moving.some(block => block.colorIndex === index && distance(block.angle, colors[index].angle) <= catchDistance);
    button.classList.toggle('ready', ready);
  });
  updateSendState();
}

function animate(time) {
  if (lastFrame !== null && !won) {
    const elapsed = Math.min((time - lastFrame) / 1000, 0.05);
    moving.forEach(block => { block.angle = (block.angle + elapsed * 0.65) % turn; });
    updateBlocks();
  }
  lastFrame = time;
  requestAnimationFrame(animate);
}

elements.send.addEventListener('click', sendBlock);
elements.restart.addEventListener('click', startLevel);
elements['next-level'].addEventListener('click', () => {
  levelIndex++;
  startLevel();
  elements.send.focus();
});
startLevel();
requestAnimationFrame(animate);
