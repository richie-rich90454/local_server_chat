import{spawn}from"child_process";
import{fileURLToPath}from"url";
import path from"path";
import WebSocket from"ws";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const WS_URL="ws://127.0.0.1:8191";
let server=null;
function fail(msg){
	console.error("SMOKE TEST FAILED: "+msg);
	if(server){server.kill();}
	process.exit(1);
}
function delay(ms){
	return new Promise(resolve=>setTimeout(resolve,ms));
}
function waitForServer(){
	return new Promise((resolve,reject)=>{
		let buf="";
		server=spawn(process.execPath,["server.js","--no-http"],{cwd:root});
		server.stdout.on("data",chunk=>{
			buf+=chunk.toString();
			if(buf.includes("WebSocket server")){
				resolve();
			}
		});
		server.stderr.on("data",chunk=>{
			console.error("server stderr: "+chunk.toString());
		});
		server.on("exit",code=>{
			reject(new Error("server exited early with code "+code));
		});
		setTimeout(()=>reject(new Error("server start timeout")),15000);
	});
}
function connect(name){
	return new Promise((resolve,reject)=>{
		const ws=new WebSocket(WS_URL);
		const messages=[];
		ws.on("open",()=>resolve({ws,messages}));
		ws.on("message",data=>{
			try{messages.push(JSON.parse(data.toString()));}catch(e){}
		});
		ws.on("error",reject);
		setTimeout(()=>reject(new Error("connect timeout for "+name)),10000);
	});
}
function send(ws,obj){
	ws.send(JSON.stringify(obj));
}
async function waitFor(messages,predicate,timeout=10000){
	const start=Date.now();
	while(Date.now()-start<timeout){
		const found=messages.find(predicate);
		if(found)return found;
		await delay(25);
	}
	return null;
}
async function main(){
	await waitForServer();
	const a=await connect("alice");
	const b=await connect("bob");
	send(a.ws,{type:"join",username:"Alice"});
	send(b.ws,{type:"join",username:"Bob"});
	await delay(200);
	send(a.ws,{username:"Alice",message:"hello world"});
	const bMsg=await waitFor(b.messages,m=>m.username==="Alice"&&m.message==="hello world");
	if(!bMsg)fail("message broadcast not received by Bob");
	send(a.ws,{type:"createPoll",question:"Best language?",options:["JS","Python"]});
	const poll=await waitFor(b.messages,m=>m.type==="pollCreated");
	if(!poll)fail("poll not received by Bob");
	send(b.ws,{type:"vote",pollId:poll.id,option:0});
	const update=await waitFor(a.messages,m=>m.type==="pollUpdate");
	if(!update)fail("poll update not received by Alice");
	send(a.ws,{type:"private",username:"Alice",target:"Bob",message:"secret"});
	const priv=await waitFor(b.messages,m=>m.type==="private"&&m.message==="secret");
	if(!priv)fail("private message not received by Bob");
	send(a.ws,{type:"nick",oldUsername:"Alice",newUsername:"Alicia"});
	const nick=await waitFor(a.messages,m=>m.type==="nickAccepted");
	if(!nick)fail("nick not accepted");
	console.log("SMOKE TEST PASSED");
	a.ws.close();
	b.ws.close();
	server.kill();
	process.exit(0);
}
main().catch(err=>fail(err.message));
