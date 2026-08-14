import express from"express";
import http from"http";
import os from"os";
import{WebSocket}from"ws";
import dgram from"dgram";
import{Filter}from"bad-words";
import{createStaticMiddleware}from"./src/server/static.js";
import{DISCOVERY_ADDRESS,DISCOVERY_PORT,DISCOVERY_TYPE,PROTOCOL_VERSION,WS_PORT,UI_PORT}from"./src/protocol/constants.js";
const discoveredServers=new Map();
let sseClients=[];
const app=express();
app.use(express.json());
app.use(createStaticMiddleware());
app.get("/client-info",(req,res)=>{
	res.json({mode:"client",protocol:PROTOCOL_VERSION});
});
app.get("/get-client-ip",(req,res)=>{
	let ip=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
	if(ip&&ip.includes("::ffff:")){
		ip=ip.split("::ffff:")[1];
	}
	res.json({ip:ip});
});
const filter=new Filter();
app.post("/check-name",(req,res)=>{
	const {name}=req.body;
	res.json({clean:!filter.isProfane(name)});
});
app.get("/server-info",(req,res)=>{
	res.json({name:null,port:WS_PORT,joinCode:null,uiPort:server.address().port,protocol:PROTOCOL_VERSION});
});
app.get("/join-code/:code",(req,res)=>{
	const code=req.params.code.toUpperCase();
	for(const s of discoveredServers.values()){
		if(s.joinCode===code){
			res.json({found:true,ip:s.ip,port:s.port,uiPort:UI_PORT});
			return;
		}
	}
	res.json({found:false});
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
		res.json({ok:false,error:"Missing ip or port"});
		return;
	}
	let sent=false;
	const done=obj=>{
		if(sent)return;
		sent=true;
		res.json(obj);
	};
	const probe=new WebSocket(`ws://${ip}:${port}`);
	const timer=setTimeout(()=>{
		try{probe.terminate();}catch(e){}
		done({ok:false,error:"Connection timed out"});
	},5000);
	probe.on("open",()=>{
		clearTimeout(timer);
		try{probe.close();}catch(e){}
		done({ok:true});
	});
	probe.on("error",err=>{
		clearTimeout(timer);
		done({ok:false,error:(err&&err.message)||"Connection failed"});
	});
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
function getLocalIPv4(){
	const nets=os.networkInterfaces();
	for(const iface of Object.values(nets)){
		for(const net of iface){
			if(net.family==="IPv4"&&!net.internal){
				return net.address;
			}
		}
	}
	return null;
}
const HTTP_SCAN_INTERVAL=10000;
const HTTP_SERVER_TTL=15000;
const SCAN_CONCURRENCY=40;
function probeHost(ip){
	const controller=new AbortController();
	const timer=setTimeout(()=>controller.abort(),500);
	fetch(`http://${ip}:${UI_PORT}/server-info`,{signal:controller.signal})
		.then(r=>r.ok?r.json():null)
		.then(info=>{
			if(info&&info.protocol===PROTOCOL_VERSION){
				const key=ip+":"+(info.port||WS_PORT);
				discoveredServers.set(key,{name:info.name||"Unknown",ip,port:info.port||WS_PORT,users:0,rooms:0,joinCode:info.joinCode||null,lastSeen:Date.now()});
				setTimeout(()=>{discoveredServers.delete(key);},HTTP_SERVER_TTL);
			}
		})
		.catch(()=>{})
		.finally(()=>clearTimeout(timer));
}
function httpScanOnce(){
	const local=getLocalIPv4();
	if(!local)return;
	const parts=local.split(".");
	const prefix=parts[0]+"."+parts[1]+"."+parts[2]+".";
	const ownLast=parseInt(parts[3],10);
	const hosts=[];
	for(let i=1;i<=254;i++){
		if(i===ownLast)continue;
		hosts.push(prefix+i);
	}
	let index=0;
	function next(){
		if(index>=hosts.length)return;
		const ip=hosts[index++];
		probeHost(ip);
		next();
	}
	for(let w=0;w<SCAN_CONCURRENCY;w++){next();}
}
httpScanOnce();
setInterval(httpScanOnce,HTTP_SCAN_INTERVAL);
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
