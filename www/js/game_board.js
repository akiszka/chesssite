import { sf_move_fen } from './stockfish.js'
import { getCookie, setCookie } from './mcookie.js'

var board = null
var game = new Chess()

const whiteSquareGrey = '#a9a9a9'
const blackSquareGrey = '#696969'

var $status = $('#status')
var $pgn = $('#pgn')

var isEngineReady = false

export function setEngineReady (val) {
  isEngineReady = val
}

export function tryLoadGame () {
  if (getCookie("game") === "") return

  game.load(getCookie("game"))
  board.position(game.fen(), true)
  updateStatus()
}

export function resetGame() {
  setCookie("game", "", 1)
  location.reload()
}

function saveGame () {
  setCookie("game", game.fen(), 1)
}

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}

function onDragStart (source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }

  // or if Stockfish is not yet ready
  if (isEngineReady === false) return false
}

function onDrop (source, target) {
  removeGreySquares()

  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'
}

function onMouseoverSquare (square, piece) {
  // get list of possible moves for this square
  var moves = game.moves({
    square: square,
    verbose: true
  })

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
    greySquare(moves[i].to)
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

function onSnapEnd () {
  board.position(game.fen())
  updateStatus()

  // use the engine
  sf_move_fen(game.fen()).then((stockfishMove) => {
    var move = game.move(stockfishMove, { sloppy: true })
    if (move === null) console.log("CRITICAL ERROR! Stockfish made an illegal move!")

    board.position(game.fen())
    updateStatus()
  })
}

export function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  if (isEngineReady === false) {
    status = "Stockfish is loading, please hold."
  }

  $status.html(status)
  $pgn.html(game.pgn())

  saveGame()
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}

board = ChessBoard('myBoard', config)
$(window).resize(board.resize) // auto-resize the board
