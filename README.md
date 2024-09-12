# **Liar's Dice Multiplayer Game**

Liar's Dice is a classic bluffing dice game that can now be played online with friends through this multiplayer web-based version! This project uses **Node.js**, **Socket.IO**, and **Express** for the server-side and **JavaScript**, **HTML**, and **CSS** for the client-side to create an engaging real-time gameplay experience. 

## **Features**

- **Multiplayer Gameplay**: Play Liar's Dice with up to 10 players in real-time.
- **Room-Based System**: Players can join or create rooms to play with friends or other online players.
- **Real-Time Communication**: Uses Socket.IO to handle real-time bid updates, challenges, and dice roll displays.
- **Dynamic Turn Management**: Automatically manages player turns, allowing only the current player to bid or challenge.
- **Bid Validations**: Enforces Liar's Dice rules for valid bids, including handling of wild "1" dice and bid restrictions.
- **Challenge Rounds**: Allows players to challenge a bid, determining whether the previous bidder was truthful or lying.
- **Automatic Round Reset**: At the end of each round, dice are rolled again, and the game continues until one player remains.
- **Visual Updates**: Players see only their dice during their turn, while all dice are displayed at the end of each round for 5 seconds.
- **Responsive Interface**: Features sliders and buttons for easy bidding, providing visual feedback as players adjust their bids.

## **Technologies Used**

- **Node.js**: A JavaScript runtime environment to build the server-side application.
- **Express**: A minimal and flexible Node.js web application framework for the server.
- **Socket.IO**: A library that enables real-time, bidirectional communication between the client and server.
- **HTML/CSS**: For structuring and styling the client-side interface.
- **JavaScript**: Core logic for client-side interactions and game mechanics.

## **How to Run the Project Locally**

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/liars-dice.git
   cd liars-dice
2. **Install Dependencies**:
   - Navigate to both the `server` and `client` directories and run:

   For the server:
   ```bash
   cd server
   npm install
   ```
   For the client:
   ```bash
   cd client
   npm install
   ```
3. **Run the Server**:
   -Navigate to the `server` directory and start the server:
   ```bash
   cd server
   node server.js
   ```
4. **Run the Client**:
   -Navigate to the `client` directory and start the client:
   ```bash
   cd client
   npm run dev
   ```
5. **Play the Game**: 
   -Open your browser and go to `http://localhost:5173.`
   -Enter a room ID and your player name to join a room.
   -Wait for other players to join or start the game if enough players are present.
   -Enjoy the game!

## **How to Play Liar's Dice**

1. **Objective**: Each player aims to be the last one remaining with dice.

2. **Setup**: Each player starts with 5 dice and a cup to conceal their dice from other players.

3. **Gameplay**:
   - Players take turns in a clockwise order. On their turn, a player may either:
     - **Make a Bid**: Announce a quantity of dice showing a specific face value that they believe exists among all the dice under all cups. For example, "five threes" means that the player believes there are at least five dice showing a three.
     - **Challenge the Previous Bid**: If a player believes the previous bid is incorrect, they may challenge it. All players then reveal their dice, and the dice are counted to see if the bid was valid.
   
4. **Bidding Rules**:
   - Each new bid must be higher than the previous one. This can mean either a higher quantity of the same face value or the same quantity of a higher face value. For example, "five threes" can be followed by "five fours" or "six threes."
   - **Wild Ones**: In most versions of the game, a die showing a one (1) is considered wild and can count as any other face value. However, bids on "ones" can only be followed by another "ones" bid or a higher number bid of any other face.
   - If a player wants to switch their bid to ones after a previous non-one bid, they must bid at least half the number of dice rounded up. If they are switching back from ones to a non-one bid, they must bid double plus one of the previous quantity of ones.

5. **Challenge Outcome**:
   - If the challenge is correct (i.e., the previous bid was not valid), the player who made the last bid loses one die.
   - If the challenge is incorrect (i.e., the previous bid was valid), the challenger loses one die.
   - The player who loses a die becomes the starting player for the next round.

6. **Ending the Game**:
   - The game continues with players losing dice for incorrect bids or challenges.
   - When a player loses all their dice, they are out of the game.
   - The last player remaining with at least one die is declared the winner.

## **Contributing**

Feel free to fork the repository and submit pull requests. Contributions, issues, and feature requests are welcome!
