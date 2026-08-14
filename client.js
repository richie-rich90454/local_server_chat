import express from"express";
import http from"http";
import{WebSocket}from"ws";
import dgram from"dgram";
import{createStaticMiddleware}from"./src/server/static.js";
import{DISCOVERY_ADDRESS,DISCOVERY_PORT,DISCOVERY_TYPE,PROTOCOL_VERSION}from"./src/protocol/constants.js";
const discoveredServers=new Map();
let sseClients=[];
let activeConnection=null;
let remoteSocket=null;
const app=express();
app.use(express.json());
app.use(createStaticMiddleware());
app.get("/client-info",(req,res)=>{
	res.json({mode:"client",protocol:PROTOCOL_VERSION});
});
app.get("/discovery/events",(req,res)=>{
	res.setHeader("Content-Type","text/event-stream");
	res.setHeader("Cache-Control","no-cache");
	res.setHeader("Connection","keep-alive");
	res.flushHeaders();
	let send=()=>{
		let servers=[];
		for(const[s]of discoveredServers){
			servers.push(s);
		}
		res.write("data: "+JSON.stringify({servers})+"\n\n");
	};
	send();
	let interval=setInterval(send,2000);
	sseClients.push({res,interval});
	req.on("close",()=>{
		clearInterval(interval);
		sseClients=sseClients.filter(c=>c.res!==res);
	});
});
app.get("/discover",(req,res)=>{
	let servers=[];
	for(const[s]of discoveredServers){
		servers.push(s);
	}
	res.json({servers});
});
app.post("/connect",(req,res)=>{
	let{ip,port}=req.body;
	if(!ip||!port){
		res.json({error:"Missing ip or port"});
		return;
	}
	if(remoteSocket){
		try{remoteSocket.close();}catch(e){}
		remoteSocket=null;
	}
	res.json({ok:true});
});
app.get("/disconnect",(req,res)=>{
	if(remoteSocket){
		try{remoteSocket.close();}catch(e){}
		remoteSocket=null;
	}
	res.json({ok:true});
});
const server=http.createServer(app);
server.listen(0,"127.0.0.1",()=>{
	let port=server.address().port;
	console.log(`Client UI on http://127.0.0.1:${port}`);
	let url=`http://127.0.0.1:${port}`;
	if(process.platform==="win32"){
		import("child_process").then(cp=>cp.exec(`start "" "${url}"`));
	}
	else if(process.platform==="darwin"){
		import("child_process").then(cp=>cp.exec(`open "${url}"`));
	}
	else{
		import("child_process").then(cp=>cp.exec(`xdg-open "${url}"`));
	}
});
const discoverySocket=dgram.createSocket({type:"udp4",reuseAddr:true});
discoverySocket.bind(DISCOVERY_PORT,()=>{
	try{
		discoverySocket.addMembership(DISCOVERY_ADDRESS);
		discoverySocket.setBroadcast(true);
		console.log(`Listening for LAN servers on ${DISCOVERY_ADDRESS}:${DISCOVERY_PORT}`);
	}
	catch(e){
		console.log("Discovery listener: "+e.message);
	}
});
discoverySocket.on("message",(msg,rinfo)=>{
	try{
		let data=JSON.parse(msg.toString());
		if(data.type===DISCOVERY_TYPE&&data.version===PROTOCOL_VERSION){
			let key=data.ip+":"+data.port;
			let server={name:data.name||"Unknown",ip:data.ip,port:data.port,users:data.users||0,rooms:data.rooms||0,joinCode:data.joinCode,lastSeen:Date.now()};
			discoveredServers.set(key,server);
			setTimeout(()=>{discoveredServers.delete(key);},10000);
		}
	}
	catch(e){}
});
discoverySocket.on("error",(err)=>{
	console.log("Discovery listener error: "+err.message);
});
process.on("SIGTERM",()=>{
	discoverySocket.close();
	server.close();
	process.exit(0);
});
process.on("SIGINT",()=>{
	discoverySocket.close();
	server.close();
	process.exit(0);
});
