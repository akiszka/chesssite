var outsideResolve = (x) => {}

Stockfish().then(sf => {
    sf.addMessageListener(line => {
	if (line === "uciok") {
	    console.log("Stockfish ready")
	}

	if(line.slice(0,8) == "bestmove") {
	    outsideResolve(line.slice(9,13))
	}
    });

    // internal function
    const p = (message) => {
	sf.postMessage(message);
    };

    // external interface functions
    sf_move = (m) => {
	sf.postMessage("position startpos moves " + m + "\n");
	sf.postMessage("go depth 10\n");
	return new Promise((resolve, reject) => {
	    outsideResolve = resolve;
	})
    }

    sf_move_fen = (f) => {
	currentBestMove = undefined
	
	sf.postMessage("position fen " + f + "\n");
	sf.postMessage("go depth 10\n");

	return new Promise((resolve, reject) => {
	    outsideResolve = resolve;
	})
    }
    
    sf_quit = () => {
	sf.postMessage("quit\n");
    }

    // setup 
    p("uci\n");
    p("setoption name Threads value 32\n");
    p("ucinewgame\n");
    p("setoption name UCI_AnalyseMode value true\n");
});
