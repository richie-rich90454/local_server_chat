import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import cpp from "highlight.js/lib/languages/cpp";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import python from "highlight.js/lib/languages/python";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import swift from "highlight.js/lib/languages/swift";
import r from "highlight.js/lib/languages/r";
import kotlin from "highlight.js/lib/languages/kotlin";
import scala from "highlight.js/lib/languages/scala";
import dart from "highlight.js/lib/languages/dart";
import perl from "highlight.js/lib/languages/perl";
import ocaml from "highlight.js/lib/languages/ocaml";
import matlab from "highlight.js/lib/languages/matlab";
import sql from "highlight.js/lib/languages/sql";
import vbnet from "highlight.js/lib/languages/vbnet";
import powershell from "highlight.js/lib/languages/powershell";
import json from "highlight.js/lib/languages/json";
import java from "highlight.js/lib/languages/java";
import bash from "highlight.js/lib/languages/bash";
import fortran from "highlight.js/lib/languages/fortran";
import armasm from "highlight.js/lib/languages/armasm";
import avrasm from "highlight.js/lib/languages/avrasm";
import x86asm from "highlight.js/lib/languages/x86asm";
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xaml", xml);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c", cpp);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("go", go);
hljs.registerLanguage("python", python);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("r", r);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("scala", scala);
hljs.registerLanguage("dart", dart);
hljs.registerLanguage("perl", perl);
hljs.registerLanguage("ocaml", ocaml);
hljs.registerLanguage("matlab", matlab);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("vbnet", vbnet);
hljs.registerLanguage("powershell", powershell);
hljs.registerLanguage("json", json);
hljs.registerLanguage("java", java);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("fortran", fortran);
hljs.registerLanguage("armasm", armasm);
hljs.registerLanguage("avrasm", avrasm);
hljs.registerLanguage("x86asm", x86asm);
import hljsDefineZig from "highlightjs-zig";
import hljsDefineCobol from "highlightjs-cobol";
hljsDefineZig(hljs);
hljs.registerLanguage("cobol", hljsDefineCobol);

function createModal(promptMessage, defaultValue, callback){
	let overlay=document.createElement("div");
	overlay.className="modal-overlay";
	let box=document.createElement("div");
	box.className="modal-box";
	let label=document.createElement("div");
	label.textContent=promptMessage;
	label.style.marginBottom="0.5rem";
	let input=document.createElement("input");
	input.type="text";
	input.value=defaultValue||"";
	let buttonDiv=document.createElement("div");
	let okBtn=document.createElement("button");
	okBtn.textContent="OK";
	let cancelBtn=document.createElement("button");
	cancelBtn.textContent="Cancel";
	buttonDiv.appendChild(okBtn);
	buttonDiv.appendChild(cancelBtn);
	box.appendChild(label);
	box.appendChild(input);
	box.appendChild(buttonDiv);
	overlay.appendChild(box);
	document.body.appendChild(overlay);
	function close(){
		overlay.remove();
	}
	okBtn.onclick=()=>{
		let val=input.value.trim();
		close();
		callback(val);
	};
	cancelBtn.onclick=()=>{
		close();
		callback(null);
	};
	input.addEventListener("keypress",(e)=>{
		if(e.key==="Enter"){
			okBtn.click();
		}
	});
	input.focus();
}

