import {Chess} from "chess.js";
const pieceValues={p:100,n:320,b:330,r:500,q:900,k:20000};
const pawnTable=[
    0,0,0,0,0,0,0,0,
    0.5,1,1,-0.5,-0.5,1,1,0.5,
    0.1,0.2,0.4,-0.2,-0.2,0.4,0.2,0.1,
    0,0,0,0,0,0,0,0,
    -0.2,-0.1,0.1,0.2,0.2,0.1,-0.1,-0.2,
    -0.3,-0.2,0,0.1,0.1,0,-0.2,-0.3,
    -0.4,-0.3,-0.2,-0.1,-0.1,-0.2,-0.3,-0.4,
    0,0,0,0,0,0,0,0
];
const knightTable=[
    -2,-1,0,0,0,0,-1,-2,
    -1,0,0.5,0.5,0.5,0.5,0,-1,
    0,0.5,0.5,1,1,0.5,0.5,0,
    0,0.5,1,1.5,1.5,1,0.5,0,
    0,0.5,1,1.5,1.5,1,0.5,0,
    0,0.5,0.5,1,1,0.5,0.5,0,
    -1,0,0.5,0.5,0.5,0.5,0,-1,
    -2,-1,0,0,0,0,-1,-2
];
const bishopTable=[
    -2,-1,0,0,0,0,-1,-2,
    -1,0,0,0,0,0,0,-1,
    0,0,0,0.5,0.5,0,0,0,
    0,0.5,0.5,1,1,0.5,0.5,0,
    0,0.5,0.5,1,1,0.5,0.5,0,
    0,0,0,0.5,0.5,0,0,0,
    -1,0,0,0,0,0,0,-1,
    -2,-1,0,0,0,0,-1,-2
];
const rookTable=[
    0,0,0,0,0,0,0,0,
    0.5,1,1,1,1,1,1,0.5,
    -0.5,0,0,0,0,0,0,-0.5,
    -0.5,0,0,0,0,0,0,-0.5,
    -0.5,0,0,0,0,0,0,-0.5,
    -0.5,0,0,0,0,0,0,-0.5,
    -0.5,0,0,0,0,0,0,-0.5,
    0,0,0,0.5,0.5,0,0,0
];
const queenTable=[
    -2,-1,0,0,0,0,-1,-2,
    -1,0,0,0,0,0,0,-1,
    0,0,0.5,0.5,0.5,0.5,0,0,
    0,0.5,0.5,1,1,0.5,0.5,0,
    0,0.5,0.5,1,1,0.5,0.5,0,
    0,0,0.5,0.5,0.5,0.5,0,0,
    -1,0,0,0,0,0,0,-1,
    -2,-1,0,0,0,0,-1,-2
];
const kingTable=[
    -3,-4,-4,-5,-5,-4,-4,-3,
    -3,-4,-4,-5,-5,-4,-4,-3,
    -3,-4,-4,-5,-5,-4,-4,-3,
    -3,-4,-4,-5,-5,-4,-4,-3,
    -2,-3,-3,-4,-4,-3,-3,-2,
    -1,-2,-2,-2,-2,-2,-2,-1,
    0.5,0.5,0,0,0,0,0.5,0.5,
    1,1.5,0.5,0,0,0.5,1.5,1
];
function getPieceSquareValue(piece, square, isWhite){
    let idx=square[1]*8+square[0];
    if(piece.type==='p'){
        let val=pawnTable[idx];
        return isWhite?val:-val;
    }
    else if(piece.type==='n'){
        let val=knightTable[idx];
        return isWhite?val:-val;
    }
    else if(piece.type==='b'){
        let val=bishopTable[idx];
        return isWhite?val:-val;
    }
    else if(piece.type==='r'){
        let val=rookTable[idx];
        return isWhite?val:-val;
    }
    else if(piece.type==='q'){
        let val=queenTable[idx];
        return isWhite?val:-val;
    }
    else if(piece.type==='k'){
        let val=kingTable[idx];
        return isWhite?val:-val;
    }
    return 0;
}
function evaluateBoard(game){
    let total=0;
    let board=game.board();
    for(let i=0;i<8;i++){
        for(let j=0;j<8;j++){
            let piece=board[i][j];
            if(piece){
                let value=pieceValues[piece.type];
                let squareBonus=getPieceSquareValue(piece, [j,i], piece.color==='w');
                let pieceValue=value+squareBonus;
                total+=(piece.color==='w'?pieceValue:-pieceValue);
            }
        }
    }
    return total;
}
function minimax(game, depth, alpha, beta, isMaximizing){
    if(depth===0 || game.game_over()){
        return evaluateBoard(game);
    }
    let moves=game.moves({verbose:true});
    if(isMaximizing){
        let maxEval=-Infinity;
        for(let move of moves){
            game.move(move);
            let moveValue=minimax(game, depth-1, alpha, beta, false);
            game.undo();
            maxEval=Math.max(maxEval, moveValue);
            alpha=Math.max(alpha, moveValue);
            if(beta<=alpha) break;
        }
        return maxEval;
    }
    else{
        let minEval=Infinity;
        for(let move of moves){
            game.move(move);
            let moveValue=minimax(game, depth-1, alpha, beta, true);
            game.undo();
            minEval=Math.min(minEval, moveValue);
            beta=Math.min(beta, moveValue);
            if(beta<=alpha) break;
        }
        return minEval;
    }
}
function getBestMove(game, difficulty){
    let depth;
    if(difficulty==='easy') depth=1;
    else if(difficulty==='medium') depth=2;
    else depth=3;
    let moves=game.moves({verbose:true});
    let bestMove=null;
    let bestValue=-Infinity;
    for(let move of moves){
        game.move(move);
        let moveValue=-minimax(game, depth-1, -Infinity, Infinity, false);
        game.undo();
        if(moveValue>bestValue){
            bestValue=moveValue;
            bestMove=move;
        }
    }
    return bestMove;
}
self.onmessage=(e)=>{
    const {fen, difficulty}=e.data;
    const game=new Chess(fen);
    const bestMove=getBestMove(game, difficulty);
    self.postMessage({bestMove});
};