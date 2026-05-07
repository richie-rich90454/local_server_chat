export const MAX_FILE_SIZE=5*1024*1024*1024;
export const CHUNK_SIZE=64*1024;
export const ALLOWED_FILE_TYPES=[];

export function formatFileSize(bytes){
    if(bytes===0)return"0 Bytes";
    const k=1024;
    const sizes=["Bytes","KB","MB","GB"];
    const i=Math.floor(Math.log(bytes)/Math.log(k));
    return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+" "+sizes[i];
}
export function getFileTypeCategory(mimeType){
    if(mimeType.startsWith("image/"))return"image";
    if(mimeType==="application/pdf")return"pdf";
    if(mimeType.includes("zip")||mimeType.includes("rar")||mimeType.includes("7z"))return"archive";
    if(mimeType.startsWith("text/")||mimeType.includes("json")||mimeType.includes("xml"))return"document";
    if(mimeType.includes("javascript")||mimeType.includes("html")||mimeType.includes("css"))return"code";
    if(mimeType.startsWith("video/"))return"video";
    if(mimeType.startsWith("audio/"))return"audio";
    return"other";
}
export function getFileIconSVG(fileType){
    const icons={
        image:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        pdf:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2H13L20 9V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 2V9H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><text x="6" y="18" font-size="8" fill="currentColor">PDF</text></svg>`,
        archive:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2Z" stroke="currentColor" stroke-width="2"/><path d="M8 2V6" stroke="currentColor" stroke-width="2"/><path d="M16 2V6" stroke="currentColor" stroke-width="2"/><path d="M8 10H16" stroke="currentColor" stroke-width="2"/><path d="M8 14H16" stroke="currentColor" stroke-width="2"/><path d="M8 18H12" stroke="currentColor" stroke-width="2"/></svg>`,
        document:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 2H13L20 9V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 2V9H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 13H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 17H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
        video:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M9 8L15 12L9 16V8Z" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
        audio:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18V5L20 3V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="16" r="3" stroke="currentColor" stroke-width="2"/></svg>`,
        default:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 2V9H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    };
    return icons[fileType]||icons.default;
}
export function createFileMessageHTML(fileData,fileName,fileSize,mimeType,username,ip,timestamp,isSender,escapeHtml){
    const fileType=getFileTypeCategory(mimeType);
    const fileIcon=getFileIconSVG(fileType);
    const formattedSize=formatFileSize(fileSize);
    const fileId="file_"+Date.now()+"_"+Math.random().toString(36).substr(2,9);
    let previewHtml="";
    if(fileType==="image"&&fileData){
        previewHtml=`<img src="${fileData}" class="file-preview-image" alt="Preview">`;
    }
    if(fileType==="video"&&fileData){
        previewHtml=`<video controls class="file-preview-video" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:5px;"><source src="${fileData}"></video>`;
    }
    if(fileType==="audio"&&fileData){
        previewHtml=`<audio controls class="file-preview-audio" style="width:100%;margin-top:5px;"><source src="${fileData}"></audio>`;
    }
    return `
        <div class="file-message" data-file-id="${fileId}" data-file-name="${fileName}" data-file-data="${fileData||""}">
            <div class="file-icon">${fileIcon}</div>
            <div class="file-info">
                <div class="file-name">
                    ${escapeHtml(fileName)}
                    <span class="file-type-badge file-type-${fileType}">${fileType.toUpperCase()}</span>
                </div>
                <div class="file-size">${formattedSize}</div>
                ${previewHtml}
            </div>
            <div class="download-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        </div>
    `;
}
export function showUploadProgress(filename){
    let progressDiv=document.getElementById("uploadProgress");
    if(!progressDiv){
        progressDiv=document.createElement("div");
        progressDiv.id="uploadProgress";
        progressDiv.className="upload-progress hidden";
        progressDiv.innerHTML=`
            <div class="upload-filename"></div>
            <div class="progress-bar"><div class="progress-fill"></div></div>
        `;
        document.body.appendChild(progressDiv);
    }
    progressDiv.querySelector(".upload-filename").textContent="Uploading: "+filename;
    progressDiv.querySelector(".progress-fill").style.width="0%";
    progressDiv.classList.remove("hidden");
}
export function updateUploadProgress(percent){
    const progressDiv=document.getElementById("uploadProgress");
    if(progressDiv){
        progressDiv.querySelector(".progress-fill").style.width=percent+"%";
    }
}
export function hideUploadProgress(){
    const progressDiv=document.getElementById("uploadProgress");
    if(progressDiv){
        progressDiv.classList.add("hidden");
        setTimeout(()=>{
            progressDiv.querySelector(".progress-fill").style.width="0%";
        },300);
    }
}
export async function sendFileChunked(file, socket, currentUser, clientRealIP, getCurrentTime, showChatError, chatErrorDiv, onSendComplete){
    if(file.size>MAX_FILE_SIZE){
        showChatError(chatErrorDiv,"File too large! Maximum size: "+formatFileSize(MAX_FILE_SIZE));
        return false;
    }
    if(!socket||socket.readyState!==WebSocket.OPEN){
        showChatError(chatErrorDiv,"Connection lost. Cannot send file.");
        return false;
    }
    const totalChunks=Math.ceil(file.size/CHUNK_SIZE);
    const transferId="f_"+Date.now().toString(36)+"_"+Math.random().toString(36).substr(2,9);
    try{
        showUploadProgress(file.name);
        socket.send(JSON.stringify({
            type:"file-start",
            transferId:transferId,
            fileName:file.name,
            fileSize:file.size,
            mimeType:file.type,
            totalChunks:totalChunks,
            chunkSize:CHUNK_SIZE,
            username:currentUser,
            ip:clientRealIP,
            timestamp:getCurrentTime()
        }));
        for(let i=0;i<totalChunks;i++){
            const start=i*CHUNK_SIZE;
            const end=Math.min(start+CHUNK_SIZE,file.size);
            const slice=file.slice(start,end);
            const arrayBuf=await slice.arrayBuffer();
            const tidLen=transferId.length;
            const headerLen=4+tidLen+4;
            const header=new ArrayBuffer(headerLen);
            const view=new DataView(header);
            view.setUint32(0,tidLen,false);
            for(let j=0;j<tidLen;j++) view.setUint8(4+j,transferId.charCodeAt(j));
            view.setUint32(4+tidLen,i,false);
            const combined=new Uint8Array(headerLen+arrayBuf.byteLength);
            combined.set(new Uint8Array(header),0);
            combined.set(new Uint8Array(arrayBuf),headerLen);
            socket.send(combined.buffer);
            const pct=Math.round(((i+1)/totalChunks)*100);
            updateUploadProgress(pct);
            await new Promise(r=>setTimeout(r,0));
        }
        socket.send(JSON.stringify({type:"file-end",transferId:transferId}));
        if(onSendComplete){
            const url=URL.createObjectURL(file);
            onSendComplete(url, file.name, file.size, file.type, getCurrentTime());
        }
        setTimeout(()=>hideUploadProgress(),500);
        return true;
    }
    catch(err){
        hideUploadProgress();
        showChatError(chatErrorDiv,"Failed to send file: "+err.message);
        return false;
    }
}
export async function sendMultipleFiles(files, socket, currentUser, clientRealIP, getCurrentTime, showChatError, chatErrorDiv, onSendComplete){
    const validFiles=Array.from(files).filter(file=>{
        if(file.size>MAX_FILE_SIZE){
            showChatError(chatErrorDiv,"Skipping "+file.name+": Too large");
            return false;
        }
        return true;
    });
    if(validFiles.length===0)return;
    showChatError(chatErrorDiv,"Sending "+validFiles.length+" file(s)...");
    for(const file of validFiles){
        await sendFileChunked(file, socket, currentUser, clientRealIP, getCurrentTime, showChatError, chatErrorDiv, onSendComplete);
        await new Promise(resolve=>setTimeout(resolve,500));
    }
    showChatError(chatErrorDiv,"Sent "+validFiles.length+" file(s)");
}
const incomingFiles=new Map();
export function handleBinaryChunk(arrayBuffer,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml,getCurrentTime,currentUser,showChatError,chatErrorDiv){
    if(arrayBuffer.byteLength<8)return;
    const view=new DataView(arrayBuffer);
    const tidLen=view.getUint32(0,false);
    if(4+tidLen+4>arrayBuffer.byteLength)return;
    let transferId="";
    for(let i=0;i<tidLen;i++) transferId+=String.fromCharCode(view.getUint8(4+i));
    const chunkIndex=view.getUint32(4+tidLen,false);
    const dataStart=4+tidLen+4;
    const chunkData=new Uint8Array(arrayBuffer.slice(dataStart));
    if(!incomingFiles.has(transferId)){
        if(!incomingFiles._pending) incomingFiles._pending=new Map();
        if(!incomingFiles._pending.has(transferId)) incomingFiles._pending.set(transferId,[]);
        incomingFiles._pending.get(transferId).push({index:chunkIndex,data:chunkData});
    }
    else{
        const meta=incomingFiles.get(transferId);
        if(!meta.chunks) meta.chunks=[];
        meta.chunks[chunkIndex]=chunkData;
        checkFileComplete(transferId,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml,getCurrentTime,currentUser,showChatError,chatErrorDiv);
    }
}
export function handleFileStart(data,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml,getCurrentTime,currentUser,showChatError,chatErrorDiv){
    const meta={
        transferId:data.transferId,
        fileName:data.fileName,
        fileSize:data.fileSize,
        mimeType:data.mimeType,
        username:data.username,
        ip:data.ip,
        timestamp:data.timestamp,
        chunks:[],
        totalChunks:data.totalChunks
    };
    incomingFiles.set(data.transferId,meta);
    if(incomingFiles._pending&&incomingFiles._pending.has(data.transferId)){
        const pending=incomingFiles._pending.get(data.transferId);
        for(const p of pending){
            meta.chunks[p.index]=p.data;
        }
        incomingFiles._pending.delete(data.transferId);
        checkFileComplete(data.transferId,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml,getCurrentTime,currentUser,showChatError,chatErrorDiv);
    }
}
function checkFileComplete(transferId,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml,getCurrentTime,currentUser,showChatError,chatErrorDiv){
    const meta=incomingFiles.get(transferId);
    if(!meta)return;
    const received=meta.chunks.filter(Boolean).length;
    if(received!==meta.totalChunks)return;
    const ordered=[];
    for(let i=0;i<meta.totalChunks;i++){
        ordered.push(meta.chunks[i]);
    }
    const blob=new Blob(ordered,{type:meta.mimeType});
    const url=URL.createObjectURL(blob);
    const time=meta.timestamp||getCurrentTime();
    const ip=meta.ip||"Unknown";
    const fileHTML=createFileMessageHTML(url,meta.fileName,meta.fileSize,meta.mimeType,meta.username,ip,time,meta.username===currentUser,escapeHtml);
    let rawHtml=escapeHtml(meta.username)+" ["+ip+"] ("+time+"):<br>"+fileHTML;
    let li=document.createElement("li");
    li.innerHTML=rawHtml;
    if(meta.username===currentUser) li.classList.add("userMessage");
    else li.classList.add("otherMessage");
    const fileDiv=li.querySelector(".file-message");
    if(fileDiv){
        fileDiv.addEventListener("click",(e)=>{
            e.stopPropagation();
            const a=document.createElement("a");
            a.href=url;
            a.download=meta.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
    messagesList.appendChild(li);
    scrollToBottom(messagesList);
    checkScrollPosition(messagesList,scrollBtn,autoScroll);
    incomingFiles.delete(transferId);
}
export function handleFileEnd(data){}
export function initFileHandlers(socket,currentUser,clientRealIP,getCurrentTime,showChatError,chatErrorDiv,messagesList,scrollToBottom,checkScrollPosition,scrollBtn,autoScroll,escapeHtml){
    const onSendComplete=(url, fileName, fileSize, mimeType, time)=>{
        const ip=clientRealIP||"Unknown";
        const fileHTML=createFileMessageHTML(url, fileName, fileSize, mimeType, currentUser, ip, time, true, escapeHtml);
        let rawHtml=escapeHtml(currentUser)+" ["+ip+"] ("+time+"):<br>"+fileHTML;
        let li=document.createElement("li");
        li.innerHTML=rawHtml;
        li.classList.add("userMessage");
        const fileDiv=li.querySelector(".file-message");
        if(fileDiv){
            fileDiv.addEventListener("click",(e)=>{
                e.stopPropagation();
                const a=document.createElement("a");
                a.href=url;
                a.download=fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
        }
        messagesList.appendChild(li);
        scrollToBottom(messagesList);
        checkScrollPosition(messagesList,scrollBtn,autoScroll);
    };
    document.getElementById("fileBtn").addEventListener("click",()=>{
        document.getElementById("fileInput").click();
    });
    document.getElementById("fileInput").addEventListener("change",(e)=>{
        if(e.target.files.length>0){
            sendMultipleFiles(e.target.files, socket, currentUser, clientRealIP, getCurrentTime, showChatError, chatErrorDiv, onSendComplete);
            e.target.value="";
        }
    });
    const chatAreaDrop=document.getElementById("chatUI");
    chatAreaDrop.addEventListener("dragover",(e)=>{
        e.preventDefault();
        chatAreaDrop.style.opacity="0.8";
    });
    chatAreaDrop.addEventListener("dragleave",()=>{
        chatAreaDrop.style.opacity="1";
    });
    chatAreaDrop.addEventListener("drop",async(e)=>{
        e.preventDefault();
        chatAreaDrop.style.opacity="1";
        const files=Array.from(e.dataTransfer.files);
        if(files.length>0){
            await sendMultipleFiles(files, socket, currentUser, clientRealIP, getCurrentTime, showChatError, chatErrorDiv, onSendComplete);
        }
    });
}