document.addEventListener("DOMContentLoaded",()=>{
	let loginPage=document.getElementById("login");
	let chatPage=document.getElementById("chatUI");
	let usernameInput=document.getElementById("username");
	let userIP=document.getElementById("userIp");
	let messagesList=document.getElementById("messages");
	let userMessage=document.getElementById("userMessage");
	let defaultPort=8191;
	let socket=null;
	let currentUser="";
	let clientRealIP="Unknown";
	function getCurrentTime(){
		let now=new Date();
		return `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`;
	}
	function escapeHtml(str){
		return str.replace(/[&<>]/g, function(m){
			if(m=='&') return '&amp;';
			if(m=='<') return '&lt;';
			if(m=='>') return '&gt;';
			return m;
		});
	}
	function formatMessage(text){
		let escaped=escapeHtml(text);
		return escaped.replace(/\n/g, '<br>');
	}
	async function fetchAndDisplayIP(){
		try{
			let response=await fetch('/get-client-ip');
			let data=await response.json();
			if(data.ip&&data.ip!=="::1"&&data.ip!=="127.0.0.1"){
				clientRealIP=data.ip;
				userIP.value=`Your local IP is: ${clientRealIP}`;
			}
			else{
				userIP.value="Unable to detect IP (invalid response)";
			}
		}
		catch(err){
			userIP.value="IP detection failed";
		}
	}
	fetchAndDisplayIP();
	async function isNameClean(name){
		try{
			let response=await fetch("/check-name",{
				method:"POST",
				headers:{"Content-Type":"application/json"},
				body:JSON.stringify({name})
			});
			let data=await response.json();
			return data.clean==true;
		}
		catch(e){
			console.error("Name check failed",e);
			return true;
		}
	}
	async function generateRandomUsername(){
		let charSet="abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		let randomName="";
		while(randomName.length<5){
			let randomCharIndex=Math.floor(Math.random()*charSet.length);
			let randomChar=charSet[randomCharIndex];
			if(!randomName.includes(randomChar)){
				randomName+=randomChar;
			}
		}
		let clean=await isNameClean(randomName);
		if(clean){
			return randomName;
		}
		else{
			return generateRandomUserame();
		}
	}
	async function loggingIn(){
		let username=usernameInput.value.trim();
		if(!username){
			document.getElementById("login-error").textContent="Please enter your username";
			return;
		}
		currentUser=username;
		if(clientRealIP=="Unknown") await fetchAndDisplayIP();
		loginPage.style.display="none";
		chatPage.style.display="block";
		const serverHost=window.location.hostname;
		const wsUrl=`ws://${serverHost}:${defaultPort}`;
		socket=new WebSocket(wsUrl);
		socket.onopen=()=>{
			socket.send(JSON.stringify({type:"join",username:currentUser}));
		};
		socket.onmessage=(event)=>{
			let data=JSON.parse(event.data);
			if(data.type=="system"&&data.message&&data.message.includes("Your IP is")){
				let ip=data.message.split("Your IP is ")[1];
				if(clientRealIP=="Unknown"){
					clientRealIP=ip;
					userIP.value=`Your local IP is: ${clientRealIP}`;
				}
				return;
			}
			if(data.type=="system") return;
			let newMessage=document.createElement("li");
			let messageTime=getCurrentTime();
			let formattedMessage=formatMessage(data.message||"");
			let displayIP=data.ip||clientRealIP||"Unknown";
			newMessage.innerHTML=`${data.username} [${displayIP}] (${messageTime}): ${formattedMessage}`;
			newMessage.style.whiteSpace="pre-wrap";
			if(data.username==currentUser){
				newMessage.classList.add("userMessage");
			}
			else{
				newMessage.classList.add("otherMessage");
			}
			messagesList.appendChild(newMessage);
			messagesList.scrollTop=messagesList.scrollHeight;
		};
		socket.onerror=(error)=>{ console.error("WebSocket error",error); };
		socket.onclose=()=>{ console.log("WebSocket closed"); };
	}
	usernameInput.addEventListener("keyup",(event)=>{
		if(event.key=="Enter") loggingIn();
	});
	document.getElementById("joinChat").addEventListener("click",loggingIn);
	document.getElementById("genUsername").addEventListener("click",async()=>{
		let newName=await generateRandomUsername();
		usernameInput.value=newName;
	});
	function sendMessage(){
		let message=userMessage.value.trim();
		if(message&&socket&&socket.readyState==WebSocket.OPEN){
			socket.send(JSON.stringify({username:currentUser,message:message,ip:clientRealIP}));
			userMessage.value="";
		}
		else if(socket&&socket.readyState!==WebSocket.OPEN){
			console.error("WebSocket not open");
			alert("Connection lost. Please refresh.");
		}
	}
	userMessage.addEventListener("keypress",(event)=>{
		if(event.key=="Enter"&&event.shiftKey){
			event.preventDefault();
			sendMessage();
		}
	});
	document.getElementById("sendMessage").onclick=sendMessage;
});