export function connectWebSocket(port,handlers){
    let serverHost=window.location.hostname;
    let wsUrl=`ws://${serverHost}:${port}`;
    let socket=new WebSocket(wsUrl);
    socket.onopen=()=>{
        if(handlers.onOpen) handlers.onOpen();
    };
    socket.onmessage=(event)=>{
        let data=JSON.parse(event.data);
        if(handlers.onMessage) handlers.onMessage(data);
    };
    socket.onerror=(e)=>{
        if(handlers.onError) handlers.onError(e);
    };
    socket.onclose=()=>{
        if(handlers.onClose) handlers.onClose();
    };
    return socket;
}