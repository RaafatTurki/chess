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


  let creation_grid = [
    [-2, -3, -4, -5, -6, -4, -3, -2],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 1,  1,  1,  1,  1,  1,  1,  1],
    [ 2,  3,  4,  5,  6,  4,  3,  2]
  ]

  let grid = [
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null]
  ]