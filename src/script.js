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
	async function loggingIn(){
		let username=usernameInput.value.trim();
		if(!username){
			document.getElementById("login-error").textContent="Please enter your username";
			return;
		}
		currentUser=username;
		if(clientRealIP==="Unknown") await fetchAndDisplayIP();
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
			if(data.type==="system"&&data.message&&data.message.includes("Your IP is")){
				let ip=data.message.split("Your IP is ")[1];
				if(clientRealIP==="Unknown"){
					clientRealIP=ip;
					userIP.value=`Your local IP is: ${clientRealIP}`;
				}
				return;
			}
			if(data.type==="system") return;
			let newMessage=document.createElement("li");
			let messageTime=getCurrentTime();
			let formattedMessage=(data.message||"").replace(/\n/g,"<br>");
			let displayIP=data.ip||clientRealIP||"Unknown";
			newMessage.innerHTML=`${data.username} [${displayIP}] (${messageTime}): ${formattedMessage}`;
			if(data.username===currentUser){
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
		if(event.key==="Enter") loggingIn();
	});
	document.querySelector("input[type=\"button\"]").addEventListener("click",loggingIn);
	function sendMessage(){
		let message=userMessage.value.trim();
		if(message&&socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({username:currentUser,message:message,ip:clientRealIP}));
			userMessage.value="";
		}
		else if(socket&&socket.readyState!==WebSocket.OPEN){
			console.error("WebSocket not open");
			alert("Connection lost. Please refresh.");
		}
	}
	userMessage.addEventListener("keypress",(event)=>{
		if(event.key==="Enter"&&event.shiftKey){
			event.preventDefault();
			sendMessage();
		}
	});
	document.getElementById("sendMessage").onclick=sendMessage;
});