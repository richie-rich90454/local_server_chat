import WebSocket,{WebSocketServer} from "ws";
import {networkInterfaces} from "os";
import express from "express";
import path from "path";
import {fileURLToPath} from "url";
import {Filter} from "bad-words";
import dgram from "dgram";
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
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
const portWS=8191;
const portUI=2047;
function parseArgs(argv){
	let serverName=null;
	for(let i=2;i<argv.length;i++){
		if(argv[i]==="--name"&&argv[i+1]){
			serverName=argv[i+1];
			i++;
		}
	}
	return{serverName};
}
const args=parseArgs(process.argv);
const serverName=args.serverName;
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
joinCodeMap.set(joinCode,{ip:localIP,port:portWS,uiPort:portUI,name:serverName});
setInterval(()=>{
	for(const[key]of joinCodeMap.entries()){
		joinCodeMap.delete(key);
	}
	joinCodeMap.set(joinCode,{ip:localIP,port:portWS,uiPort:portUI,name:serverName});
},300000);
const DISCOVERY_ADDRESS="224.0.0.1";
const DISCOVERY_PORT=9876;
const DISCOVERY_INTERVAL=2000;
const DISCOVERY_PACKET=JSON.stringify({
	type:"local-chat-server",
	name:serverName,
	ip:localIP,
	port:portWS,
	uiPort:portUI,
	joinCode:joinCode
});
function startDiscovery(){
	const socket=dgram.createSocket({type:"udp4",reuseAddr:true});
	socket.bind(DISCOVERY_PORT);
	socket.on("listening",()=>{
		socket.addMembership(DISCOVERY_ADDRESS);
		socket.setBroadcast(true);
		console.log(`LAN discovery active on ${DISCOVERY_ADDRESS}:${DISCOVERY_PORT}`);
	});
	socket.on("error",(err)=>{
		console.log("Discovery socket error: "+err.message);
	});
	const broadcast=()=>{
		const msg=Buffer.from(DISCOVERY_PACKET);
		socket.send(msg,0,msg.length,DISCOVERY_PORT,DISCOVERY_ADDRESS);
	};
	broadcast();
	setInterval(broadcast,DISCOVERY_INTERVAL);
	return socket;
}
const app=express();
app.use(express.json());
app.use(express.static(path.join(__dirname,"dist"),{
	maxAge:"1h",
	etag:true,
	lastModified:true,
	setHeaders(res,filePath){
		if(filePath.endsWith("sw.js")||filePath.endsWith("index.html")){
			res.setHeader("Cache-Control","no-cache");
		}
	}
}));
app.get("/get-client-ip",(req,res)=>{
	let ip=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
	if(ip&&ip.includes("::ffff:")){
		ip=ip.split("::ffff:")[1];
	}
	res.json({ip:ip});
});
app.get("/server-info",(req,res)=>{
	res.json({
		name:serverName,
		port:portWS,
		ip:localIP,
		joinCode:joinCode,
		uiPort:portUI
	});
});
app.get("/join-code/:code",(req,res)=>{
	const info=joinCodeMap.get(req.params.code.toUpperCase());
	if(info){
		res.json({found:true,...info});
	}
	else{
		res.json({found:false});
	}
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
const wsServer=new WebSocketServer({
	port:portWS,
	host:"::",
	pingInterval:30000,
	pingTimeout:10000,
    maxPayload: 5*1024*1024*1024,
});
let clients=[];
let usernameToWs=new Map();
const rateLimitMap=new Map();
const RATE_LIMIT=3;
const RATE_WINDOW=1000;
const BAN_DURATION=5000;
function checkRateAndBan(username){
	const now=Date.now();
	if(!rateLimitMap.has(username)){
		rateLimitMap.set(username,{count:1,lastReset:now,bannedUntil:0});
		return true;
	}
	let entry=rateLimitMap.get(username);
	if(entry.bannedUntil>now){
		return false;
	}
	if(now-entry.lastReset>RATE_WINDOW){
		entry.lastReset=now;
		entry.count=1;
		entry.bannedUntil=0;
		return true;
	}
	if(entry.count>=RATE_LIMIT){
		entry.bannedUntil=now+BAN_DURATION;
		entry.count=0;
		return false;
	}
	entry.count++;
	return true;
}
function cleanRateLimitMap(){
	const now=Date.now();
	for(const [username,entry] of rateLimitMap.entries()){
		if(entry.bannedUntil<now&&now-entry.lastReset>60000){
			rateLimitMap.delete(username);
		}
	}
}
setInterval(cleanRateLimitMap,300000);
const rooms=new Map();
const defaultRooms=["General","Homework","Programming","Gaming","Robotics"];
for(const name of defaultRooms){
	rooms.set(name,{name,members:new Set()});
}
function getRoomList(){
	let list=[];
	for(const[name,room]of rooms){
		list.push({name,members:room.members.size});
	}
	return list;
}
function broadcastToRoom(roomName,message,excludeWs=null){
	const room=rooms.get(roomName);
	if(!room)return;
	clients.forEach(client=>{
		if(client!==excludeWs&&client.readyState===WebSocket.OPEN&&client.room===roomName){
			client.send(JSON.stringify(message));
		}
	});
}
let pollIdCounter=0;
const activePolls=new Map();
let stats={
	messagesTotal:0,
	messagesLastMinute:0,
	messageTimestamps:[],
	filesTransferred:0,
	startTime:Date.now()
};
function recordMessage(){
	stats.messagesTotal++;
	let now=Date.now();
	stats.messageTimestamps.push(now);
	stats.messageTimestamps=stats.messageTimestamps.filter(t=>now-t<60000);
	stats.messagesLastMinute=stats.messageTimestamps.length;
}
function getStats(){
	let now=Date.now();
	stats.messageTimestamps=stats.messageTimestamps.filter(t=>now-t<60000);
	return{
		usersOnline:clients.length,
		messagesPerMinute:stats.messageTimestamps.length,
		messagesTotal:stats.messagesTotal,
		filesTransferred:stats.filesTransferred,
		uptime:Math.floor((now-stats.startTime)/1000),
		rooms:rooms.size,
		activePolls:0
	};
}
function getPollsForRoom(roomName){
	let polls=[];
	for(const[poll]of activePolls){
		if(poll.room===roomName&&poll.active){
			polls.push({
				id:poll.id,
				question:poll.question,
				options:poll.options.map((o,i)=>({text:o,votes:poll.votes.filter(v=>v===i).length})),
				totalVotes:poll.votes.length,
				createdBy:poll.createdBy
			});
		}
	}
	return polls;
}
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
	console.log("New connection established. Clients: "+clients.length);
	let clientIP=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
	if(clientIP&&clientIP.includes("::ffff:")){
		clientIP=clientIP.split("::ffff:")[1];
	}
	ws.clientIP=clientIP;
	ws.room="General";
	const generalRoom=rooms.get("General");
	if(generalRoom){generalRoom.members.add(ws);}
	ws.send(JSON.stringify({type:"system",message:`Your IP is ${clientIP}`}));
	ws.on("message",(message,isBinary)=>{
		if(isBinary){
			broadcastToRoom(ws.room||"General",message,ws);
			return;
		}
		let data;
		try{
			data=JSON.parse(message);
		}
		catch(err){
			ws.send(JSON.stringify({type:"system",message:"Invalid JSON received."}));
			return;
		}
		if(data.type=="join"){
			if(usernameToWs.has(data.username)){
				ws.send(JSON.stringify({type:"system",message:`Username "${data.username}" is already taken.`}));
				ws.close(1008,"Username taken");
				return;
			}
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
		else if(data.type=="joinRoom"){
			let targetRoom=data.room;
			if(!targetRoom||typeof targetRoom!=="string"){
				ws.send(JSON.stringify({type:"system",message:"Invalid room name."}));
				return;
			}
			targetRoom=targetRoom.trim().substring(0,20);
			if(!rooms.has(targetRoom)){
				rooms.set(targetRoom,{name:targetRoom,members:new Set()});
			}
			if(ws.room){
				let oldRoom=rooms.get(ws.room);
				if(oldRoom){oldRoom.members.delete(ws);}
			}
			ws.room=targetRoom;
			rooms.get(targetRoom).members.add(ws);
			let roomList=getRoomList();
			ws.send(JSON.stringify({type:"roomJoined",room:targetRoom,rooms:roomList}));
			broadcastToRoom(targetRoom,{type:"system",message:`${ws.username} joined ${targetRoom}`},ws);
			return;
		}
		else if(data.type=="createRoom"){
			let newRoom=data.room;
			if(!newRoom||typeof newRoom!=="string"){
				ws.send(JSON.stringify({type:"system",message:"Invalid room name."}));
				return;
			}
			newRoom=newRoom.trim().substring(0,20);
			if(rooms.has(newRoom)){
				ws.send(JSON.stringify({type:"system",message:`Room "${newRoom}" already exists.`}));
				return;
			}
			rooms.set(newRoom,{name:newRoom,members:new Set()});
			let roomList=getRoomList();
			broadcastOnlineCount();
			ws.send(JSON.stringify({type:"roomCreated",room:newRoom,rooms:roomList}));
			return;
		}
		else if(data.type=="getRooms"){
			let roomList=getRoomList();
			ws.send(JSON.stringify({type:"roomList",rooms:roomList,currentRoom:ws.room}));
			return;
		}
		else if(data.type=="createPoll"){
			if(!data.question||!data.options||data.options.length<2){
				ws.send(JSON.stringify({type:"system",message:"Poll needs a question and at least 2 options."}));
				return;
			}
			let pollId=++pollIdCounter;
			let poll={
				id:pollId,
				question:data.question.substring(0,200),
				options:data.options.map(o=>o.substring(0,100)).slice(0,10),
				votes:[],
				votedBy:new Set(),
				createdBy:ws.username||"Anonymous",
				room:ws.room||"General",
				active:true,
				createdAt:Date.now()
			};
			activePolls.set(poll,poll);
			let pollData={
				type:"pollCreated",
				id:pollId,
				question:poll.question,
				options:poll.options.map((o,i)=>({text:o,votes:0})),
				totalVotes:0,
				createdBy:poll.createdBy
			};
			broadcastToRoom(ws.room||"General",pollData);
			return;
		}
		else if(data.type=="vote"){
			if(!data.pollId||data.option===undefined){
				ws.send(JSON.stringify({type:"system",message:"Invalid vote."}));
				return;
			}
			let targetPoll=null;
			for(const[poll]of activePolls){
				if(poll.id===data.pollId){targetPoll=poll;break;}
			}
			if(!targetPoll||!targetPoll.active){
				ws.send(JSON.stringify({type:"system",message:"Poll not found or closed."}));
				return;
			}
			if(targetPoll.votedBy.has(ws)){
				ws.send(JSON.stringify({type:"system",message:"You already voted."}));
				return;
			}
			if(data.option<0||data.option>=targetPoll.options.length){
				ws.send(JSON.stringify({type:"system",message:"Invalid option."}));
				return;
			}
			targetPoll.votes.push(data.option);
			targetPoll.votedBy.add(ws);
			let pollData={
				type:"pollUpdate",
				id:targetPoll.id,
				options:targetPoll.options.map((o,i)=>({text:o,votes:targetPoll.votes.filter(v=>v===i).length})),
				totalVotes:targetPoll.votes.length
			};
			broadcastToRoom(targetPoll.room,pollData);
			return;
		}
		else if(data.type=="closePoll"){
			if(!data.pollId){
				ws.send(JSON.stringify({type:"system",message:"Invalid poll ID."}));
				return;
			}
			for(const[poll]of activePolls){
				if(poll.id===data.pollId&&poll.createdBy===ws.username){
					poll.active=false;
					let pollData={
						type:"pollClosed",
						id:poll.id,
						question:poll.question,
						options:poll.options.map((o,i)=>({text:o,votes:poll.votes.filter(v=>v===i).length})),
						totalVotes:poll.votes.length
					};
					broadcastToRoom(poll.room,pollData);
					break;
				}
			}
			return;
		}
		else if(data.type=="getPolls"){
			let polls=getPollsForRoom(ws.room||"General");
			ws.send(JSON.stringify({type:"pollList",polls:polls}));
			return;
		}
		else if(data.type=="typing"){
			clients.forEach(client=>{
				if(client!==ws&&client.readyState===WebSocket.OPEN){
					client.send(JSON.stringify({type:"typing",username:data.username,typing:data.typing}));
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
		else if(data.type=="getStats"){
			let s=getStats();
			let uptimeH=Math.floor(s.uptime/3600);
			let uptimeM=Math.floor((s.uptime%3600)/60);
			let uptimeS=s.uptime%60;
			let uptimeStr="";
			if(uptimeH>0)uptimeStr+=uptimeH+"h ";
			if(uptimeM>0)uptimeStr+=uptimeM+"m ";
			uptimeStr+=uptimeS+"s";
			let msg=`Session Statistics:\n\nUsers online: ${s.usersOnline}\nMessages/min: ${s.messagesPerMinute}\nTotal messages: ${s.messagesTotal}\nFiles transferred: ${s.filesTransferred}\nActive rooms: ${s.rooms}\nUptime: ${uptimeStr}`;
			ws.send(JSON.stringify({type:"system",message:msg}));
			return;
		}
		else if(data.type=="private"){
			if(!checkRateAndBan(data.username)){
				ws.send(JSON.stringify({type:"system",message:"You are temporarily banned for spamming."}));
				return;
			}
			const targetWs=usernameToWs.get(data.target);
			if(!targetWs||targetWs.readyState!==WebSocket.OPEN){
				ws.send(JSON.stringify({type:"system",message:`User "${data.target}" is not online.`}));
				return;
			}
			targetWs.send(JSON.stringify({
				type:"private",
				from:data.username,
				message:data.message,
				ip:ws.clientIP||"Unknown",
				timestamp:data.timestamp
			}));
			ws.send(JSON.stringify({
				type:"private",
				self:true,
				target:data.target,
				from:data.username,
				message:data.message,
				ip:ws.clientIP||"Unknown",
				timestamp:data.timestamp
			}));
			return;
		}
		else if(data.type=="nick"){
			let oldName=data.oldUsername;
			let newName=data.newUsername;
			if(usernameToWs.has(newName)){
				ws.send(JSON.stringify({type:"system",message:`Username "${newName}" is already taken.`}));
				return;
			}
			usernameToWs.delete(oldName);
			ws.username=newName;
			usernameToWs.set(newName,ws);
			broadcastSystemMessage(`${oldName} changed their name to ${newName}`);
			broadcastOnlineCount();
			ws.send(JSON.stringify({type:"nickAccepted",newUsername:newName}));
			return;
		}
		else if(data.type=="ping"){
			ws.send(JSON.stringify({type:"pong",timestamp:data.timestamp}));
			return;
		}
		else if(data.type=="file-cancel"){
			const payload={type:"file-cancel",transferId:data.transferId};
			broadcastToRoom(ws.room||"General",payload,ws);
			return;
		}
		else if(data.type=="image"||data.type=="voice"||data.type=="file-start"||data.type=="file-end"||data.type=="file"){
			if(data.type==="file-end"){stats.filesTransferred++;}
			const {type,...rest}=data;
			const payload={
				type,
				...rest,
				ip:ws.clientIP||"Unknown",
				timestamp:data.timestamp||new Date().toISOString()
			};
			broadcastToRoom(ws.room||"General",payload,ws);
			return;
		}
		if(!checkRateAndBan(data.username)){
			ws.send(JSON.stringify({type:"system",message:"You are temporarily banned."}));
			return;
		}
		recordMessage();
		const broadcastMsg={
			username:data.username,
			message:data.message,
			ip:ws.clientIP||"Unknown",
			room:ws.room
		};
		broadcastToRoom(ws.room||"General",broadcastMsg,ws);
	});
	ws.on("close",()=>{
		const index=clients.indexOf(ws);
		if(index!=-1){
			clients.splice(index,1);
			if(ws.room){
				let room=rooms.get(ws.room);
				if(room){
					room.members.delete(ws);
					if(room.members.size===0&&!defaultRooms.includes(ws.room)){
						rooms.delete(ws.room);
					}
				}
			}
			if(ws.username){
				usernameToWs.delete(ws.username);
				const userList=getCurrentUsersList();
				broadcastSystemMessage(`${ws.username} left. Current users: ${userList}`);
			}
			broadcastOnlineCount();
			console.log("Client disconnected. Remaining: "+clients.length);
		}
	});
});
const discoverySocket=startDiscovery();
process.on("SIGTERM",()=>{
	console.log("SIGTERM received. Closing server...");
	discoverySocket.close();
	wsServer.close(()=>{
		console.log("WebSocket server closed.");
		process.exit(0);
	});
});
process.on("SIGINT",()=>{
	console.log("SIGINT received. Closing server...");
	discoverySocket.close();
	wsServer.close(()=>{
		console.log("WebSocket server closed.");
		process.exit(0);
	});
});
console.log(`WebSocket server on ws://${localIP}:${portWS}`+(serverName?` "${serverName}"`:""));
console.log(`Join code: ${joinCode}`);