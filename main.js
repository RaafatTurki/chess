let scaler = 2
let board_w = 256 * scaler
let w = 22 * scaler
let offset = 40 * scaler

let colors = { WHITE: 1, BLACK: -1 }
let pieces = { PAWN: 1, ROOK: 2, KNIGHT: 3, BISHOP: 4, QUEEN: 5, KING: 6 }  //unused yet

//globals
let turn = colors.WHITE
let selectedSquare = null
let grid = [
    [-2, -3, -4, -5, -6, -4, -3, -2],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 1,  1,  1,  1,  1,  1,  1,  1],
    [ 2,  3,  4,  5,  6,  4,  3,  2]
]
let captured = []


function preload() {
    board = loadImage('assets/board.png')
  
    b_king = loadImage('assets/b_king.png')
    b_queen = loadImage('assets/b_queen.png')
    b_bishop = loadImage('assets/b_bishop.png')
    b_knight = loadImage('assets/b_knight.png')
    b_rook = loadImage('assets/b_rook.png')
    b_pawn = loadImage('assets/b_pawn.png')
  
    w_king = loadImage('assets/w_king.png')
    w_queen = loadImage('assets/w_queen.png')
    w_bishop = loadImage('assets/w_bishop.png')
    w_knight = loadImage('assets/w_knight.png')
    w_rook = loadImage('assets/w_rook.png')
    w_pawn = loadImage('assets/w_pawn.png')
}

function setup() {
    createCanvas(board_w, board_w)
    board.resizeNN(board_w, board_w)

    for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
            let num = grid[j][i]
            grid[j][i] = new Square(i, j, null)
            putPieceByNum(new Vec2(i, j), num)
        }
    }
}


//Grid Control
function putPieceByNum(pos, num) {
    let col = (num > 0 ? colors.WHITE : colors.BLACK)
    let piece = null

    switch (abs(num)) {
        case 0: piece = null; break
        case 1: piece = new Pawn(pos, col); break
        case 2: piece = new Rook(pos, col); break
        case 3: piece = new Knight(pos, col); break
        case 4: piece = new Bishop(pos, col); break
        case 5: piece = new Queen(pos, col); break
        case 6: piece = new King(pos, col); break
        default: console.log("can not put piece due to undefined num")
    }
    
    grid[pos.j][pos.i].piece = piece
}

function putPieceByObj(pos, piece) {
    grid[pos.j][pos.i].piece = piece
}

function delPiece(pos) {
    grid[pos.j][pos.i].piece = null
}

function getPiece(pos) {
    if(isPosOutOfBounds(pos)) return null
    return grid[pos.j][pos.i].piece
}

function movePiece(posFrom, posTo) {
    let piece = getPiece(posFrom);
    if (piece == null) return
    piece.pos = posTo
    putPieceByObj(posTo, piece)
    delPiece(posFrom)
}


//Selection Control
function deselectSelectedSquare() {
    if (selectedSquare != null) {
        selectedSquare.isSelected = false
        selectedSquare = null
    }
}

function selectSquare(square) {
    selectedSquare = square
    square.isSelected = true
}


//Checking Control
function isSquareSelected() {
    if (selectedSquare != null) return true
    return false
}

function isPieceSelected() {
    if (isSquareSelected() && selectedSquare.piece != null) {
        return true
    }
    return false
}

function isSelectedPieceCanMoveTo(pos) {
    if (selectedSquare.piece.canMoveTo(pos)) return true
    return false
}

function isTherePieceOn(pos) {
    let piece = getPiece(pos)
    if (piece != null) return true
    return false
}

function isThereEnemyPieceOn(thisColor, pos) {
    let piece = getPiece(pos)
    if (piece == null) return false
    if (piece.color != thisColor) {
        return true
    }
    return false
}

function isPosOutOfBounds(pos) {
    if (pos.i < 0 || pos.i > 7 || pos.j < 0 || pos.j > 7) return true; else return false
}


//Gameplay Control
function nextTurn() {
    if (turn == colors.WHITE) {
        turn = colors.BLACK
    } else {
        turn = colors.WHITE
    }
}

function capture(piece) {
    captured.push(piece)
}

