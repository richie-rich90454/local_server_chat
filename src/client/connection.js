import{WS_PORT,MSG}from"../protocol/constants.js";
export function createConnectionManager(){
	let socket=null;
	let currentUser="";
	let clientRealIP="Unknown";
	let currentRoom="General";
	let reconnectAttempts=0;
	let reconnectTimer=null;
	let intentionalClose=false;
	let handlers={onMessage:null,onBinary:null,onOpen:null,onClose:null};
	function connect(host,port=WS_PORT){
		if(reconnectTimer){clearTimeout(reconnectTimer);}
		const wsUrl=`ws://${host}:${port}`;
		socket=new WebSocket(wsUrl);
		socket.binaryType="arraybuffer";
		socket.onopen=()=>{
			console.log("WebSocket connected");
			reconnectAttempts=0;
			if(handlers.onOpen)handlers.onOpen();
		};
		socket.onmessage=(event)=>{
			if(event.data instanceof ArrayBuffer){
				if(handlers.onBinary)handlers.onBinary(event.data);
			}
			else{
				let data;
				try{data=JSON.parse(event.data);}catch(e){return;}
				if(handlers.onMessage)handlers.onMessage(data);
			}
		};
		socket.onerror=(e)=>{
			if(handlers.onError)handlers.onError(e);
		};
		socket.onclose=()=>{
			if(handlers.onClose)handlers.onClose();
			if(!intentionalClose){
				let delay=Math.min(1000*Math.pow(1.5,reconnectAttempts),3000);
				if(reconnectAttempts===0)delay=3000;
				reconnectTimer=setTimeout(()=>{reconnectAttempts++;connect(host,port);},delay);
			}
		};
	}
	function send(data){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify(data));
			return true;
		}
		return false;
	}
	function sendRaw(data){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(data);
			return true;
		}
		return false;
	}
	function close(){
		intentionalClose=true;
		if(reconnectTimer){clearTimeout(reconnectTimer);}
		if(socket){socket.close();}
	}
	function setHandlers(h){handlers={...handlers,...h};}
	function getUsername(){return currentUser;}
	function setUsername(name){currentUser=name;}
	function getIP(){return clientRealIP;}
	function setIP(ip){clientRealIP=ip;}
	function getRoom(){return currentRoom;}
	function setRoom(room){currentRoom=room;}
	function getSocket(){return socket;}
	return{connect,send,sendRaw,close,setHandlers,getUsername,setUsername,getIP,setIP,getRoom,setRoom,getSocket};
}
