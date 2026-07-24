import{networkInterfaces}from"os";
import{parseArgs}from"./src/server/args.js";
import{createDiscoverySocket,stopDiscovery}from"./src/server/discovery.js";
import{createHttpServer}from"./src/server/http.js";
import{createWebSocketServer}from"./src/server/websocket.js";
import{WS_PORT,UI_PORT}from"./src/protocol/constants.js";
const getLocalIP=()=>{
	const nets=networkInterfaces();
	for(const iface of Object.values(nets)){
		for(const net of iface){
			if(net.family=="IPv4"&&!net.internal&&net.address!=="127.0.0.1"&&net.address!=="::1"){
				return net.address;
			}
		}
	}
	return "localhost";
};
const localIP=getLocalIP();
const{serverName,noHttp}=parseArgs(process.argv);
function generateJoinCode(){
	const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code="";
	for(let i=0;i<4;i++){
		code+=chars[Math.floor(Math.random()*chars.length)];
	}
	return code;
}
const joinCode=generateJoinCode();
const joinCodeMap=new Map();
joinCodeMap.set(joinCode,{ip:localIP,port:WS_PORT,uiPort:UI_PORT,name:serverName});
setInterval(()=>{
	for(const[key]of joinCodeMap.entries()){
		joinCodeMap.delete(key);
	}
	joinCodeMap.set(joinCode,{ip:localIP,port:WS_PORT,uiPort:UI_PORT,name:serverName});
},300000);
const{server:wsServer,getStats}=createWebSocketServer(WS_PORT,localIP);
let discoverySocket=null;
if(serverName){
	discoverySocket=createDiscoverySocket(serverName,localIP,WS_PORT,joinCode,getStats);
}
if(!noHttp){
	createHttpServer(localIP,UI_PORT,WS_PORT,serverName,joinCode,joinCodeMap);
}
console.log(`WebSocket server on ws://${localIP}:${WS_PORT}`+(serverName?` "${serverName}"`:""));
console.log(`Join code: ${joinCode}`);
function shutdown(){
	console.log("Shutting down...");
	if(discoverySocket){stopDiscovery(discoverySocket);}
	wsServer.close(()=>{console.log("WebSocket server closed.");process.exit(0);});
}
process.on("SIGTERM",shutdown);
process.on("SIGINT",shutdown);
