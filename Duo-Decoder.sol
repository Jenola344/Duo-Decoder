// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DuoDecoderGame {
    uint8 public constant MAX_ROUNDS = 5;

    enum Role { ClueMaster, CodeBreaker }
    enum GameStatus { WaitingForPlayer, InProgress, Completed }

    struct GameRound {
        string clue1;
        string clue2;
        string clue3;
        string[4] options;
        uint8 correctIndex;
        bool guessMade;
        bool correct;
    }

    struct GameSession {
        address player1;
        address player2;
        uint8 currentRound;
        uint8 score;
        GameStatus status;
        mapping(uint8 => GameRound) rounds;
    }

    mapping(uint256 => GameSession) public sessions;
    uint256 public nextSessionId;

    event SessionCreated(uint256 sessionId, address creator);
    event PlayerJoined(uint256 sessionId, address player2);
    event RoundSubmitted(uint256 sessionId, uint8 roundNumber);
    event GuessMade(uint256 sessionId, uint8 roundNumber, bool correct);
    event GameCompleted(uint256 sessionId, uint8 finalScore);

    modifier onlyPlayers(uint256 sessionId) {
        require(
            msg.sender == sessions[sessionId].player1 || msg.sender == sessions[sessionId].player2,
            "Not a player in this session"
        );
        _;
    }

    function createSession() external returns (uint256 sessionId) {
        sessionId = nextSessionId++;
        sessions[sessionId].player1 = msg.sender;
        sessions[sessionId].status = GameStatus.WaitingForPlayer;
        emit SessionCreated(sessionId, msg.sender);
    }

    function joinSession(uint256 sessionId) external {
        GameSession storage game = sessions[sessionId];
        require(game.status == GameStatus.WaitingForPlayer, "Session not joinable");
        require(game.player1 != msg.sender, "Can't join your own session");

        game.player2 = msg.sender;
        game.status = GameStatus.InProgress;

        emit PlayerJoined(sessionId, msg.sender);
    }

    function submitRound(
        uint256 sessionId,
        string memory clue1,
        string memory clue2,
        string memory clue3,
        string[4] memory options,
        uint8 correctIndex
    ) external onlyPlayers(sessionId) {
        GameSession storage game = sessions[sessionId];
        require(game.status == GameStatus.InProgress, "Game not in progress");
        require(game.currentRound < MAX_ROUNDS, "Game is already completed");

        GameRound storage round = game.rounds[game.currentRound];
        round.clue1 = clue1;
        round.clue2 = clue2;
        round.clue3 = clue3;
        round.options = options;
        round.correctIndex = correctIndex;

        emit RoundSubmitted(sessionId, game.currentRound);
    }

    function guess(
        uint256 sessionId,
        uint8 guessIndex
    ) external onlyPlayers(sessionId) {
        GameSession storage game = sessions[sessionId];
        GameRound storage round = game.rounds[game.currentRound];

        require(!round.guessMade, "Guess already made for this round");
        require(guessIndex < 4, "Invalid guess");

        round.guessMade = true;
        if (guessIndex == round.correctIndex) {
            round.correct = true;
            game.score += 1;
        }

        emit GuessMade(sessionId, game.currentRound, round.correct);

        game.currentRound++;

        if (game.currentRound == MAX_ROUNDS) {
            game.status = GameStatus.Completed;
            emit GameCompleted(sessionId, game.score);
        }
    }

    function getCurrentRole(uint256 sessionId) external view onlyPlayers(sessionId) returns (Role) {
        GameSession storage game = sessions[sessionId];

        if (game.currentRound % 2 == 0) {
            return msg.sender == game.player1 ? Role.ClueMaster : Role.CodeBreaker;
        } else {
            return msg.sender == game.player1 ? Role.CodeBreaker : Role.ClueMaster;
        }
    }

    function getRoundData(uint256 sessionId, uint8 roundNumber)
        external
        view
        onlyPlayers(sessionId)
        returns (
            string memory,
            string memory,
            string memory,
            string[4] memory,
            bool,
            bool
        )
    {
        GameRound storage round = sessions[sessionId].rounds[roundNumber];
        return (
            round.clue1,
            round.clue2,
            round.clue3,
            round.options,
            round.guessMade,
            round.correct
        );
    }
}