function clearAllEnPassantVulnerability() {
    for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
            let piece = grid[j][i].piece
            if (piece != null && piece.type == pieces.PAWN) {
                piece.isEnPassantVulnerable = false
            }
        }
    }
}

function doAction(square) {
    let movingPiece = selectedSquare.piece

    //en passant capture: pawn moving diagonally into an empty square means
    //the captured pawn is beside the destination, not on it
    if (movingPiece.type == pieces.PAWN && square.piece == null && square.pos.i != movingPiece.pos.i) {
        let capturedPawnPos = new Vec2(square.pos.i, movingPiece.pos.j)
        capture(getPiece(capturedPawnPos))
        delPiece(capturedPawnPos)
    }

    //saving captured pieces
    if (isTherePieceOn(square.pos)) capture(square.piece)
    //moving piece
    movePiece(movingPiece.pos, square.pos)

    //en passant is only available for the turn right after a double move
    clearAllEnPassantVulnerability()

    //if wasn't touched mark it so
    if (square.piece.isUntouched) {
        square.piece.isUntouched = false
        //if pawn just double moved mark it en passant vulnerable
        if (square.piece.type == pieces.PAWN && (square.piece.pos.y == 3 || square.piece.pos.y == 4)) {
            square.piece.isEnPassantVulnerable = true
        }
    }

}


function draw() {
    image(board, 0, 0)

    //rendering squares
    for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
            let square = grid[j][i]
            square.render()
        }
    }

    //rendering pieces
    for (let j = 0; j < 8; j++) {
        for (let i = 0; i < 8; i++) {
            let square = grid[j][i]
            square.renderPiece()
            square.updatePiece()
        }
    }

}

function mousePressed() {

    for (let j = 0; j < grid.length; j++) {
        for (let i = 0; i < grid[j].length; i++) {
            let square = grid[j][i]
            if (square.hasMouse()) {
                square.mousePressed()
            }
        }
    }

}


class Square {
    constructor(i, j, piece) {
        this.i = i;
        this.j = j;
        this.x = (this.i * w) + offset
        this.y = (this.j * w) + offset
        this.pos = new Vec2(i, j)
        this.piece = piece
        this.isSelected = false
        this.SelectColor = color("black")
        this.HighlightColor = color("orange")
        this.HighlightHitColor = color("red")
    }

    hasMouse() {
        if (mouseX > this.x && mouseX < this.x + w && mouseY > this.y && mouseY < this.y + w) return true
    }

    mousePressed() {
        //Playing
        if (isPieceSelected() && isSelectedPieceCanMoveTo(this.pos)) {
            doAction(this)
            deselectSelectedSquare()
            nextTurn()
        //Selecting
        } else /*if (this.piece != null && this.piece.color == turn)*/ { //uncomment to get out of free play
            deselectSelectedSquare()
            selectSquare(this)
        }
    }

    render() {
        if (this.isSelected) {

            if (this.piece != null) {
                for (let i = 0; i < this.piece.available_positions.length; i++) {
                    let pos = this.piece.available_positions[i]
                    noStroke()
                    //Hit highlight
                    if (isTherePieceOn(pos)) {
                        this.HighlightHitColor.setAlpha(150)
                        fill(this.HighlightHitColor)
                    //Move highlight
                    } else {
                        this.HighlightColor.setAlpha(150)
                        fill(this.HighlightColor)
                    }
                    rect((pos.i * w) + offset, (pos.j * w) + offset, w, w)
                }
            }
            //Selection highlight
            noFill()
            strokeWeight(5)
            stroke(this.SelectColor)
            rect(this.x, this.y, w, w)
        }
    }

    renderPiece() {
        if (this.piece != null) this.piece.render()
    }

    updatePiece() {
        if (this.piece != null) this.piece.calculateAllAvailablePositions()
    }

}



class Piece {
    constructor(pos, col, imgs) {
        this.pos = pos
        this.color = col
        this.imgs = imgs
        this.imgs[0].resizeNN(w, w)
        this.imgs[1].resizeNN(w, w)
        this.available_positions = []
        this.isUntouched = true
        this.isEnPassantVulnerable  = false //unused yet
        this.isFrozen = false //unused yet
    }

