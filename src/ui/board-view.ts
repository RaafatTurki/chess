import type { Game } from '../chess/game.ts'
import { isEnPassantCapture } from '../chess/moves.ts'
import type { Color, PieceType, Square } from '../chess/types.ts'
import { sameSquare, squareKey } from '../chess/types.ts'
import { pieceImageSrc } from './piece-images.ts'
import { sounds } from './sounds.ts'

const PROMO_CHOICES: PieceType[] = ['queen', 'rook', 'bishop', 'knight']
const SQUARE_PERCENT = 100 / 8
const DRAG_THRESHOLD_PX = 4

interface PieceEl {
  el: HTMLDivElement
  img: HTMLImageElement
}

export class BoardView {
  readonly rootEl: HTMLElement

  private squareEls: HTMLElement[][] = []
  private pieceLayer: HTMLElement
  private pieceEls = new Map<number, PieceEl>()
  private pieceSquares = new Map<number, Square>()
  private promoEl: HTMLElement
  private promoButtons: HTMLButtonElement[] = []

  externalLock = false

  private selectedSquare: Square | null = null
  private legalMoves: Square[] = []
  private dragPieceId: number | null = null
  private dragEntry: PieceEl | null = null
  private dragHoverEl: HTMLElement | null = null
  private game: Game
  private onChange: () => void

  constructor(container: HTMLElement, game: Game, onChange: () => void) {
    this.game = game
    this.onChange = onChange
    this.rootEl = document.createElement('div')
    this.rootEl.className = 'board'
    container.prepend(this.rootEl)

    for (let rank = 0; rank < 8; rank++) {
      const row: HTMLElement[] = []
      for (let file = 0; file < 8; file++) row.push(this.buildSquare(file, rank))
      this.squareEls.push(row)
    }

    this.pieceLayer = document.createElement('div')
    this.pieceLayer.className = 'piece-layer'
    this.rootEl.appendChild(this.pieceLayer)

    const picker = this.buildPromoPicker()
    this.promoEl = picker.el
    this.promoButtons = picker.buttons
    container.appendChild(this.promoEl)

    this.render()
  }

  reset(): void {
    this.deselect()
    this.dragPieceId = null
    this.render()
  }

