/**
 * Minesweeper game for the 404 page, powered by a real Handsontable instance.
 *
 * Only initializes when `div.not-found` is present on the page.
 */
import Handsontable from 'handsontable/base';
import {
  registerCellType,
  TextCellType,
} from 'handsontable/cellTypes';

registerCellType(TextCellType);

const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

interface GameState {
  mines: boolean[][];
  revealed: boolean[][];
  flagged: boolean[][];
  adjacent: number[][];
  gameOver: boolean;
  won: boolean;
  minesPlaced: boolean;
  hitRow: number;
  hitCol: number;
}

function createEmptyGrid<T>(val: T): T[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => val));
}

function freshState(): GameState {
  return {
    mines: createEmptyGrid(false),
    revealed: createEmptyGrid(false),
    flagged: createEmptyGrid(false),
    adjacent: createEmptyGrid(0),
    gameOver: false,
    won: false,
    minesPlaced: false,
    hitRow: -1,
    hitCol: -1,
  };
}

// ---------------------------------------------------------------------------
// Mine placement & adjacency
// ---------------------------------------------------------------------------

function placeMines(state: GameState, safeRow: number, safeCol: number) {
  const safe = new Set<string>();

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      safe.add(`${safeRow + dr},${safeCol + dc}`);
    }
  }

  let placed = 0;

  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);

    if (!state.mines[r][c] && !safe.has(`${r},${c}`)) {
      state.mines[r][c] = true;
      placed++;
    }
  }

  // Precompute adjacency counts
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (state.mines[r][c]) {
        state.adjacent[r][c] = -1;
        continue;
      }

      let count = 0;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;

          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && state.mines[nr][nc]) {
            count++;
          }
        }
      }

      state.adjacent[r][c] = count;
    }
  }

  state.minesPlaced = true;
}

// ---------------------------------------------------------------------------
// Reveal logic (BFS flood fill)
// ---------------------------------------------------------------------------

function reveal(state: GameState, row: number, col: number) {
  if (state.gameOver || state.won) return;
  if (state.flagged[row][col]) return;
  if (state.revealed[row][col]) return;

  if (!state.minesPlaced) {
    placeMines(state, row, col);
  }

  if (state.mines[row][col]) {
    state.gameOver = true;
    state.hitRow = row;
    state.hitCol = col;

    // Reveal all mines
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.mines[r][c]) {
          state.revealed[r][c] = true;
        }
      }
    }

    return;
  }

  // BFS flood fill
  const queue: [number, number][] = [[row, col]];

  state.revealed[row][col] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;

    if (state.adjacent[r][c] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;

          if (
            nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
            !state.revealed[nr][nc] && !state.flagged[nr][nc]
          ) {
            state.revealed[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  // Check win condition: all non-mine cells revealed
  let unrevealedSafe = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!state.mines[r][c] && !state.revealed[r][c]) {
        unrevealedSafe++;
      }
    }
  }

  if (unrevealedSafe === 0) {
    state.won = true;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.mines[r][c] && !state.flagged[r][c]) {
          state.flagged[r][c] = true;
        }
      }
    }
  }
}

function toggleFlag(state: GameState, row: number, col: number) {
  if (state.gameOver || state.won) return;
  if (state.revealed[row][col]) return;

  state.flagged[row][col] = !state.flagged[row][col];
}

// ---------------------------------------------------------------------------
// Custom cell renderer
// ---------------------------------------------------------------------------

const FLAG_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9"/><path d="M5 21v-7"/></svg>';

const BOMB_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14.499 3.996a2.2 2.2 0 0 1 1.556 .645l3.302 3.301a2.2 2.2 0 0 1 0 3.113l-.567 .567l.043 .192a8.5 8.5 0 0 1 -3.732 8.83l-.23 .144a8.5 8.5 0 1 1 -2.687 -15.623l.192 .042l.567 -.566a2.2 2.2 0 0 1 1.362 -.636zm-4.499 5.004a4 4 0 0 0 -4 4a1 1 0 0 0 2 0a2 2 0 0 1 2 -2a1 1 0 0 0 0 -2z"/><path d="M21 2a1 1 0 0 1 .117 1.993l-.117 .007h-1c0 .83 -.302 1.629 -.846 2.25l-.154 .163l-1.293 1.293a1 1 0 0 1 -1.497 -1.32l.083 -.094l1.293 -1.292c.232 -.232 .375 -.537 .407 -.86l.007 -.14a2 2 0 0 1 1.85 -1.995l.15 -.005h1z"/></svg>';

