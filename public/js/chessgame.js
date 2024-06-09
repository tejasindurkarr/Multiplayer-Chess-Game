const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const getPieceUnicode = () => {
    return {
        w: {
            p: "\u2659", // White Pawn
            r: "\u2656", // White Rook
            n: "\u2658", // White Knight
            b: "\u2657", // White Bishop
            q: "\u2655", // White Queen
            k: "\u2654"  // White King
        },
        b: {
            p: "\u265F", // Black Pawn
            r: "\u265C", // Black Rook
            n: "\u265E", // Black Knight
            b: "\u265D", // Black Bishop
            q: "\u265B", // Black Queen
            k: "\u265A"  // Black King
        }
    };
};

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    const unicodePieces = getPieceUnicode();

    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = unicodePieces[square.color][square.type];
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    if (source.row === target.row && source.col === target.col) {
        return; // Do nothing if the source and target squares are the same
    }

    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q", // Always promote to a queen for simplicity
    };
    socket.emit("move", move);
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

renderBoard();