  render(): void {
    const board = this.game.board

    const checkedKingSquares = new Set<string>()
    for (const color of ['white', 'black'] as Color[]) {
      if (!this.game.isInCheck(color)) continue
      const kingSquare = board.findKing(color)
      if (kingSquare != null) checkedKingSquares.add(squareKey(kingSquare))
    }
    const legalMoveKeys = new Set(this.legalMoves.map(squareKey))
    const selectedPiece = this.selectedSquare != null ? board.get(this.selectedSquare) : null

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = { file, rank }
        const key = squareKey(square)
        const el = this.squareEls[rank][file]
        const isLegal = legalMoveKeys.has(key)
        const occupied = board.get(square) != null
        const isEnPassant =
          !occupied && selectedPiece != null && isEnPassantCapture(board, selectedPiece, this.selectedSquare!, square)
        el.classList.toggle('selected', this.selectedSquare != null && sameSquare(this.selectedSquare, square))
        el.classList.toggle('legal-move', isLegal && !occupied && !isEnPassant)
        el.classList.toggle('legal-capture', isLegal && occupied)
        el.classList.toggle('legal-ep', isLegal && isEnPassant)
        el.classList.toggle('in-check', checkedKingSquares.has(key))
      }
    }

    this.pieceSquares.clear()
    const seenIds = new Set<number>()
    for (const [square, piece] of board.pieces()) {
      seenIds.add(piece.id)
      this.pieceSquares.set(piece.id, square)

      let entry = this.pieceEls.get(piece.id)
      if (entry == null) entry = this.buildPieceEl(piece.id, square)

      entry.img.src = pieceImageSrc(piece.color, piece.type)
      entry.img.alt = `${piece.color} ${piece.type}`
      entry.el.classList.toggle('draggable', this.game.result == null && piece.color === this.game.turn)
      if (piece.id !== this.dragPieceId) this.positionPiece(entry.el, square)
    }

    for (const [id, entry] of this.pieceEls) {
      if (seenIds.has(id)) continue
      entry.el.classList.add('captured')
      entry.el.addEventListener('transitionend', () => entry.el.remove(), { once: true })
      this.pieceEls.delete(id)
    }

    if (this.game.pendingPromotion != null) {
      const { color } = this.game.pendingPromotion
      this.promoButtons.forEach((btn, i) => {
        const img = btn.querySelector('img')!
        img.src = pieceImageSrc(color, PROMO_CHOICES[i])
        img.alt = PROMO_CHOICES[i]
      })
      this.promoEl.hidden = false
    } else {
      this.promoEl.hidden = true
    }
  }

  private buildSquare(file: number, rank: number): HTMLElement {
    const el = document.createElement('div')
    el.className = `square ${(file + rank) % 2 === 0 ? 'tile-light' : 'tile-dark'}`
    el.addEventListener('click', () => this.tryMoveOrSelect({ file, rank }))
    this.rootEl.appendChild(el)
    return el
  }

  private buildPromoPicker(): { el: HTMLElement; buttons: HTMLButtonElement[] } {
    const el = document.createElement('div')
    el.className = 'overlay promo-picker'
    el.hidden = true

    const buttons = PROMO_CHOICES.map((type) => {
      const btn = document.createElement('button')
      btn.className = 'promo-choice'
      btn.type = 'button'
      btn.addEventListener('click', () => {
        this.game.resolvePromotion(type)
        this.afterMove()
      })
      btn.appendChild(document.createElement('img'))
      el.appendChild(btn)
      return btn
    })

    return { el, buttons }
  }

  private buildPieceEl(pieceId: number, square: Square): PieceEl {
    const el = document.createElement('div')
    el.className = 'piece entering'
    el.addEventListener('animationend', () => el.classList.remove('entering'), { once: true })
    el.addEventListener('pointerdown', (e) => this.handlePointerDown(e, pieceId))
    this.positionPiece(el, square)

    const img = document.createElement('img')
    img.draggable = false
    el.appendChild(img)

    this.pieceLayer.appendChild(el)
    const entry: PieceEl = { el, img }
    this.pieceEls.set(pieceId, entry)
    return entry
  }

  private positionPiece(el: HTMLElement, square: Square): void {
    el.style.left = `${square.file * SQUARE_PERCENT}%`
    el.style.top = `${square.rank * SQUARE_PERCENT}%`
  }

  private squareAtPoint(clientX: number, clientY: number): Square | null {
    const rect = this.rootEl.getBoundingClientRect()
    const file = Math.floor(((clientX - rect.left) / rect.width) * 8)
    const rank = Math.floor(((clientY - rect.top) / rect.height) * 8)
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null
    return { file, rank }
  }

  private get inputLocked(): boolean {
    return this.game.result != null || this.game.pendingPromotion != null || this.externalLock
  }

  private isLegalTarget(square: Square): boolean {
    return this.legalMoves.some((m) => sameSquare(m, square))
  }

  private deselect(): void {
    this.selectedSquare = null
    this.legalMoves = []
  }

  private afterMove(): void {
    this.deselect()
    this.render()
    this.onChange()
    if (this.game.result != null) sounds.gameover()
  }

  private playMoveSound(from: Square, to: Square): void {
    const piece = this.game.board.get(from)
    const isCapture = piece != null && (this.game.board.get(to) != null || isEnPassantCapture(this.game.board, piece, from, to))
    if (isCapture) sounds.capture()
    else sounds.move()
  }

  playEngineMove(from: Square, to: Square, promotion?: PieceType): void {
    this.playMoveSound(from, to)
    this.game.makeMove(from, to, promotion)
    this.afterMove()
  }

  private tryMoveOrSelect(square: Square): void {
    if (this.inputLocked) return

    if (this.selectedSquare != null && this.isLegalTarget(square)) {
      this.playMoveSound(this.selectedSquare, square)
      this.game.makeMove(this.selectedSquare, square)
      this.afterMove()
      return
    }

    const piece = this.game.board.get(square)
    if (piece != null && piece.color === this.game.turn) {
      this.selectedSquare = square
      this.legalMoves = this.game.legalMovesFrom(square)
    } else {
      this.deselect()
    }
    this.render()
  }

  private handlePointerDown(e: PointerEvent, pieceId: number): void {
    if (this.inputLocked) return
    const from = this.pieceSquares.get(pieceId)
    if (from == null) return

    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const piece = this.game.board.get(from)
    const canDrag = piece != null && piece.color === this.game.turn
    let dragging = false

    const onMove = (ev: PointerEvent) => {
      if (!dragging) {
        if (!canDrag) return
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD_PX) return
        dragging = true
        this.beginDrag(pieceId, from)
      }
      this.updateDrag(ev)
    }

    const onUp = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
      if (dragging) this.endDrag(ev)
      else this.tryMoveOrSelect(from)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
  }

  private beginDrag(pieceId: number, from: Square): void {
    const entry = this.pieceEls.get(pieceId)
    if (entry == null) return
    this.dragPieceId = pieceId
    this.dragEntry = entry
    this.selectedSquare = from
    this.legalMoves = this.game.legalMovesFrom(from)
    entry.el.classList.add('dragging')
    this.render()
  }

  private updateDrag(ev: PointerEvent): void {
    if (this.dragEntry == null) return
    const rect = this.rootEl.getBoundingClientRect()
    const half = SQUARE_PERCENT / 2
    const leftPct = ((ev.clientX - rect.left) / rect.width) * 100 - half
    const topPct = ((ev.clientY - rect.top) / rect.height) * 100 - half
    this.dragEntry.el.style.left = `${leftPct}%`
    this.dragEntry.el.style.top = `${topPct}%`
    this.updateDragHover(this.squareAtPoint(ev.clientX, ev.clientY))
  }

  private updateDragHover(square: Square | null): void {
    const el = square != null && this.isLegalTarget(square) ? this.squareEls[square.rank][square.file] : null
    if (el === this.dragHoverEl) return
    this.dragHoverEl?.classList.remove('drag-hover')
    el?.classList.add('drag-hover')
    this.dragHoverEl = el
  }

  private endDrag(ev: PointerEvent): void {
    const from = this.selectedSquare!
    this.dragEntry?.el.classList.remove('dragging')
    this.dragPieceId = null
    this.dragEntry = null
    this.updateDragHover(null)

    const target = this.squareAtPoint(ev.clientX, ev.clientY)
    if (target != null && this.isLegalTarget(target)) {
      this.playMoveSound(from, target)
      this.game.makeMove(from, target)
      this.afterMove()
    } else {
      this.deselect()
      this.render()
    }
  }
}
