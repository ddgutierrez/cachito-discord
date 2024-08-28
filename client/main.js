import './style.css';
import io from 'socket.io-client';

const socket = io('http://localhost:8000');
let playerName = '';
let roomId = '';
let isMyTurn = false;

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

document.getElementById('join-room').addEventListener('click', () => {
    roomId = prompt('Enter room ID:');
    playerName = prompt('Enter your name:');
    console.log(`Joining room ${roomId} as ${playerName}`);
    socket.emit('join_room', roomId, playerName);
});

document.getElementById('start-game').addEventListener('click', () => {
    console.log(`Starting game in room ${roomId}`);
    socket.emit('start_game', roomId);
});

document.getElementById('make-bid').addEventListener('click', () => {
    if (!isMyTurn) {
        alert('It\'s not your turn!');
        return;
    }

    const quantity = prompt('Cantidad de dados');
    const faceValue = prompt('Numero del dado');
    console.log(`${playerName} is making a bid of ${quantity} x ${faceValue}`);
    socket.emit('make_bid', { roomId, playerId: socket.id, quantity, faceValue });
});

document.getElementById('challenge-bid').addEventListener('click', () => {
    if (!isMyTurn) {
        alert('It\'s not your turn!');
        return;
    }

    console.log(`${playerName} is challenging the current bid`);
    socket.emit('challenge_bid', roomId, socket.id);
});

socket.on('game_started', (dice) => {
    console.log('New round started, your dice:', dice);

    // Clear the dice display for all other players
    clearOtherPlayersDice();

    // Update the player's own dice display
    updateDiceDisplay(socket.id, dice); // Only the player's own dice are displayed
});

socket.on('your_turn', ({ message }) => {
    console.log(message);
    alert(message);
    isMyTurn = true;
});

socket.on('bid_made', (bid) => {
    console.log('Bid made:', bid);
    document.getElementById('current-bid').textContent = `Current Bid: ${bid.quantity} x ${bid.faceValue}`;
    isMyTurn = false;
});

socket.on('bid_invalid', (message) => {
    console.log('Invalid bid:', message);
    alert(message);
});

socket.on('challenge_result', (result) => {
    console.log('Challenge result:', result);
    alert(result);
    isMyTurn = false;
});

socket.on('game_over', ({ message }) => {
    console.log('Game over:', message);
    alert(message);
    isMyTurn = false;
});

// Listen for dice updates
socket.on('update_dice', ({ playerId, dice }) => {
    console.log(`Updating dice for player ${playerId}:`, dice);
    updateDiceDisplay(playerId, dice);
});

// Function to update the dice display for a player
function updateDiceDisplay(playerId, dice) {
    console.log(`Updating dice display for player ${playerId} with dice:`, dice);
    const playerRow = document.querySelector(`#player-${playerId}`);
    if (playerRow) {
        const diceCell = playerRow.querySelector('.dice-cell');
        diceCell.innerHTML = ''; // Clear previous dice

        dice.forEach(dieValue => {
            const die = document.createElement('div');
            die.className = 'dice';
            die.textContent = dieValue;
            diceCell.appendChild(die);
        });
    } else {
        console.log(`No row found for player ${playerId}.`);
    }
}

socket.on('player_joined', (players) => {
    console.log('Players in the room:', players);
    const tbody = document.querySelector('#dice-table tbody');
    tbody.innerHTML = ''; // Clear existing rows

    players.forEach(player => {
        addPlayerRow(player.id, player.name, []); // Initially, pass an empty dice array
    });
});

socket.on('show_all_dice', (allDice) => {
    console.log('Displaying all players\' dice:', allDice);
    for (const [playerId, dice] of Object.entries(allDice)) {
        updateDiceDisplay(playerId, dice); // Show each player's dice
    }
});

function clearOtherPlayersDice() {
    const tbody = document.querySelector('#dice-table tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const playerId = row.id.replace('player-', '');
        if (playerId !== socket.id) {
            const diceCell = row.querySelector('.dice-cell');
            diceCell.innerHTML = ''; // Clear the dice display for other players
        }
    });
}
// Example of how player rows are added, make sure to adapt this for your specific implementation
function addPlayerRow(playerId, playerName, dice) {
    console.log(`Adding player row for ${playerName} (${playerId})`);
    const tbody = document.querySelector('#dice-table tbody');
    const row = document.createElement('tr');
    row.id = `player-${playerId}`;

    const playerCell = document.createElement('td');
    playerCell.textContent = playerName;

    const diceCell = document.createElement('td');
    diceCell.className = 'dice-cell';

    dice.forEach(dieValue => {
        const die = document.createElement('div');
        die.className = 'dice';
        die.textContent = dieValue;
        diceCell.appendChild(die);
    });

    row.appendChild(playerCell);
    row.appendChild(diceCell);
    tbody.appendChild(row);
}