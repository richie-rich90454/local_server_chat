self.onmessage=(e)=>{
    const {chunks, totalChunks, mimeType, fileName, fileSize, username, ip, timestamp, currentUser}=e.data;
    const ordered=new Array(totalChunks);
    for(let i=0;i<totalChunks;i++){
        ordered[i]=chunks[i];
    }
    const blob=new Blob(ordered,{type:mimeType});
    const url=URL.createObjectURL(blob);
    const isSender=(username===currentUser);
    self.postMessage({url, fileName, fileSize, mimeType, username, ip, timestamp, isSender});
};