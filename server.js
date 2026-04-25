import WebSocket,{WebSocketServer} from "ws";
import {networkInterfaces} from "os";
import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import {Filter} from "bad-words";
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const getLocalIP=()=>{
	const nets=networkInterfaces();
	for(const iface of Object.values(nets)){
		for(const net of iface){
			if(net.family=="IPv4"&&!net.internal&&!net.address.startsWith("192.168.137")&&!net.address.startsWith("26.26.26.1")){
				return net.address;
			}
		}
	}
	return "localhost";
};
const localIP=getLocalIP();
const portWS=8191;
const portUI=2047;
const app=express();
app.use(express.json());
app.use(express.static(path.join(__dirname,"dist")));
app.get("/",(req,res)=>{
	res.sendFile(path.join(__dirname,"public","index.html"));
});
app.get("/get-client-ip",(req,res)=>{
	let ip=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
	if(ip&&ip.includes("::ffff:")){
		ip=ip.split("::ffff:")[1];
	}
	res.json({ip:ip});
});
app.listen(portUI,()=>{
	console.log(`UI on http://${localIP}:${portUI}`);
});
const filter=new Filter();
app.post("/check-name",(req,res)=>{
	const {name}=req.body;
	const isClean=!filter.isProfane(name);
	res.json({clean:isClean});
});
const wsServer=new WebSocketServer({port:portWS,host:"::"});
let clients=[];
let usernameToWs=new Map();
function broadcastOnlineCount(){
	const count=clients.length;
	clients.forEach(client=>{
		if(client.readyState===WebSocket.OPEN){
			client.send(JSON.stringify({type:"onlineCount",count}));
		}
	});
}
function getCurrentUsersList(){
	let users=[];
	for(const [username] of usernameToWs.entries()){
		users.push(username);
	}
	return users.join(", ");
}
function broadcastSystemMessage(message,excludeWs=null){
	clients.forEach(client=>{
		if(client!==excludeWs&&client.readyState===WebSocket.OPEN){
			client.send(JSON.stringify({type:"system",message}));
		}
	});
}
wsServer.on("connection",(ws,req)=>{
	clients.push(ws);
	broadcastOnlineCount();
	console.log("New connection established"+". Number of client(s): "+clients.length);
	let clientIP=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
	if(clientIP&&clientIP.includes("::ffff:")){
		clientIP=clientIP.split("::ffff:")[1];
	}
	ws.clientIP=clientIP;
	ws.send(JSON.stringify({type:"system",message:`Your IP is ${clientIP}`}));
	ws.on("message",(message)=>{
		const data=JSON.parse(message);
		if(data.type=="join"){
			ws.username=data.username;
			usernameToWs.set(data.username,ws);
			broadcastOnlineCount();
			const userList=getCurrentUsersList();
			clients.forEach(client=>{
				if(client.readyState===WebSocket.OPEN){
					client.send(JSON.stringify({type:"system",message:`${data.username} joined the chat. Current users: ${userList}`}));
				}
			});
			return;
		}
		else if(data.type=="getUsers"){
			const userList=getCurrentUsersList();
			if(ws.readyState===WebSocket.OPEN){
				ws.send(JSON.stringify({type:"system",message:`Online users: ${userList}`}));
			}
			return;
		}
		else if(data.type=="private"){
			const targetWs=usernameToWs.get(data.target);
			if(!targetWs||targetWs.readyState!==WebSocket.OPEN){
				if(ws.readyState===WebSocket.OPEN){
					ws.send(JSON.stringify({type:"system",message:`User "${data.target}" is not online.`}));
				}
				return;
			}
			targetWs.send(JSON.stringify({
				type:"private",
				from:data.username,
				message:data.message,
				ip:ws.clientIP||"Unknown IP",
				timestamp:data.timestamp
			}));
			if(ws.readyState===WebSocket.OPEN){
				ws.send(JSON.stringify({
					type:"private",
					from:data.username,
					message:data.message,
					ip:ws.clientIP||"Unknown IP",
					timestamp:data.timestamp,
					self:true,
					target:data.target
				}));
			}
			return;
		}
		clients.forEach((client)=>{
			if(client.readyState==WebSocket.OPEN){
				client.send(JSON.stringify({
					username:data.username,
					message:data.message,
					ip:ws.clientIP||"Unknown IP"
				}));
			}
		});
	});
	ws.on("close",()=>{
		const index=clients.indexOf(ws);
		if(index!=-1){
			clients.splice(index,1);
			if(ws.username){
				usernameToWs.delete(ws.username);
				const userList=getCurrentUsersList();
				broadcastSystemMessage(`${ws.username} left the chat. Current users: ${userList}`);
			}
			broadcastOnlineCount();
			console.log(`Client disconnected. Remaining: ${clients.length}`);
		}
	});
});
console.log(`WebSocket server on ws://${localIP}:${portWS}`);