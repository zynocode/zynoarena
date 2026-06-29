/// <reference lib="webworker" />

// Load Stockfish from cdnjs
// This works perfectly in browser Web Workers since importScripts is evaluated in the worker thread.
try {
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
} catch (error) {
  console.error('Error importing Stockfish script in worker:', error);
}

declare var STOCKFISH: any;

let engine: any = null;

try {
  if (typeof STOCKFISH === 'function') {
    engine = STOCKFISH();
  } else {
    // Fallback if STOCKFISH function isn't globally bound
    console.warn('STOCKFISH function is not defined globally.');
  }
} catch (err) {
  console.error('Failed to instantiate Stockfish:', err);
}

if (engine) {
  engine.onmessage = (line: string) => {
    // Send UCI responses back to the main thread
    postMessage(line);
  };

  self.onmessage = (e: MessageEvent) => {
    // Pipe UCI commands from the main thread directly to Stockfish
    engine.postMessage(e.data);
  };
} else {
  // If CDN fails, we can fall back to posting an error message
  postMessage('error Stockfish engine not loaded');
}