document.addEventListener("DOMContentLoaded",()=>{
	let headerControls=document.getElementById("headerControls");
	if(headerControls&&!document.getElementById("exportFormat")){
		let select=document.createElement("select");
		select.id="exportFormat";
		let opt1=document.createElement("option");opt1.value="text";opt1.textContent="TXT";
		let opt2=document.createElement("option");opt2.value="json";opt2.textContent="JSON";
		let opt3=document.createElement("option");opt3.value="html";opt3.textContent="HTML";
		select.appendChild(opt1);select.appendChild(opt2);select.appendChild(opt3);
		headerControls.insertBefore(select,document.getElementById("exportChat"));
	}
	if(!document.getElementById("contextMenu")){
		let menu=document.createElement("div");menu.id="contextMenu";
		menu.style.cssText="position:fixed;background-color:var(--background-card);border:1px solid var(--border-card);border-radius:.3rem;padding:.3rem;z-index:1000;display:none;box-shadow:0 2px 6px var(--box-shadow);color:var(--text-primary);";
		let replyOpt=document.createElement("div");replyOpt.id="replyOption";replyOpt.textContent="Reply";replyOpt.style.cssText="padding:.2rem .5rem;cursor:pointer;white-space:nowrap;color:var(--text-primary);";
		let forwardOpt=document.createElement("div");forwardOpt.id="forwardOption";forwardOpt.textContent="Forward to private";forwardOpt.style.cssText="padding:.2rem .5rem;cursor:pointer;white-space:nowrap;color:var(--text-primary);";
		menu.appendChild(replyOpt);menu.appendChild(forwardOpt);document.body.appendChild(menu);
	}
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
	timeSpan.style.fontSize=".8rem";
	let onlineSpan=document.getElementById("onlineCount");
	if(onlineSpan&&onlineSpan.parentNode){
		onlineSpan.parentNode.appendChild(timeSpan);
	}
	function updateClock(){
		let now=new Date();
		let str=now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
		if(timeSpan){timeSpan.textContent=str;}
	}
	updateClock();
	setInterval(updateClock,1000);
	function showChatError(msg){
		if(!chatErrorDiv){return;}
		chatErrorDiv.textContent=msg;
		chatErrorDiv.classList.add("show");
		setTimeout(()=>{chatErrorDiv.classList.remove("show");},3000);
	}
	function shakeElement(el){
		if(!el){return;}
		el.classList.add("shake");
		setTimeout(()=>{el.classList.remove("shake");},400);
	}
	function getCurrentTime(){
		let now=new Date();
		return `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`;
	}
	function escapeHtml(str){
		return str.replace(/[&<>]/g,function(m){
			if(m=="&"){return "&amp;";}
			if(m=="<"){return "&lt;";}
			if(m==">"){return "&gt;";}
			return m;
		});
	}
	function formatMarkdown(text){
		let codeBlocks=[];
		let withoutCode=text.replace(/^[ \t]*```(\w*)\s*\n([\s\S]*?)\n[ \t]*```/gm,function(match,lang,code){
			let idx=codeBlocks.length;
			codeBlocks.push({lang:lang||"",code});
			return `__CODEBLOCK_${idx}__`;
		});
		let escaped=escapeHtml(withoutCode);
		escaped=escaped.replace(/`([^`]+)`/g,"<code>$1</code>");
		escaped=escaped.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
		escaped=escaped.replace(/\*([^*]+)\*/g,"<em>$1</em>");
		escaped=escaped.replace(/\n/g,"<br>");
		escaped=escaped.replace(/__CODEBLOCK_(\d+)__/g,function(match,idx){
			let block=codeBlocks[parseInt(idx)];
			let highlighted;
			try{
				if(block.lang&&hljs.getLanguage(block.lang)){
					highlighted=hljs.highlight(block.code,{language:block.lang}).value;
				}
				else{
					highlighted=hljs.highlightAuto(block.code).value;
				}
			}
			catch(e){
				highlighted=escapeHtml(block.code);
			}
			return `<pre><code class="hljs">${highlighted}</code></pre>`;
		});
		return escaped;
	}
	function highlightMentions(html,currentUsername){
		let div=document.createElement("div");
		div.innerHTML=html;
		let skipElements=div.querySelectorAll("pre,code");
		skipElements.forEach(el=>{el.setAttribute("data-skip-mention","true");});
		let regex=/(?:@([a-zA-Z0-9_]+)|@\"([^\"]+)\"|@&quot;([^&]+)&quot;)/g;
		let walker=document.createTreeWalker(div,NodeFilter.SHOW_TEXT,{
			acceptNode:function(node){
				let parent=node.parentElement;
				while(parent){
					if(parent.hasAttribute&&parent.hasAttribute("data-skip-mention")){
						return NodeFilter.FILTER_SKIP;
					}
					parent=parent.parentElement;
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		});
		let nodes=[];
		while(walker.nextNode()){nodes.push(walker.currentNode);}
		for(let node of nodes){
			let text=node.nodeValue;
			let newText=text.replace(regex,function(match,simpleName,quotedName,escapedQuotedName){
				let username=simpleName||quotedName||escapedQuotedName;
				if(username===currentUsername){
					return `<span style="background-color:#FFD700; color:#000; border-radius:4px; padding:0 2px;">@${escapeHtml(username)}</span>`;
				}
				else{
					return `<span style="background-color:#E0E0E0; color:#000; border-radius:4px; padding:0 2px;">@${escapeHtml(username)}</span>`;
				}
			});
			if(newText!==text){
				let span=document.createElement("span");
				span.innerHTML=newText;
				node.parentNode.replaceChild(span,node);
				while(span.firstChild){
					span.parentNode.insertBefore(span.firstChild,span);
				}
				span.remove();
			}
		}
		skipElements.forEach(el=>el.removeAttribute("data-skip-mention"));
		return div.innerHTML;
	}
	function scrollToBottom(){
		messagesList.scrollTop=messagesList.scrollHeight;
	}
	function checkScrollPosition(){
		let isAtBottom=messagesList.scrollHeight-messagesList.scrollTop<=messagesList.clientHeight+10;
		if(isAtBottom){
			autoScroll=true;
			if(scrollBtn){scrollBtn.style.display="none";}
		}
		else{
			autoScroll=false;
			if(scrollBtn){scrollBtn.style.display="flex";}
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
			let idx=Math.floor(Math.random()*charSet.length);
			let ch=charSet[idx];
			if(!randomName.includes(ch)){randomName+=ch;}
		}
		let clean=await isNameClean(randomName);
		if(clean){return randomName;}
		else{return generateRandomUsername();}
	}
	function parsePrivateMessage(msg){
		let quoted=/^\/msg\s+"([^"]+)"\s+(.+)$/s;
		let match=msg.match(quoted);
		if(match){return{target:match[1],content:match[2]};}
		let simple=/^\/msg\s+(\S+)\s+(.+)$/s;
		match=msg.match(simple);
		if(match){return{target:match[1],content:match[2]};}
		return null;
	}
	function updateTypingIndicator(){
		if(!typingIndicatorDiv){return;}
		let arr=Array.from(currentTypers);
		if(arr.length===0){typingIndicatorDiv.textContent="";}
		else if(arr.length===1){typingIndicatorDiv.textContent=`${escapeHtml(arr[0])} is typing...`;}
		else{
			let last=arr.pop();
			typingIndicatorDiv.textContent=`${arr.map(escapeHtml).join(", ")} and ${escapeHtml(last)} are typing...`;
		}
	}
	function sendTypingStop(){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:"typing",username:currentUser,typing:false}));
		}
	}
	function sendTypingStart(){
		if(socket&&socket.readyState===WebSocket.OPEN){
			socket.send(JSON.stringify({type:"typing",username:currentUser,typing:true}));
		}
	}
	function wrapSelection(textarea,before,after){
		let start=textarea.selectionStart;
		let end=textarea.selectionEnd;
		let text=textarea.value;
		let selected=text.substring(start,end);
		let newText=text.substring(0,start)+before+selected+after+text.substring(end);
		textarea.value=newText;
		if(selected.length===0){
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
				let w=img.width,h=img.height;
				if(w>max){h=h*max/w;w=max;}
				if(h>max){w=w*max/h;h=max;}
				canvas.width=w;canvas.height=h;
				let ctx=canvas.getContext("2d");
				ctx.drawImage(img,0,0,w,h);
				resolve(canvas.toDataURL("image/webp",0.7));
			};
			img.onerror=()=>reject("Image load failed");
			img.src=URL.createObjectURL(file);
		});
	}
	function insertReplyQuote(sender,rawMessage){
		let quotedText=`> @${sender}: ${rawMessage}\n`;
		let cursor=userMessage.selectionStart;
		let val=userMessage.value;
		let newVal=val.substring(0,cursor)+quotedText+val.substring(cursor);
		userMessage.value=newVal;
		userMessage.selectionStart=cursor+quotedText.length;
		userMessage.selectionEnd=cursor+quotedText.length;
		userMessage.focus();
	}
	function insertForwardToPrivate(sender,rawMessage){
		createModal("Enter target username to forward to:", "", (target)=>{
			if(target&&target.trim()){
				let forwardText=`/msg "${target.trim()}" > @${sender}: ${rawMessage}`;
				let cursor=userMessage.selectionStart;
				let val=userMessage.value;
				let newVal=val.substring(0,cursor)+forwardText+val.substring(cursor);
				userMessage.value=newVal;
				userMessage.selectionStart=cursor+forwardText.length;
				userMessage.selectionEnd=cursor+forwardText.length;
				userMessage.focus();
			}
		});
	}
	function connectWebSocket(){
		if(reconnectTimer){clearTimeout(reconnectTimer);}
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
				let span=document.getElementById("onlineCount");
				if(span){span.textContent=`(${data.count} online)`;}
				return;
			}
			if(data.type==="typing"){
				if(data.typing){currentTypers.add(data.username);}
				else{currentTypers.delete(data.username);}
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
				let li=document.createElement("li");
				li.innerHTML=`<em>${escapeHtml(data.message)}</em>`;
				li.style.cssText="white-space:pre-wrap;color:gray;font-style:italic;";
				messagesList.appendChild(li);
				scrollToBottom();
				checkScrollPosition();
				return;
			}
			if(data.type==="private"){
				let time=data.timestamp||getCurrentTime();
				let formatted=formatMarkdown(data.message);
				let ip=data.ip||"Unknown";
				let html=data.self?`[Private to ${escapeHtml(data.target)}] You [${ip}] (${time}): ${formatted}`:`[Private] ${escapeHtml(data.from)} [${ip}] (${time}): ${formatted}`;
				let li=document.createElement("li");
				li.innerHTML=html;
				li.style.whiteSpace="pre-wrap";
				if(data.self){li.classList.add("userMessage");}
				else{li.classList.add("otherMessage");}
				messagesList.appendChild(li);
				scrollToBottom();
				checkScrollPosition();
				return;
			}
			if(data.type==="image"){
				let time=getCurrentTime();
				let ip=data.ip||clientRealIP||"Unknown";
				let imgHtml=`<img src="${escapeHtml(data.image)}" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:4px;cursor:pointer;" onclick="window.open(this.src,'_blank')">`;
				let rawHtml=`${escapeHtml(data.username)} [${ip}] (${time}):<br> ${imgHtml}`;
				let li=document.createElement("li");
				li.innerHTML=rawHtml;
				if(data.username===currentUser){li.classList.add("userMessage");}
				else{li.classList.add("otherMessage");}
				messagesList.appendChild(li);
				scrollToBottom();
				checkScrollPosition();
				return;
			}
			if(data.type==="voice"){
				let time=getCurrentTime();
				let ip=data.ip||clientRealIP||"Unknown";
				let audioHtml=`<audio controls src="${escapeHtml(data.voice)}" style="max-width:100%;"></audio>`;
				let rawHtml=`${escapeHtml(data.username)} [${ip}] (${time}):<br> ${audioHtml}`;
				let li=document.createElement("li");
				li.innerHTML=rawHtml;
				if(data.username===currentUser){li.classList.add("userMessage");}
				else{li.classList.add("otherMessage");}
				messagesList.appendChild(li);
				scrollToBottom();
				checkScrollPosition();
				return;
			}
			let time=getCurrentTime();
			let formatted=formatMarkdown(data.message||"");
			let ip=data.ip||clientRealIP||"Unknown";
			let baseHtml=`${escapeHtml(data.username)} [${ip}] (${time}): ${formatted}`;
			let finalHtml=highlightMentions(baseHtml,currentUser);
			let li=document.createElement("li");
			li.innerHTML=finalHtml;
			li.style.whiteSpace="pre-wrap";
			if(data.username===currentUser){li.classList.add("userMessage");}
			else{li.classList.add("otherMessage");}
			let replySpan=document.createElement("span");
			replySpan.className="reply-btn";
			replySpan.title="Reply";
			replySpan.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5C21 16.1944 17.1944 20 12.5 20C10.9 20 9.4 19.6 8.1 18.9L3 20L5.3 15.3C4.5 13.9 4.2 12.4 4.2 10.9C4.2 6.4 8 2.5 12.5 2.5C17 2.5 21 6.2 21 11.5Z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12.5 8.5V12.5M12.5 14.5V14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
			replySpan.onclick=(e)=>{
				e.stopPropagation();
				insertReplyQuote(data.username,data.message);
			};
			li.appendChild(replySpan);
			li.setAttribute("data-sender",data.username);
			li.setAttribute("data-rawmessage",data.message);
			li.addEventListener("contextmenu",(e)=>{
				e.preventDefault();
				let menu=document.getElementById("contextMenu");
				if(!menu){return;}
				menu.style.left=e.pageX+"px";
				menu.style.top=e.pageY+"px";
				menu.style.display="block";
				window.currentReplySender=data.username;
				window.currentReplyRawText=data.message;
			});
			messagesList.appendChild(li);
			scrollToBottom();
			checkScrollPosition();
		};
		socket.onerror=(e)=>{console.error(e);};
		socket.onclose=()=>{
			console.log("WebSocket closed");
			if(!intentionalClose&&currentUser&&chatPage.style.display==="block"){
				showChatError("Connection lost. Reconnecting...");
				clearTimeout(reconnectTimer);
				reconnectTimer=setTimeout(()=>{
					reconnectAttempts++;
					let delay=Math.min(3000,1000*Math.pow(1.5,reconnectAttempts));
					setTimeout(connectWebSocket,delay);
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
		if(clientRealIP==="Unknown"){await fetchAndDisplayIP();}
		loginPage.style.display="none";
		chatPage.style.display="block";
		intentionalClose=false;
		connectWebSocket();
		checkScrollPosition();
	}
	usernameInput.addEventListener("keyup",(event)=>{
		if(event.key==="Enter"){loggingIn();}
	});
	document.getElementById("joinChat").addEventListener("click",loggingIn);
	document.getElementById("genUsername").addEventListener("click",async()=>{
		usernameInput.value=await generateRandomUsername();
	});
	function exportChatLog(){
		let messages=messagesList.children;
		if(messages.length===0){
			showChatError("No messages to export.");
			return;
		}
		let formatSelect=document.getElementById("exportFormat");
		let format=formatSelect?formatSelect.value:"text";
		let fileName=`chat_log_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}`;
		let content,mime;
		if(format==="json"){
			let items=[];
			for(let li of messages){
				let text=li.innerText||li.textContent;
				if(text.trim()){items.push({text,timestamp:new Date().toISOString()});}
			}
			content=JSON.stringify(items,null,2);
			mime="application/json";
			fileName+=".json";
		}
		else if(format==="html"){
			let htmlContent="<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Chat Export</title><style>body{font-family:sans-serif;padding:20px;} .userMessage{color:#EC1414;} .otherMessage{color:#000;}</style></head><body>";
			for(let li of messages){
				let clone=li.cloneNode(true);
				let replyBtn=clone.querySelector(".reply-btn");
				if(replyBtn){replyBtn.remove();}
				htmlContent+=clone.outerHTML;
			}
			htmlContent+="</body></html>";
			content=htmlContent;
			mime="text/html";
			fileName+=".html";
		}
		else{
			let lines=[];
			for(let li of messages){
				let text=li.innerText||li.textContent;
				if(text.trim()){lines.push(text);}
			}
			content=lines.join("\n");
			mime="text/plain";
			fileName+=".txt";
		}
		let blob=new Blob([content],{type:mime});
		let link=document.createElement("a");
		link.href=URL.createObjectURL(blob);
		link.download=fileName;
		link.click();
		URL.revokeObjectURL(link.href);
	}
	let exportBtnElem=document.getElementById("exportChat");
	if(exportBtnElem){exportBtnElem.addEventListener("click",exportChatLog);}
	let clearBtnElem=document.getElementById("clearChat");
	if(clearBtnElem){
		clearBtnElem.addEventListener("click",()=>{
			while(messagesList.firstChild){messagesList.removeChild(messagesList.firstChild);}
		});
	}
	let emojiBtnElem=document.getElementById("emojiBtn");
	let emojiPickerElem=document.getElementById("emojiPicker");
	if(emojiBtnElem&&emojiPickerElem){
		emojiBtnElem.addEventListener("click",()=>{
			if(emojiPickerElem.style.display==="none"){emojiPickerElem.style.display="grid";}
			else{emojiPickerElem.style.display="none";}
		});
		emojiPickerElem.querySelectorAll("span").forEach(span=>{
			span.addEventListener("click",()=>{
				userMessage.value+=span.textContent;
				emojiPickerElem.style.display="none";
				userMessage.focus();
			});
		});
		document.addEventListener("click",(e)=>{
			if(!emojiBtnElem.contains(e.target)&&!emojiPickerElem.contains(e.target)){
				emojiPickerElem.style.display="none";
			}
		});
	}
	let codeBlockBtn=document.getElementById("codeBlockBtn");
	if(codeBlockBtn){
		codeBlockBtn.addEventListener("click",()=>{
			createModal("Enter language (e.g., javascript, python, cpp, fortran, cobol):", "", (lang)=>{
				let codeBlock=`\`\`\`${lang||""}\n\n\`\`\``;
				let cursorPos=userMessage.selectionStart;
				let val=userMessage.value;
				let newVal=val.slice(0,cursorPos)+codeBlock+val.slice(cursorPos);
				userMessage.value=newVal;
				let newCursorPos=cursorPos+(lang?lang.length+4:3);
				userMessage.selectionStart=newCursorPos;
				userMessage.selectionEnd=newCursorPos;
				userMessage.focus();
			});
		});
	}
	userMessage.addEventListener("keydown",(e)=>{
		if(e.ctrlKey&&e.key==="b"){
			e.preventDefault();
			wrapSelection(userMessage,"**","**");
		}
		else if(e.ctrlKey&&e.key==="i"){
			e.preventDefault();
			wrapSelection(userMessage,"*","*");
		}
		else if(e.ctrlKey&&e.key==="m"){
			e.preventDefault();
			wrapSelection(userMessage,"`","`");
		}
	});
	function sendMessageContent(message,isImage=false,imageData=null){
		if(!socket||socket.readyState!==WebSocket.OPEN){
			showChatError("Connection lost.");
			return false;
		}
		if(isImage){
			socket.send(JSON.stringify({type:"image",username:currentUser,image:imageData,ip:clientRealIP,timestamp:getCurrentTime()}));
		}
		else{
			let priv=parsePrivateMessage(message);
			if(priv){
				socket.send(JSON.stringify({type:"private",username:currentUser,target:priv.target,message:priv.content,ip:clientRealIP,timestamp:getCurrentTime()}));
			}
			else{
				socket.send(JSON.stringify({username:currentUser,message:message,ip:clientRealIP}));
			}
		}
		return true;
	}
	function sendMessage(){
		let msg=userMessage.value.trim();
		if(!msg){return;}
		if(msg==="/users"){
			if(socket&&socket.readyState===WebSocket.OPEN){socket.send(JSON.stringify({type:"getUsers"}));}
			userMessage.value="";
			return;
		}
		if(msg==="/help"){
			let help="Available commands:\n/users - list online users\n/msg \"username\" message - private message\n/help - this help\n\nKeyboard: Ctrl+B bold, Ctrl+I italic, Ctrl+M code\n\nDrag & drop image (≤1MB, WebP)\n\nMentions: @username or @\"name with spaces\" (highlighted, not inside code blocks)\n\nRight-click any message to reply or forward.\n\n{ } button inserts code block (supports many languages).";
			let fake={data:JSON.stringify({type:"system",message:help})};
			socket.onmessage(fake);
			userMessage.value="";
			return;
		}
		if(sendMessageContent(msg)){userMessage.value="";}
	}
	userMessage.addEventListener("keypress",(e)=>{
		if(e.key==="Enter"&&e.shiftKey){
			e.preventDefault();
			sendMessage();
		}
	});
	userMessage.addEventListener("input",()=>{
		if(typingTimeout){clearTimeout(typingTimeout);}
		sendTypingStart();
		typingTimeout=setTimeout(()=>{sendTypingStop();},1000);
	});
	userMessage.addEventListener("blur",()=>{
		if(typingTimeout){clearTimeout(typingTimeout);}
		sendTypingStop();
	});
	document.getElementById("sendMessage").onclick=sendMessage;
	userMessage.addEventListener("dragover",(e)=>e.preventDefault());
	userMessage.addEventListener("drop",async(e)=>{
		e.preventDefault();
		let file=e.dataTransfer.files[0];
		if(!file){return;}
		if(!file.type.startsWith("image/")){
			showChatError("Only images.");
			return;
		}
		if(file.size>1024*1024){
			showChatError("Max 1MB.");
			return;
		}
		try{
			let webp=await convertToWebP(file);
			sendMessageContent(null,true,webp);
		}
		catch(err){
			showChatError("Image conversion failed");
		}
	});
	let voiceBtnElem=document.getElementById("voiceBtn");
	if(voiceBtnElem){
		voiceBtnElem.addEventListener("click",()=>{
			showChatError("Voice recording requires HTTPS. Use localhost or enable microphone flag.");
		});
	}
	window.addEventListener("beforeunload",(e)=>{
		if(chatPage.style.display==="block"){
			intentionalClose=true;
			e.preventDefault();
			e.returnValue="Leave chat?";
		}
	});
	let contextMenuElem=document.getElementById("contextMenu");
	if(contextMenuElem){
		document.addEventListener("click",()=>{contextMenuElem.style.display="none";});
		let replyOptElem=document.getElementById("replyOption");
		let forwardOptElem=document.getElementById("forwardOption");
		if(replyOptElem){
			replyOptElem.addEventListener("click",()=>{
				if(window.currentReplySender&&window.currentReplyRawText){
					insertReplyQuote(window.currentReplySender,window.currentReplyRawText);
				}
				contextMenuElem.style.display="none";
			});
		}
		if(forwardOptElem){
			forwardOptElem.addEventListener("click",()=>{
				if(window.currentReplySender&&window.currentReplyRawText){
					insertForwardToPrivate(window.currentReplySender,window.currentReplyRawText);
				}
				contextMenuElem.style.display="none";
			});
		}
	}
	let hljsTheme=document.getElementById("hljs-theme");
	function setHighlightTheme(theme){
		let lightTheme="/vs.min.css";
		let darkTheme="/vs2015.min.css";
		if(hljsTheme){
			hljsTheme.href=theme==="dark"?darkTheme:lightTheme;
		}
	}
	function applyTheme(theme){
		if(theme==="dark"){
			document.body.setAttribute("data-theme","dark");
			setHighlightTheme("dark");
		}
		else{
			document.body.setAttribute("data-theme","light");
			setHighlightTheme("light");
		}
	}
	function getSystemTheme(){
		return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
	}
	let savedTheme=localStorage.getItem("chatTheme");
	if(!savedTheme){savedTheme=getSystemTheme();}
	applyTheme(savedTheme);
	let themeToggleElem=document.getElementById("themeToggle");
	if(themeToggleElem){
		themeToggleElem.addEventListener("click",()=>{
			let cur=document.body.getAttribute("data-theme");
			let neu=cur==="dark"?"light":"dark";
			applyTheme(neu);
			localStorage.setItem("chatTheme",neu);
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
			scrollBtn.style.display="none";
		});
	}
});