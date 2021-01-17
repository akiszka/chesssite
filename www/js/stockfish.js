// for UCI documentation, see https://gist.github.com/aliostad/f4470274f39d29b788c1b09519e67372
export { sf_setup, sf_move, sf_move_fen, sf_whenready, sf_quit }

let sf_setup = {}
let sf_move = {}
let sf_move_fen = {}
let sf_whenready = {}
let sf_quit = {}

Stockfish().then(sf => {
  // this is crazy
  // when stockfish is fed a move, it returns the best move later
  // because of that the sf_move_fen function returns a Promise
  // the resolve() of that Promise is added to oudsideResolve
  // and then the promise is resolved from the Stockfish MessageListener
  var outsideMoveResolve = []
  var outsideReadyResolve = []
  var isready = false

  sf.addMessageListener(line => {
    if (line === "readyok") {
      console.log("Stockfish ready")
      isready = true
      while (outsideReadyResolve.length > 0) {
	var resolve = outsideReadyResolve.shift()
	resolve(true)
      }
    }

    if(line.slice(0, 8) === "bestmove") {
      // call the first resolve()
      var resolve = outsideMoveResolve.shift()
      resolve(line.slice(9, 13))
    }
  });

  // external interface functions
  sf_setup = (analyze) => {
    sf.postMessage("uci\n")
    sf.postMessage("setoption name Threads value 32\n")
    sf.postMessage("ucinewgame\n")
    sf.postMessage("setoption name UCI_Elo value 1350\n")
    sf.postMessage("setoption name Threads value 32\n")
    if (analyze === true) {
      sf.postMessage("setoption name UCI_AnalyseMode value true\n")
    } else {
      sf.postMessage("setoption name UCI_AnalyseMode value false\n")
    }
    sf.postMessage("isready")
  }

  sf_whenready = () => {
    return new Promise((resolve, reject) => {
      if (isready === false) // if not yet ready, just let other code handle this
	outsideReadyResolve.push(resolve)
      else // if ready, return true rightaway
	resolve(true)
    })
  }

  sf_move = (m) => {
    sf.postMessage("position startpos moves " + m + "\n");
    sf.postMessage("go depth 10\n");
    return new Promise((resolve, reject) => {
      outsideMoveResolve.push(resolve);
    })
  }

  sf_move_fen = (f) => {3
    sf.postMessage("position fen " + f + "\n");
    sf.postMessage("go depth 13\n");

    return new Promise((resolve, reject) => {
      outsideMoveResolve.push(resolve);
    })
  }

  sf_quit = () => {
    sf.postMessage("quit\n");
  }
});
