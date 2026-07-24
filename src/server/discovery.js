import dgram from "dgram";
import{DISCOVERY_ADDRESS,DISCOVERY_PORT,DISCOVERY_INTERVAL,DISCOVERY_TYPE,PROTOCOL_VERSION}from"../protocol/constants.js";
export function createDiscoverySocket(name,localIP,wsPort,joinCode){
	const socket=dgram.createSocket({type:"udp4",reuseAddr:true});
	const packet=JSON.stringify({type:DISCOVERY_TYPE,name,ip:localIP,port:wsPort,version:PROTOCOL_VERSION,joinCode});
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
		const msg=Buffer.from(packet);
		socket.send(msg,0,msg.length,DISCOVERY_PORT,DISCOVERY_ADDRESS);
	};
	broadcast();
	const interval=setInterval(broadcast,DISCOVERY_INTERVAL);
	socket._interval=interval;
	return socket;
}
export function stopDiscovery(socket){
	if(socket._interval){clearInterval(socket._interval);}
	socket.close();
}
