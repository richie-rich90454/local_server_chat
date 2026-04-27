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
const rateLimitMap=new Map();
const RATE_LIMIT=3;
const RATE_WINDOW=1000;
const BAN_DURATION=5000;
function checkRateAndBan(username){
    const now=Date.now();
    if(!rateLimitMap.has(username)){
        rateLimitMap.set(username,{count:1, lastReset:now, bannedUntil:0});
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
    console.log("New connection established"+". Number of client(s) "+clients.length);
    let clientIP=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
    if(clientIP&&clientIP.includes("::ffff:")){
        clientIP=clientIP.split("::ffff:")[1];
    }
    ws.clientIP=clientIP;
    ws.send(JSON.stringify({type:"system",message:`Your IP is ${clientIP}`}));
    ws.on("message",(message)=>{
        const data=JSON.parse(message);
        if(data.type=="join"){
            if(usernameToWs.has(data.username)){
                ws.send(JSON.stringify({type:"system",message:`Username "${data.username}" is already taken. Please choose another name.`}));
                ws.close(1008, "Username taken");
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
        else if(data.type=="typing"){
            clients.forEach(client=>{
                if(client!==ws&&client.readyState===WebSocket.OPEN){
                    client.send(JSON.stringify({type:"typing", username:data.username, typing:data.typing}));
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
        else if(data.type=="image"){
            const payload={
                type:"image",
                username:data.username,
                image:data.image,
                ip:ws.clientIP||"Unknown IP",
                timestamp:data.timestamp
            };
            clients.forEach(client=>{
                if(client.readyState===WebSocket.OPEN){
                    client.send(JSON.stringify(payload));
                }
            });
            return;
        }
        else if(data.type=="voice"){
            const payload={
                type:"voice",
                username:data.username,
                voice:data.voice,
                ip:ws.clientIP||"Unknown IP",
                timestamp:data.timestamp
            };
            clients.forEach(client=>{
                if(client.readyState===WebSocket.OPEN){
                    client.send(JSON.stringify(payload));
                }
            });
            return;
        }
        else if(data.type=="private"){
            if(!checkRateAndBan(data.username)){
                ws.send(JSON.stringify({type:"system",message:"You are temporarily banned for sending too many messages. Please wait 5 seconds."}));
                return;
            }
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
            ws.send(JSON.stringify({type:"nickAccepted", newUsername:newName}));
            return;
        }
        else if(data.type=="ping"){
            if(ws.readyState===WebSocket.OPEN){
                ws.send(JSON.stringify({type:"pong", timestamp:data.timestamp}));
            }
            return;
        }
        if(!checkRateAndBan(data.username)){
            ws.send(JSON.stringify({type:"system",message:"You are temporarily banned for sending too many messages. Please wait 5 seconds."}));
            return;
        }
        const broadcastMsg={
            username:data.username,
            message:data.message,
            ip:ws.clientIP||"Unknown IP"
        };
        clients.forEach(client=>{
            if(client.readyState==WebSocket.OPEN){
                client.send(JSON.stringify(broadcastMsg));
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