function minesweeperRenderer(
  state: GameState,
  instance: Handsontable,
  td: HTMLTableCellElement,
  row: number,
  col: number,
) {
  // Reset -- use textContent first to clear text, then innerHTML only when
  // inserting SVG.  Avoid wiping innerHTML unconditionally as HOT may rely
  // on child elements for event delegation.
  td.textContent = '';
  td.className = 'ms-cell';

  if (!state.revealed[row][col]) {
    if (state.flagged[row][col]) {
      td.classList.add('ms-flagged');
      td.innerHTML = FLAG_SVG;

      // If game over and this flag was wrong, mark it
      if (state.gameOver && !state.mines[row][col]) {
        td.classList.remove('ms-flagged');
        td.classList.add('ms-wrong');
        td.innerHTML = FLAG_SVG;
      }
    } else {
      td.classList.add('ms-hidden');
    }

    return td;
  }

  // Revealed
  if (state.mines[row][col]) {
    td.classList.add('ms-mine');
    td.innerHTML = BOMB_SVG;

    if (row === state.hitRow && col === state.hitCol) {
      td.classList.add('ms-hit');
    }
  } else {
    td.classList.add('ms-revealed');
    const adj = state.adjacent[row][col];

    if (adj > 0) {
      td.textContent = String(adj);
      td.classList.add(`ms-${adj}`);
    }
  }

  return td;
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------

class GameTimer {
  private seconds = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
    this.render();
  }

  start() {
    if (this.intervalId !== null) return;

    this.intervalId = setInterval(() => {
      this.seconds = Math.min(this.seconds + 1, 999);
      this.render();
    }, 1000);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.seconds = 0;
    this.render();
  }

  private render() {
    this.el.textContent = String(this.seconds).padStart(3, '0');
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function init() {
  const wrapper = document.querySelector('.not-found');

  if (!wrapper) return;

  const container = wrapper.querySelector('.minesweeper');

  if (!container) return;

  const gridEl = container.querySelector<HTMLElement>('.minesweeper-grid');
  const minesEl = container.querySelector<HTMLElement>('.minesweeper-mines');
  const resetBtn = container.querySelector<HTMLElement>('.minesweeper-reset');
  const flagToggleBtn = container.querySelector<HTMLElement>('.minesweeper-flag-toggle');
  const timerEl = container.querySelector<HTMLElement>('.minesweeper-timer');

  if (!gridEl || !minesEl || !resetBtn || !flagToggleBtn || !timerEl) return;

  let state = freshState();
  let flagMode = false;
  const timer = new GameTimer(timerEl);

  // Build 9x9 data array (empty strings -- renderer reads from state)
  const data = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ''));

  function updateMineCounter() {
    let flagCount = 0;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.flagged[r][c]) flagCount++;
      }
    }

    minesEl!.textContent = String(MINE_COUNT - flagCount).padStart(3, '0');
  }

  function updateResetButton() {
    if (state.won) {
      resetBtn!.textContent = '\u{1F60E}'; // 😎
    } else if (state.gameOver) {
      resetBtn!.textContent = '\u{1F635}'; // 😵
    } else {
      resetBtn!.textContent = '\u{1F642}'; // 🙂
    }
  }

  function resetGame() {
    state = freshState();
    flagMode = false;
    flagToggleBtn!.classList.remove('active');
    timer.reset();
    updateMineCounter();
    updateResetButton();
    hot.render();
  }

  const hot = new Handsontable(gridEl, {
    data,
    colWidths: 36,
    rowHeights: 36,
    rowHeaderWidth: 30,
    readOnly: true,
    editor: false,
    disableVisualSelection: true,
    contextMenu: false,
    copyPaste: false,
    autoColumnSize: false,
    autoRowSize: false,
    colHeaders: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    rowHeaders: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    outsideClickDeselects: true,
    fragmentSelection: false,
    manualColumnResize: false,
    manualRowResize: false,
    renderer(instance, td, row, col) {
      return minesweeperRenderer(state, instance, td, row, col);
    },
    afterOnCellMouseDown(_event, coords) {
      if (coords.row < 0 || coords.col < 0) return;
      if (state.gameOver || state.won) return;

      // Ignore right clicks (handled by context menu event)
      const e = _event as unknown as MouseEvent;

      if (e.button === 2) return;

      // Flag mode: tap toggles flag instead of revealing
      if (flagMode) {
        toggleFlag(state, coords.row, coords.col);
        hot.render();
        updateMineCounter();
        return;
      }

      if (!state.minesPlaced) {
        timer.start();
      }

      reveal(state, coords.row, coords.col);
      hot.render();
      updateMineCounter();

      if (state.gameOver || state.won) {
        timer.stop();
        updateResetButton();
      }
    },
    beforeOnCellContextMenu(_event, coords) {
      const e = _event as unknown as Event;

      e.preventDefault();

      if (coords.row < 0 || coords.col < 0) return;

      toggleFlag(state, coords.row, coords.col);
      hot.render();
      updateMineCounter();
    },
    licenseKey: 'non-commercial-and-evaluation',
  });

  // Reset button
  resetBtn.addEventListener('click', resetGame);

  // Flag mode toggle
  flagToggleBtn.addEventListener('click', () => {
    flagMode = !flagMode;
    flagToggleBtn.classList.toggle('active', flagMode);
  });

  // Init UI
  updateMineCounter();
  updateResetButton();
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
