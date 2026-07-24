import WebSocket from"ws";
import{createInterface}from"readline";
import{MSG,WS_PORT,PROTOCOL_VERSION}from"./src/protocol/constants.js";
const args=process.argv.slice(2);
let manualHost=null;
let manualPort=WS_PORT;
for(let i=2;i<args.length;i++){
	if(args[i]==="--host"&&args[i+1]){manualHost=args[i+1];i++;}
	if(args[i]==="--port"&&args[i+1]){manualPort=parseInt(args[i+1]);i++;}
}
const rl=createInterface({input:process.stdin,output:process.stdout});
let socket=null;
let currentUser="";
let currentRoom="General";
function print(msg){process.stdout.write(msg+"\n");}
function prompt(){rl.question("> ",handleInput);}
function handleInput(input){
	const trimmed=input.trim();
	if(!trimmed){prompt();return;}
	if(trimmed==="/quit"||trimmed==="/exit"){
		if(socket){socket.close();}
		rl.close();
		process.exit(0);
	}
	if(trimmed.startsWith("/nick ")){
		let newName=trimmed.substring(6).trim();
		if(newName&&socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:MSG.NICK,oldUsername:currentUser,newUsername:newName}));
		}
		prompt();
		return;
	}
	if(trimmed.startsWith("/msg ")){
		let match=trimmed.match(/^\/msg\s+"([^"]+)"\s+(.+)$/)||trimmed.match(/^\/msg\s+(\S+)\s+(.+)$/);
		if(match&&socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:MSG.PRIVATE,username:currentUser,target:match[1],message:match[2],timestamp:new Date().toISOString()}));
			print(`[Private to ${match[1]}] ${match[2]}`);
		}
		prompt();
		return;
	}
	if(trimmed==="/users"){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:MSG.GET_USERS}));
		}
		prompt();
		return;
	}
	if(trimmed==="/rooms"){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:MSG.GET_ROOMS}));
		}
		prompt();
		return;
	}
	if(trimmed.startsWith("/join ")){
		let room=trimmed.substring(6).trim();
		if(room&&socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:MSG.JOIN_ROOM,room}));
		}
		prompt();
		return;
	}
	if(trimmed==="/stats"){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:MSG.GET_STATS}));
		}
		prompt();
		return;
	}
	if(trimmed==="/ping"){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:MSG.PING,timestamp:Date.now()}));
		}
		prompt();
		return;
	}
	if(trimmed==="/help"){
		print("Commands:");
		print("  /nick <name>       - Change username");
		print("  /msg \"user\" msg    - Private message");
		print("  /users             - List online users");
		print("  /rooms             - List rooms");
		print("  /join <room>       - Join a room");
		print("  /stats             - Session statistics");
		print("  /ping              - Measure latency");
		print("  /help              - Show this help");
		print("  /quit              - Exit");
		prompt();
		return;
	}
	if(socket&&socket.readyState===WebSocket.OPEN){
		socket.send(JSON.stringify({username:currentUser,message:trimmed,ip:"TUI"}));
	}
	prompt();
}
function connect(host,port){
	print(`Connecting to ws://${host}:${port}...`);
	socket=new WebSocket(`ws://${host}:${port}`);
	socket.binaryType="arraybuffer";
	socket.on("open",()=>{
		print("Connected!");
		rl.question("Username: ",(name)=>{
			currentUser=name.trim()||"Anonymous";
			socket.send(JSON.stringify({type:MSG.JOIN,username:currentUser}));
			socket.send(JSON.stringify({type:MSG.GET_ROOMS}));
			prompt();
		});
	});
	socket.on("message",(data)=>{
		if(data instanceof ArrayBuffer){return;}
		let msg;
		try{msg=JSON.parse(data);}catch(e){return;}
		if(msg.type===MSG.SYSTEM){
			print(`[System] ${msg.message}`);
		}
		else if(msg.type===MSG.ONLINE_COUNT){
			print(`[Online: ${msg.count}]`);
		}
		else if(msg.type===MSG.TYPING){
			if(msg.typing){print(`[Typing] ${msg.username} is typing...`);}
		}
		else if(msg.type===MSG.PRIVATE){
			if(msg.self){print(`[Private to ${msg.target}] You: ${msg.message}`);}
			else{print(`[Private from ${msg.from}] ${msg.message}`);}
		}
		else if(msg.type===MSG.PONG){
			let latency=Date.now()-msg.timestamp;
			print(`[Pong] ${latency}ms`);
		}
		else if(msg.type===MSG.ROOM_LIST){
			print("[Rooms] "+msg.rooms.map(r=>`${r.name}(${r.members})`).join(", "));
		}
		else if(msg.type===MSG.ROOM_JOINED){
			currentRoom=msg.room;
			print(`[Room] Joined ${msg.room}`);
		}
		else if(msg.type===MSG.POLL_CREATED||msg.type===MSG.POLL_UPDATE||msg.type===MSG.POLL_CLOSED){
			let votes=msg.options.map((o,i)=>`  ${i+1}. ${o.text} (${o.votes})`).join("\n");
			print(`[Poll] ${msg.question}\n${votes}\n  ${msg.totalVotes} votes`);
		}
		else if(msg.type===MSG.NICK_ACCEPTED){
			currentUser=msg.newUsername;
			print(`[Nick] Changed to ${msg.newUsername}`);
		}
		else if(msg.username){
			print(`${msg.username}: ${msg.message}`);
		}
	});
	socket.on("close",()=>{
		print("Disconnected.");
		process.exit(0);
	});
	socket.on("error",(err)=>{
		print(`Error: ${err.message}`);
		process.exit(1);
	});
}
if(manualHost){
	connect(manualHost,manualPort);
}
else{
	print("Local Server Chat Client v"+PROTOCOL_VERSION);
	print("");
	rl.question("Server IP (or press Enter for localhost): ",(ip)=>{
		let host=ip.trim()||"localhost";
		rl.question("Port ["+WS_PORT+"]: ",(port)=>{
			let p=parseInt(port)||WS_PORT;
			connect(host,p);
		});
	});
}