    render() {
        image((this.color == colors.WHITE ? this.imgs[0] : this.imgs[1]), offset + (this.pos.i * w), offset + (this.pos.j * w))
    }

    canMoveTo(pos) {
        for (let i = 0; i < this.available_positions.length; i++) {
            if (this.available_positions[i].equals(pos)) {
                return true
            }
        }
        return false
    }

    getRelPos(i, j) {
        return new Vec2(this.pos.x + i, this.pos.j + j)
    }

    rayCastToDir(dir) {
        let arr = []
        let pos = this.pos

        do {
            arr.push(pos)
            pos = pos.add(dir)
        } while (!isTherePieceOn(pos) && !isPosOutOfBounds(pos))

        if (getPiece(pos) != null) {
            if (getPiece(pos).color != this.color) arr.push(pos)
        }

        return arr
    }

    filterOutOfBoundsPositions() {
        let arr = []
        for (let i = 0; i < this.available_positions.length; i++) {
            let pos = this.available_positions[i]
            if (pos.i < 0 || pos.i > 7 || pos.j < 0 || pos.j > 7) continue
            arr.push(pos)
        }
        this.available_positions = arr
    }

    filterOutSameColorPositions() {
        let arr = []
        for (let i = 0; i < this.available_positions.length; i++) {
            let pos = this.available_positions[i]
            if (getPiece(pos) != null) {
                if (getPiece(pos).color == this.color) continue
            }
            arr.push(pos)
        }
        this.available_positions = arr
    }

}



class Pawn extends Piece {
    
    constructor(pos, col) {
        super(pos, col, [w_pawn, b_pawn])
        this.type = pieces.PAWN
    }

    calculateUnfilteredAvailablePositions() {
        let arr = []

        //move forward
        if (!isTherePieceOn(this.getRelPos(0, -1 * this.color))) {
            arr.push(this.getRelPos(0, -1 * this.color))

            //move forward twice
            if (this.isUntouched && !isTherePieceOn(this.getRelPos(0, -2 * this.color))) {
                arr.push(this.pos.add(new Vec2(0, -2 * this.color)))
            }
        }

        //kill diagonally right
        if (isThereEnemyPieceOn(this.color, this.pos.add(new Vec2(-1, -1 * this.color)))) {
            arr.push(this.pos.add(new Vec2(-1, -1 * this.color)))
        }

        //kill en passant right
        if (isThereEnemyPieceOn(this.color, this.pos.add(new Vec2(-1, 0)))) {
            if (getPiece(this.pos.add(new Vec2(-1, 0))).isEnPassantVulnerable) {
                arr.push(this.pos.add(new Vec2(-1, -1 * this.color)))
            }
        }

        //kill diagonally left
        if (isThereEnemyPieceOn(this.color, this.pos.add(new Vec2( 1, -1 * this.color)))) {
            arr.push(this.pos.add(new Vec2( 1, -1 * this.color)))
        }

        //kill en passant left
        if (isThereEnemyPieceOn(this.color, this.pos.add(new Vec2( 1, 0)))) {
            if (getPiece(this.pos.add(new Vec2( 1, 0))).isEnPassantVulnerable) {
                arr.push(this.pos.add(new Vec2( 1, -1 * this.color)))
            }
        }

        this.available_positions = arr
    }

    calculateAllAvailablePositions() {
        this.calculateUnfilteredAvailablePositions()
        this.filterOutOfBoundsPositions()
        this.filterOutSameColorPositions()
    }
}



class Rook extends Piece {
    constructor(pos, col) {
        super(pos, col, [w_rook, b_rook])
        this.type = pieces.ROOK
    }

    calculateUnfilteredAvailablePositions() {
        this.available_positions = [
            ...this.rayCastToDir(new Vec2(-1, 0)),
            ...this.rayCastToDir(new Vec2( 1, 0)),
            ...this.rayCastToDir(new Vec2( 0,-1)),
            ...this.rayCastToDir(new Vec2( 0, 1))
        ]
    }
    calculateAllAvailablePositions() {
        this.calculateUnfilteredAvailablePositions()
        this.filterOutOfBoundsPositions()
        this.filterOutSameColorPositions()
    }
}



