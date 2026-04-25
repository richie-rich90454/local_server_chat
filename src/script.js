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
	return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}
async function fetchAndDisplayIP(){
	try{
		let response=await fetch('/get-client-ip');
		let data=await response.json();
		if(data.ip){
			clientRealIP=data.ip;
			userIP.value=`Your local IP is: ${clientRealIP}`;
			console.log("IP obtained via HTTP:", clientRealIP);
		}
		else{
			userIP.value="Unable to detect IP";
			console.error("No ip field in response");
		}
	}
	catch(err){
		console.error("HTTP IP fetch failed:", err);
		userIP.value="IP detection failed";
	}
}
function loggingIn(){
	let username=usernameInput.value.trim();
	if(!username){
		document.getElementById("login-error").textContent="Please enter your username";
		return;
	}
	currentUser=username;
	loginPage.style.display="none";
	chatPage.style.display="block";
	fetchAndDisplayIP();
	const serverHost=window.location.hostname;
	const wsUrl=`ws://${serverHost}:${defaultPort}`;
	socket=new WebSocket(wsUrl);
	socket.onopen=()=>{
		console.log(`Connected to WebSocket server at ${wsUrl}`);
		socket.send(JSON.stringify({type:"join", username}));
	};
	socket.onmessage=(event)=>{
		let data=JSON.parse(event.data);
		if(data.type=="system") return;
		let newMessage=document.createElement("li");
		let messageTime=getCurrentTime();
		let formattedMessage=(data.message||"").replace(/\n/g, "<br>");
		let displayIP=data.ip||clientRealIP||"Unknown";
		newMessage.innerHTML=`${data.username} [${displayIP}] (${messageTime}): ${formattedMessage}`;
		if(data.username==currentUser){
			newMessage.classList.add("userMessage");
		}
		else{
			newMessage.classList.add("otherMessage");
		}
		messagesList.appendChild(newMessage);
		messagesList.scrollTop=messagesList.scrollHeight;
	};
	socket.onerror=(error)=>{
		console.error("WebSocket error:", error);
	};
	socket.onclose=()=>{
		console.log("WebSocket connection closed");
	};
}
usernameInput.addEventListener("keyup", (event)=>{
	if(event.key=="Enter") loggingIn();
});
document.querySelector("input[type=\"button\"]").addEventListener("click", loggingIn);
function sendMessage(){
	let message=userMessage.value.trim();
	if(message&&socket&&socket.readyState==WebSocket.OPEN){
		socket.send(JSON.stringify({username:currentUser, message:message, ip:clientRealIP}));
		userMessage.value="";
	}
	else if(socket&&socket.readyState!==WebSocket.OPEN){
		console.error("WebSocket not open, cannot send message");
		alert("Connection lost. Please refresh and try again.");
	}
}
userMessage.addEventListener("keypress", (event)=>{
	if(event.key=="Enter"&&event.shiftKey){
		event.preventDefault();
		sendMessage();
	}
});
document.getElementById("sendMessage").onclick=sendMessage;