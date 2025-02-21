import WebSocket, {WebSocketServer} from "ws";
import {networkInterfaces} from "os";
import express from "express";
import path from "path";
import {fileURLToPath} from "url";
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

const getLocalIP=()=>{
    const nets=networkInterfaces();
    for (const iface of Object.values(nets)){
        for (const net of iface){
            if (net.family=="IPv4"&&!net.internal&&!net.address.startsWith("192.168.137")&&!net.address.startsWith("26.26.26.1")){
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
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/get-client-ip", (req, res)=>{
    let ip=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
    if(ip&&ip.includes("::ffff:")){
        ip=ip.split("::ffff:")[1];
    }
    res.json({ip: ip});
});
app.listen(portUI, ()=>{
    console.log(`UI on http://${localIP}:${portUI}`);
});
const wsServer=new WebSocketServer({port: portWS, host: "0.0.0.0"});
let clients=[];
wsServer.on("connection", (ws,req)=>{
    clients.push(ws);
    console.log("New connection established");
    let clientIP=req.headers["x-forwarded-for"]||req.socket.remoteAddress;
    if(clientIP&&clientIP.includes("::ffff:")){
        clientIP=clientIP.split("::ffff:")[1];
    }
    ws.clientIP=clientIP;
    ws.on("message", (message)=>{
        const data=JSON.parse(message);
        if (data.type=="join"){
            ws.username=data.username;
            ws.clientIP=clientIP;
        }
        clients.forEach((client)=>{
            if (client.readyState==WebSocket.OPEN) {
                client.send(JSON.stringify({
                    username: data.username,
                    message: data.message,
                    ip: ws.clientIP||"Unknown IP"
                }));
            }
        });
    });
});
console.log(`Server on ws://${localIP}:${portWS}`);