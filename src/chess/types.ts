export type Color = 'white' | 'black'

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'

export interface Piece {
  id: number
  type: PieceType
  color: Color
  hasMoved: boolean
}

let nextPieceId = 1

export function createPiece(type: PieceType, color: Color, hasMoved = false): Piece {
  return { id: nextPieceId++, type, color, hasMoved }
}

export interface Square {
  file: number
  rank: number
}

export function sq(file: number, rank: number): Square {
  return { file, rank }
}

export function sameSquare(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank
}

export function isOnBoard(s: Square): boolean {
  return s.file >= 0 && s.file <= 7 && s.rank >= 0 && s.rank <= 7
}

export function otherColor(color: Color): Color {
  return color === 'white' ? 'black' : 'white'
}

export function squareKey(s: Square): string {
  return `${s.file},${s.rank}`
}
