# Shoppy Bird

Shoppy Bird is a fun, engaging, Flappy Bird-inspired web game built with Phaser, React, TypeScript, and Vite. Test your reflexes by navigating Shoppy, the bird, through an endless series of pipes. Collect valuable items during regular gameplay and go on a collecting spree during the exciting Bonus Phase!

## Features

*   **Classic Flappy Bird Mechanics:** Simple tap/click controls to make Shoppy flap and fly.
*   **Dynamic Difficulty:** The game starts with wider pipe gaps for an easier introduction. As you progress, the gaps gradually narrow to the classic challenging width.
*   **Collectible Items:** Grab bronze, silver, gold, and diamond items between pipes for extra points.
*   **Bonus Phase:** After passing a certain number of pipes, a "Lucky Break" Bonus Phase triggers!
    *   Pipes temporarily disappear.
    *   Rainbow background and special music.
    *   Bonus items spawn rapidly for a limited time – collect as many as you can!
    *   The number of pipes required to trigger the next Bonus Phase increases each time.
*   **Time-of-Day Cycle:** The background visuals dynamically change, cycling through sunrise, day, sunset, and night.
*   **Sound Effects & Music:** Immersive audio feedback for flapping, collecting items, scoring, collisions, and a distinct track for the Bonus Phase.
*   **High Score Tracking:** Your best score is saved locally in your browser.
*   **Pause Functionality:** Press 'P' to pause and resume the game.
*   **Responsive Design:** The game is designed to be playable on various screen sizes.
*   **Modern Tech Stack:**
    *   **Phaser 3:** Fast, free, and fun open-source HTML5 game framework.
    *   **React:** JavaScript library for building user interfaces.
    *   **TypeScript:** Typed superset of JavaScript that compiles to plain JavaScript.
    *   **Vite:** Next-generation frontend tooling for a fast development experience.
    *   **Tailwind CSS:** Utility-first CSS framework for rapid UI development (used for the surrounding page).
    *   **Tone.js:** Web Audio framework for creating interactive music in the browser.

## Getting Started

To run Shoppy Bird locally on your machine, follow these steps:

### Prerequisites

*   **Node.js and npm (or yarn):** Make sure you have Node.js installed. npm is included with Node.js. You can download it from [nodejs.org](https://nodejs.org/). Alternatively, you can use yarn.

### Installation & Running

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd shoppy-bird
    ```

2.  **Install dependencies:**
    Open your terminal in the project's root directory (`shoppy-bird`) and run:
    ```bash
    npm install
    ```
    or if you prefer yarn:
    ```bash
    yarn install
    ```

3.  **Start the development server:**
    Once the dependencies are installed, start the Vite development server:
    ```bash
    npm run dev
    ```
    or with yarn:
    ```bash
    yarn dev
    ```

4.  **Open the game in your browser:**
    Vite will typically output a local URL (usually `http://localhost:5173` or similar) in the terminal. Open this URL in your web browser to play Shoppy Bird.

## How to Play

*   **Click** the screen or press the **Spacebar** to make Shoppy flap upwards.
*   Navigate Shoppy through the gaps in the pipes.
*   Avoid hitting the pipes or the top/bottom of the screen.
*   Collect items that appear in the pipe gaps for bonus points.
*   Survive as long as you can to get the highest score!
*   Press **'P'** to pause and resume the game.

Enjoy playing Shoppy Bird!
