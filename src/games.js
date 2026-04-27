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
export async function createChessGame(container){
    try{
        const chessModule=await import("chess.js");
        const Chess=chessModule.Chess||chessModule.default;
        if(!Chess) throw new Error("Chess module not loaded");
        let game=new Chess();
        let boardDiv=document.createElement("div");
        boardDiv.style.cssText="display:grid;grid-template-columns:repeat(8,1fr);width:min(400px,70vw);height:min(400px,70vw);margin:0 auto;";
        let statusDiv=document.createElement("div");
        statusDiv.style.cssText="margin-top:10px;text-align:center;color:var(--text-primary);font-size:0.9rem;";
        statusDiv.textContent="Your turn (White)";
        let selectedSquare=null;
        let aiThinking=false;
        function getRandomMove(){
            let moves=game.moves({verbose:true});
            if(moves.length===0) return null;
            let randomIndex=Math.floor(Math.random()*moves.length);
            return moves[randomIndex];
        }
        function makeAIMove(){
            if(aiThinking) return;
            if(game.game_over()){
                statusDiv.textContent=game.in_checkmate()?"Checkmate! "+(game.turn()==="w"?"Black wins":"White wins"):"Game over!";
                return;
            }
            if(game.turn()==="b"){
                aiThinking=true;
                setTimeout(()=>{
                    let move=getRandomMove();
                    if(move){
                        game.move(move);
                        renderBoard();
                        statusDiv.textContent=game.game_over()?"Game over! "+(game.in_checkmate()?"Checkmate! ":"")+(game.turn()==="w"?"Black wins":"White wins"):"Your turn (White)";
                    }
                    aiThinking=false;
                },100);
            }
        }
        function renderBoard(){
            let board=game.board();
            boardDiv.innerHTML="";
            for(let i=0;i<8;i++){
                for(let j=0;j<8;j++){
                    let square=String.fromCharCode(97+j)+(8-i);
                    let piece=board[i][j];
                    let squareDiv=document.createElement("div");
                    squareDiv.style.cssText=`width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:min(2rem,6vw);cursor:pointer;background-color:${(i+j)%2==0?"#f0d9b5":"#b58863"};${selectedSquare===square?"border:2px solid red;box-sizing:border-box;":""}`;
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
                        if(aiThinking) return;
                        if(game.game_over()){
                            statusDiv.textContent="Game over. Close and reopen to play new game.";
                            return;
                        }
                        if(game.turn()!=="w"){
                            statusDiv.textContent="Computer is thinking...";
                            return;
                        }
                        if(selectedSquare===null){
                            let pieceAtSquare=game.get(square);
                            if(pieceAtSquare&&pieceAtSquare.color==="w"){
                                selectedSquare=square;
                                renderBoard();
                            }
                        }else{
                            let move=game.move({from:selectedSquare,to:square,promotion:"q"});
                            if(move){
                                selectedSquare=null;
                                renderBoard();
                                if(game.game_over()){
                                    statusDiv.textContent=game.in_checkmate()?"Checkmate! You win!":(game.in_stalemate()?"Stalemate!":"Game over!");
                                }else{
                                    statusDiv.textContent="Computer is thinking...";
                                    makeAIMove();
                                }
                            }else{
                                selectedSquare=null;
                                renderBoard();
                            }
                        }
                    };
                    boardDiv.appendChild(squareDiv);
                }
            }
            if(!game.game_over() && game.turn()==="b" && !aiThinking){
                makeAIMove();
            }
        }
        renderBoard();
        container.appendChild(boardDiv);
        container.appendChild(statusDiv);
    }catch(err){
        console.error(err);
        container.innerHTML="<p style=\"color:red\">Chess game failed to load. Please install chess.js@0.10.3</p>";
    }
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
        title.textContent="Chess Game (Human vs Computer)";
        title.style.marginTop="0";
        title.style.color="var(--text-primary)";
        let boardContainer=document.createElement("div");
        boardContainer.id="chessBoard";
        let closeBtn=document.createElement("button");
        closeBtn.textContent="Close";
        closeBtn.style.cssText="margin-top:1rem;padding:0.3rem 1rem;background:var(--button-bg);border:1px solid var(--border-card);border-radius:.3rem;cursor:pointer;color:var(--text-primary);";
        closeBtn.onclick=()=>{
            if(boardContainer._cleanup) boardContainer._cleanup();
            overlay.remove();
        };
        modal.appendChild(title);
        modal.appendChild(boardContainer);
        modal.appendChild(closeBtn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        createChessGame(boardContainer);
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
    if(msg==="/help"){
        let help="Available commands:\n/users - list online users\n/msg \"username\" message - private message\n/2048 - play 2048 game\n/chess - play Chess vs Computer\n/help - this help\n\nKeyboard: Ctrl+B bold, Ctrl+I italic, Ctrl+M code\n\nDrag & drop image (≤1MB, WebP)\n\nMentions: @username or @\"name with spaces\" (highlighted, not inside code blocks)\n\nRight-click any message to reply or forward.\n\n{ } button inserts code block (supports many languages).";
        showSystemMessageFn(help);
        return true;
    }
    return false;
}