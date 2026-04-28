import {hljs, escapeHtml, formatMarkdown, highlightMentions} from "./highlight-config.js";
import {createModal, showChatError, shakeElement, getCurrentTime, scrollToBottom, checkScrollPosition, updateTypingIndicatorUI, wrapSelection, convertToWebP, insertReplyQuote, insertForwardToPrivate, exportChatLog, applyTheme, getSystemTheme, setHighlightTheme} from "./ui-helpers.js";
import {connectWebSocket} from "./websocket.js";
import {create2048Game, createChessGame, processCommand, updateDeveloperMode, applyGoldBorder, showSystemMessage, doRandomEasterEgg, getUnlockCount, incrementUnlockCount} from "./games.js";
import {initFileHandlers,handleFileMessage,sendMultipleFiles} from "./file-handler.js";
document.addEventListener("DOMContentLoaded",()=>{
    let headerControls=document.getElementById("headerControls");
    if(headerControls&&!document.getElementById("exportFormat")){
        let select=document.createElement("select");
        select.id="exportFormat";
        let opt1=document.createElement("option");opt1.value="text";opt1.textContent="TXT";
        let opt2=document.createElement("option");opt2.value="json";opt2.textContent="JSON";
        let opt3=document.createElement("option");opt3.value="html";opt3.textContent="HTML";
        select.appendChild(opt1);select.appendChild(opt2);select.appendChild(opt3);
        headerControls.insertBefore(select,document.getElementById("exportChat"));
    }
    if(!document.getElementById("contextMenu")){
        let menu=document.createElement("div");menu.id="contextMenu";
        menu.style.cssText="position:fixed;background-color:var(--background-card);border:1px solid var(--border-card);border-radius:.3rem;padding:.3rem;z-index:1000;display:none;box-shadow:0 2px 6px var(--box-shadow);color:var(--text-primary);";
        let replyOpt=document.createElement("div");replyOpt.id="replyOption";replyOpt.textContent="Reply";replyOpt.style.cssText="padding:.2rem .5rem;cursor:pointer;white-space:nowrap;color:var(--text-primary);";
        let forwardOpt=document.createElement("div");forwardOpt.id="forwardOption";forwardOpt.textContent="Forward to private";forwardOpt.style.cssText="padding:.2rem .5rem;cursor:pointer;white-space:nowrap;color:var(--text-primary);";
        menu.appendChild(replyOpt);menu.appendChild(forwardOpt);document.body.appendChild(menu);
    }
    let loginPage=document.getElementById("login");
    let chatPage=document.getElementById("chatUI");
    let usernameInput=document.getElementById("username");
    let userIP=document.getElementById("userIp");
    let messagesList=document.getElementById("messages");
    let userMessage=document.getElementById("userMessage");
    let defaultPort=8191;
    let socket=null;
    let currentUser="";
    let clientRealIP="Unknown";
    let autoScroll=true;
    let scrollBtn=document.getElementById("scrollToBottomBtn");
    let joinFailed=false;
    let chatErrorDiv=document.getElementById("chatError");
    let typingTimeout=null;
    let currentTypers=new Set();
    let typingIndicatorDiv=document.getElementById("typingIndicator");
    let reconnectAttempts=0;
    let reconnectTimer=null;
    let intentionalClose=false;
    let timeSpan=document.createElement("span");
    timeSpan.id="currentTime";
    timeSpan.style.marginLeft="1rem";
    timeSpan.style.fontSize=".8rem";
    let onlineSpan=document.getElementById("onlineCount");
    if(onlineSpan&&onlineSpan.parentNode){
        onlineSpan.parentNode.appendChild(timeSpan);
    }
    let onlineUsersList=[];
    function updateOnlineUsersList(usersStr){
        let parts=usersStr.split(": ");
        if(parts.length>1){
            let list=parts[1].split(", ");
            onlineUsersList=list.filter(u=>u.length>0);
        }
    }
    function getCaretCoordinates(element, position){
        let div=document.createElement("div");
        let cs=getComputedStyle(element);
        div.style.cssText="position:absolute;top:0;left:0;visibility:hidden;white-space:pre-wrap;font:"+cs.font+";font-size:"+cs.fontSize+";font-family:"+cs.fontFamily+";";
        div.textContent=element.value.substring(0,position);
        document.body.appendChild(div);
        let coords={left:div.offsetWidth, top:div.offsetHeight};
        div.remove();
        return coords;
    }
    function showMentionAutocomplete(query){
        let existing=document.getElementById("autocompleteDropdown");
        if(existing) existing.remove();
        let filtered=onlineUsersList.filter(u=>u.toLowerCase().startsWith(query.toLowerCase()));
        if(!filtered.length) return;
        let dropdown=document.createElement("div");
        dropdown.id="autocompleteDropdown";
        dropdown.style.cssText="position:absolute;background:var(--background-card);border:1px solid var(--border-card);border-radius:.3rem;z-index:1000;max-height:150px;overflow-y:auto;";
        let caretPos=userMessage.selectionStart;
        let textBefore=userMessage.value.substring(0,caretPos);
        let lastAtIndex=textBefore.lastIndexOf("@");
        let rect=userMessage.getBoundingClientRect();
        let cursorCoords=getCaretCoordinates(userMessage,caretPos);
        dropdown.style.left=rect.left+cursorCoords.left+"px";
        dropdown.style.top=rect.top+cursorCoords.top+20+"px";
        filtered.forEach(item=>{
            let div=document.createElement("div");
            div.textContent=item;
            div.style.cssText="padding:.3rem .6rem;cursor:pointer;color:var(--text-primary);";
            div.onclick=()=>{
                let before=userMessage.value.substring(0,lastAtIndex+1);
                let after=userMessage.value.substring(caretPos);
                let newValue=before+item+after;
                userMessage.value=newValue;
                let newCaret=before.length+item.length;
                userMessage.selectionStart=newCaret;
                userMessage.selectionEnd=newCaret;
                dropdown.remove();
                userMessage.focus();
            };
            dropdown.appendChild(div);
        });
        document.body.appendChild(dropdown);
        function closeOnClickOutside(e){
            if(!dropdown.contains(e.target)&&e.target!==userMessage){
                dropdown.remove();
                document.removeEventListener("click",closeOnClickOutside);
            }
        }
        setTimeout(()=>document.addEventListener("click",closeOnClickOutside),0);
    }
    function showMsgAutocomplete(query){
        let existing=document.getElementById("autocompleteDropdown");
        if(existing) existing.remove();
        let filtered=onlineUsersList.filter(u=>u.toLowerCase().startsWith(query.toLowerCase()));
        if(!filtered.length) return;
        let dropdown=document.createElement("div");
        dropdown.id="autocompleteDropdown";
        dropdown.style.cssText="position:absolute;background:var(--background-card);border:1px solid var(--border-card);border-radius:.3rem;z-index:1000;max-height:150px;overflow-y:auto;";
        let caretPos=userMessage.selectionStart;
        let textBefore=userMessage.value.substring(0,caretPos);
        let match=textBefore.match(/\/msg\s+"([^"]*)$/);
        let lastQuotePos=match?textBefore.lastIndexOf('"'):-1;
        let rect=userMessage.getBoundingClientRect();
        let cursorCoords=getCaretCoordinates(userMessage,caretPos);
        dropdown.style.left=rect.left+cursorCoords.left+"px";
        dropdown.style.top=rect.top+cursorCoords.top+20+"px";
        filtered.forEach(item=>{
            let div=document.createElement("div");
            div.textContent=item;
            div.style.cssText="padding:.3rem .6rem;cursor:pointer;color:var(--text-primary);";
            div.onclick=()=>{
                let beforeQuote=userMessage.value.substring(0,lastQuotePos+1);
                let after=userMessage.value.substring(caretPos);
                let newValue=beforeQuote+item+'" '+after;
                userMessage.value=newValue;
                let newCaret=beforeQuote.length+item.length+2;
                userMessage.selectionStart=newCaret;
                userMessage.selectionEnd=newCaret;
                dropdown.remove();
                userMessage.focus();
            };
            dropdown.appendChild(div);
        });
        document.body.appendChild(dropdown);
        function closeOnClickOutside(e){
            if(!dropdown.contains(e.target)&&e.target!==userMessage){
                dropdown.remove();
                document.removeEventListener("click",closeOnClickOutside);
            }
        }
        setTimeout(()=>document.addEventListener("click",closeOnClickOutside),0);
    }
    userMessage.addEventListener("input",function(e){
        let caretPos=userMessage.selectionStart;
        let text=userMessage.value;
        let existing=document.getElementById("autocompleteDropdown");
        let lastAt=text.lastIndexOf("@",caretPos-1);
        let lastSlash=text.lastIndexOf("/",caretPos-1);
        if(lastAt!==-1 && (lastSlash===-1 || lastAt>lastSlash)){
            let afterAt=text.substring(lastAt+1,caretPos);
            if(afterAt.length<=20 && !afterAt.includes(" ")){
                showMentionAutocomplete(afterAt);
                return;
            }
            else if(existing) existing.remove();
        }
        let textBefore=text.substring(0,caretPos);
        let msgMatch=textBefore.match(/\/msg\s+"([^"]*)$/);
        if(msgMatch){
            let query=msgMatch[1];
            showMsgAutocomplete(query);
            return;
        }
        if(existing) existing.remove();
    });
    function updateClock(){
        let now=new Date();
        let str=now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
        if(timeSpan){timeSpan.textContent=str;}
    }
    updateClock();
    setInterval(updateClock,1000);
    function updateTypingIndicator(){
        updateTypingIndicatorUI(currentTypers,typingIndicatorDiv);
    }
    async function fetchAndDisplayIP(){
        try{
            let response=await fetch("/get-client-ip");
            let data=await response.json();
            if(data.ip&&data.ip!="::1"&&data.ip!="127.0.0.1"){
                clientRealIP=data.ip;
                userIP.value=`Your local IP is: ${clientRealIP}`;
            }
            else{
                userIP.value="Unable to detect IP (invalid response)";
            }
        }
        catch(err){
            userIP.value="IP detection failed";
        }
    }
    fetchAndDisplayIP();
    async function isNameClean(name){
        try{
            let response=await fetch("/check-name",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({name})
            });
            let data=await response.json();
            return data.clean===true;
        }
        catch(e){
            console.error("Name check failed",e);
            return true;
        }
    }
    async function generateRandomUsername(){
        let charSet="abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let randomName="";
        while(randomName.length<5){
            let idx=Math.floor(Math.random()*charSet.length);
            let ch=charSet[idx];
            if(!randomName.includes(ch)){randomName+=ch;}
        }
        let clean=await isNameClean(randomName);
        if(clean){return randomName;}
        else{return generateRandomUsername();}
    }
    function parsePrivateMessage(msg){
        let quoted=/^\/msg\s+"([^"]+)"\s+(.+)$/s;
        let match=msg.match(quoted);
        if(match){return{target:match[1],content:match[2]};}
        let simple=/^\/msg\s+(\S+)\s+(.+)$/s;
        match=msg.match(simple);
        if(match){return{target:match[1],content:match[2]};}
        return null;
    }
    function sendTypingStop(){
        if(socket&&socket.readyState===WebSocket.OPEN){
            socket.send(JSON.stringify({type:"typing",username:currentUser,typing:false}));
        }
    }
    function sendTypingStart(){
        if(socket&&socket.readyState===WebSocket.OPEN){
            socket.send(JSON.stringify({type:"typing",username:currentUser,typing:true}));
        }
    }
    function sendMessageContent(message,isImage=false,imageData=null){
        if(!socket||socket.readyState!==WebSocket.OPEN){
            showChatError(chatErrorDiv,"Connection lost.");
            return false;
        }
        if(isImage){
            socket.send(JSON.stringify({type:"image",username:currentUser,image:imageData,ip:clientRealIP,timestamp:getCurrentTime()}));
        }
        else{
            let priv=parsePrivateMessage(message);
            if(priv){
                socket.send(JSON.stringify({type:"private",username:currentUser,target:priv.target,message:priv.content,ip:clientRealIP,timestamp:getCurrentTime()}));
            }
            else{
                socket.send(JSON.stringify({username:currentUser,message:message,ip:clientRealIP}));
            }
        }
        return true;
    }
    function handleSystemMessage(message){
        if(message&&message.includes("Your IP is")){
            let ip=message.split("Your IP is ")[1];
            if(clientRealIP==="Unknown"){
                clientRealIP=ip;
                userIP.value=`Your local IP is: ${clientRealIP}`;
            }
            return true;
        }
        if(message&&message.includes("already taken")){
            joinFailed=true;
            document.getElementById("login-error").textContent=message;
            shakeElement(usernameInput);
            intentionalClose=true;
            socket.close();
            return true;
        }
        if(message&&message.includes("Current users: ")){
            updateOnlineUsersList(message);
        }
        if(message&&message.includes("Online users: ")){
            updateOnlineUsersList(message);
        }
        if(message&&message.includes("changed their name to ")){
            if(socket&&socket.readyState===WebSocket.OPEN){
                socket.send(JSON.stringify({type:"getUsers"}));
            }
        }
        return false;
    }
    function addMessageToUI(data){
        if(data.type==="onlineCount"){
            let span=document.getElementById("onlineCount");
            if(span){span.textContent=`(${data.count} online)`;}
            return;
        }
        if(data.type==="typing"){
            if(data.typing){currentTypers.add(data.username);}
            else{currentTypers.delete(data.username);}
            updateTypingIndicator();
            return;
        }
        if(data.type==="file"){
            handleFileMessage(data,currentUser,clientRealIP,getCurrentTime,escapeHtml,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,showChatError,chatErrorDiv);
            return;
        }
        if(data.type==="system"){
            if(handleSystemMessage(data.message)) return;
            let li=document.createElement("li");
            li.innerHTML=`<em>${escapeHtml(data.message)}</em>`;
            li.style.cssText="white-space:pre-wrap;color:gray;font-style:italic;";
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            return;
        }
        if(data.type==="private"){
            let time=data.timestamp||getCurrentTime();
            let formatted=formatMarkdown(data.message);
            let ip=data.ip||"Unknown";
            let html=data.self?`[Private to ${escapeHtml(data.target)}] You [${ip}] (${time}): ${formatted}`:`[Private] ${escapeHtml(data.from)} [${ip}] (${time}): ${formatted}`;
            let li=document.createElement("li");
            li.innerHTML=html;
            li.style.whiteSpace="pre-wrap";
            if(data.self){li.classList.add("userMessage");}
            else{li.classList.add("otherMessage");}
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            return;
        }
        if(data.type==="image"){
            let time=getCurrentTime();
            let ip=data.ip||clientRealIP||"Unknown";
            let imgHtml=`<img src="${escapeHtml(data.image)}" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:4px;cursor:pointer;" onclick="window.open(this.src,'_blank')">`;
            let rawHtml=`${escapeHtml(data.username)} [${ip}] (${time}):<br> ${imgHtml}`;
            let li=document.createElement("li");
            li.innerHTML=rawHtml;
            if(data.username===currentUser){li.classList.add("userMessage");}
            else{li.classList.add("otherMessage");}
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            return;
        }
        if(data.type==="voice"){
            let time=getCurrentTime();
            let ip=data.ip||clientRealIP||"Unknown";
            let audioHtml=`<audio controls src="${escapeHtml(data.voice)}" style="max-width:100%;"></audio>`;
            let rawHtml=`${escapeHtml(data.username)} [${ip}] (${time}):<br> ${audioHtml}`;
            let li=document.createElement("li");
            li.innerHTML=rawHtml;
            if(data.username===currentUser){li.classList.add("userMessage");}
            else{li.classList.add("otherMessage");}
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            return;
        }
        if(data.type==="pong"){
            let latency=Date.now()-data.timestamp;
            let li=document.createElement("li");
            li.innerHTML=`<em>Pong! Latency: ${latency} ms</em>`;
            li.style.cssText="white-space:pre-wrap;color:gray;font-style:italic;";
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            return;
        }
        if(data.type==="nickAccepted"){
            currentUser=data.newUsername;
            showChatError(chatErrorDiv,`Username changed to ${currentUser}`);
            return;
        }
        let time=getCurrentTime();
        let formatted=formatMarkdown(data.message||"");
        let ip=data.ip||clientRealIP||"Unknown";
        let baseHtml=`${escapeHtml(data.username)} [${ip}] (${time}): ${formatted}`;
        let finalHtml=highlightMentions(baseHtml,currentUser);
        let li=document.createElement("li");
        li.innerHTML=finalHtml;
        li.style.whiteSpace="pre-wrap";
        if(data.username===currentUser){li.classList.add("userMessage");}
        else{li.classList.add("otherMessage");}
        let replySpan=document.createElement("span");
        replySpan.className="reply-btn";
        replySpan.title="Reply";
        replySpan.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5C21 16.1944 17.1944 20 12.5 20C10.9 20 9.4 19.6 8.1 18.9L3 20L5.3 15.3C4.5 13.9 4.2 12.4 4.2 10.9C4.2 6.4 8 2.5 12.5 2.5C17 2.5 21 6.2 21 11.5Z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12.5 8.5V12.5M12.5 14.5V14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
        replySpan.onclick=(e)=>{
            e.stopPropagation();
            insertReplyQuote(userMessage,data.username,data.message);
        };
        li.appendChild(replySpan);
        li.setAttribute("data-sender",data.username);
        li.setAttribute("data-rawmessage",data.message);
        li.addEventListener("contextmenu",(e)=>{
            e.preventDefault();
            let menu=document.getElementById("contextMenu");
            if(!menu){return;}
            menu.style.left=e.pageX+"px";
            menu.style.top=e.pageY+"px";
            menu.style.display="block";
            window.currentReplySender=data.username;
            window.currentReplyRawText=data.message;
        });
        messagesList.appendChild(li);
        scrollToBottom(messagesList);
        checkScrollPosition(messagesList,scrollBtn,autoScroll);
    }
    function onWebSocketMessage(data){
        addMessageToUI(data);
    }
    function connect(){
        if(reconnectTimer){clearTimeout(reconnectTimer);}
        let handlers={
            onMessage: onWebSocketMessage,
            onOpen: ()=>{
                console.log("WebSocket connected");
                reconnectAttempts=0;
                socket.send(JSON.stringify({type:"join",username:currentUser}));
                setTimeout(()=>{
                    if(socket&&socket.readyState===WebSocket.OPEN){
                        socket.send(JSON.stringify({type:"getUsers"}));
                    }
                },500);
            },
            onClose: ()=>{
                console.log("WebSocket closed");
                if(!intentionalClose&&currentUser&&chatPage.style.display==="block"){
                    showChatError(chatErrorDiv,"Connection lost. Reconnecting...");
                    clearTimeout(reconnectTimer);
                    reconnectTimer=setTimeout(()=>{
                        reconnectAttempts++;
                        let delay=Math.min(3000,1000*Math.pow(1.5,reconnectAttempts));
                        setTimeout(connect,delay);
                    },3000);
                }
            },
            onError: (e)=>console.error(e)
        };
        let ws=connectWebSocket(defaultPort,handlers);
        socket=ws;
    }
    async function loggingIn(){
        let username=usernameInput.value.trim();
        if(!username){
            document.getElementById("login-error").textContent="Please enter your username";
            shakeElement(usernameInput);
            return;
        }
        currentUser=username;
        if(clientRealIP==="Unknown"){await fetchAndDisplayIP();}
        loginPage.style.display="none";
        chatPage.style.display="block";
        intentionalClose=false;
        connect();
        checkScrollPosition(messagesList,scrollBtn,autoScroll);
    }
    usernameInput.addEventListener("keyup",(event)=>{
        if(event.key==="Enter"){loggingIn();}
    });
    document.getElementById("joinChat").addEventListener("click",loggingIn);
    document.getElementById("genUsername").addEventListener("click",async()=>{
        usernameInput.value=await generateRandomUsername();
    });
    let exportBtnElem=document.getElementById("exportChat");
    if(exportBtnElem){exportBtnElem.addEventListener("click",()=>exportChatLog(messagesList,chatErrorDiv));}
    let clearBtnElem=document.getElementById("clearChat");
    if(clearBtnElem){
        clearBtnElem.addEventListener("click",()=>{
            while(messagesList.firstChild){messagesList.removeChild(messagesList.firstChild);}
        });
    }
    let emojiBtnElem=document.getElementById("emojiBtn");
    let emojiPickerElem=document.getElementById("emojiPicker");
    if(emojiBtnElem&&emojiPickerElem){
        emojiBtnElem.addEventListener("click",()=>{
            if(emojiPickerElem.style.display==="none"){emojiPickerElem.style.display="grid";}
            else{emojiPickerElem.style.display="none";}
        });
        emojiPickerElem.querySelectorAll("span").forEach(span=>{
            span.addEventListener("click",()=>{
                userMessage.value+=span.textContent;
                emojiPickerElem.style.display="none";
                userMessage.focus();
            });
        });
        document.addEventListener("click",(e)=>{
            if(!emojiBtnElem.contains(e.target)&&!emojiPickerElem.contains(e.target)){
                emojiPickerElem.style.display="none";
            }
        });
    }
    let codeBlockBtn=document.getElementById("codeBlockBtn");
    if(codeBlockBtn){
        codeBlockBtn.addEventListener("click",()=>{
            createModal("Enter language (e.g., javascript, python, cpp, fortran, cobol):", "", (lang)=>{
                let codeBlock=`\`\`\`${lang||""}\n\n\`\`\``;
                let cursorPos=userMessage.selectionStart;
                let val=userMessage.value;
                let newVal=val.slice(0,cursorPos)+codeBlock+val.slice(cursorPos);
                userMessage.value=newVal;
                let newCursorPos=cursorPos+(lang?lang.length+4:3);
                userMessage.selectionStart=newCursorPos;
                userMessage.selectionEnd=newCursorPos;
                userMessage.focus();
            });
        });
    }
    userMessage.addEventListener("keydown",(e)=>{
        if(e.ctrlKey&&e.key==="b"){
            e.preventDefault();
            wrapSelection(userMessage,"**","**");
        }
        else if(e.ctrlKey&&e.key==="i"){
            e.preventDefault();
            wrapSelection(userMessage,"*","*");
        }
        else if(e.ctrlKey&&e.key==="m"){
            e.preventDefault();
            wrapSelection(userMessage,"`","`");
        }
    });
    function sendMessage(){
        let msg=userMessage.value.trim();
        if(!msg){return;}
        let handled=processCommand(msg,currentUser,socket,clientRealIP,chatPage,userMessage,chatErrorDiv,messagesList,showSystemMessageWithSocket,applyGoldBorderWrapper,updateDeveloperModeWrapper);
        if(handled){
            userMessage.value="";
            return;
        }
        if(sendMessageContent(msg)){userMessage.value="";}
    }
    function showSystemMessageWithSocket(msg){
        let fakeEvent={data:JSON.stringify({type:"system",message:msg})};
        onWebSocketMessage(JSON.parse(fakeEvent.data));
    }
    function applyGoldBorderWrapper(){
        applyGoldBorder(chatPage);
    }
    function updateDeveloperModeWrapper(){
        let devMode=updateDeveloperMode(chatPage,socket,showSystemMessageWithSocket);
        if(devMode){
            let devBadge=document.getElementById("devBadge");
            if(!devBadge){
                devBadge=document.createElement("div");
                devBadge.id="devBadge";
                devBadge.textContent="DEV MODE ACTIVE";
                devBadge.style.cssText="position:fixed;bottom:10px;left:10px;background:#000;color:#0f0;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:10px;z-index:9999;opacity:0.7;";
                document.body.appendChild(devBadge);
            }
        }
    }
    userMessage.addEventListener("keypress",(e)=>{
        if(e.key==="Enter"&&e.shiftKey){
            e.preventDefault();
            sendMessage();
        }
    });
    userMessage.addEventListener("input",()=>{
        if(typingTimeout){clearTimeout(typingTimeout);}
        sendTypingStart();
        typingTimeout=setTimeout(()=>{sendTypingStop();},1000);
    });
    userMessage.addEventListener("blur",()=>{
        if(typingTimeout){clearTimeout(typingTimeout);}
        sendTypingStop();
    });
    document.getElementById("sendMessage").onclick=sendMessage;
    userMessage.addEventListener("dragover",(e)=>e.preventDefault());
    userMessage.addEventListener("drop",async(e)=>{
        e.preventDefault();
        let file=e.dataTransfer.files[0];
        if(!file){return;}
        if(!file.type.startsWith("image/")){
            showChatError(chatErrorDiv,"Only images.");
            return;
        }
        if(file.size>1024*1024){
            showChatError(chatErrorDiv,"Max 1MB.");
            return;
        }
        try{
            let webp=await convertToWebP(file);
            sendMessageContent(null,true,webp);
        }
        catch(err){
            showChatError(chatErrorDiv,"Image conversion failed");
        }
    });
    let voiceBtnElem=document.getElementById("voiceBtn");
    if(voiceBtnElem){
        voiceBtnElem.addEventListener("click",()=>{
            showChatError(chatErrorDiv,"Voice recording requires HTTPS. Use localhost or enable microphone flag.");
        });
    }
    window.addEventListener("beforeunload",(e)=>{
        if(chatPage.style.display==="block"){
            intentionalClose=true;
            e.preventDefault();
            e.returnValue="Leave chat?";
        }
    });
    let contextMenuElem=document.getElementById("contextMenu");
    if(contextMenuElem){
        document.addEventListener("click",()=>{contextMenuElem.style.display="none";});
        let replyOptElem=document.getElementById("replyOption");
        let forwardOptElem=document.getElementById("forwardOption");
        if(replyOptElem){
            replyOptElem.addEventListener("click",()=>{
                if(window.currentReplySender&&window.currentReplyRawText){
                    insertReplyQuote(userMessage,window.currentReplySender,window.currentReplyRawText);
                }
                contextMenuElem.style.display="none";
            });
        }
        if(forwardOptElem){
            forwardOptElem.addEventListener("click",()=>{
                if(window.currentReplySender&&window.currentReplyRawText){
                    insertForwardToPrivate(userMessage,window.currentReplySender,window.currentReplyRawText);
                }
                contextMenuElem.style.display="none";
            });
        }
    }
    let savedTheme=localStorage.getItem("chatTheme");
    if(!savedTheme){savedTheme=getSystemTheme();}
    applyTheme(savedTheme);
    let themeToggleElem=document.getElementById("themeToggle");
    if(themeToggleElem){
        themeToggleElem.addEventListener("click",()=>{
            let cur=document.body.getAttribute("data-theme");
            let neu=cur==="dark"?"light":"dark";
            applyTheme(neu);
            localStorage.setItem("chatTheme",neu);
        });
    }
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",(e)=>{
        if(!localStorage.getItem("chatTheme")){
            applyTheme(e.matches?"dark":"light");
        }
    });
    messagesList.addEventListener("scroll",()=>checkScrollPosition(messagesList,scrollBtn,autoScroll));
    if(scrollBtn){
        scrollBtn.addEventListener("click",()=>{
            scrollToBottom(messagesList);
            autoScroll=true;
            scrollBtn.style.display="none";
        });
    }
    initFileHandlers(socket,currentUser,clientRealIP,getCurrentTime,showChatError,chatErrorDiv,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml);
});