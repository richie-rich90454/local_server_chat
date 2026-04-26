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
	let reconnectAttempts=0;
	let reconnectTimer=null;
	let intentionalClose=false;
	let timeSpan=document.createElement("span");
	timeSpan.id="currentTime";
	timeSpan.style.marginLeft="1rem";
	timeSpan.style.fontSize="0.8rem";
	let onlineSpan=document.getElementById("onlineCount");
	if(onlineSpan&&onlineSpan.parentNode){
		onlineSpan.parentNode.appendChild(timeSpan);
	}
	function updateClock(){
		let now=new Date();
		let str=now.toLocaleTimeString([],{hour:"2-digit", minute:"2-digit", second:"2-digit"});
		if(timeSpan){
			timeSpan.textContent=str;
		}
	}
	updateClock();
	setInterval(updateClock,1000);

	function showChatError(msg){
		if(!chatErrorDiv){
			return;
		}
		chatErrorDiv.textContent=msg;
		chatErrorDiv.classList.add("show");
		setTimeout(()=>{
			chatErrorDiv.classList.remove("show");
		},3000);
	}
	function shakeElement(el){
		if(!el){
			return;
		}
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
			if(m=='&'){
				return '&amp;';
			}
			if(m=='<'){
				return '&lt;';
			}
			if(m=='>'){
				return '&gt;';
			}
			return m;
		});
	}
	function formatMarkdown(text){
		let escaped=escapeHtml(text);
		escaped=escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
		escaped=escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		escaped=escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
		return escaped.replace(/\n/g, '<br>');
	}
	function highlightMentions(html, currentUsername){
		let regex=/(?:@([a-zA-Z0-9_]+)|@\"([^\"]+)\"|@&quot;([^&]+)&quot;)/g;
		return html.replace(regex, function(match, simpleName, quotedName, escapedQuotedName){
			let username=simpleName||quotedName||escapedQuotedName;
			if(username===currentUsername){
				return `<span style="background-color:#FFD700; color:#000; border-radius:4px; padding:0 2px;">@${escapeHtml(username)}</span>`;
			}
			else{
				return `<span style="background-color:#E0E0E0; color:#000; border-radius:4px; padding:0 2px;">@${escapeHtml(username)}</span>`;
			}
		});
	}
	function scrollToBottom(){
		messagesList.scrollTop=messagesList.scrollHeight;
	}
	function checkScrollPosition(){
		let isAtBottom=messagesList.scrollHeight-messagesList.scrollTop<=messagesList.clientHeight+10;
		if(isAtBottom){
			autoScroll=true;
			if(scrollBtn){
				scrollBtn.style.display="none";
			}
		}
		else{
			autoScroll=false;
			if(scrollBtn){
				scrollBtn.style.display="flex";
			}
		}
	}
	async function fetchAndDisplayIP(){
		try{
			let response=await fetch('/get-client-ip');
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
			return data.clean===true;
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
			return generateRandomUsername();
		}
	}
	function parsePrivateMessage(msg){
		let quotedPattern=/^\/msg\s+"([^"]+)"\s+(.+)$/s;
		let match=msg.match(quotedPattern);
		if(match){
			return {target:match[1], content:match[2]};
		}
		let simplePattern=/^\/msg\s+(\S+)\s+(.+)$/s;
		match=msg.match(simplePattern);
		if(match){
			return {target:match[1], content:match[2]};
		}
		return null;
	}
	function updateTypingIndicator(){
		if(!typingIndicatorDiv){
			return;
		}
		let arr=Array.from(currentTypers);
		if(arr.length===0){
			typingIndicatorDiv.textContent="";
		}
		else if(arr.length===1){
			typingIndicatorDiv.textContent=`${escapeHtml(arr[0])} is typing...`;
		}
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
		if(selectedText.length===0){
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
				let maxWidth=800;
				let maxHeight=800;
				let width=img.width;
				let height=img.height;
				if(width>maxWidth){
					height=height*maxWidth/width;
					width=maxWidth;
				}
				if(height>maxHeight){
					width=width*maxHeight/height;
					height=maxHeight;
				}
				canvas.width=width;
				canvas.height=height;
				let ctx=canvas.getContext("2d");
				ctx.drawImage(img,0,0,width,height);
				let webpData=canvas.toDataURL("image/webp",0.7);
				resolve(webpData);
			};
			img.onerror=()=>reject("Image load failed");
			img.src=URL.createObjectURL(file);
		});
	}
	function connectWebSocket(){
		if(reconnectTimer){
			clearTimeout(reconnectTimer);
		}
		let serverHost=window.location.hostname;
		let wsUrl=`ws://${serverHost}:${defaultPort}`;
		socket=new WebSocket(wsUrl);
		socket.onopen=()=>{
			console.log("WebSocket connected");
			reconnectAttempts=0;
			socket.send(JSON.stringify({type:"join",username:currentUser}));
		};
		socket.onmessage=(event)=>{
			let data=JSON.parse(event.data);
			if(data.type==="onlineCount"){
				let onlineSpanElement=document.getElementById("onlineCount");
				if(onlineSpanElement){
					onlineSpanElement.textContent=`(${data.count} online)`;
				}
				return;
			}
			if(data.type==="typing"){
				if(data.typing){
					currentTypers.add(data.username);
				}
				else{
					currentTypers.delete(data.username);
				}
				updateTypingIndicator();
				return;
			}
			if(data.type==="system"){
				if(data.message&&data.message.includes("Your IP is")){
					let ip=data.message.split("Your IP is ")[1];
					if(clientRealIP==="Unknown"){
						clientRealIP=ip;
						userIP.value=`Your local IP is: ${clientRealIP}`;
					}
					return;
				}
				if(data.message&&data.message.includes("already taken")){
					joinFailed=true;
					document.getElementById("login-error").textContent=data.message;
					shakeElement(usernameInput);
					intentionalClose=true;
					socket.close();
					return;
				}
				let newMessage=document.createElement("li");
				newMessage.innerHTML=`<em>${escapeHtml(data.message)}</em>`;
				newMessage.style.whiteSpace="pre-wrap";
				newMessage.style.color="gray";
				newMessage.style.fontStyle="italic";
				messagesList.appendChild(newMessage);
				if(autoScroll){
					scrollToBottom();
				}
				checkScrollPosition();
				return;
			}
			if(data.type==="private"){
				let time=data.timestamp||getCurrentTime();
				let formattedMessage=formatMarkdown(data.message);
				let displayIP=data.ip||"Unknown";
				let html;
				if(data.self){
					html=`[Private to ${escapeHtml(data.target)}] You [${displayIP}] (${time}): ${formattedMessage}`;
				}
				else{
					html=`[Private] ${escapeHtml(data.from)} [${displayIP}] (${time}): ${formattedMessage}`;
				}
				let li=document.createElement("li");
				li.innerHTML=html;
				li.style.whiteSpace="pre-wrap";
				if(data.self){
					li.classList.add("userMessage");
				}
				else{
					li.classList.add("otherMessage");
				}
				messagesList.appendChild(li);
				if(autoScroll){
					scrollToBottom();
				}
				checkScrollPosition();
				return;
			}
			if(data.type==="image"){
				let time=getCurrentTime();
				let displayIP=data.ip||clientRealIP||"Unknown";
				let imgHtml=`<img src="${escapeHtml(data.image)}" style="max-width:100%; max-height:200px; border-radius:8px; margin-top:4px; cursor:pointer;" onclick="window.open(this.src,'_blank')">`;
				let rawHtml=`${escapeHtml(data.username)} [${displayIP}] (${time}):<br> ${imgHtml}`;
				let li=document.createElement("li");
				li.innerHTML=rawHtml;
				if(data.username===currentUser){
					li.classList.add("userMessage");
				}
				else{
					li.classList.add("otherMessage");
				}
				messagesList.appendChild(li);
				if(autoScroll){
					scrollToBottom();
				}
				checkScrollPosition();
				return;
			}
			if(data.type==="voice"){
				let time=getCurrentTime();
				let displayIP=data.ip||clientRealIP||"Unknown";
				let audioHtml=`<audio controls src="${escapeHtml(data.voice)}" style="max-width:100%;"></audio>`;
				let rawHtml=`${escapeHtml(data.username)} [${displayIP}] (${time}):<br> ${audioHtml}`;
				let li=document.createElement("li");
				li.innerHTML=rawHtml;
				if(data.username===currentUser){
					li.classList.add("userMessage");
				}
				else{
					li.classList.add("otherMessage");
				}
				messagesList.appendChild(li);
				if(autoScroll){
					scrollToBottom();
				}
				checkScrollPosition();
				return;
			}
			let time=getCurrentTime();
			let formattedMessage=formatMarkdown(data.message||"");
			let displayIP=data.ip||clientRealIP||"Unknown";
			let baseHtml=`${escapeHtml(data.username)} [${displayIP}] (${time}): ${formattedMessage}`;
			let finalHtml=highlightMentions(baseHtml, currentUser);
			let li=document.createElement("li");
			li.innerHTML=finalHtml;
			li.style.whiteSpace="pre-wrap";
			if(data.username===currentUser){
				li.classList.add("userMessage");
			}
			else{
				li.classList.add("otherMessage");
			}
			let replySpan=document.createElement("span");
			replySpan.textContent=" 💬";
			replySpan.className="reply-btn";
			replySpan.title="Reply to this message";
			let rawMessageText=data.message;
			let senderUsername=data.username;
			replySpan.onclick=()=>{
				let quotedText=`> @${senderUsername}: ${rawMessageText}\n`;
				let currentCursor=userMessage.selectionStart;
				let currentVal=userMessage.value;
				let newVal=currentVal.substring(0,currentCursor)+quotedText+currentVal.substring(currentCursor);
				userMessage.value=newVal;
				userMessage.selectionStart=currentCursor+quotedText.length;
				userMessage.selectionEnd=currentCursor+quotedText.length;
				userMessage.focus();
			};
			li.appendChild(replySpan);
			messagesList.appendChild(li);
			if(autoScroll){
				scrollToBottom();
			}
			checkScrollPosition();
		};
		socket.onerror=(error)=>{
			console.error("WebSocket error",error);
		};
		socket.onclose=()=>{
			console.log("WebSocket closed");
			if(!intentionalClose && currentUser && chatPage.style.display==="block"){
				showChatError("Connection lost. Reconnecting...");
				reconnectTimer=setTimeout(()=>{
					reconnectAttempts++;
					let delay=Math.min(3000, 1000 * Math.pow(1.5, reconnectAttempts));
					setTimeout(connectWebSocket, delay);
				},3000);
			}
		};
	}
	async function loggingIn(){
		let username=usernameInput.value.trim();
		if(!username){
			document.getElementById("login-error").textContent="Please enter your username";
			shakeElement(usernameInput);
			return;
		}
		currentUser=username;
		if(clientRealIP==="Unknown"){
			await fetchAndDisplayIP();
		}
		loginPage.style.display="none";
		chatPage.style.display="block";
		intentionalClose=false;
		connectWebSocket();
		checkScrollPosition();
	}
	usernameInput.addEventListener("keyup",(event)=>{
		if(event.key==="Enter"){
			loggingIn();
		}
	});
	document.getElementById("joinChat").addEventListener("click",loggingIn);
	document.getElementById("genUsername").addEventListener("click",async()=>{
		let newName=await generateRandomUsername();
		usernameInput.value=newName;
	});
	function exportChatLog(){
		let messages=messagesList.children;
		if(messages.length===0){
			showChatError("No messages to export.");
			return;
		}
		let lines=[];
		for(let li of messages){
			let text=li.innerText||li.textContent;
			if(text.trim()){
				lines.push(text);
			}
		}
		if(lines.length===0){
			showChatError("No messages to export.");
			return;
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
	let exportBtn=document.getElementById("exportChat");
	if(exportBtn){
		exportBtn.addEventListener("click",exportChatLog);
	}
	let clearBtn=document.getElementById("clearChat");
	if(clearBtn){
		clearBtn.addEventListener("click",()=>{
			while(messagesList.firstChild){
				messagesList.removeChild(messagesList.firstChild);
			}
		});
	}
	let emojiBtn=document.getElementById("emojiBtn");
	let emojiPicker=document.getElementById("emojiPicker");
	if(emojiBtn&&emojiPicker){
		emojiBtn.addEventListener("click",()=>{
			if(emojiPicker.style.display==="none"){
				emojiPicker.style.display="grid";
			}
			else{
				emojiPicker.style.display="none";
			}
		});
		emojiPicker.querySelectorAll("span").forEach(span=>{
			span.addEventListener("click",()=>{
				userMessage.value+=span.textContent;
				emojiPicker.style.display="none";
				userMessage.focus();
			});
		});
		document.addEventListener("click",(e)=>{
			if(!emojiBtn.contains(e.target)&&!emojiPicker.contains(e.target)){
				emojiPicker.style.display="none";
			}
		});
	}
	userMessage.addEventListener("keydown",(e)=>{
		if(e.ctrlKey&&e.key==='b'){
			e.preventDefault();
			wrapSelection(userMessage,'**','**');
		}
		else if(e.ctrlKey&&e.key==='i'){
			e.preventDefault();
			wrapSelection(userMessage,'*','*');
		}
		else if(e.ctrlKey&&e.key==='m'){
			e.preventDefault();
			wrapSelection(userMessage,'`','`');
		}
	});
	function sendMessageContent(message, isImage=false, imageData=null){
		if(!socket||socket.readyState!==WebSocket.OPEN){
			showChatError("Connection lost. Please refresh.");
			return false;
		}
		if(isImage){
			socket.send(JSON.stringify({
				type:"image",
				username:currentUser,
				image:imageData,
				ip:clientRealIP,
				timestamp:getCurrentTime()
			}));
		}
		else{
			let privateInfo=parsePrivateMessage(message);
			if(privateInfo){
				socket.send(JSON.stringify({
					type:"private",
					username:currentUser,
					target:privateInfo.target,
					message:privateInfo.content,
					ip:clientRealIP,
					timestamp:getCurrentTime()
				}));
			}
			else{
				socket.send(JSON.stringify({username:currentUser, message:message, ip:clientRealIP}));
			}
		}
		return true;
	}
	function sendMessage(){
		let message=userMessage.value.trim();
		if(!message){
			return;
		}
		if(message==="/users"){
			if(socket&&socket.readyState===WebSocket.OPEN){
				socket.send(JSON.stringify({type:"getUsers"}));
			}
			userMessage.value="";
			return;
		}
		if(message==="/help"){
			let helpText="Available commands:\n/users - list online users\n/msg \"username\" message - send private message\n/help - show this help\n\nKeyboard shortcuts:\nCtrl+B - bold\nCtrl+I - italic\nCtrl+M - inline code\n\nDrag & drop image (≤1MB, converted to WebP)\n\nMentions: @username or @\"username with spaces\"\n\nClick 💬 on any message to reply with quoted text.";
			let fakeEvent={data:JSON.stringify({type:"system",message:helpText})};
			socket.onmessage(fakeEvent);
			userMessage.value="";
			return;
		}
		if(sendMessageContent(message)){
			userMessage.value="";
		}
	}
	userMessage.addEventListener("keypress",(event)=>{
		if(event.key==="Enter"&&event.shiftKey){
			event.preventDefault();
			sendMessage();
		}
	});
	userMessage.addEventListener("input",()=>{
		if(typingTimeout){
			clearTimeout(typingTimeout);
		}
		sendTypingStart();
		typingTimeout=setTimeout(()=>{
			sendTypingStop();
		},1000);
	});
	userMessage.addEventListener("blur",()=>{
		if(typingTimeout){
			clearTimeout(typingTimeout);
		}
		sendTypingStop();
	});
	document.getElementById("sendMessage").onclick=sendMessage;
	userMessage.addEventListener("dragover",(e)=>{
		e.preventDefault();
	});
	userMessage.addEventListener("drop",async(e)=>{
		e.preventDefault();
		let file=e.dataTransfer.files[0];
		if(!file){
			return;
		}
		if(!file.type.startsWith("image/")){
			showChatError("Only image files are allowed.");
			return;
		}
		if(file.size>1024*1024){
			showChatError("File too large (max 1 MB).");
			return;
		}
		try{
			let webpData=await convertToWebP(file);
			sendMessageContent(null, true, webpData);
		}
		catch(err){
			showChatError("Image conversion failed: "+err);
		}
	});
	window.addEventListener("beforeunload",(e)=>{
		if(chatPage.style.display==="block"){
			intentionalClose=true;
			e.preventDefault();
			e.returnValue="You are currently in the chat. Leaving will disconnect you.";
			return "You are currently in the chat. Leaving will disconnect you.";
		}
	});
	function applyTheme(theme){
		if(theme==="dark"){
			document.body.setAttribute("data-theme","dark");
		}
		else{
			document.body.setAttribute("data-theme","light");
		}
	}
	function getSystemTheme(){
		if(window.matchMedia("(prefers-color-scheme: dark)").matches){
			return "dark";
		}
		else{
			return "light";
		}
	}
	let savedTheme=localStorage.getItem("chatTheme");
	if(!savedTheme){
		savedTheme=getSystemTheme();
	}
	applyTheme(savedTheme);
	let themeToggle=document.getElementById("themeToggle");
	if(themeToggle){
		themeToggle.addEventListener("click",()=>{
			let currentTheme=document.body.getAttribute("data-theme");
			let newTheme=currentTheme==="dark"?"light":"dark";
			applyTheme(newTheme);
			localStorage.setItem("chatTheme",newTheme);
		});
	}
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",(e)=>{
		if(!localStorage.getItem("chatTheme")){
			applyTheme(e.matches?"dark":"light");
		}
	});
	messagesList.addEventListener("scroll",checkScrollPosition);
	if(scrollBtn){
		scrollBtn.addEventListener("click",()=>{
			scrollToBottom();
			autoScroll=true;
			if(scrollBtn){
				scrollBtn.style.display="none";
			}
		});
	}
});