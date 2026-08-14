import express from"express";
import{Filter}from"bad-words";
import{createStaticMiddleware}from"./static.js";
import{PROTOCOL_VERSION}from"../protocol/constants.js";
export function createHttpServer(localIP,portUI,portWS,serverName,joinCode,joinCodeMap){
	const app=express();
	app.use(express.json());
	app.use(createStaticMiddleware());
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
			uiPort:portUI,
			protocol:PROTOCOL_VERSION
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
	const filter=new Filter();
	app.post("/check-name",(req,res)=>{
		const {name}=req.body;
		const isClean=!filter.isProfane(name);
		res.json({clean:isClean});
	});
	const server=app.listen(portUI,()=>{
		console.log(`UI on http://${localIP}:${portUI}`);
	});
	return{app,server};
}
