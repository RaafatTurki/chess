//globals
let colors = { WHITE: 1, BLACK: -1 }
let board;
let boxes = []
let selected_piece;

//size settings
let scaler = 2
let board_w = 256 * scaler
let w = 22 * scaler
let offset = 40 * scaler

//color settings
let selection_color;
let selection_alpha = 100;
let movment_color;
let movment_alpha = 100;

function setup() {
  createCanvas(board_w, board_w)
  board.resizeNN(board_w, board_w)
  
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      
      let number = creation_grid[y][x];
      
      switch (abs(number)) {
        case 0: grid[y][x] = null; break; //not needed
        case 1: grid[y][x] = new Pawn(new Location(x, y), (number > 0 ? colors.WHITE : colors.BLACK )); break;
        case 2: grid[y][x] = new Rook(new Location(x, y), (number > 0 ? colors.WHITE : colors.BLACK )); break;
        case 3: grid[y][x] = new Knight(new Location(x, y), (number > 0 ? colors.WHITE : colors.BLACK )); break;
        case 4: grid[y][x] = new Bishop(new Location(x, y), (number > 0 ? colors.WHITE : colors.BLACK )); break;
        case 5: grid[y][x] = new Queen(new Location(x, y), (number > 0 ? colors.WHITE : colors.BLACK )); break;
        case 6: grid[y][x] = new King(new Location(x, y), (number > 0 ? colors.WHITE : colors.BLACK )); break;
      }

      boxes.push(new Box(x, y))
    }
  }

  selection_color = color("blue")
  selection_color.setAlpha(selection_alpha)
  movment_color = color("yellow")
  movment_color.setAlpha(movment_alpha)
}

function draw() {
  background(50)
  noStroke()
  image(board, 0, 0)
  
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (grid[y][x] != null) grid[y][x].render()
    }
  }

}

function mousePressed() {
  for (let i = 0; i < boxes.length; i++) {
    let box = boxes[i]
    let piece = grid[box.y][box.x]

    if (box.hasMouse()) {

      if (piece != null) {
        clearSelection()
        piece.is_selected = true
        selected_piece = piece;
        piece.calculatePosibleLocation()

      } else if (selected_piece != null) {

        for (let i = 0; i < selected_piece.possible_locations.length; i++) {
          let loc = selected_piece.possible_locations[i]
          if (box.x == loc.x && box.y == loc.y) {
            selected_piece.moveTo(new Location(box.x, box.y))
          }
        }

      }

    }
  }
}



class Piece {
  constructor(loc, col, imgs) {
    this.location = loc
    this.color = col
    this.imgs = imgs
    this.imgs[0].resizeNN(w, w)
    this.imgs[1].resizeNN(w, w)
    this.is_selected = false
    this.possible_locations = []
  }

  render() {
    image((this.color == colors.WHITE ? this.imgs[0] : this.imgs[1]), offset + (this.location.x * w), offset + (this.location.y * w))

    if (this.is_selected) {
      fill(selection_color)
      rect(offset + (this.location.x * w), offset + (this.location.y * w), w, w)
    }

    for (let i = 0; i < this.possible_locations.length; i++) {
      let location = this.possible_locations[i]
      fill(movment_color)
      rect(offset + (location.x * w), offset + (location.y * w), w, w)
    }
  }

  clearPossibleLocations() {
    this.possible_locations = [];
  }

  moveTo(newLocation) {
    //grid[this.location.y, this.location.x] = null
    //grid[newLocation.y, newLocation.x] = this
    this.location = newLocation
  }

}


class Pawn extends Piece {
  constructor(loc, col) {
    super(loc, col, [w_pawn, b_pawn])
  }
}

class Rook extends Piece {
  constructor(loc, col) {
    super(loc, col, [w_rook, b_rook])
  }

}



class Knight extends Piece {
  constructor(loc, col) {
    super(loc, col, [w_knight, b_knight])
  }

  calculatePosibleLocation() {
    clearAllPossibleLocations()
    let knight_moves = [
      new Location( 2,  1),
      new Location( 2, -1),
      new Location(-2,  1),
      new Location(-2, -1),
      new Location( 1,  2),
      new Location(-1,  2),
      new Location( 1, -2),
      new Location(-1, -2)
    ]
    
    this.unfiltered_possible_locations = []
    for (let i = 0; i < knight_moves.length; i++) {
      let loc = new Location(this.location.x + knight_moves[i].x, this.location.y - knight_moves[i].y)
      this.unfiltered_possible_locations.push(loc)
    }
    this.unfiltered_possible_locations = filterOutOfBounds(this.unfiltered_possible_locations)
    this.unfiltered_possible_locations = filterSameColor(this.unfiltered_possible_locations, this.color)
    this.possible_locations = this.unfiltered_possible_locations
  }

}



class Bishop extends Piece {
  constructor(loc, col) {
    super(loc, col, [w_bishop, b_bishop])
  }

}

class Queen extends Piece {
  constructor(loc, col) {
    super(loc, col, [w_queen, b_queen])
  }

}

class King extends Piece {
  constructor(loc, col) {
    super(loc, col, [w_king, b_king])
  }

}



class Location {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

class Box {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.pos_x = offset + (x * w)
    this.pos_y = offset + (y * w)
    this.is_highlighted = false
  }

  hasMouse() {
    if (mouseX > this.pos_x && mouseX < this.pos_x + w && mouseY > this.pos_y && mouseY < this.pos_y + w) return true
  }
}



function clearSelection() {
  for (let i = 0; i < boxes.length; i++) {
    let box = boxes[i]
    if (grid[box.y][box.x] != null) {
      grid[box.y][box.x].is_selected = false
    }
  }
  selected_piece = null;
}

function clearAllPossibleLocations() {
  for (let i = 0; i < boxes.length; i++) {
    let box = boxes[i]
    if (grid[box.y][box.x] != null) {
      grid[box.y][box.x].possible_locations = []
    }
  }
}

function filterOutOfBounds(locations) {
  let filtered_locations = [];
  for (let i = 0; i < locations.length; i++) {
    let loc = locations[i]
    if (loc.x < 0 || loc.x > 7 || loc.y < 0 || loc.y > 7) continue;
    filtered_locations.push(loc)
  }
  return filtered_locations
}

function filterSameColor(locations, color) {
  let filtered_locations = [];
  for (let i = 0; i < locations.length; i++) {
    let loc = locations[i]
    if (grid[loc.y][loc.x] != null) {
      if (grid[loc.y][loc.x].color == color) continue;
    }
    filtered_locations.push(loc)
  }
  return filtered_locations
}

