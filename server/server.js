import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

server.listen(3000, () => {
    console.log('Listening on *:3000');
});

class LiarsDiceGame {
    constructor(players) {
        if (!Array.isArray(players)) {
            throw new Error('Players must be an array');
        }
        this.players = players.slice(0, 10); // Limit to 10 players max
        this.diceCount = 5; // Each player starts with 5 dice
        this.dice = {};
        this.currentBid = null;

        // Shuffle players to determine turn order
        this.turnOrder = this.shufflePlayers(players);
        this.currentPlayerIndex = 0; // Start with the first player in the shuffled list

        console.log('Initialized game with players:', this.turnOrder);

        this.turnOrder.forEach(player => {
            this.dice[player.id] = this.rollDice(this.diceCount);
            console.log(`Player ${player.name} (${player.id}) dice:`, this.dice[player.id]);
        });
    }

    shufflePlayers(players) {
        console.log('Shuffling players...');
        return players.sort(() => Math.random() - 0.5); // Simple shuffle algorithm
    }

    rollDice(count) {
        let rolls = [];
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * 6) + 1);
        }
        return rolls;
    }

    getCurrentPlayer() {
        return this.turnOrder[this.currentPlayerIndex];
    }

    nextPlayer() {
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.turnOrder.length;
        } while (
            !this.dice[this.getCurrentPlayer().id] ||
            this.dice[this.getCurrentPlayer().id].length === 0
        );

        console.log(`Next player is: ${this.getCurrentPlayer().name} (${this.getCurrentPlayer().id})`);
        return this.getCurrentPlayer();
    }

    makeBid(playerId, quantity, faceValue) {
        console.log(`Player ${playerId} making a bid of ${quantity} x ${faceValue}`);
        if (this.isValidBid(quantity, faceValue)) {
            this.currentBid = { playerId, quantity, faceValue };
            console.log('Bid accepted:', this.currentBid);
            return true;
        } else {
            console.log('Bid rejected as invalid');
            return false;
        }
    }
    
    isValidBid(quantity, faceValue) {
        if (!this.currentBid) {
            return true;
        }
    
        const previousFaceValue = this.currentBid.faceValue;
        const previousQuantity = this.currentBid.quantity;
    
        if (faceValue === 1) {
            // If the new bid is on 1's, the quantity must be at least half of the previous non-1 bid
            return quantity >= Math.floor(previousQuantity / 2);
        } else if (previousFaceValue === 1) {
            // If the previous bid was on 1's, the new bid must be at least (quantity * 2) + 1
            return quantity >= (previousQuantity * 2) + 1;
        } else {
            // Standard rule: new quantity must be higher, or same quantity with a higher face value
            return (
                quantity > previousQuantity ||
                (quantity === previousQuantity && faceValue > previousFaceValue)
            );
        }
    }

    challengeBid(challengerId, roomId) {
        const totalDice = this.countDice(this.currentBid.faceValue);
        console.log(`Challenge by ${challengerId} against bid ${this.currentBid.quantity} x ${this.currentBid.faceValue}`);
        if (totalDice >= this.currentBid.quantity) {
            this.removeDice(challengerId, roomId);
            console.log(`Challenge failed: ${totalDice} dice showing ${this.currentBid.faceValue}`);
            return `${challengerId} loses! There were actually ${totalDice} dice showing ${this.currentBid.faceValue}.`;
        } else {
            this.removeDice(this.currentBid.playerId, roomId);
            console.log(`Challenge succeeded: Only ${totalDice} dice showing ${this.currentBid.faceValue}`);
            return `${this.currentBid.playerId} loses! There were only ${totalDice} dice showing ${this.currentBid.faceValue}.`;
        }
    }

    countDice(faceValue) {
        let count = 0;
        Object.values(this.dice).forEach(dice => {
            count += dice.filter(die => die === faceValue || die === 1).length; // 1 counts as any value
        });
        console.log(`Total dice showing ${faceValue} or 1 (joker): ${count}`);
        return count;
    }    

    removeDice(playerId, roomId) {
        if (this.dice[playerId] && this.dice[playerId].length > 0) {
            this.dice[playerId].pop(); // Remove one dice from the player
            console.log(`Player ${playerId} now has ${this.dice[playerId].length} dice left`);

            // Notify the client about the dice update
            io.to(roomId).emit('update_dice', { playerId, dice: this.dice[playerId] });

            if (this.dice[playerId].length === 0) {
                console.log(`Player ${playerId} has been eliminated.`);
            }
        }
    }

    checkGameOver() {
        const remainingPlayers = this.turnOrder.filter(player =>
            this.dice[player.id] && this.dice[player.id].length > 0
        );
        console.log('Remaining players:', remainingPlayers);
        return remainingPlayers.length === 1;
    }

    getWinner() {
        return this.turnOrder.find(player => this.dice[player.id].length > 0);
    }

    resetDiceForNewRound() {
        console.log('Rolling new dice for all players');
        this.turnOrder.forEach(player => {
            if (this.dice[player.id].length > 0) { // Roll dice only for players who have dice left
                this.dice[player.id] = this.rollDice(this.dice[player.id].length);
                console.log(`Player ${player.name} (${player.id}) new dice:`, this.dice[player.id]);
            }
        });
    }
}