class Knight extends Piece {
    constructor(pos, col) {
        super(pos, col, [w_knight, b_knight])
        this.type = pieces.KNIGHT
    }

    calculateUnfilteredAvailablePositions() {
        let arr = []
        let possible_knight_moves = [
            new Vec2( 2,  1),
            new Vec2( 2, -1),
            new Vec2(-2,  1),
            new Vec2(-2, -1),
            new Vec2( 1,  2),
            new Vec2(-1,  2),
            new Vec2( 1, -2),
            new Vec2(-1, -2),
        ]

        for (let i = 0; i < possible_knight_moves.length; i++) {
            arr.push(this.pos.add(possible_knight_moves[i]))
        }

        this.available_positions = arr
    }

    calculateAllAvailablePositions() {
        this.calculateUnfilteredAvailablePositions()
        this.filterOutOfBoundsPositions()
        this.filterOutSameColorPositions()
    }

}



class Bishop extends Piece {
    constructor(pos, col) {
        super(pos, col, [w_bishop, b_bishop])
        this.type = pieces.BISHOP
    }

    calculateUnfilteredAvailablePositions() {
        this.available_positions = [
            ...this.rayCastToDir(new Vec2(-1,-1)),
            ...this.rayCastToDir(new Vec2( 1, 1)),
            ...this.rayCastToDir(new Vec2(-1, 1)),
            ...this.rayCastToDir(new Vec2( 1,-1))
        ]
    }
    calculateAllAvailablePositions() {
        this.calculateUnfilteredAvailablePositions()
        this.filterOutOfBoundsPositions()
        this.filterOutSameColorPositions()
    }
}



class Queen extends Piece {
    constructor(pos, col) {
        super(pos, col, [w_queen, b_queen])
        this.type = pieces.QUEEN
    }

    calculateUnfilteredAvailablePositions() {
        this.available_positions = [
            ...this.rayCastToDir(new Vec2(-1,-1)),
            ...this.rayCastToDir(new Vec2( 1, 1)),
            ...this.rayCastToDir(new Vec2(-1, 1)),
            ...this.rayCastToDir(new Vec2( 1,-1)),
            ...this.rayCastToDir(new Vec2(-1, 0)),
            ...this.rayCastToDir(new Vec2( 1, 0)),
            ...this.rayCastToDir(new Vec2( 0,-1)),
            ...this.rayCastToDir(new Vec2( 0, 1))
        ]
    }
    calculateAllAvailablePositions() {
        this.calculateUnfilteredAvailablePositions()
        this.filterOutOfBoundsPositions()
        this.filterOutSameColorPositions()
    }
}



class King extends Piece {
    constructor(pos, col) {
        super(pos, col, [w_king, b_king])
        this.type = pieces.KING
    }

    calculateUnfilteredAvailablePositions() {
        let arr = []
        let possible_king_moves = [
            new Vec2( 1,  0),
            new Vec2(-1,  0),
            new Vec2( 0,  1),
            new Vec2( 0, -1),
            new Vec2( 1,  1),
            new Vec2( 1, -1),
            new Vec2(-1,  1),
            new Vec2(-1, -1)
        ]

        for (let i = 0; i < possible_king_moves.length; i++) {
            arr.push(this.pos.add(possible_king_moves[i]))
        }

        this.available_positions = arr
    }

    calculateAllAvailablePositions() {
        this.calculateUnfilteredAvailablePositions()
        this.filterOutOfBoundsPositions()
        this.filterOutSameColorPositions()
        //this.filterOutDangerPositions
    }
}



class Vec2 {
    constructor(i, j) {
        this.i = i
        this.j = j
        
        this.x = i
        this.y = j
    }

    add(vec2) {
        return new Vec2(this.i + vec2.i, this.j + vec2.j)
    }

    equals(vec2) {
        return (this.i == vec2.i && this.j == vec2.j)
    }
}


//Others
let themes = ["oak", "almond"] //has to have 2 only
function toggleTheme() {
    let canvas = document.querySelector("canvas")
    let btns = document.querySelector(".btn")

    canvas.classList.toggle("oak")
    canvas.classList.toggle("almond")

    btns.classList.toggle("oak")
    btns.classList.toggle("almond")
}

