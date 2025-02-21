import WebSocket, {WebSocketServer} from 'ws';
import {networkInterfaces} from 'os';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const getLocalIP=()=>{
    const nets=networkInterfaces();
    for (const iface of Object.values(nets)){
        for (const net of iface){
            if (net.family=="IPv4"&& !net.internal){
                return net.address;
            }
        }
    }
    return 'localhost';
};
const localIP=getLocalIP();
const portWS=8191;
const portUI=2047;
const app=express();
app.use(express.static(path.join(__dirname, 'public')));
app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get("/get-ip", (req, res)=>{
    res.json({ip: localIP});
});
app.listen(portUI, ()=>{
    console.log(`UI on http://${localIP}:${portUI}`);
});
const wsServer=new WebSocketServer({port: portWS, host: '0.0.0.0'});
let clients=[];
wsServer.on('connection', (ws)=>{
    clients.push(ws);
    console.log('New connection established');
    ws.on('message', (message)=>{
        const data=JSON.parse(message);
        clients.forEach((client)=>{
            if (client.readyState==WebSocket.OPEN){
                client.send(JSON.stringify({username: data.username, message: data.message}));
            }
        });
    });
    ws.on('close', ()=>{
        clients=clients.filter((client)=>client!==ws);
    });
});
console.log(`Server on ws://${localIP}:${portWS}`);