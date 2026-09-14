import './style.css'
import { Game } from './chess/game.ts'
import { BoardView } from './ui/board-view.ts'
import { el } from './ui/dom.ts'
import { HistoryPanel } from './ui/history-panel.ts'

const boardFrame = el('board-frame')
const game = new Game()

const turnTextEl = el('turnText')
const turnDotEl = el('turnDot')
const gameOverOverlayEl = el('gameOverOverlay')
const gameOverTextEl = el('gameOverText')
const moveListEl = el('moveList')
const exportPgnBtn = el<HTMLButtonElement>('exportPgnBtn')
const exportFenBtn = el<HTMLButtonElement>('exportFenBtn')

const boardView = new BoardView(boardFrame, game, updateStatus)
const historyPanel = new HistoryPanel(game, moveListEl, exportPgnBtn, exportFenBtn)

function updateStatus() {
  if (game.result != null) {
    const text = game.result.outcome === 'checkmate' ? `${game.result.loser === 'white' ? 'Black' : 'White'} wins` : 'Stalemate'
    turnTextEl.textContent = text
    gameOverTextEl.textContent = text
    gameOverOverlayEl.hidden = false
  } else {
    turnTextEl.textContent = game.turn === 'white' ? "White's turn" : "Black's turn"
    turnDotEl.classList.toggle('black', game.turn === 'black')
    gameOverOverlayEl.hidden = true
  }
  historyPanel.render()
}

function newGame() {
  game.reset()
  boardView.reset()
  updateStatus()
}

el('rematchBtn').addEventListener('click', newGame)
el('newGameBtn').addEventListener('click', newGame)

updateStatus()
