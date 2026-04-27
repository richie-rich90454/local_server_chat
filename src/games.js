let unlockCount=localStorage.getItem("unlockCount")?parseInt(localStorage.getItem("unlockCount")):0;
let developerMode=false;
export function getUnlockCount(){return unlockCount;}
export function incrementUnlockCount(){unlockCount++;localStorage.setItem("unlockCount",unlockCount);}
export function applyGoldBorder(chatPage){
    if(window.goldBorderTimeout) clearTimeout(window.goldBorderTimeout);
    chatPage.style.borderColor="#FFD700";
    chatPage.style.boxShadow="0 0 20px #FFD700";
    window.goldBorderTimeout=setTimeout(()=>{
        chatPage.style.borderColor="";
        chatPage.style.boxShadow="";
    },30000);
}
export function showSystemMessage(socket,msg,onMessage){
    let fakeEvent={data:JSON.stringify({type:"system",message:msg})};
    onMessage(JSON.parse(fakeEvent.data));
}
export function updateDeveloperMode(chatPage,socket,showSystemMessageFn){
    if(unlockCount>=5 && !developerMode){
        developerMode=true;
        let devBadge=document.getElementById("devBadge");
        if(!devBadge){
            devBadge=document.createElement("div");
            devBadge.id="devBadge";
            devBadge.textContent="DEV MODE ACTIVE";
            devBadge.style.cssText="position:fixed;bottom:10px;left:10px;background:#000;color:#0f0;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:10px;z-index:9999;opacity:0.7;";
            document.body.appendChild(devBadge);
        }
        let originalOnlineHandler=socket.onmessage;
        socket.onmessage=(event)=>{
            let data=JSON.parse(event.data);
            if(data.type==="onlineCount"){
                console.log("[DEV] Online count:",data.count);
            }
            originalOnlineHandler(event);
        };
        showSystemMessageFn("Developer mode unlocked. Hidden powers activated.");
        return true;
    }
    return false;
}
export function doRandomEasterEgg(showSystemMessageFn,applyGoldBorderFn,updateDeveloperModeFn,incrementUnlockCountFn){
    let eggs=[
        ()=>{
            incrementUnlockCountFn();
            showSystemMessageFn(`Secret unlock #${unlockCount}. You feel a strange power.`);
            applyGoldBorderFn();
            updateDeveloperModeFn();
        },
        ()=>{
            showSystemMessageFn("That's the maximum value of a signed 16-bit integer. You found a boundary.");
        },
        ()=>{
            showSystemMessageFn("65536 = 2^16. A perfect square.");
        },
        ()=>{
            showSystemMessageFn("The maximum 32-bit signed integer. You've reached the limit.");
        },
        ()=>{
            showSystemMessageFn("You have gained root access... to the chat. Nothing changes, but feel powerful.");
        },
        ()=>{
            let oldName=currentUser;
            currentUser="root";
            showSystemMessageFn("You are now root. (Press any key to revert)");
            document.addEventListener("keydown",function revert(e){
                currentUser=oldName;
                showSystemMessageFn("Root privileges revoked.");
                document.removeEventListener("keydown",revert);
            },{once:true});
        },
        ()=>{
            let originalBg=document.body.style.backgroundColor;
            document.body.style.backgroundColor="#FF0000";
            setTimeout(()=>{
                document.body.style.backgroundColor="#00FF00";
                setTimeout(()=>{
                    document.body.style.backgroundColor="#0000FF";
                    setTimeout(()=>{
                        document.body.style.backgroundColor=originalBg;
                    },200);
                },200);
            },200);
            showSystemMessageFn("RGB flash!");
        },
        ()=>{
            let span=document.getElementById("onlineCount");
            let original=span.textContent;
            span.textContent="(???)";
            showSystemMessageFn("Online count classified.");
            setTimeout(()=>{
                span.textContent=original;
            },5000);
        },
        ()=>{
            showSystemMessageFn("Critical error: reality glitch detected. Press any key to stabilise.");
            let handler=()=>{
                showSystemMessageFn("Reality stabilised.");
                document.removeEventListener("keydown",handler);
            };
            document.addEventListener("keydown",handler,{once:true});
        }
    ];
    let randomIndex=Math.floor(Math.random()*eggs.length);
    eggs[randomIndex]();
}
export function create2048Game(container){
    let size=4;
    let grid=[];
    let score=0;
    let gameOver=false;
    let gameContainerDiv=document.createElement("div");
    gameContainerDiv.style.cssText="display:flex;flex-direction:column;align-items:center;gap:10px;";
    let scoreDiv=document.createElement("div");
    scoreDiv.style.cssText="font-size:1.2rem;font-weight:bold;color:var(--text-primary);";
    scoreDiv.textContent="Score: 0";
    let gridDiv=document.createElement("div");
    gridDiv.style.cssText="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:var(--background-card);padding:10px;border-radius:8px;";
    let statusDiv=document.createElement("div");
    statusDiv.style.cssText="font-size:1rem;color:var(--text-primary);";
    function initGrid(){
        grid=Array(size).fill().map(()=>Array(size).fill(0));
        addRandomTile();
        addRandomTile();
        updateUI();
    }
    function addRandomTile(){
        let empty=[];
        for(let i=0;i<size;i++){
            for(let j=0;j<size;j++){
                if(grid[i][j]==0) empty.push([i,j]);
            }
        }
        if(empty.length==0) return;
        let [x,y]=empty[Math.floor(Math.random()*empty.length)];
        grid[x][y]=Math.random()<0.9?2:4;
    }
    function updateUI(){
        gridDiv.innerHTML="";
        for(let i=0;i<size;i++){
            for(let j=0;j<size;j++){
                let val=grid[i][j];
                let tile=document.createElement("div");
                tile.style.cssText="width:60px;height:60px;background:#cdc1b4;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;color:#776e65;transition:0.1s;";
                if(val>0){
                    tile.textContent=val;
                    if(val==2) tile.style.backgroundColor="#eee4da";
                    else if(val==4) tile.style.backgroundColor="#ede0c8";
                    else if(val==8) tile.style.backgroundColor="#f2b179";
                    else if(val==16) tile.style.backgroundColor="#f59563";
                    else if(val==32) tile.style.backgroundColor="#f67c5f";
                    else if(val==64) tile.style.backgroundColor="#f65e3b";
                    else if(val>=128) tile.style.backgroundColor="#edcf72";
                }
                else{
                    tile.textContent="";
                    tile.style.backgroundColor="#cdc1b4";
                }
                gridDiv.appendChild(tile);
            }
        }
        scoreDiv.textContent="Score: "+score;
        if(gameOver){
            statusDiv.textContent="Game Over! Press R to restart.";
        }else{
            statusDiv.textContent="";
        }
    }
    function move(direction){
        if(gameOver) return;
        let oldGrid=JSON.parse(JSON.stringify(grid));
        let merged=Array(size).fill().map(()=>Array(size).fill(false));
        if(direction=="left"){
            for(let i=0;i<size;i++){
                for(let j=1;j<size;j++){
                    if(grid[i][j]!==0){
                        let k=j;
                        while(k>0 && grid[i][k-1]==0){
                            grid[i][k-1]=grid[i][k];
                            grid[i][k]=0;
                            k--;
                        }
                        if(k>0 && grid[i][k-1]==grid[i][k] && !merged[i][k-1]){
                            grid[i][k-1]*=2;
                            score+=grid[i][k-1];
                            grid[i][k]=0;
                            merged[i][k-1]=true;
                        }
                    }
                }
            }
        }
        else if(direction=="right"){
            for(let i=0;i<size;i++){
                for(let j=size-2;j>=0;j--){
                    if(grid[i][j]!==0){
                        let k=j;
                        while(k<size-1 && grid[i][k+1]==0){
                            grid[i][k+1]=grid[i][k];
                            grid[i][k]=0;
                            k++;
                        }
                        if(k<size-1 && grid[i][k+1]==grid[i][k] && !merged[i][k+1]){
                            grid[i][k+1]*=2;
                            score+=grid[i][k+1];
                            grid[i][k]=0;
                            merged[i][k+1]=true;
                        }
                    }
                }
            }
        }
        else if(direction=="up"){
            for(let j=0;j<size;j++){
                for(let i=1;i<size;i++){
                    if(grid[i][j]!==0){
                        let k=i;
                        while(k>0 && grid[k-1][j]==0){
                            grid[k-1][j]=grid[k][j];
                            grid[k][j]=0;
                            k--;
                        }
                        if(k>0 && grid[k-1][j]==grid[k][j] && !merged[k-1][j]){
                            grid[k-1][j]*=2;
                            score+=grid[k-1][j];
                            grid[k][j]=0;
                            merged[k-1][j]=true;
                        }
                    }
                }
            }
        }
        else if(direction=="down"){
            for(let j=0;j<size;j++){
                for(let i=size-2;i>=0;i--){
                    if(grid[i][j]!==0){
                        let k=i;
                        while(k<size-1 && grid[k+1][j]==0){
                            grid[k+1][j]=grid[k][j];
                            grid[k][j]=0;
                            k++;
                        }
                        if(k<size-1 && grid[k+1][j]==grid[k][j] && !merged[k+1][j]){
                            grid[k+1][j]*=2;
                            score+=grid[k+1][j];
                            grid[k][j]=0;
                            merged[k+1][j]=true;
                        }
                    }
                }
            }
        }
        if(JSON.stringify(oldGrid)!==JSON.stringify(grid)){
            addRandomTile();
            updateUI();
            if(isGameOver()){
                gameOver=true;
                updateUI();
            }
        }
    }
    function isGameOver(){
        for(let i=0;i<size;i++){
            for(let j=0;j<size;j++){
                if(grid[i][j]==0) return false;
                if(i<size-1 && grid[i][j]==grid[i+1][j]) return false;
                if(j<size-1 && grid[i][j]==grid[i][j+1]) return false;
            }
        }
        return true;
    }
    function restart(){
        grid=Array(size).fill().map(()=>Array(size).fill(0));
        score=0;
        gameOver=false;
        addRandomTile();
        addRandomTile();
        updateUI();
    }
    gameContainerDiv.appendChild(scoreDiv);
    gameContainerDiv.appendChild(gridDiv);
    gameContainerDiv.appendChild(statusDiv);
    container.appendChild(gameContainerDiv);
    initGrid();
    function handleKey(e){
        let key=e.key;
        if(key=="ArrowLeft") move("left");
        else if(key=="ArrowRight") move("right");
        else if(key=="ArrowUp") move("up");
        else if(key=="ArrowDown") move("down");
        else if(key=="r"||key=="R") restart();
        else return;
        e.preventDefault();
    }
    window.addEventListener("keydown",handleKey);
    container._cleanup=()=>{
        window.removeEventListener("keydown",handleKey);
    };
}
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
export async function createChessGame(container, options={}){
    let mode=options.mode||'ai';
    let difficulty=options.difficulty||'medium';
    let boardDiv=document.createElement("div");
    boardDiv.style.cssText="display:grid;grid-template-columns:repeat(8,1fr);width:min(400px,70vw);height:min(400px,70vw);margin:0 auto;";
    let statusDiv=document.createElement("div");
    statusDiv.style.cssText="margin-top:10px;text-align:center;color:var(--text-primary);font-size:0.9rem;";
    let controlsDiv=document.createElement("div");
    controlsDiv.style.cssText="margin-top:10px;text-align:center;";
    let resignBtn=document.createElement("button");
    resignBtn.textContent="Resign";
    resignBtn.style.cssText="margin:0 5px;padding:4px 12px;background:var(--button-bg);border:1px solid var(--border-card);border-radius:.3rem;cursor:pointer;color:var(--text-primary);";
    controlsDiv.appendChild(resignBtn);
    container.appendChild(boardDiv);
    container.appendChild(statusDiv);
    container.appendChild(controlsDiv);
    let game=null;
    let selectedSquare=null;
    let aiThinking=false;
    let playerColor='w';
    let gameActive=true;
    const chessModule=await import("chess.js");
    const Chess=chessModule.Chess||chessModule.default;
    game=new Chess();
    function renderBoard(){
        let board=game.board();
        boardDiv.innerHTML="";
        for(let i=0;i<8;i++){
            for(let j=0;j<8;j++){
                let square=String.fromCharCode(97+j)+(8-i);
                let piece=board[i][j];
                let squareDiv=document.createElement("div");
                let isLight=(i+j)%2===0;
                squareDiv.style.cssText=`width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:min(2rem,6vw);cursor:pointer;background-color:${isLight?"#f0d9b5":"#b58863"};${selectedSquare===square?"border:3px solid red;box-sizing:border-box;":""}`;
                if(piece){
                    let pieceChar="";
                    switch(piece.type){
                        case "k": pieceChar=piece.color==="w"?"♔":"♚";break;
                        case "q": pieceChar=piece.color==="w"?"♕":"♛";break;
                        case "r": pieceChar=piece.color==="w"?"♖":"♜";break;
                        case "b": pieceChar=piece.color==="w"?"♗":"♝";break;
                        case "n": pieceChar=piece.color==="w"?"♘":"♞";break;
                        case "p": pieceChar=piece.color==="w"?"♙":"♟";break;
                    }
                    squareDiv.textContent=pieceChar;
                }
                squareDiv.onclick=()=>{
                    if(!gameActive) return;
                    if(aiThinking) return;
                    let turn=game.turn();
                    if(turn!==playerColor) return;
                    if(selectedSquare===null){
                        let pieceAtSquare=game.get(square);
                        if(pieceAtSquare && pieceAtSquare.color===playerColor){
                            selectedSquare=square;
                            renderBoard();
                        }
                    }
                    else{
                        let move=game.move({from:selectedSquare,to:square,promotion:"q"});
                        if(move){
                            selectedSquare=null;
                            renderBoard();
                            if(game.game_over()){
                                let result=game.in_checkmate()?"Checkmate! "+(game.turn()==='w'?"Black wins":"White wins"):(game.in_stalemate()?"Stalemate!":"Game over");
                                statusDiv.textContent=result;
                                gameActive=false;
                                if(options.onGameEnd) options.onGameEnd(result);
                            }
                            else{
                                statusDiv.textContent="Computer is thinking...";
                                makeAIMove();
                            }
                        }
                        else{
                            selectedSquare=null;
                            renderBoard();
                        }
                    }
                };
                boardDiv.appendChild(squareDiv);
            }
        }
        if(game.game_over()){
            let result=game.in_checkmate()?"Checkmate! "+(game.turn()==='w'?"Black wins":"White wins"):(game.in_stalemate()?"Stalemate!":"Game over");
            statusDiv.textContent=result;
            gameActive=false;
            if(options.onGameEnd) options.onGameEnd(result);
        }
    }
    async function makeAIMove(){
        if(!gameActive || aiThinking) return;
        let turn=game.turn();
        let aiColor=(playerColor==='w'?'b':'w');
        if(turn!==aiColor) return;
        aiThinking=true;
        setTimeout(()=>{
            let bestMove=getBestMove(game, difficulty);
            if(bestMove){
                game.move(bestMove);
                renderBoard();
                if(game.game_over()){
                    let result=game.in_checkmate()?"Checkmate! "+(game.turn()==='w'?"Black wins":"White wins"):(game.in_stalemate()?"Stalemate!":"Game over");
                    statusDiv.textContent=result;
                    gameActive=false;
                    if(options.onGameEnd) options.onGameEnd(result);
                }
                else{
                    statusDiv.textContent="Your turn";
                }
            }
            aiThinking=false;
        }, 100);
    }
    statusDiv.textContent="Your turn (White)";
    renderBoard();
    resignBtn.onclick=()=>{
        if(!gameActive) return;
        gameActive=false;
        let result=(playerColor==='w')?"Black wins by resignation":"White wins by resignation";
        statusDiv.textContent=result;
        if(options.onGameEnd) options.onGameEnd(result);
    };
    container._cleanup=()=>{};
}
export function processCommand(msg,currentUser,socket,clientRealIP,chatPage,userMessage,chatErrorDiv,messagesList,showSystemMessageFn,applyGoldBorderFn,updateDeveloperModeFn){
    if(msg==="/unlock"){
        incrementUnlockCount();
        showSystemMessageFn(`Secret unlock #${unlockCount}. You feel a strange power.`);
        applyGoldBorderFn();
        updateDeveloperModeFn();
        return true;
    }
    if(msg==="/32767"){
        showSystemMessageFn("That's the maximum value of a signed 16-bit integer. You found a boundary.");
        return true;
    }
    if(msg==="/65536"){
        showSystemMessageFn("65536 = 2^16. A perfect square.");
        return true;
    }
    if(msg==="/2147483647"){
        showSystemMessageFn("The maximum 32-bit signed integer. You've reached the limit.");
        return true;
    }
    if(msg==="/root"){
        showSystemMessageFn("You have gained root access... to the chat. Nothing changes, but feel powerful.");
        return true;
    }
    if(msg==="/egg"){
        doRandomEasterEgg(showSystemMessageFn,applyGoldBorderFn,updateDeveloperModeFn,()=>{incrementUnlockCount();showSystemMessageFn(`Secret unlock #${unlockCount}. You feel a strange power.`);applyGoldBorderFn();updateDeveloperModeFn();});
        return true;
    }
    if(msg==="/chess"){
        if(document.getElementById("chessOverlay")){
            showChatError(chatErrorDiv,"Chess game is already open");
            return true;
        }
        let overlay=document.createElement("div");
        overlay.id="chessOverlay";
        overlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1001;";
        let modal=document.createElement("div");
        modal.style.cssText="background:var(--background-card);border:2px solid var(--border-card);border-radius:.5rem;padding:1rem;max-width:500px;width:90%;box-shadow:0 4px 20px var(--box-shadow);";
        let title=document.createElement("h3");
        title.textContent="Play Chess vs Computer";
        title.style.marginTop="0";
        title.style.color="var(--text-primary)";
        let diffDiv=document.createElement("div");
        diffDiv.style.cssText="margin:10px 0;";
        diffDiv.style.color="var(--text-primary)"
        diffDiv.innerHTML="Difficulty: <select id='chessDiff'><option value='easy'>Easy</option><option value='medium' selected>Medium</option><option value='hard'>Hard</option></select>";
        let startBtn=document.createElement("button");
        startBtn.textContent="Start Game";
        startBtn.style.cssText="margin-top:1rem;padding:0.3rem 1rem;background:var(--button-bg);border:1px solid var(--border-card);border-radius:.3rem;cursor:pointer;color:var(--text-primary);";
        let cancelBtn=document.createElement("button");
        cancelBtn.textContent="Cancel";
        cancelBtn.style.cssText="margin-top:1rem;margin-left:0.5rem;padding:0.3rem 1rem;background:var(--button-bg);border:1px solid var(--border-card);border-radius:.3rem;cursor:pointer;color:var(--text-primary);";
        modal.appendChild(title);
        modal.appendChild(diffDiv);
        modal.appendChild(startBtn);
        modal.appendChild(cancelBtn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        startBtn.onclick=async ()=>{
            let difficulty=document.getElementById("chessDiff").value;
            let boardContainer=document.createElement("div");
            boardContainer.id="chessBoard";
            let gameOverlay=document.createElement("div");
            gameOverlay.id="chessOverlay";
            gameOverlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1001;";
            let gameModal=document.createElement("div");
            gameModal.style.cssText="background:var(--background-card);border:2px solid var(--border-card);border-radius:.5rem;padding:1rem;max-width:500px;width:90%;box-shadow:0 4px 20px var(--box-shadow);";
            let gameTitle=document.createElement("h3");
            gameTitle.textContent="Chess vs Computer";
            gameTitle.style.marginTop="0";
            gameTitle.style.color="var(--text-primary)";
            let closeBtn=document.createElement("button");
            closeBtn.textContent="Close";
            closeBtn.style.cssText="margin-top:1rem;padding:0.3rem 1rem;background:var(--button-bg);border:1px solid var(--border-card);border-radius:.3rem;cursor:pointer;color:var(--text-primary);";
            closeBtn.onclick=()=>{
                if(boardContainer._cleanup) boardContainer._cleanup();
                gameOverlay.remove();
            };
            gameModal.appendChild(gameTitle);
            gameModal.appendChild(boardContainer);
            gameModal.appendChild(closeBtn);
            gameOverlay.appendChild(gameModal);
            document.body.appendChild(gameOverlay);
            await createChessGame(boardContainer, {mode:'ai', difficulty});
            overlay.remove();
        };
        cancelBtn.onclick=()=>overlay.remove();
        return true;
    }
    if(msg==="/2048"){
        if(document.getElementById("gameOverlay")){
            showChatError(chatErrorDiv,"Game is already open");
            return true;
        }
        let overlay=document.createElement("div");
        overlay.id="gameOverlay";
        overlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1001;";
        let modal=document.createElement("div");
        modal.style.cssText="background:var(--background-card);border:2px solid var(--border-card);border-radius:.5rem;padding:1rem;max-width:500px;width:90%;box-shadow:0 4px 20px var(--box-shadow);";
        let title=document.createElement("h3");
        title.textContent="2048 Game";
        title.style.marginTop="0";
        title.style.color="var(--text-primary)";
        let gameContainer=document.createElement("div");
        gameContainer.id="gameContainer";
        let closeBtn=document.createElement("button");
        closeBtn.textContent="Close";
        closeBtn.style.cssText="margin-top:1rem;padding:0.3rem 1rem;background:var(--button-bg);border:1px solid var(--border-card);border-radius:.3rem;cursor:pointer;color:var(--text-primary);";
        closeBtn.onclick=()=>{
            if(gameContainer._cleanup) gameContainer._cleanup();
            overlay.remove();
        };
        modal.appendChild(title);
        modal.appendChild(gameContainer);
        modal.appendChild(closeBtn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        create2048Game(gameContainer);
        return true;
    }
    if(msg==="/users"){
        if(socket&&socket.readyState===WebSocket.OPEN){socket.send(JSON.stringify({type:"getUsers"}));}
        return true;
    }
    if(msg==="/ping"){
        if(socket&&socket.readyState===WebSocket.OPEN){
            let now=Date.now();
            socket.send(JSON.stringify({type:"ping", timestamp:now}));
        }
        return true;
    }
    if(msg.startsWith("/clear")){
        let parts=msg.split(" ");
        let n=parts[1]?parseInt(parts[1]):0;
        let total=messagesList.children.length;
        if(n===0){
            while(messagesList.firstChild){messagesList.removeChild(messagesList.firstChild);}
        }
        else if(n>0){
            let removeCount=Math.min(n,total);
            for(let i=0;i<removeCount;i++){
                if(messagesList.lastChild){messagesList.removeChild(messagesList.lastChild);}
            }
        }
        return true;
    }
    if(msg.startsWith("/nick")){
        let newName=msg.substring(5).trim();
        if(!newName){
            showSystemMessageFn("Usage: /nick <newusername>");
            return true;
        }
        if(socket&&socket.readyState===WebSocket.OPEN){
            socket.send(JSON.stringify({type:"nick", oldUsername:currentUser, newUsername:newName}));
        }
        return true;
    }
    if(msg==="/shortcuts"){
        let shortcuts=`
Keyboard Shortcuts:
Ctrl+B - Bold text (**bold**)
Ctrl+I - Italic text (*italic*)
Ctrl+M - Inline code (\`code\`)
Shift+Enter - Send message
@username - Mention a user (gets highlighted)
/help - Show this help
/msg "username" message - Send private message
/users - List online users
/nick <newname> - Change your username
/clear - Clear all messages from your view
/clear <N> - Clear last N messages
/ping - Measure connection latency
/2048 - Play 2048 game
/chess - Play Chess vs Computer (choose difficulty)
        `;
        showSystemMessageFn(shortcuts);
        return true;
    }
    if(msg==="/help"){
        let help="Available commands:\n/users - list online users\n/msg \"username\" message - private message\n/2048 - play 2048 game\n/chess - play Chess vs Computer (difficulty selection)\n/nick <newname> - change your username\n/clear [N] - clear all or last N messages\n/ping - measure latency\n/shortcuts - show keyboard shortcuts\n/help - this help\n\nKeyboard: Ctrl+B bold, Ctrl+I italic, Ctrl+M code\n\nDrag & drop image (≤1MB, WebP)\n\nMentions: @username or @\"name with spaces\" (highlighted, not inside code blocks)\n\nRight-click any message to reply or forward.\n\n{ } button inserts code block (supports many languages).";
        showSystemMessageFn(help);
        return true;
    }
    return false;
}