import WebSocket,{WebSocketServer}from"ws";
import{MSG,DEFAULT_ROOMS,RATE_LIMIT,RATE_WINDOW,BAN_DURATION}from"../protocol/constants.js";
export function createWebSocketServer(portWS,localIP){
	const wsServer=new WebSocketServer({port:portWS,host:"::",pingInterval:30000,pingTimeout:10000,maxPayload:5*1024*1024*1024});
	let clients=[];
	let usernameToWs=new Map();
	const rateLimitMap=new Map();
	const rooms=new Map();
	for(const name of DEFAULT_ROOMS){rooms.set(name,{name,members:new Set()});}
	let pollIdCounter=0;
	const activePolls=new Map();
	let stats={messagesTotal:0,messageTimestamps:[],filesTransferred:0,startTime:Date.now()};
	function recordMessage(){
		stats.messagesTotal++;
		let now=Date.now();
		stats.messageTimestamps.push(now);
		stats.messageTimestamps=stats.messageTimestamps.filter(t=>now-t<60000);
	}
	function checkRateAndBan(username){
		const now=Date.now();
		if(!rateLimitMap.has(username)){rateLimitMap.set(username,{count:1,lastReset:now,bannedUntil:0});return true;}
		let entry=rateLimitMap.get(username);
		if(entry.bannedUntil>now){return false;}
		if(now-entry.lastReset>RATE_WINDOW){entry.lastReset=now;entry.count=1;entry.bannedUntil=0;return true;}
		if(entry.count>=RATE_LIMIT){entry.bannedUntil=now+BAN_DURATION;entry.count=0;return false;}
		entry.count++;
		return true;
	}
	function getRoomList(){let list=[];for(const[name,room]of rooms){list.push({name,members:room.members.size});}return list;}
	function broadcastToRoom(roomName,message,excludeWs=null){
		const room=rooms.get(roomName);
		if(!room)return;
		clients.forEach(client=>{if(client!==excludeWs&&client.readyState===WebSocket.OPEN&&client.room===roomName){client.send(JSON.stringify(message));}});
	}
	function broadcastOnlineCount(){const count=clients.length;clients.forEach(client=>{if(client.readyState===WebSocket.OPEN){client.send(JSON.stringify({type:MSG.ONLINE_COUNT,count}));}});}
	function broadcastRoomList(){const list=getRoomList();clients.forEach(client=>{if(client.readyState===WebSocket.OPEN){client.send(JSON.stringify({type:MSG.ROOM_LIST,rooms:list,currentRoom:client.room}));}});}
	function getCurrentUsersList(){let users=[];for(const[username]of usernameToWs.entries()){users.push(username);}return users.join(", ");}
	function broadcastSystemMessage(message,excludeWs=null){clients.forEach(client=>{if(client!==excludeWs&&client.readyState===WebSocket.OPEN){client.send(JSON.stringify({type:MSG.SYSTEM,message}));}});}
	function getStats(){
		let now=Date.now();
		stats.messageTimestamps=stats.messageTimestamps.filter(t=>now-t<60000);
		return{usersOnline:clients.length,messagesPerMinute:stats.messageTimestamps.length,messagesTotal:stats.messagesTotal,filesTransferred:stats.filesTransferred,uptime:Math.floor((now-stats.startTime)/1000),rooms:rooms.size};
	}
	function getPollsForRoom(roomName){
		let polls=[];
		for(const[poll]of activePolls){
			if(poll.room===roomName&&poll.active){
				polls.push({id:poll.id,question:poll.question,options:poll.options.map((o,i)=>({text:o,votes:poll.votes.filter(v=>v===i).length})),totalVotes:poll.votes.length,createdBy:poll.createdBy});
			}
		}
		return polls;
	}
	function handleMessage(ws,data){
		if(!data||typeof data.type!=="string"){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Invalid message format."}));return;}
		switch(data.type){
			case MSG.JOIN:{
				if(usernameToWs.has(data.username)){
					ws.send(JSON.stringify({type:MSG.SYSTEM,message:`Username "${data.username}" is already taken.`}));
					ws.close(1008,"Username taken");
					return;
				}
				ws.username=data.username;
				usernameToWs.set(data.username,ws);
				broadcastOnlineCount();
				const userList=getCurrentUsersList();
				clients.forEach(client=>{if(client.readyState===WebSocket.OPEN){client.send(JSON.stringify({type:MSG.SYSTEM,message:`${data.username} joined the chat. Current users: ${userList}`}));}});
				break;
			}
			case MSG.JOIN_ROOM:{
				let targetRoom=data.room;
				if(!targetRoom||typeof targetRoom!=="string"){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Invalid room name."}));return;}
				targetRoom=targetRoom.trim().substring(0,20);
				if(!rooms.has(targetRoom)){rooms.set(targetRoom,{name:targetRoom,members:new Set()});}
				if(ws.room){let oldRoom=rooms.get(ws.room);if(oldRoom){oldRoom.members.delete(ws);}}
				ws.room=targetRoom;
				rooms.get(targetRoom).members.add(ws);
				ws.send(JSON.stringify({type:MSG.ROOM_JOINED,room:targetRoom,rooms:getRoomList()}));
				broadcastToRoom(targetRoom,{type:MSG.SYSTEM,message:`${ws.username} joined ${targetRoom}`},ws);
				broadcastRoomList();
				break;
			}
			case MSG.CREATE_ROOM:{
				let newRoom=data.room;
				if(!newRoom||typeof newRoom!=="string"){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Invalid room name."}));return;}
				newRoom=newRoom.trim().substring(0,20);
				if(rooms.has(newRoom)){ws.send(JSON.stringify({type:MSG.SYSTEM,message:`Room "${newRoom}" already exists.`}));return;}
				rooms.set(newRoom,{name:newRoom,members:new Set()});
				broadcastOnlineCount();
				ws.send(JSON.stringify({type:MSG.ROOM_CREATED,room:newRoom,rooms:getRoomList()}));
				break;
			}
			case MSG.GET_ROOMS:{
				ws.send(JSON.stringify({type:MSG.ROOM_LIST,rooms:getRoomList(),currentRoom:ws.room}));
				break;
			}
			case MSG.CREATE_POLL:{
				if(!data.question||!data.options||data.options.length<2){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Poll needs a question and at least 2 options."}));return;}
				let pollId=++pollIdCounter;
				let poll={id:pollId,question:data.question.substring(0,200),options:data.options.map(o=>o.substring(0,100)).slice(0,10),votes:[],votedBy:new Set(),createdBy:ws.username||"Anonymous",room:ws.room||"General",active:true,createdAt:Date.now()};
				activePolls.set(poll,poll);
				broadcastToRoom(ws.room||"General",{type:MSG.POLL_CREATED,id:pollId,question:poll.question,options:poll.options.map((o,i)=>({text:o,votes:0})),totalVotes:0,createdBy:poll.createdBy});
				break;
			}
			case MSG.VOTE:{
				if(!data.pollId||data.option===undefined){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Invalid vote."}));return;}
				let targetPoll=null;
				for(const[poll]of activePolls){if(poll.id===data.pollId){targetPoll=poll;break;}}
				if(!targetPoll||!targetPoll.active){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Poll not found or closed."}));return;}
				if(targetPoll.votedBy.has(ws)){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"You already voted."}));return;}
				if(data.option<0||data.option>=targetPoll.options.length){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Invalid option."}));return;}
				targetPoll.votes.push(data.option);
				targetPoll.votedBy.add(ws);
				broadcastToRoom(targetPoll.room,{type:MSG.POLL_UPDATE,id:targetPoll.id,options:targetPoll.options.map((o,i)=>({text:o,votes:targetPoll.votes.filter(v=>v===i).length})),totalVotes:targetPoll.votes.length});
				break;
			}
			case MSG.CLOSE_POLL:{
				if(!data.pollId){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Invalid poll ID."}));return;}
				for(const[poll]of activePolls){
					if(poll.id===data.pollId&&poll.createdBy===ws.username){
						poll.active=false;
						broadcastToRoom(poll.room,{type:MSG.POLL_CLOSED,id:poll.id,question:poll.question,options:poll.options.map((o,i)=>({text:o,votes:poll.votes.filter(v=>v===i).length})),totalVotes:poll.votes.length});
						break;
					}
				}
				break;
			}
			case MSG.GET_POLLS:{
				ws.send(JSON.stringify({type:MSG.POLL_LIST,polls:getPollsForRoom(ws.room||"General")}));
				break;
			}
			case MSG.TYPING:{
				clients.forEach(client=>{if(client!==ws&&client.readyState===WebSocket.OPEN){client.send(JSON.stringify({type:MSG.TYPING,username:data.username,typing:data.typing}));}});
				break;
			}
			case MSG.GET_USERS:{
				const userList=getCurrentUsersList();
				if(ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type:MSG.SYSTEM,message:`Online users: ${userList}`}));}
				break;
			}
			case MSG.GET_STATS:{
				let s=getStats();
				let uptimeH=Math.floor(s.uptime/3600);
				let uptimeM=Math.floor((s.uptime%3600)/60);
				let uptimeS=s.uptime%60;
				let uptimeStr="";
				if(uptimeH>0)uptimeStr+=uptimeH+"h ";
				if(uptimeM>0)uptimeStr+=uptimeM+"m ";
				uptimeStr+=uptimeS+"s";
				ws.send(JSON.stringify({type:MSG.SYSTEM,message:`Session Statistics:\n\nUsers online: ${s.usersOnline}\nMessages/min: ${s.messagesPerMinute}\nTotal messages: ${s.messagesTotal}\nFiles transferred: ${s.filesTransferred}\nActive rooms: ${s.rooms}\nUptime: ${uptimeStr}`}));
				break;
			}
			case MSG.PRIVATE:{
				if(!checkRateAndBan(data.username)){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"You are temporarily banned for spamming."}));return;}
				const targetWs=usernameToWs.get(data.target);
				if(!targetWs||targetWs.readyState!==WebSocket.OPEN){ws.send(JSON.stringify({type:MSG.SYSTEM,message:`User "${data.target}" is not online.`}));return;}
				targetWs.send(JSON.stringify({type:MSG.PRIVATE,from:data.username,message:data.message,ip:ws.clientIP||"Unknown",timestamp:data.timestamp}));
				ws.send(JSON.stringify({type:MSG.PRIVATE,self:true,target:data.target,from:data.username,message:data.message,ip:ws.clientIP||"Unknown",timestamp:data.timestamp}));
				break;
			}
			case MSG.NICK:{
				let oldName=data.oldUsername;
				let newName=data.newUsername;
				if(usernameToWs.has(newName)){ws.send(JSON.stringify({type:MSG.SYSTEM,message:`Username "${newName}" is already taken.`}));return;}
				usernameToWs.delete(oldName);
				ws.username=newName;
				usernameToWs.set(newName,ws);
				broadcastSystemMessage(`${oldName} changed their name to ${newName}`);
				broadcastOnlineCount();
				ws.send(JSON.stringify({type:MSG.NICK_ACCEPTED,newUsername:newName}));
				break;
			}
			case MSG.PING:{
				ws.send(JSON.stringify({type:MSG.PONG,timestamp:data.timestamp}));
				break;
			}
			case MSG.FILE_CANCEL:{
				broadcastToRoom(ws.room||"General",{type:MSG.FILE_CANCEL,transferId:data.transferId},ws);
				break;
			}
			case MSG.IMAGE:case MSG.VOICE:case MSG.FILE_START:case MSG.FILE_END:{
				if(data.type===MSG.FILE_END){stats.filesTransferred++;}
				const{type,...rest}=data;
				clients.forEach(client=>{
					if(client!==ws&&client.readyState===WebSocket.OPEN&&client.room===(ws.room||"General")){
						client.send(JSON.stringify({type,...rest,ip:ws.clientIP||"Unknown",timestamp:data.timestamp||new Date().toISOString()}));
					}
				});
				break;
			}
			default:{
				if(!checkRateAndBan(data.username)){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"You are temporarily banned."}));return;}
				recordMessage();
				const broadcastMsg={username:data.username,message:data.message,ip:ws.clientIP||"Unknown",room:ws.room};
				const room=rooms.get(ws.room||"General");
				if(room){
					clients.forEach(client=>{
						if(client.readyState===WebSocket.OPEN&&client.room===ws.room){
							client.send(JSON.stringify(broadcastMsg));
						}
					});
				}
			}
		}
	}
	wsServer.on("connection",(ws,req)=>{
		clients.push(ws);
		broadcastOnlineCount();
		console.log("New connection established. Clients: "+clients.length);
		let clientIP=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
		if(clientIP&&clientIP.includes("::ffff:")){clientIP=clientIP.split("::ffff:")[1];}
		ws.clientIP=clientIP;
		ws.room="General";
		const generalRoom=rooms.get("General");
		if(generalRoom){generalRoom.members.add(ws);}
		ws.send(JSON.stringify({type:MSG.SYSTEM,message:`Your IP is ${clientIP}`}));
		ws.on("message",(message,isBinary)=>{
			if(isBinary){broadcastToRoom(ws.room||"General",message,ws);return;}
			let data;
			try{data=JSON.parse(message);}catch(err){ws.send(JSON.stringify({type:MSG.SYSTEM,message:"Invalid JSON received."}));return;}
			handleMessage(ws,data);
		});
		ws.on("close",()=>{
			const index=clients.indexOf(ws);
			if(index!=-1){
				clients.splice(index,1);
				if(ws.room){let room=rooms.get(ws.room);if(room){room.members.delete(ws);if(room.members.size===0&&!DEFAULT_ROOMS.includes(ws.room)){rooms.delete(ws.room);}}}
				if(ws.username){
					usernameToWs.delete(ws.username);
					const userList=getCurrentUsersList();
					broadcastSystemMessage(`${ws.username} left. Current users: ${userList}`);
				}
			broadcastOnlineCount();
			broadcastRoomList();
			console.log("Client disconnected. Remaining: "+clients.length);
			}
		});
	});
	return wsServer;
}