let games = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (roomId, playerName) => {
        socket.join(roomId);
        console.log(`${playerName} joined room ${roomId}`);

        if (!games[roomId]) {
            games[roomId] = {
                players: []
            };
        }

        const player = { id: socket.id, name: playerName };
        games[roomId].players.push(player);

        console.log('Players in room:', games[roomId].players);

        // Notify others in the room about the new player
        io.to(roomId).emit('player_joined', games[roomId].players);
    });

    socket.on('start_game', (roomId) => {
        const players = games[roomId].players;
        console.log('Starting game with players:', players);
        if (!Array.isArray(players) || players.length === 0) {
            console.error('Cannot start game: players is not an array or is empty.');
            return;
        }

        const game = new LiarsDiceGame(players);
        games[roomId].game = game;

        // Send each player their own dice
        players.forEach(player => {
            console.log(`Sending dice to player ${player.name} (${player.id}):`, game.dice[player.id]);
            io.to(player.id).emit('game_started', game.dice[player.id]);
        });

        // Notify the first player that it's their turn
        const currentPlayer = game.getCurrentPlayer();
        io.to(currentPlayer.id).emit('your_turn', { message: `It's your turn!`, currentPlayer });
    });


    socket.on('make_bid', ({ roomId, playerId, quantity, faceValue }) => {
        console.log(`Player ${playerId} in room ${roomId} is making a bid`);
        const game = games[roomId].game;
        if (playerId !== game.getCurrentPlayer().id) {
            io.to(playerId).emit('bid_invalid', 'Not your turn.');
            return;
        }

        const success = game.makeBid(playerId, quantity, faceValue);
        if (success) {
            io.to(roomId).emit('bid_made', { playerId, quantity, faceValue });

            // Move to the next player's turn
            const nextPlayer = game.nextPlayer();
            io.to(nextPlayer.id).emit('your_turn', { message: `It's your turn!`, nextPlayer });
        } else {
            io.to(playerId).emit('bid_invalid', `Invalid bid by ${playerId}.`);
        }
    });

    socket.on('challenge_bid', (roomId, challengerId) => {
        console.log(`Player ${challengerId} in room ${roomId} is challenging the current bid`);
        const game = games[roomId].game;
        const result = game.challengeBid(challengerId, roomId);
        io.to(roomId).emit('challenge_result', result);
    
        if (game.checkGameOver()) {
            const winner = game.getWinner();
            io.to(roomId).emit('game_over', { message: `${winner.name} wins!`, winner });
        } else {
            // Reset dice for all players and start a new round
            game.resetDiceForNewRound();
    
            // Send the new dice to each player individually
            game.turnOrder.forEach(player => {
                io.to(player.id).emit('game_started', game.dice[player.id]);
            });
    
            // Move to the next player's turn
            const nextPlayer = game.nextPlayer();
            io.to(nextPlayer.id).emit('your_turn', { message: `It's your turn!`, nextPlayer });
        }
    });
    


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Handle player leaving the game and clean up
        for (let roomId in games) {
            const room = games[roomId];
            room.players = room.players.filter(player => player.id !== socket.id);
            if (room.players.length === 0) {
                delete games[roomId];  // Delete the game if no players are left
            } else {
                io.to(roomId).emit('player_left', room.players);
            }
        }
    });
});
