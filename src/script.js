let loginPage=document.getElementById("login");
let chatPage=document.getElementById("chatUI");
let usernameInput=document.getElementById("username");
let userIP=document.getElementById("userIp");
let messagesList=document.getElementById("messages");
let userMessage=document.getElementById("userMessage");
let localIP=window.location.hostname;
let defaultPort=8191;
let socket=null;
let currentUser="";
userIP.value=`Your local IP is: ${localIP}`;
function getCurrentTime(){
    let currentTime=new Date();
    let hours=currentTime.getHours().toString().padStart(2, "0");
    let minutes=currentTime.getMinutes().toString().padStart(2, "0");
    let seconds=currentTime.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}
function loggingIn(){
    let username=usernameInput.value.trim();
    if (!username){
        document.getElementById("login-error").textContent="Please enter your username";
        return;
    }
    currentUser=username;
    loginPage.style.display="none";
    chatPage.style.display="block";
    socket=new WebSocket(`ws://${localIP}:${defaultPort}`);
    socket.onopen=()=>{
        console.log("Connected to WebSocket server");
        socket.send(JSON.stringify({ type: "join", username, ip: localIP }));
    };
    socket.onmessage=(event)=>{
        let data=JSON.parse(event.data);
        let newMessage=document.createElement("li");
        let messageTime=getCurrentTime();
        let formattedMessage=data.message.replace(/\n/g, "<br>");
        newMessage.innerHTML=`${data.username} [${data.ip}] (${messageTime}): ${formattedMessage}`;
        if (data.username==currentUser){
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
    if (event.key=="Enter"){
        loggingIn();
    }
})
document.querySelector("input[type=\"button\"]").addEventListener("click", loggingIn);
function sendMessage(){
    let message=userMessage.value.trim();
    let username=usernameInput.value.trim();
    if (message&&socket&&socket.readyState==WebSocket.OPEN){
        let data=JSON.stringify({username, message, ip: localIP});
        socket.send(data);
        userMessage.value="";
    }
}
userMessage.addEventListener("keypress", (event)=>{
    if (event.key=="Enter"&&event.shiftKey){
        event.preventDefault();
        sendMessage();
    }
});
document.getElementById("sendMessage").onclick=sendMessage;