import {hljs, escapeHtml, formatMarkdown, highlightMentions} from "./highlight-config.js";
import {createModal, showChatError, shakeElement, getCurrentTime, scrollToBottom, checkScrollPosition, updateTypingIndicatorUI, wrapSelection, convertToWebP, insertReplyQuote, insertForwardToPrivate, exportChatLog, applyTheme, getSystemTheme, setHighlightTheme} from "./ui-helpers.js";
import {connectWebSocket} from "./websocket.js";
import {create2048Game, createChessGame, processCommand, updateDeveloperMode, applyGoldBorder, showSystemMessage, doRandomEasterEgg, getUnlockCount, incrementUnlockCount} from "./games.js";
import {initFileHandlers, handleFileStart, handleBinaryChunk, handleFileEnd, handleFileCancel, sendFileChunked, createFileMessageHTML} from "./file-handler.js";
import QRCode from "qrcode";
import {generateIdenticon} from "./identicon.js";
import "./font-preload.css";
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
        let ignoreOpt=document.createElement("div");ignoreOpt.id="ignoreOption";ignoreOpt.textContent="Ignore user";ignoreOpt.style.cssText="padding:.2rem .5rem;cursor:pointer;white-space:nowrap;color:var(--text-primary);";
        let copyOpt=document.createElement("div");copyOpt.id="copyOption";copyOpt.textContent="Copy message";copyOpt.style.cssText="padding:.2rem .5rem;cursor:pointer;white-space:nowrap;color:var(--text-primary);";
        let pinOpt=document.createElement("div");pinOpt.id="pinOption";pinOpt.textContent="Pin message";pinOpt.style.cssText="padding:.2rem .5rem;cursor:pointer;white-space:nowrap;color:var(--text-primary);";
        menu.appendChild(replyOpt);menu.appendChild(forwardOpt);menu.appendChild(ignoreOpt);menu.appendChild(copyOpt);menu.appendChild(pinOpt);document.body.appendChild(menu);
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
    let currentRoom="General";
    let roomSelector=null;
    let sendQueue=[];
    let inputHistory=[];
    let historyIndex=-1;
    let sentCount=0;
    let receivedCount=0;
    let connectedAt=0;
    let draftTimer=null;
    let savedDraft=localStorage.getItem("chatDraft");
    if(savedDraft){
        userMessage.value=savedDraft;
    }
    const EMOJI_MAP={
        smile:"😀",grin:"😁",laugh:"😂",joy:"😂",wink:"😉",blush:"😊",cool:"😎",thinking:"🤔",sad:"😢",cry:"😭",angry:"😠",heart:"❤️",love:"😍",thumbsup:"👍",ok:"👌",clap:"👏",fire:"🔥",star:"⭐",eyes:"👀",party:"🎉",shrug:"🤷",pray:"🙏",wave:"👋",rocket:"🚀",bug:"🐛",coffee:"☕",pizza:"🍕",check:"✅",x:"❌",warning:"⚠️"
    };
    function applyEmojiShortcuts(text){
        return text.replace(/:([a-z0-9_]+):/g,function(match,name){
            let snippets=prefs.snippets||{};
            if(snippets[name]!==undefined)return snippets[name];
            return EMOJI_MAP[name]||match;
        });
    }
    function updateSessionStats(){
        let el=document.getElementById("sessionStats");
        if(!el)return;
        let up="not connected";
        if(connectedAt){
            let sec=Math.floor((Date.now()-connectedAt)/1000);
            up=Math.floor(sec/3600)+"h "+Math.floor((sec%3600)/60)+"m "+sec%60+"s";
        }
        el.textContent="Sent: "+sentCount+" | Received: "+receivedCount+" | Connected: "+up;
    }
    let prefs=loadPrefs();
    let chatSearchEl=document.getElementById("chatSearch");
    function loadPrefs(){
        try{
            let saved=JSON.parse(localStorage.getItem("chatPrefs")||"{}");
            return Object.assign({sound:true,dndUntil:0,density:"comfortable",focusMode:false,reduceMotion:false,wrapCode:false,textSize:"normal",accent:"",lang:"en",e2e:false,e2ePass:"",ignoredUsers:[],blockedWords:[],snippets:{}},saved);
        }
        catch(e){
            return{sound:true,dndUntil:0,density:"comfortable",focusMode:false,reduceMotion:false,wrapCode:false,textSize:"normal",accent:"",lang:"en",e2e:false,e2ePass:"",ignoredUsers:[],blockedWords:[],snippets:{}};
        }
    }
    function savePrefs(){
        localStorage.setItem("chatPrefs",JSON.stringify(prefs));
    }
    function applyPrefs(){
        document.body.classList.toggle("density-compact",prefs.density==="compact");
        document.body.classList.toggle("reduce-motion",prefs.reduceMotion);
        document.body.classList.toggle("wrap-code",prefs.wrapCode);
        if(prefs.textSize==="small"){
            document.documentElement.style.fontSize="14px";
        }
        else if(prefs.textSize==="large"){
            document.documentElement.style.fontSize="18px";
        }
        else{
            document.documentElement.style.fontSize="";
        }
        if(prefs.accent){
            document.documentElement.style.setProperty("--message-user",prefs.accent);
        }
        else{
            document.documentElement.style.removeProperty("--message-user");
        }
        applyVisibilityFilters();
    }
    function isHiddenFromView(data){
        if(!data)return false;
        let ignored=prefs.ignoredUsers||[];
        if(data.username&&ignored.indexOf(data.username)!==-1)return true;
        if(data.from&&ignored.indexOf(data.from)!==-1)return true;
        let blocked=prefs.blockedWords||[];
        if(blocked.length&&data.message){
            let lower=String(data.message).toLowerCase();
            for(let w of blocked){
                if(w&&lower.indexOf(w.toLowerCase())!==-1)return true;
            }
        }
        return false;
    }
    function applyVisibilityFilters(){
        let query=chatSearchEl?chatSearchEl.value.trim().toLowerCase():"";
        let ignored=prefs.ignoredUsers||[];
        let blocked=prefs.blockedWords||[];
        for(let li of messagesList.children){
            let sender=li.getAttribute("data-sender")||"";
            let raw=(li.getAttribute("data-rawmessage")||li.textContent||"").toLowerCase();
            let hidden=false;
            if(ignored.indexOf(sender)!==-1)hidden=true;
            if(!hidden&&blocked.length){
                for(let w of blocked){
                    if(w&&raw.indexOf(w.toLowerCase())!==-1){hidden=true;break;}
                }
            }
            if(!hidden&&query){
                let hay=(li.textContent||"").toLowerCase();
                if(hay.indexOf(query)===-1)hidden=true;
            }
            li.classList.toggle("search-hidden",hidden);
        }
    }
    applyPrefs();
    if(chatSearchEl){
        chatSearchEl.addEventListener("input",()=>{
            applyVisibilityFilters();
        });
    }
    document.addEventListener("keydown",(e)=>{
        if(e.ctrlKey&&e.key.toLowerCase()==="f"&&chatPage.style.display==="block"){
            e.preventDefault();
            if(chatSearchEl)chatSearchEl.focus();
        }
    });
    let connStatus=document.createElement("span");
    connStatus.id="connStatus";
    connStatus.textContent="Offline";
    connStatus.classList.add("reconnecting");
    let headerControlsEl=document.getElementById("headerControls");
    if(headerControlsEl){
        headerControlsEl.insertBefore(connStatus,headerControlsEl.firstChild);
    }
    function setConnStatus(text,cls){
        connStatus.textContent=text;
        connStatus.className=cls;
    }
    let unreadCount=0;
    const baseTitle="Local Server Chat";
    function resetTitle(){
        unreadCount=0;
        document.title=baseTitle;
    }
    function bumpTitle(){
        unreadCount++;
        document.title=`(${unreadCount}) ${baseTitle}`;
    }
    document.addEventListener("visibilitychange",()=>{
        if(!document.hidden){
            resetTitle();
        }
    });
    function inDnd(){
        return prefs.dndUntil>Date.now();
    }
    function playMessageSound(){
        if(!prefs.sound||inDnd())return;
        try{
            let ctx=new(window.AudioContext||window.webkitAudioContext)();
            let osc=ctx.createOscillator();
            let gain=ctx.createGain();
            osc.type="sine";
            osc.frequency.value=880;
            gain.gain.setValueAtTime(0.08,ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime+0.15);
        }
        catch(e){}
    }
    function notifyMessage(data){
        if(document.hidden&&!inDnd()&&"Notification" in window&&Notification.permission==="granted"){
            try{
                let body=String(data.message||"").slice(0,140);
                let n=new Notification(data.username||"New message",{body:body||"(message)",icon:"/favicon-32x32.png"});
                n.onclick=()=>{window.focus();n.close();};
            }
            catch(e){}
        }
    }
    function onIncomingMessage(data){
        if(!data||data.username===currentUser||data.username==="Anonymous")return;
        receivedCount++;
        updateSessionStats();
        if(document.hidden){
            bumpTitle();
            notifyMessage(data);
        }
        else{
            resetTitle();
        }
        playMessageSound();
    }
    let settingsOverlay=null;
    function applyLanguage(){}
    function settingsRow(labelText,controlEl){
        let row=document.createElement("div");
        row.style.cssText="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin:0.4rem 0;";
        let label=document.createElement("span");
        label.style.cssText="color:var(--text-primary);font-size:0.9rem;";
        label.textContent=labelText;
        row.appendChild(label);
        row.appendChild(controlEl);
        return row;
    }
    function closeSettings(){
        if(settingsOverlay){
            settingsOverlay.remove();
            settingsOverlay=null;
        }
    }
    function openSettings(){
        closeSettings();
        let overlay=document.createElement("div");
        overlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;";
        let box=document.createElement("div");
        box.style.cssText="background:var(--background-card);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:1rem;max-width:520px;width:92%;max-height:85vh;overflow-y:auto;box-shadow:0 4px 20px var(--box-shadow);";
        let title=document.createElement("h3");
        title.textContent="Settings";
        title.style.cssText="margin:0 0 .5rem 0;color:var(--text-primary);";
        box.appendChild(title);
        function mkSelect(options,value){
            let sel=document.createElement("select");
            sel.style.cssText="background:var(--button-bg);color:var(--text-primary);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:.2rem .4rem;";
            for(let o of options){
                let opt=document.createElement("option");
                opt.value=o[0];
                opt.textContent=o[1];
                sel.appendChild(opt);
            }
            sel.value=value;
            return sel;
        }
        function mkCheckbox(checked){
            let cb=document.createElement("input");
            cb.type="checkbox";
            cb.checked=checked;
            cb.style.cssText="accent-color:var(--message-user);";
            return cb;
        }
        let langSel=mkSelect([["en","EN"],["es","ES"],["fr","FR"],["de","DE"],["zh","ZH"]],prefs.lang);
        langSel.onchange=()=>{prefs.lang=langSel.value;savePrefs();applyLanguage();};
        box.appendChild(settingsRow("Language",langSel));
        let densitySel=mkSelect([["comfortable","Comfortable"],["compact","Compact"]],prefs.density);
        densitySel.onchange=()=>{prefs.density=densitySel.value;savePrefs();applyPrefs();};
        box.appendChild(settingsRow("Message density",densitySel));
        let sizeSel=mkSelect([["small","Small"],["normal","Normal"],["large","Large"]],prefs.textSize);
        sizeSel.onchange=()=>{prefs.textSize=sizeSel.value;savePrefs();applyPrefs();};
        box.appendChild(settingsRow("Text size",sizeSel));
        let soundBox=mkCheckbox(prefs.sound);
        soundBox.onchange=()=>{prefs.sound=soundBox.checked;savePrefs();};
        box.appendChild(settingsRow("Message sound",soundBox));
        let focusBox=mkCheckbox(prefs.focusMode);
        focusBox.onchange=()=>{prefs.focusMode=focusBox.checked;savePrefs();};
        box.appendChild(settingsRow("Focus mode (messages only)",focusBox));
        let motionBox=mkCheckbox(prefs.reduceMotion);
        motionBox.onchange=()=>{prefs.reduceMotion=motionBox.checked;savePrefs();applyPrefs();};
        box.appendChild(settingsRow("Reduce motion",motionBox));
        let wrapBox=mkCheckbox(prefs.wrapCode);
        wrapBox.onchange=()=>{prefs.wrapCode=wrapBox.checked;savePrefs();applyPrefs();};
        box.appendChild(settingsRow("Wrap long code lines",wrapBox));
        let accentInput=document.createElement("input");
        accentInput.type="color";
        accentInput.value=prefs.accent||"#EC1414";
        accentInput.style.cssText="background:var(--button-bg);border:1px solid var(--border-card);border-radius:var(--border-radius);width:3rem;padding:0;";
        accentInput.onchange=()=>{prefs.accent=accentInput.value;savePrefs();applyPrefs();};
        box.appendChild(settingsRow("Accent color",accentInput));
        let dndRow=document.createElement("div");
        dndRow.style.cssText="display:flex;gap:.3rem;";
        for(let m of [[0,"Off"],[5,"5m"],[30,"30m"],[60,"60m"]]){
            let b=document.createElement("button");
            b.textContent=m[1];
            b.style.cssText="background:var(--button-bg);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:.15rem .5rem;color:var(--text-primary);cursor:pointer;font-size:.8rem;";
            b.onclick=()=>{prefs.dndUntil=m[0]===0?0:Date.now()+m[0]*60000;savePrefs();};
            dndRow.appendChild(b);
        }
        box.appendChild(settingsRow("Do not disturb",dndRow));
        let e2eBox=mkCheckbox(prefs.e2e);
        e2eBox.onchange=()=>{prefs.e2e=e2eBox.checked;savePrefs();};
        let e2ePassInput=document.createElement("input");
        e2ePassInput.type="password";
        e2ePassInput.value=prefs.e2ePass;
        e2ePassInput.placeholder="Shared encryption password";
        e2ePassInput.style.cssText="background:var(--button-bg);color:var(--text-primary);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:.2rem .4rem;width:12rem;";
        e2ePassInput.onchange=()=>{prefs.e2ePass=e2ePassInput.value;savePrefs();};
        box.appendChild(settingsRow("End-to-end encryption",e2eBox));
        box.appendChild(settingsRow("Encryption password",e2ePassInput));
        let wordsArea=document.createElement("textarea");
        wordsArea.style.cssText="background:var(--button-bg);color:var(--text-primary);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:.3rem;width:12rem;height:3rem;resize:vertical;";
        wordsArea.value=(prefs.blockedWords||[]).join("\n");
        wordsArea.placeholder="Blocked words (one per line)";
        wordsArea.oninput=()=>{
            prefs.blockedWords=wordsArea.value.split("\n").map(s=>s.trim()).filter(s=>s.length>0);
            savePrefs();
            applyVisibilityFilters();
        };
        box.appendChild(settingsRow("Word filter",wordsArea));
        let ignoredDiv=document.createElement("div");
        ignoredDiv.style.cssText="display:flex;flex-direction:column;gap:.2rem;max-height:6rem;overflow-y:auto;width:12rem;";
        function renderIgnored(){
            ignoredDiv.innerHTML="";
            let list=prefs.ignoredUsers||[];
            for(let name of list){
                let row=document.createElement("div");
                row.style.cssText="display:flex;justify-content:space-between;align-items:center;gap:.3rem;font-size:.85rem;color:var(--text-primary);";
                let span=document.createElement("span");
                span.textContent=name;
                row.appendChild(span);
                let unBtn=document.createElement("button");
                unBtn.textContent="Unignore";
                unBtn.style.cssText="background:var(--button-bg);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:.05rem .4rem;color:var(--text-primary);cursor:pointer;font-size:.7rem;";
                unBtn.onclick=()=>{
                    prefs.ignoredUsers=prefs.ignoredUsers.filter(n=>n!==name);
                    savePrefs();
                    renderIgnored();
                    applyVisibilityFilters();
                };
                row.appendChild(unBtn);
                ignoredDiv.appendChild(row);
            }
            if(list.length===0){
                let empty=document.createElement("span");
                empty.textContent="None";
                empty.style.cssText="color:var(--text-secondary);font-size:.85rem;";
                ignoredDiv.appendChild(empty);
            }
        }
        renderIgnored();
        box.appendChild(settingsRow("Ignored users",ignoredDiv));
        let statsLine=document.createElement("div");
        statsLine.id="sessionStats";
        statsLine.style.cssText="margin-top:.5rem;color:var(--text-secondary);font-size:.8rem;";
        box.appendChild(statsLine);
        let closeBtn=document.createElement("button");
        closeBtn.textContent="Close";
        closeBtn.style.cssText="margin-top:.8rem;padding:.3rem 1rem;background:var(--button-bg);border:1px solid var(--border-card);border-radius:var(--border-radius);cursor:pointer;color:var(--text-primary);";
        closeBtn.onclick=closeSettings;
        box.appendChild(closeBtn);
        overlay.appendChild(box);
        overlay.addEventListener("click",(e)=>{if(e.target===overlay){closeSettings();}});
        document.body.appendChild(overlay);
        updateSessionStats();
        settingsOverlay=overlay;
    }

    function createRoomUI(){
        let headerControls=document.getElementById("headerControls");
        if(!headerControls)return;
        roomSelector=document.createElement("select");
        roomSelector.id="roomSelector";
        roomSelector.style.cssText="background-color:var(--button-bg);color:var(--text-primary);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:0 .6rem;height:var(--button-height);font-size:var(--button-font-size);cursor:pointer;";
        roomSelector.onchange=()=>{
            let room=roomSelector.value;
            if(room&&room!==currentRoom){
                if(socket&&socket.readyState===WebSocket.OPEN){
                    socket.send(JSON.stringify({type:"joinRoom",room:room}));
                }
            }
        };
        headerControls.insertBefore(roomSelector,headerControls.firstChild);
        let createBtn=document.createElement("button");
        createBtn.textContent="+";
        createBtn.title="Create room";
        createBtn.style.cssText="height:var(--button-height);padding:0 .6rem;font-size:var(--button-font-size);background-color:var(--button-bg);border:1px solid var(--border-card);border-radius:var(--border-radius);cursor:pointer;color:var(--text-primary);";
        createBtn.onclick=()=>{
            createModal("Room name:","",name=>{
                if(name&&name.trim()){
                    if(socket&&socket.readyState===WebSocket.OPEN){
                        socket.send(JSON.stringify({type:"createRoom",room:name.trim()}));
                    }
                }
            });
        };
        headerControls.insertBefore(createBtn,roomSelector.nextSibling);
    }
    function updateRoomList(rooms,current){
        if(!roomSelector)return;
        roomSelector.innerHTML="";
        for(let room of rooms){
            let opt=document.createElement("option");
            opt.value=room.name;
            opt.textContent=room.name+" ("+room.members+")";
            if(room.name===current)opt.selected=true;
            roomSelector.appendChild(opt);
        }
        if(current){currentRoom=current;}
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
            showChatError(chatErrorDiv,"Offline. Message queued.");
            let payload;
            if(isImage){
                payload=JSON.stringify({type:"image",username:currentUser,image:imageData,ip:clientRealIP,timestamp:getCurrentTime()});
            }
            else{
                let priv=parsePrivateMessage(message);
                if(priv){
                    payload=JSON.stringify({type:"private",username:currentUser,target:priv.target,message:applyEmojiShortcuts(priv.content),ip:clientRealIP,timestamp:getCurrentTime()});
                }
                else{
                    payload=JSON.stringify({username:currentUser,message:applyEmojiShortcuts(message),ip:clientRealIP});
                }
            }
            sendQueue.push(payload);
            return true;
        }
        if(isImage){
            socket.send(JSON.stringify({type:"image",username:currentUser,image:imageData,ip:clientRealIP,timestamp:getCurrentTime()}));
        }
        else{
            let priv=parsePrivateMessage(message);
            if(priv){
                socket.send(JSON.stringify({type:"private",username:currentUser,target:priv.target,message:applyEmojiShortcuts(priv.content),ip:clientRealIP,timestamp:getCurrentTime()}));
            }
            else{
                socket.send(JSON.stringify({username:currentUser,message:applyEmojiShortcuts(message),ip:clientRealIP}));
            }
        }
        sentCount++;
        updateSessionStats();
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
    function isSafeMediaSrc(src){
        return typeof src==="string"&&/^(data:|blob:)/.test(src);
    }
    function nameHash(str){
        let h=0;
        for(let i=0;i<str.length;i++){
            h=((h<<5)-h)+str.charCodeAt(i);
            h|=0;
        }
        return Math.abs(h);
    }
    function colorForUsername(name){
        return "hsl("+(nameHash(name)%360)+",70%,50%)";
    }
    function coloredNameHtml(name){
        return `<span style="color:${colorForUsername(name)}">${escapeHtml(name)}</span>`;
    }
    function copyTextToClipboard(text){
        if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(text).catch(()=>{});
        }
        else{
            let ta=document.createElement("textarea");
            ta.value=text;
            ta.style.cssText="position:fixed;opacity:0;";
            document.body.appendChild(ta);
            ta.select();
            try{document.execCommand("copy");}catch(e){}
            ta.remove();
        }
    }
    let lastMessageDate="";
    let newMsgDividerShown=false;
    function maybeInsertDateDivider(){
        let ds=new Date().toDateString();
        if(!lastMessageDate){lastMessageDate=ds;return;}
        if(ds===lastMessageDate)return;
        let y=new Date(Date.now()-86400000).toDateString();
        let prevStr=new Date(lastMessageDate).toLocaleDateString([],{weekday:"short",month:"short",day:"numeric"});
        let label=(lastMessageDate===y)?"Yesterday":prevStr;
        let div=document.createElement("li");
        div.className="msg-date-divider";
        div.textContent=label;
        messagesList.appendChild(div);
        lastMessageDate=ds;
    }
    function maybeInsertNewMsgDivider(){
        if(!autoScroll&&!newMsgDividerShown){
            newMsgDividerShown=true;
            let div=document.createElement("li");
            div.className="new-msg-divider";
            div.textContent="New messages";
            messagesList.appendChild(div);
        }
    }
    function addMessageToUI(data){
        if(data.type==="onlineCount"){
            let span=document.getElementById("onlineCount");
            if(span){span.textContent=`(${data.count} online)`;}
            return;
        }
        if(data.type==="typing"){
            if(prefs.focusMode)return;
            if(data.typing){currentTypers.add(data.username);}
            else{currentTypers.delete(data.username);}
            updateTypingIndicator();
            return;
        }
        if(data.type==="roomJoined"){
            currentRoom=data.room;
            if(data.rooms){updateRoomList(data.rooms,data.room);}
            let li=document.createElement("li");
            li.innerHTML=`<em>You joined ${escapeHtml(data.room)}</em>`;
            li.style.cssText="white-space:pre-wrap;color:gray;font-style:italic;";
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            return;
        }
        if(data.type==="roomCreated"){
            if(data.rooms){updateRoomList(data.rooms,currentRoom);}
            let li=document.createElement("li");
            li.innerHTML=`<em>Room ${escapeHtml(data.room)} created</em>`;
            li.style.cssText="white-space:pre-wrap;color:gray;font-style:italic;";
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            return;
        }
        if(data.type==="roomList"){
            if(data.rooms){updateRoomList(data.rooms,data.currentRoom);}
            return;
        }
        if(data.type==="file-start"){
            handleFileStart(data,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml,getCurrentTime,currentUser,showChatError,chatErrorDiv);
            return;
        }
        if(data.type==="file-end"){
            handleFileEnd(data);
            return;
        }
        if(data.type==="file-cancel"){
            handleFileCancel(data.transferId);
            return;
        }
        if(data.type==="system"){
            if(prefs.focusMode){
                handleSystemMessage(data.message);
                return;
            }
            if(handleSystemMessage(data.message)) return;
            let li=document.createElement("li");
            li.innerHTML=`<em>${escapeHtml(data.message)}</em>`;
            li.style.cssText="white-space:pre-wrap;color:gray;font-style:italic;";
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            return;
        }
        if(data.type==="pollCreated"||data.type==="pollUpdate"||data.type==="pollClosed"){
            if(isHiddenFromView(data))return;
            let li=document.createElement("li");
            li.id="poll_"+data.id;
            li.style.cssText="background:var(--background-card);border:1px solid var(--border-input);border-radius:var(--border-radius);padding:0.5rem;margin:0.3rem 0;";
            let title=document.createElement("div");
            title.style.cssText="font-weight:600;margin-bottom:0.3rem;color:var(--text-primary);";
            title.textContent=data.question+(data.createdBy?" (by "+data.createdBy+")":"");
            li.appendChild(title);
            let optionsDiv=document.createElement("div");
            optionsDiv.style.cssText="display:flex;flex-direction:column;gap:0.2rem;";
            data.options.forEach((opt,i)=>{
                let optRow=document.createElement("div");
                optRow.style.cssText="display:flex;align-items:center;gap:0.3rem;";
                let voteBtn=document.createElement("button");
                voteBtn.style.cssText="background:var(--button-bg);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:0.2rem 0.5rem;cursor:pointer;color:var(--text-primary);font-size:0.85rem;flex-shrink:0;";
                voteBtn.textContent=opt.votes;
                voteBtn.title="Vote";
                voteBtn.onclick=()=>{
                    if(socket&&socket.readyState===WebSocket.OPEN){
                        socket.send(JSON.stringify({type:"vote",pollId:data.id,option:i}));
                    }
                };
                let optText=document.createElement("span");
                optText.style.cssText="color:var(--text-primary);font-size:0.9rem;";
                optText.textContent=opt.text;
                let bar=document.createElement("div");
                bar.style.cssText="flex:1;height:6px;background:var(--button-bg);border-radius:3px;overflow:hidden;min-width:2rem;";
                let fill=document.createElement("div");
                fill.style.cssText="height:100%;background:var(--message-user);transition:width 0.3s;";
                fill.style.width=data.totalVotes>0?((opt.votes/data.totalVotes)*100)+"%":"0%";
                bar.appendChild(fill);
                optRow.appendChild(voteBtn);
                optRow.appendChild(optText);
                optRow.appendChild(bar);
                optionsDiv.appendChild(optRow);
            });
            li.appendChild(optionsDiv);
            let footer=document.createElement("div");
            footer.style.cssText="font-size:0.75rem;color:var(--text-secondary);margin-top:0.3rem;";
            footer.textContent=data.totalVotes+" vote"+(data.totalVotes!==1?"s":"");
            li.appendChild(footer);
            if(data.type==="pollClosed"){
                let closedBadge=document.createElement("span");
                closedBadge.style.cssText="color:var(--error-color);font-weight:600;margin-left:0.3rem;";
                closedBadge.textContent="[CLOSED]";
                footer.appendChild(closedBadge);
            }
            let existingPoll=document.getElementById("poll_"+data.id);
            if(existingPoll){
                existingPoll.replaceWith(li);
            }
            else{
                messagesList.appendChild(li);
            }
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            if(data.type==="pollCreated"){
                onIncomingMessage(data);
            }
            return;
        }
        if(data.type==="pollList"){
            return;
        }
        if(data.type==="private"){
            if(isHiddenFromView(data))return;
            maybeInsertDateDivider();
            maybeInsertNewMsgDivider();
            let time=data.timestamp||getCurrentTime();
            let formatted=formatMarkdown(data.message);
            let ip=data.ip||"Unknown";
            let identiconName=data.self?data.target:data.from;
            let identiconSvg=generateIdenticon(identiconName,20);
            let identiconHtml=identiconSvg?" "+identiconSvg.outerHTML:"";
            let html=data.self?`[Private to ${escapeHtml(data.target)}] You [${ip}] (${time}): ${formatted}${identiconHtml}`:`[Private] ${coloredNameHtml(data.from)} [${ip}] (${time}): ${formatted}${identiconHtml}`;
            let li=document.createElement("li");
            li.innerHTML=html;
            li.style.whiteSpace="pre-wrap";
            if(data.self){li.classList.add("userMessage");}
            else{li.classList.add("otherMessage");}
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            if(!data.self){onIncomingMessage(data);}
            return;
        }
        if(data.type==="image"){
            if(isHiddenFromView(data))return;
            maybeInsertDateDivider();
            maybeInsertNewMsgDivider();
            let time=getCurrentTime();
            let ip=data.ip||clientRealIP||"Unknown";
            let imgHtml=isSafeMediaSrc(data.image)?`<img src="${escapeHtml(data.image)}" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:4px;cursor:pointer;" onclick="window.open(this.src,'_blank')">`:`<em>[Unsafe image blocked]</em>`;
            let identiconSvg=generateIdenticon(data.username,20);
            let identiconHtml=identiconSvg?identiconSvg.outerHTML+" ":"";
            let rawHtml=identiconHtml+`${coloredNameHtml(data.username)} [${ip}] (${time}):<br> ${imgHtml}`;
            let li=document.createElement("li");
            li.innerHTML=rawHtml;
            li.style.display="flex";
            li.style.alignItems="flex-start";
            li.style.gap="0.3rem";
            if(data.username===currentUser){li.classList.add("userMessage");}
            else{li.classList.add("otherMessage");}
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            onIncomingMessage(data);
            return;
        }
        if(data.type==="voice"){
            if(isHiddenFromView(data))return;
            maybeInsertDateDivider();
            maybeInsertNewMsgDivider();
            let time=getCurrentTime();
            let ip=data.ip||clientRealIP||"Unknown";
            let audioHtml=isSafeMediaSrc(data.voice)?`<audio controls src="${escapeHtml(data.voice)}" style="max-width:100%;"></audio>`:`<em>[Unsafe audio blocked]</em>`;
            let identiconSvg=generateIdenticon(data.username,20);
            let identiconHtml=identiconSvg?identiconSvg.outerHTML+" ":"";
            let rawHtml=identiconHtml+`${coloredNameHtml(data.username)} [${ip}] (${time}):<br> ${audioHtml}`;
            let li=document.createElement("li");
            li.innerHTML=rawHtml;
            li.style.display="flex";
            li.style.alignItems="flex-start";
            li.style.gap="0.3rem";
            if(data.username===currentUser){li.classList.add("userMessage");}
            else{li.classList.add("otherMessage");}
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
            onIncomingMessage(data);
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
        if(isHiddenFromView(data))return;
        maybeInsertDateDivider();
        maybeInsertNewMsgDivider();
        let time=getCurrentTime();
        let formatted=formatMarkdown(data.message||"");
        let ip=data.ip||clientRealIP||"Unknown";
        let identiconSvg=generateIdenticon(data.username,20);
        let identiconHtml=identiconSvg?identiconSvg.outerHTML+" ":"";
        let baseHtml=identiconHtml+`${coloredNameHtml(data.username)} [${ip}] (${time}): ${formatted}`;
        let finalHtml=highlightMentions(baseHtml,currentUser);
        let li=document.createElement("li");
        li.innerHTML=finalHtml;
        li.style.whiteSpace="pre-wrap";
        li.style.display="flex";
        li.style.alignItems="flex-start";
        li.style.gap="0.3rem";
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
        li.addEventListener("dblclick",(e)=>{
            e.stopPropagation();
            insertReplyQuote(userMessage,data.username,data.message);
        });
        li.addEventListener("contextmenu",(e)=>{
            e.preventDefault();
            let menu=document.getElementById("contextMenu");
            if(!menu){return;}
            menu.style.left=e.pageX+"px";
            menu.style.top=e.pageY+"px";
            menu.style.display="block";
            window.currentReplySender=data.username;
            window.currentReplyRawText=data.message;
            window.currentReplyLi=li;
            let pinOptEl=document.getElementById("pinOption");
            if(pinOptEl){
                pinOptEl.textContent=li.classList.contains("msg-pinned")?"Unpin message":"Pin message";
            }
        });
        messagesList.appendChild(li);
        scrollToBottom(messagesList);
        checkScrollPosition(messagesList,scrollBtn,autoScroll);
        onIncomingMessage(data);
    }
    function onWebSocketMessage(data){
        addMessageToUI(data);
    }
    function connect(){
        if(reconnectTimer){clearTimeout(reconnectTimer);}
        setConnStatus("Connecting…","reconnecting");
        let wsHost=clientMode&&remoteHost?remoteHost:window.location.hostname;
        let wsPort=clientMode&&remotePort?remotePort:defaultPort;
        let handlers={
            onMessage: onWebSocketMessage,
            onBinary: (arrayBuffer)=>{
                handleBinaryChunk(arrayBuffer,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml,getCurrentTime,currentUser,showChatError,chatErrorDiv);
            },
            onOpen: ()=>{
                console.log("WebSocket connected to "+wsHost+":"+wsPort);
                setConnStatus("Connected","connected");
                connectedAt=Date.now();
                updateSessionStats();
                reconnectAttempts=0;
                socket.send(JSON.stringify({type:"join",username:currentUser}));
                socket.send(JSON.stringify({type:"getRooms"}));
                if(currentRoom&&currentRoom!=="General"){
                    socket.send(JSON.stringify({type:"joinRoom",room:currentRoom}));
                }
                while(sendQueue.length){
                    socket.send(sendQueue.shift());
                }
                setTimeout(()=>{
                    if(socket&&socket.readyState===WebSocket.OPEN){
                        socket.send(JSON.stringify({type:"getUsers"}));
                    }
                },500);
            },
            onClose: ()=>{
                console.log("WebSocket closed");
                setConnStatus("Reconnecting…","reconnecting");
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
        let wsUrl=`ws://${wsHost}:${wsPort}`;
        let ws=new WebSocket(wsUrl);
        ws.binaryType="arraybuffer";
        ws.onopen=()=>{if(handlers.onOpen)handlers.onOpen();};
        ws.onmessage=(event)=>{
            if(event.data instanceof ArrayBuffer){
                if(handlers.onBinary)handlers.onBinary(event.data);
            }
            else if(typeof Blob!=="undefined"&&event.data instanceof Blob){
                event.data.arrayBuffer().then(buf=>{if(handlers.onBinary)handlers.onBinary(buf);});
            }
            else{
                let str=typeof event.data==="string"?event.data:(event.data&&event.data.toString?event.data.toString():null);
                if(str){try{let data=JSON.parse(str);if(handlers.onMessage)handlers.onMessage(data);}catch(e){}}
            }
        };
        ws.onerror=(e)=>{if(handlers.onError)handlers.onError(e);};
        ws.onclose=()=>{if(handlers.onClose)handlers.onClose();};
        socket=ws;
    }
    fetch("/server-info").then(r=>r.json()).then(info=>{
        let serverInfoDiv=document.getElementById("serverInfo");
        let serverNameEl=document.getElementById("serverName");
        let joinCodeValue=document.getElementById("joinCodeValue");
        let altJoinSection=document.getElementById("altJoinSection");
        if(info.name&&serverNameEl){
            serverNameEl.textContent=info.name;
        }
        if(info.joinCode&&joinCodeValue){
            joinCodeValue.textContent=info.joinCode;
        }
        if(serverInfoDiv&&info.name){
            serverInfoDiv.style.display="block";
        }
        if(altJoinSection&&info.name){
            altJoinSection.style.display="block";
        }
        else if(altJoinSection){
            altJoinSection.style.display="none";
        }
        let qrCanvas=document.getElementById("qrCanvas");
        if(qrCanvas&&info.ip&&info.name){
            let url=`http://${info.ip}:${info.uiPort||2047}`;
            QRCode.toCanvas(qrCanvas,url,{width:128,margin:1,errorCorrectionLevel:"L"}).catch(()=>{});
            let linkBtn=document.getElementById("copyLinkBtn");
            if(!linkBtn){
                linkBtn=document.createElement("button");
                linkBtn.id="copyLinkBtn";
                linkBtn.textContent="Copy Link";
                linkBtn.style.cssText="margin:0 auto .3rem;display:block;padding:.2rem .8rem;background:var(--button-bg);border:1px solid var(--border-card);border-radius:var(--border-radius);cursor:pointer;color:var(--text-primary);";
                linkBtn.onclick=()=>{
                    copyTextToClipboard(url);
                    showChatError(chatErrorDiv,"Link copied.");
                };
                qrCanvas.parentNode.insertBefore(linkBtn,qrCanvas);
            }
        }
    }).catch(()=>{});
    let clientMode=false;
    let remoteHost=null;
    let remotePort=8191;
    fetch("/client-info").then(r=>r.json()).then(info=>{
        if(info.mode==="client"){
            clientMode=true;
            document.getElementById("discoveryPage").style.display="block";
            document.getElementById("username-wrapper").style.display="none";
            document.getElementById("userIp").style.display="none";
            document.getElementById("joinChat").style.display="none";
            document.getElementById("loginHeading").textContent="Local Server Chat";
            let evtSource=new EventSource("/discovery/events");
            evtSource.onmessage=(e)=>{
                let data=JSON.parse(e.data);
                updateServerList(data.servers);
            };
        }
    }).catch(()=>{});
    function updateServerList(servers){
        let list=document.getElementById("serverList");
        let noServers=document.getElementById("noServers");
        if(!list)return;
        if(servers.length===0){
            noServers.style.display="block";
            return;
        }
        noServers.style.display="none";
        list.innerHTML="";
        servers.forEach(s=>{
            let item=document.createElement("div");
            item.style.cssText="padding:0.5rem;border-bottom:1px solid var(--border-card);cursor:pointer;display:flex;justify-content:space-between;align-items:center;";
            item.innerHTML=`<div><div style="font-weight:500;color:var(--text-primary);">${escapeHtml(s.name)}</div><div style="font-size:0.75rem;color:var(--text-secondary);">${s.ip}:${s.port} - ${s.users||0} users</div></div><input type="button" value="Join" style="width:auto;padding:0.2rem 0.8rem;">`;
            item.querySelector("input").onclick=(e)=>{
                e.stopPropagation();
                selectServer(s.ip,s.port);
            };
            item.onclick=()=>selectServer(s.ip,s.port);
            list.appendChild(item);
        });
    }
    function selectServer(host,port){
        remoteHost=host;
        remotePort=port;
        document.getElementById("discoveryPage").style.display="none";
        document.getElementById("username-wrapper").style.display="flex";
        document.getElementById("userIp").style.display="block";
        document.getElementById("joinChat").style.display="block";
        document.getElementById("loginHeading").textContent="Join Chat";
        userIP.value=`Server: ${host}:${port}`;
        fetch("/connect",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({ip:host,port:port})
        }).then(r=>r.json()).then(result=>{
            if(result&&result.ok){
                userIP.value=`Connected to ${host}:${port}`;
            }
            else{
                showChatError(chatErrorDiv,`Cannot reach server ${host}:${port}.`);
            }
        }).catch(()=>{
            showChatError(chatErrorDiv,`Cannot reach server ${host}:${port}.`);
        });
    }
    let manualConnectBtn=document.getElementById("manualConnect");
    if(manualConnectBtn){
        manualConnectBtn.onclick=()=>{
            let host=document.getElementById("manualHost").value.trim();
            let port=parseInt(document.getElementById("manualPort").value)||8191;
            if(!host){showChatError(chatErrorDiv,"Enter a server IP.");return;}
            selectServer(host,port);
        };
    }
    let joinCodeBtn=document.getElementById("joinCodeBtn");
    let joinCodeInput=document.getElementById("joinCodeInput");
    if(joinCodeBtn&&joinCodeInput){
        joinCodeBtn.onclick=()=>{
            let code=joinCodeInput.value.trim().toUpperCase();
            if(code.length!==4){
                showChatError(chatErrorDiv,"Enter a 4-character join code.");
                shakeElement(joinCodeInput);
                return;
            }
            fetch("/join-code/"+code).then(r=>r.json()).then(result=>{
                if(result.found){
                    window.location.href=`http://${result.ip}:${result.uiPort||2047}`;
                }
                else{
                    showChatError(chatErrorDiv,"Server not found. Check the code and try again.");
                    shakeElement(joinCodeInput);
                }
            }).catch(()=>{
                showChatError(chatErrorDiv,"Could not reach server.");
            });
        };
        joinCodeInput.addEventListener("keypress",(e)=>{
            if(e.key==="Enter"){joinCodeBtn.click();}
        });
    }
    async function loggingIn(){
        let username=usernameInput.value.trim();
        if(!username){
            document.getElementById("login-error").textContent="Please enter your username";
            shakeElement(usernameInput);
            return;
        }
        currentUser=username;
        if("Notification" in window&&Notification.permission==="default"){
            Notification.requestPermission().catch(()=>{});
        }
        if(clientRealIP==="Unknown"){await fetchAndDisplayIP();}
        loginPage.style.display="none";
        chatPage.style.display="block";
        createRoomUI();
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
        else if(e.key==="ArrowUp"&&!e.shiftKey&&!e.altKey){
            if(inputHistory.length===0)return;
            if(historyIndex===inputHistory.length&&userMessage.value.trim()!=="")return;
            if(historyIndex>0){
                historyIndex--;
                userMessage.value=inputHistory[historyIndex];
                e.preventDefault();
            }
        }
        else if(e.key==="ArrowDown"&&!e.shiftKey){
            if(historyIndex===inputHistory.length)return;
            historyIndex++;
            if(historyIndex>=inputHistory.length){
                historyIndex=inputHistory.length;
                userMessage.value="";
            }
            else{
                userMessage.value=inputHistory[historyIndex];
            }
            e.preventDefault();
        }
    });
    function sendMessage(){
        let msg=userMessage.value.trim();
        if(!msg){return;}
        inputHistory.push(msg);
        if(inputHistory.length>100)inputHistory.shift();
        historyIndex=inputHistory.length;
        if(msg.startsWith("/snippet ")){
            handleSnippetCommand(msg);
            return;
        }
        let handled=processCommand(msg,currentUser,socket,clientRealIP,chatPage,userMessage,chatErrorDiv,messagesList,showSystemMessageWithSocket,applyGoldBorderWrapper,updateDeveloperModeWrapper);
        if(handled){
            userMessage.value="";
            clearDraft();
            return;
        }
        if(sendMessageContent(msg)){
            userMessage.value="";
            clearDraft();
        }
    }
    function handleSnippetCommand(msg){
        let parts=msg.split(" ");
        let cmd=parts[1];
        let snippets=prefs.snippets=prefs.snippets||{};
        if(cmd==="add"&&parts.length>=4){
            let name=parts[2];
            let text=msg.substring(msg.indexOf(parts[3]));
            snippets[name]=text;
            savePrefs();
            showChatError(chatErrorDiv,"Snippet '"+name+"' saved.");
            userMessage.value="";
            clearDraft();
            return;
        }
        else if(cmd==="del"&&parts[2]){
            delete snippets[parts[2]];
            savePrefs();
            showChatError(chatErrorDiv,"Snippet '"+parts[2]+"' deleted.");
            userMessage.value="";
            clearDraft();
            return;
        }
        else if(cmd==="list"){
            let names=Object.keys(snippets);
            showSystemMessageWithSocket(names.length?"Snippets: "+names.join(", "):"No snippets saved.");
            userMessage.value="";
            clearDraft();
            return;
        }
        showSystemMessageWithSocket("Usage: /snippet add <name> <text> | /snippet del <name> | /snippet list");
        userMessage.value="";
        clearDraft();
    }
    function saveDraft(){
        localStorage.setItem("chatDraft",userMessage.value);
    }
    function clearDraft(){
        localStorage.removeItem("chatDraft");
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
        if(draftTimer){clearTimeout(draftTimer);}
        draftTimer=setTimeout(saveDraft,300);
        userMessage.style.height="auto";
        userMessage.style.height=Math.min(userMessage.scrollHeight,200)+"px";
    });
    userMessage.addEventListener("paste",(e)=>{
        if(!e.clipboardData)return;
        for(let item of e.clipboardData.items){
            if(item.kind==="file"&&item.type&&item.type.startsWith("image/")){
                e.preventDefault();
                let file=item.getAsFile();
                if(!file)return;
                if(file.size>1024*1024){
                    showChatError(chatErrorDiv,"Max 1MB.");
                    return;
                }
                convertToWebP(file).then(webp=>{
                    sendMessageContent(null,true,webp);
                }).catch(err=>{
                    showChatError(chatErrorDiv,"Image conversion failed");
                });
                return;
            }
        }
    });
    userMessage.addEventListener("blur",()=>{
        if(typingTimeout){clearTimeout(typingTimeout);}
        sendTypingStop();
    });
    document.getElementById("sendMessage").onclick=sendMessage;
    userMessage.addEventListener("dragover",(e)=>e.preventDefault());
    userMessage.addEventListener("drop",async(e)=>{
        e.preventDefault();
        e.stopPropagation();
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
        let mediaRecorder=null;
        let mediaChunks=[];
        let voiceStream=null;
        const voiceFileInput=document.createElement("input");
        voiceFileInput.type="file";
        voiceFileInput.accept="audio/*";
        voiceFileInput.style.display="none";
        document.body.appendChild(voiceFileInput);
        function voiceSendComplete(url,fileName,fileSize,mimeType,time){
            const ip=clientRealIP||"Unknown";
            const fileHTML=createFileMessageHTML(url,fileName,fileSize,mimeType,currentUser,ip,time,true,escapeHtml);
            let rawHtml=escapeHtml(currentUser)+" ["+ip+"] ("+time+"):<br>"+fileHTML;
            let li=document.createElement("li");
            li.innerHTML=rawHtml;
            li.classList.add("userMessage");
            messagesList.appendChild(li);
            scrollToBottom(messagesList);
            checkScrollPosition(messagesList,scrollBtn,autoScroll);
        }
        function voiceFallbackToFile(){
            showChatError(chatErrorDiv,"Mic is blocked on plain HTTP. Pick an audio file instead.");
            voiceFileInput.click();
        }
        async function startVoiceRecording(){
            try{
                voiceStream=await navigator.mediaDevices.getUserMedia({audio:true});
                mediaChunks=[];
                mediaRecorder=new MediaRecorder(voiceStream);
                mediaRecorder.ondataavailable=e=>{if(e.data&&e.data.size>0)mediaChunks.push(e.data);};
                mediaRecorder.onstop=async()=>{
                    voiceBtnElem.style.background="";
                    const type=mediaRecorder.mimeType||"audio/webm";
                    const blob=new Blob(mediaChunks,{type});
                    const file=new File([blob],"voice_"+Date.now()+".webm",{type});
                    voiceStream.getTracks().forEach(t=>t.stop());
                    voiceStream=null;
                    if(socket&&socket.readyState===WebSocket.OPEN){
                        await sendFileChunked(file,socket,currentUser,clientRealIP,getCurrentTime,showChatError,chatErrorDiv,voiceSendComplete);
                    }
                    else{
                        showChatError(chatErrorDiv,"Connection lost.");
                    }
                };
                mediaRecorder.start();
                voiceBtnElem.style.background="red";
            }
            catch(err){
                voiceStream=null;
                voiceFallbackToFile();
            }
        }
        voiceFileInput.addEventListener("change",async()=>{
            const file=voiceFileInput.files[0];
            voiceFileInput.value="";
            if(!file)return;
            if(socket&&socket.readyState===WebSocket.OPEN){
                await sendFileChunked(file,socket,currentUser,clientRealIP,getCurrentTime,showChatError,chatErrorDiv,voiceSendComplete);
            }
            else{
                showChatError(chatErrorDiv,"Connection lost.");
            }
        });
        voiceBtnElem.addEventListener("click",()=>{
            if(mediaRecorder&&mediaRecorder.state==="recording"){
                mediaRecorder.stop();
                return;
            }
            if(window.isSecureContext===false||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
                voiceFallbackToFile();
                return;
            }
            startVoiceRecording();
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
        let ignoreOptElem=document.getElementById("ignoreOption");
        let copyOptElem=document.getElementById("copyOption");
        let pinOptElem=document.getElementById("pinOption");
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
        if(ignoreOptElem){
            ignoreOptElem.addEventListener("click",()=>{
                let sender=window.currentReplySender;
                if(sender){
                    prefs.ignoredUsers=prefs.ignoredUsers||[];
                    if(prefs.ignoredUsers.indexOf(sender)===-1){
                        prefs.ignoredUsers.push(sender);
                        savePrefs();
                        applyVisibilityFilters();
                        showChatError(chatErrorDiv,"Ignored "+sender+". Messages hidden.");
                    }
                }
                contextMenuElem.style.display="none";
            });
        }
        if(copyOptElem){
            copyOptElem.addEventListener("click",()=>{
                if(window.currentReplyRawText){
                    copyTextToClipboard(window.currentReplyRawText);
                }
                contextMenuElem.style.display="none";
            });
        }
        if(pinOptElem){
            pinOptElem.addEventListener("click",()=>{
                let li=window.currentReplyLi;
                if(li){
                    if(li.classList.contains("msg-pinned")){
                        li.classList.remove("msg-pinned");
                        messagesList.appendChild(li);
                    }
                    else{
                        li.classList.add("msg-pinned");
                        messagesList.insertBefore(li,messagesList.firstChild);
                    }
                    scrollToBottom(messagesList);
                }
                contextMenuElem.style.display="none";
            });
        }
    }
    let savedTheme=localStorage.getItem("chatTheme");
    if(!savedTheme){savedTheme=getSystemTheme();}
    applyTheme(savedTheme);
    let themeToggleElem=document.getElementById("themeToggle");
    let settingsBtnEl=document.getElementById("settingsBtn");
    if(settingsBtnEl){
        settingsBtnEl.addEventListener("click",openSettings);
    }
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
    messagesList.addEventListener("scroll",()=>{
        checkScrollPosition(messagesList,scrollBtn,autoScroll);
        if(messagesList.scrollHeight-messagesList.scrollTop<=messagesList.clientHeight+10){
            newMsgDividerShown=false;
        }
    });
    if(scrollBtn){
        scrollBtn.addEventListener("click",()=>{
            scrollToBottom(messagesList);
            autoScroll=true;
            scrollBtn.style.display="none";
        });
    }
    setTimeout(()=>{
        if(socket&&socket.readyState===WebSocket.OPEN){
            initFileHandlers(socket,currentUser,clientRealIP,getCurrentTime,showChatError,chatErrorDiv,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml);
        }
        else{
            const checkSocket=setInterval(()=>{
                if(socket&&socket.readyState===WebSocket.OPEN){
                    clearInterval(checkSocket);
                    initFileHandlers(socket,currentUser,clientRealIP,getCurrentTime,showChatError,chatErrorDiv,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml);
                }
            },100);
        }
    },500);
});