import React from 'react';
import PhaserGame from './components/PhaserGame';

function App() {
  return (
    <div className="min-h-screen w-full bg-gray-800 flex flex-col justify-center items-center py-6 sm:py-8">
      <header className="mb-6 sm:mb-8 text-center">
        <h1 
          className="text-4xl sm:text-5xl font-bold text-yellow-400 tracking-wider px-2"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          Shoppy Bird
        </h1>
      </header>
      <main className="shadow-2xl rounded-lg overflow-hidden border-4 border-gray-700">
        <PhaserGame />
      </main>
      <footer className="mt-6 sm:mt-8 text-center text-gray-400 px-4">
        <p 
          className="text-sm sm:text-base"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          Click or Tap the screen to make Shoppy flap.
        </p>
        <p 
          className="text-sm sm:text-base"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          Collect bonus items for extra points.
        </p>
        <p 
          className="text-sm sm:text-base"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          Press P to pause
        </p>
        <p 
          className="text-sm sm:text-base"
          style={{ fontFamily: "'Press Start 2P', cursive" }}
        >
          Avoid the pipes!
        </p>
      </footer>
    </div>
  );
}

export default App;