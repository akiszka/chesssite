import { sf_move_fen } from './stockfish.js'

let board = null
const game = new Chess()

const squareClass = 'square-55d63'

const $board = $('#myBoard')
const $status = $('#status')
const $pgn = $('#pgn')
const $engine = $('#engine')

let isEngineReady = false

let moves = []
let currentMoveNumber = 0

export function setEngineReady (val) {
  isEngineReady = val
}

export function setChessPosition (pgn) {
  game.load_pgn(pgn)
  console.log(board.position(game.fen(), true))
  updateStatus()
  moves = []
  game.history({ verbose: true }).forEach((move) => moves.push(move.from+move.to))
  currentMoveNumber = moves.length
}

export function rewindBack () {
  game.reset()
  board.position(game.fen(), true)
  updateStatus()
  currentMoveNumber = 0
}

export function fastForward () {
  game.reset()
  moves.forEach((currentMove) => {
    game.move(currentMove, { sloppy: true })
  })
  board.position(game.fen(), true)
  updateStatus()
  currentMoveNumber = moves.length
}

export function nextMove() {
  if (currentMoveNumber >= moves.length) return // no more moves

  currentMoveNumber += 1

  let movesUntilNow = moves.slice(0, currentMoveNumber)
  let currentMove = movesUntilNow[currentMoveNumber-1]

  game.move(currentMove, { sloppy: true })
  board.position(game.fen(), false)
  updateStatus()
}

export function previousMove() {
  if (currentMoveNumber <= 0) return // no more moves

  currentMoveNumber -= 1

  let movesUntilNow = moves.slice(0, currentMoveNumber)

  game.reset()
  movesUntilNow.forEach((currentMove) => {
    game.move(currentMove, { sloppy: true })
  })
  board.position(game.fen(), false)
  updateStatus()
}

export function updateStatus () {
  let status = ''

  let moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  } else if (game.in_draw()) { // draw?
    status = 'Game over, drawn position'
  } else { // game still on
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  if (isEngineReady === false) {
    status = 'Stockfish is loading, please hold.'
  }

  $status.html(status)
  $pgn.html(game.pgn())

  if(isEngineReady === true) {
    sf_move_fen(game.fen()).then((move) => {
      $engine.html(move)

      const from = move.slice(0,2)
      const to = move.slice(2,4)

      $board.find('.' + squareClass).removeClass('highlight')
      $board.find('.square-' + from).addClass('highlight')
      $board.find('.square-' + to).addClass('highlight')
    })
  }
}

const config = {
  draggable: false,
  position: 'start',
  moveSpeed: 160,
  useAnimation: false
}

board = ChessBoard('myBoard', config)
$(window).resize(board.resize) // auto-resize the board

updateStatus()
