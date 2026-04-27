export function createModal(promptMessage, defaultValue, callback){
    let overlay=document.createElement("div");
    overlay.className="modal-overlay";
    let box=document.createElement("div");
    box.className="modal-box";
    let label=document.createElement("div");
    label.textContent=promptMessage;
    label.style.marginBottom="0.5rem";
    let input=document.createElement("input");
    input.type="text";
    input.value=defaultValue||"";
    let buttonDiv=document.createElement("div");
    let okBtn=document.createElement("button");
    okBtn.textContent="OK";
    let cancelBtn=document.createElement("button");
    cancelBtn.textContent="Cancel";
    buttonDiv.appendChild(okBtn);
    buttonDiv.appendChild(cancelBtn);
    box.appendChild(label);
    box.appendChild(input);
    box.appendChild(buttonDiv);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    function close(){
        overlay.remove();
    }
    okBtn.onclick=()=>{
        let val=input.value.trim();
        close();
        callback(val);
    };
    cancelBtn.onclick=()=>{
        close();
        callback(null);
    };
    input.addEventListener("keypress",(e)=>{
        if(e.key=="Enter"){
            okBtn.click();
        }
    });
    input.focus();
}
export function showChatError(chatErrorDiv,msg){
    if(!chatErrorDiv){return;}
    chatErrorDiv.textContent=msg;
    chatErrorDiv.classList.add("show");
    setTimeout(()=>{chatErrorDiv.classList.remove("show");},3000);
}
export function shakeElement(el){
    if(!el){return;}
    el.classList.add("shake");
    setTimeout(()=>{el.classList.remove("shake");},400);
}
export function getCurrentTime(){
    let now=new Date();
    return `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`;
}
export function scrollToBottom(messagesList){
    messagesList.scrollTop=messagesList.scrollHeight;
}
export function checkScrollPosition(messagesList,scrollBtn,autoScroll){
    let isAtBottom=messagesList.scrollHeight-messagesList.scrollTop<=messagesList.clientHeight+10;
    if(isAtBottom){
        autoScroll=true;
        if(scrollBtn){scrollBtn.style.display="none";}
    }
    else{
        autoScroll=false;
        if(scrollBtn){scrollBtn.style.display="flex";}
    }
}
export function updateTypingIndicatorUI(currentTypers,typingIndicatorDiv){
    if(!typingIndicatorDiv){return;}
    let arr=Array.from(currentTypers);
    if(arr.length===0){typingIndicatorDiv.textContent="";}
    else if(arr.length===1){typingIndicatorDiv.textContent=`${escapeHtml(arr[0])} is typing...`;}
    else{
        let last=arr.pop();
        typingIndicatorDiv.textContent=`${arr.map(escapeHtml).join(", ")} and ${escapeHtml(last)} are typing...`;
    }
}
function escapeHtml(str){
    return str.replace(/[&<>]/g,function(m){
        if(m=="&"){return "&amp;";}
        if(m=="<"){return "&lt;";}
        if(m==">"){return "&gt;";}
        return m;
    });
}
export function wrapSelection(textarea,before,after){
    let start=textarea.selectionStart;
    let end=textarea.selectionEnd;
    let text=textarea.value;
    let selected=text.substring(start,end);
    let newText=text.substring(0,start)+before+selected+after+text.substring(end);
    textarea.value=newText;
    if(selected.length===0){
        textarea.selectionStart=start+before.length;
        textarea.selectionEnd=start+before.length;
    }
    else{
        textarea.selectionStart=start;
        textarea.selectionEnd=end+before.length+after.length;
    }
    textarea.focus();
}
export async function convertToWebP(file){
    return new Promise((resolve,reject)=>{
        let img=new Image();
        img.onload=()=>{
            let canvas=document.createElement("canvas");
            let max=800;
            let w=img.width,h=img.height;
            if(w>max){h=h*max/w;w=max;}
            if(h>max){w=w*max/h;h=max;}
            canvas.width=w;canvas.height=h;
            let ctx=canvas.getContext("2d");
            ctx.drawImage(img,0,0,w,h);
            resolve(canvas.toDataURL("image/webp",0.7));
        };
        img.onerror=()=>reject("Image load failed");
        img.src=URL.createObjectURL(file);
    });
}
export function insertReplyQuote(userMessage,sender,rawMessage){
    let quotedText=`> @${sender}: ${rawMessage}\n`;
    let cursor=userMessage.selectionStart;
    let val=userMessage.value;
    let newVal=val.substring(0,cursor)+quotedText+val.substring(cursor);
    userMessage.value=newVal;
    userMessage.selectionStart=cursor+quotedText.length;
    userMessage.selectionEnd=cursor+quotedText.length;
    userMessage.focus();
}
export function insertForwardToPrivate(userMessage,sender,rawMessage){
    createModal("Enter target username to forward to:", "", (target)=>{
        if(target&&target.trim()){
            let forwardText=`/msg "${target.trim()}" > @${sender}: ${rawMessage}`;
            let cursor=userMessage.selectionStart;
            let val=userMessage.value;
            let newVal=val.substring(0,cursor)+forwardText+val.substring(cursor);
            userMessage.value=newVal;
            userMessage.selectionStart=cursor+forwardText.length;
            userMessage.selectionEnd=cursor+forwardText.length;
            userMessage.focus();
        }
    });
}
export function exportChatLog(messagesList,chatErrorDiv){
    let messages=messagesList.children;
    if(messages.length===0){
        showChatError(chatErrorDiv,"No messages to export.");
        return;
    }
    let formatSelect=document.getElementById("exportFormat");
    let format=formatSelect?formatSelect.value:"text";
    let fileName=`chat_log_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}`;
    let content,mime;
    if(format==="json"){
        let items=[];
        for(let li of messages){
            let text=li.innerText||li.textContent;
            if(text.trim()){items.push({text,timestamp:new Date().toISOString()});}
        }
        content=JSON.stringify(items,null,2);
        mime="application/json";
        fileName+=".json";
    }
    else if(format==="html"){
        let htmlContent="<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Chat Export</title><style>body{font-family:sans-serif;padding:20px;} .userMessage{color:#EC1414;} .otherMessage{color:#000;}</style></head><body>";
        for(let li of messages){
            let clone=li.cloneNode(true);
            let replyBtn=clone.querySelector(".reply-btn");
            if(replyBtn){replyBtn.remove();}
            htmlContent+=clone.outerHTML;
        }
        htmlContent+="</body></html>";
        content=htmlContent;
        mime="text/html";
        fileName+=".html";
    }
    else{
        let lines=[];
        for(let li of messages){
            let text=li.innerText||li.textContent;
            if(text.trim()){lines.push(text);}
        }
        content=lines.join("\n");
        mime="text/plain";
        fileName+=".txt";
    }
    let blob=new Blob([content],{type:mime});
    let link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download=fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}
export function applyTheme(theme){
    let hljsTheme=document.getElementById("hljs-theme");
    let lightTheme="/vs.min.css";
    let darkTheme="/vs2015.min.css";
    if(hljsTheme){
        hljsTheme.href=theme==="dark"?darkTheme:lightTheme;
    }
    if(theme==="dark"){
        document.body.setAttribute("data-theme","dark");
    }
    else{
        document.body.setAttribute("data-theme","light");
    }
}
export function getSystemTheme(){
    return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
}
export function setHighlightTheme(theme){
    let hljsTheme=document.getElementById("hljs-theme");
    let lightTheme="/vs.min.css";
    let darkTheme="/vs2015.min.css";
    if(hljsTheme){
        hljsTheme.href=theme==="dark"?darkTheme:lightTheme;
    }
}