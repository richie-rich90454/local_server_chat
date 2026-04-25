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
	let autoScroll=true;
	let scrollBtn=document.getElementById("scrollToBottomBtn");
	let joinFailed=false;
	let chatErrorDiv=document.getElementById("chatError");
	let typingTimeout=null;
	let currentTypers=new Set();
	let typingIndicatorDiv=document.getElementById("typingIndicator");

	// Voice recording variables
	let mediaRecorder=null;
	let audioChunks=[];
	let isRecording=false;
	let voiceBtn=document.getElementById("voiceBtn");
	let voiceStatus=document.getElementById("voiceStatus");

	function showChatError(msg){
		if(!chatErrorDiv) return;
		chatErrorDiv.textContent=msg;
		chatErrorDiv.classList.add("show");
		setTimeout(()=>{
			chatErrorDiv.classList.remove("show");
		},3000);
	}
	function shakeElement(el){
		if(!el) return;
		el.classList.add("shake");
		setTimeout(()=>{
			el.classList.remove("shake");
		},400);
	}
	function getCurrentTime(){
		let now=new Date();
		return `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`;
	}
	function escapeHtml(str){
		return str.replace(/[&<>]/g, function(m){
			if(m=="&") return "&amp;";
			if(m=="<") return "&lt;";
			if(m==">") return "&gt;";
			return m;
		});
	}
	function formatMarkdown(text){
		let escaped=escapeHtml(text);
		escaped=escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
		escaped=escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
		escaped=escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
		return escaped.replace(/\n/g, "<br>");
	}
	function scrollToBottom(){
		messagesList.scrollTop=messagesList.scrollHeight;
	}
	function checkScrollPosition(){
		let isAtBottom=messagesList.scrollHeight-messagesList.scrollTop<=messagesList.clientHeight+10;
		if(isAtBottom){
			autoScroll=true;
			if(scrollBtn) scrollBtn.style.display="none";
		}
		else{
			autoScroll=false;
			if(scrollBtn) scrollBtn.style.display="flex";
		}
	}
	async function fetchAndDisplayIP(){
		try{
			let response=await fetch("/get-client-ip");
			let data=await response.json();
			if(data.ip&&data.ip!="::1"&&data.ip!="127.0.0.1"){
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
		if(clean) return randomName;
		else return generateRandomUsername();
	}
	function parsePrivateMessage(msg){
		let quotedPattern=/^\/msg\s+"([^"]+)"\s+(.+)$/s;
		let match=msg.match(quotedPattern);
		if(match) return {target:match[1], content:match[2]};
		let simplePattern=/^\/msg\s+(\S+)\s+(.+)$/s;
		match=msg.match(simplePattern);
		if(match) return {target:match[1], content:match[2]};
		return null;
	}
	function updateTypingIndicator(){
		if(!typingIndicatorDiv) return;
		let arr=Array.from(currentTypers);
		if(arr.length==0) typingIndicatorDiv.textContent="";
		else if(arr.length==1) typingIndicatorDiv.textContent=`${escapeHtml(arr[0])} is typing...`;
		else{
			let last=arr.pop();
			typingIndicatorDiv.textContent=`${arr.map(escapeHtml).join(", ")} and ${escapeHtml(last)} are typing...`;
		}
	}
	function sendTypingStop(){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:"typing", username:currentUser, typing:false}));
		}
	}
	function sendTypingStart(){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:"typing", username:currentUser, typing:true}));
		}
	}
	function wrapSelection(textarea, before, after){
		let start=textarea.selectionStart;
		let end=textarea.selectionEnd;
		let text=textarea.value;
		let selectedText=text.substring(start,end);
		let newText=text.substring(0,start)+before+selectedText+after+text.substring(end);
		textarea.value=newText;
		if(selectedText.length==0){
			textarea.selectionStart=start+before.length;
			textarea.selectionEnd=start+before.length;
		}
		else{
			textarea.selectionStart=start;
			textarea.selectionEnd=end+before.length+after.length;
		}
		textarea.focus();
	}
	async function convertToWebP(file){
		return new Promise((resolve,reject)=>{
			let img=new Image();
			img.onload=()=>{
				let canvas=document.createElement("canvas");
				let max=800;
				let w=img.width, h=img.height;
				if(w>max){ h=h*max/w; w=max; }
				if(h>max){ w=w*max/h; h=max; }
				canvas.width=w; canvas.height=h;
				let ctx=canvas.getContext("2d");
				ctx.drawImage(img,0,0,w,h);
				resolve(canvas.toDataURL("image/webp",0.7));
			};
			img.onerror=()=>reject("Image load failed");
			img.src=URL.createObjectURL(file);
		});
	}
	async function startRecording(){
		try{
			let stream=await navigator.mediaDevices.getUserMedia({audio:true});
			mediaRecorder=new MediaRecorder(stream);
			audioChunks=[];
			mediaRecorder.ondataavailable=(event)=>{
				audioChunks.push(event.data);
			};
			mediaRecorder.onstop=async()=>{
				let audioBlob=new Blob(audioChunks, {type:"audio/webm"});
				let reader=new FileReader();
				reader.onloadend=()=>{
					let base64=reader.result;
					if(socket&&socket.readyState===WebSocket.OPEN){
						socket.send(JSON.stringify({
							type:"voice",
							username:currentUser,
							voice:base64,
							ip:clientRealIP,
							timestamp:getCurrentTime()
						}));
					}
					stream.getTracks().forEach(track=>track.stop());
					voiceStatus.style.display="none";
					if(voiceBtn) voiceBtn.classList.remove("recording");
				};
				reader.readAsDataURL(audioBlob);
			};
			mediaRecorder.start();
			isRecording=true;
			if(voiceStatus) voiceStatus.style.display="block";
			if(voiceBtn) voiceBtn.classList.add("recording");
			setTimeout(()=>{
				if(isRecording) stopRecording();
			},30000);
		}
		catch(err){
			console.error(err);
			showChatError("Microphone access denied.");
		}
	}
	function stopRecording(){
		if(mediaRecorder&&isRecording){
			mediaRecorder.stop();
			isRecording=false;
		}
	}
	async function loggingIn(){
		let username=usernameInput.value.trim();
		if(!username){
			document.getElementById("login-error").textContent="Please enter your username";
			shakeElement(usernameInput);
			return;
		}
		currentUser=username;
		if(clientRealIP=="Unknown") await fetchAndDisplayIP();
		loginPage.style.display="none";
		chatPage.style.display="block";
		const serverHost=window.location.hostname;
		const wsUrl=`ws://${serverHost}:${defaultPort}`;
		socket=new WebSocket(wsUrl);
		joinFailed=false;
		socket.onopen=()=>{
			socket.send(JSON.stringify({type:"join",username:currentUser}));
		};
		socket.onmessage=(event)=>{
			let data=JSON.parse(event.data);
			if(data.type=="onlineCount"){
				let onlineSpan=document.getElementById("onlineCount");
				if(onlineSpan) onlineSpan.textContent=`(${data.count} online)`;
				return;
			}
			if(data.type=="typing"){
				if(data.typing) currentTypers.add(data.username);
				else currentTypers.delete(data.username);
				updateTypingIndicator();
				return;
			}
			if(data.type=="system"){
				if(data.message&&data.message.includes("Your IP is")){
					let ip=data.message.split("Your IP is ")[1];
					if(clientRealIP=="Unknown"){
						clientRealIP=ip;
						userIP.value=`Your local IP is: ${clientRealIP}`;
					}
					return;
				}
				if(data.message&&data.message.includes("already taken")){
					joinFailed=true;
					document.getElementById("login-error").textContent=data.message;
					shakeElement(usernameInput);
					socket.close();
					return;
				}
				let newMessage=document.createElement("li");
				newMessage.innerHTML=`<em>${escapeHtml(data.message)}</em>`;
				newMessage.style.whiteSpace="pre-wrap";
				newMessage.style.color="gray";
				newMessage.style.fontStyle="italic";
				messagesList.appendChild(newMessage);
				if(autoScroll) scrollToBottom();
				checkScrollPosition();
				return;
			}
			if(data.type=="private"){
				let newMessage=document.createElement("li");
				let time=data.timestamp||getCurrentTime();
				let formattedMessage=formatMarkdown(data.message);
				let displayIP=data.ip||"Unknown";
				if(data.self){
					newMessage.innerHTML=`[Private to ${escapeHtml(data.target)}] You [${displayIP}] (${time}): ${formattedMessage}`;
				}
				else{
					newMessage.innerHTML=`[Private] ${escapeHtml(data.from)} [${displayIP}] (${time}): ${formattedMessage}`;
				}
				newMessage.classList.add("privateMessage");
				messagesList.appendChild(newMessage);
				if(autoScroll) scrollToBottom();
				checkScrollPosition();
				return;
			}
			if(data.type=="image"){
				let newMessage=document.createElement("li");
				let messageTime=getCurrentTime();
				let displayIP=data.ip||clientRealIP||"Unknown";
				let imgHtml=`<img src="${escapeHtml(data.image)}" style="max-width:100%; max-height:200px; border-radius:8px; margin-top:4px; cursor:pointer;" onclick="window.open(this.src,"_blank")">`;
				newMessage.innerHTML=`${escapeHtml(data.username)} [${displayIP}] (${messageTime}):<br> ${imgHtml}`;
				if(data.username==currentUser) newMessage.classList.add("userMessage");
				else newMessage.classList.add("otherMessage");
				messagesList.appendChild(newMessage);
				if(autoScroll) scrollToBottom();
				checkScrollPosition();
				return;
			}
			if(data.type=="voice"){
				let newMessage=document.createElement("li");
				let messageTime=getCurrentTime();
				let displayIP=data.ip||clientRealIP||"Unknown";
				let audioHtml=`<audio controls src="${escapeHtml(data.voice)}" style="max-width:100%;"></audio>`;
				newMessage.innerHTML=`${escapeHtml(data.username)} [${displayIP}] (${messageTime}):<br> ${audioHtml}`;
				if(data.username==currentUser) newMessage.classList.add("userMessage");
				else newMessage.classList.add("otherMessage");
				messagesList.appendChild(newMessage);
				if(autoScroll) scrollToBottom();
				checkScrollPosition();
				return;
			}
			let newMessage=document.createElement("li");
			let messageTime=getCurrentTime();
			let formattedMessage=formatMarkdown(data.message||"");
			let displayIP=data.ip||clientRealIP||"Unknown";
			newMessage.innerHTML=`${escapeHtml(data.username)} [${displayIP}] (${messageTime}): ${formattedMessage}`;
			if(data.username==currentUser) newMessage.classList.add("userMessage");
			else newMessage.classList.add("otherMessage");
			messagesList.appendChild(newMessage);
			if(autoScroll) scrollToBottom();
			checkScrollPosition();
		};
		socket.onerror=(e)=>console.error(e);
		socket.onclose=()=>{
			if(joinFailed){
				loginPage.style.display="block";
				chatPage.style.display="none";
				socket=null;
			}
		};
		messagesList.addEventListener("scroll",checkScrollPosition);
		scrollBtn.addEventListener("click",()=>{
			scrollToBottom();
			autoScroll=true;
			scrollBtn.style.display="none";
		});
		checkScrollPosition();
	}
	usernameInput.addEventListener("keyup",(e)=>e.key=="Enter"&&loggingIn());
	document.getElementById("joinChat").addEventListener("click",loggingIn);
	document.getElementById("genUsername").addEventListener("click",async()=>{
		usernameInput.value=await generateRandomUsername();
	});
	function exportChatLog(){
		let messages=messagesList.children;
		if(messages.length==0){
			showChatError("No messages to export.");
			return;
		}
		let lines=[];
		for(let li of messages){
			let text=li.innerText||li.textContent;
			if(text.trim()) lines.push(text);
		}
		let content=lines.join("\n");
		let blob=new Blob([content], {type:"text/plain"});
		let now=new Date();
		let timestamp=`${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,"0")}-${now.getDate().toString().padStart(2,"0")}_${now.getHours().toString().padStart(2,"0")}-${now.getMinutes().toString().padStart(2,"0")}-${now.getSeconds().toString().padStart(2,"0")}`;
		let link=document.createElement("a");
		link.href=URL.createObjectURL(blob);
		link.download=`chat_log_${timestamp}.txt`;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	document.getElementById("exportChat")?.addEventListener("click",exportChatLog);
	document.getElementById("clearChat")?.addEventListener("click",()=>{
		while(messagesList.firstChild) messagesList.removeChild(messagesList.firstChild);
	});
	let emojiBtn=document.getElementById("emojiBtn");
	let emojiPicker=document.getElementById("emojiPicker");
	if(emojiBtn&&emojiPicker){
		emojiBtn.addEventListener("click",()=>{
			emojiPicker.style.display=emojiPicker.style.display=="none"?"grid":"none";
		});
		emojiPicker.querySelectorAll("span").forEach(span=>{
			span.addEventListener("click",()=>{
				userMessage.value+=span.textContent;
				emojiPicker.style.display="none";
				userMessage.focus();
			});
		});
		document.addEventListener("click",(e)=>{
			if(!emojiBtn.contains(e.target)&&!emojiPicker.contains(e.target)) emojiPicker.style.display="none";
		});
	}
	userMessage.addEventListener("keydown",(e)=>{
		if(e.ctrlKey&&e.key==="b"){ e.preventDefault(); wrapSelection(userMessage,"**","**"); }
		else if(e.ctrlKey&&e.key==="i"){ e.preventDefault(); wrapSelection(userMessage,"*","*"); }
		else if(e.ctrlKey&&e.key==="m"){ e.preventDefault(); wrapSelection(userMessage,"`","`"); }
	});
	function sendMessageContent(message, isImage=false, imageData=null){
		if(!socket||socket.readyState!=WebSocket.OPEN){
			showChatError("Connection lost.");
			return false;
		}
		if(isImage){
			socket.send(JSON.stringify({type:"image",username:currentUser,image:imageData,ip:clientRealIP,timestamp:getCurrentTime()}));
		}
		else{
			let privateInfo=parsePrivateMessage(message);
			if(privateInfo){
				socket.send(JSON.stringify({type:"private",username:currentUser,target:privateInfo.target,message:privateInfo.content,ip:clientRealIP,timestamp:getCurrentTime()}));
			}
			else{
				socket.send(JSON.stringify({username:currentUser,message:message,ip:clientRealIP}));
			}
		}
		return true;
	}
	function sendMessage(){
		let message=userMessage.value.trim();
		if(!message) return;
		if(message=="/users"){
			if(socket&&socket.readyState==WebSocket.OPEN) socket.send(JSON.stringify({type:"getUsers"}));
			userMessage.value="";
			return;
		}
		if(message=="/help"){
			let helpText="Available commands:\n/users - list online users\n/msg \"username\" message - private message\n/help - this help\n\nKeyboard:\nCtrl+B bold, Ctrl+I italic, Ctrl+M code\n\nDrag & drop image (≤1MB, converts to WebP)\nVoice: click 🎤 (30s max)";
			let fakeEvent={data:JSON.stringify({type:"system",message:helpText})};
			socket.onmessage(fakeEvent);
			userMessage.value="";
			return;
		}
		if(sendMessageContent(message)) userMessage.value="";
	}
	userMessage.addEventListener("keypress",(e)=>{
		if(e.key=="Enter"&&e.shiftKey){ e.preventDefault(); sendMessage(); }
	});
	userMessage.addEventListener("input",()=>{
		if(typingTimeout) clearTimeout(typingTimeout);
		sendTypingStart();
		typingTimeout=setTimeout(sendTypingStop,1000);
	});
	userMessage.addEventListener("blur",()=>{
		if(typingTimeout) clearTimeout(typingTimeout);
		sendTypingStop();
	});
	document.getElementById("sendMessage").onclick=sendMessage;
	if(voiceBtn){
		voiceBtn.addEventListener("click",()=>{
			if(!isRecording) startRecording();
			else stopRecording();
		});
	}
	userMessage.addEventListener("dragover",e=>e.preventDefault());
	userMessage.addEventListener("drop",async(e)=>{
		e.preventDefault();
		let file=e.dataTransfer.files[0];
		if(!file) return;
		if(!file.type.startsWith("image/")){
			showChatError("Only images allowed.");
			return;
		}
		if(file.size>1024*1024){
			showChatError("Max 1MB.");
			return;
		}
		try{
			let webp=await convertToWebP(file);
			sendMessageContent(null, true, webp);
		}
		catch(err){ showChatError("Image conversion failed."); }
	});
	window.addEventListener("beforeunload",(e)=>{
		if(chatPage.style.display=="block"){
			e.preventDefault();
			e.returnValue="You will be disconnected.";
		}
	});
	function applyTheme(theme){
		document.body.setAttribute("data-theme",theme=="dark"?"dark":"light");
	}
	function getSystemTheme(){
		return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
	}
	let savedTheme=localStorage.getItem("chatTheme");
	if(!savedTheme) savedTheme=getSystemTheme();
	applyTheme(savedTheme);
	document.getElementById("themeToggle").addEventListener("click",()=>{
		let newTheme=document.body.getAttribute("data-theme")=="dark"?"light":"dark";
		applyTheme(newTheme);
		localStorage.setItem("chatTheme",newTheme);
	});
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",(e)=>{
		if(!localStorage.getItem("chatTheme")) applyTheme(e.matches?"dark":"light");
	});
});