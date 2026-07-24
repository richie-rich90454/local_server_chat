import{MSG,PROTOCOL_VERSION,DISCOVERY_TYPE}from"./constants.js";
export function createJoin(username){return{type:MSG.JOIN,username};}
export function createJoinRoom(room){return{type:MSG.JOIN_ROOM,room};}
export function createCreateRoom(room){return{type:MSG.CREATE_ROOM,room};}
export function createGetRooms(){return{type:MSG.GET_ROOMS};}
export function createTyping(username,typing){return{type:MSG.TYPING,username,typing};}
export function createGetUsers(){return{type:MSG.GET_USERS};}
export function createGetStats(){return{type:MSG.GET_STATS};}
export function createPrivate(username,target,message,timestamp){return{type:MSG.PRIVATE,username,target,message,timestamp};}
export function createNick(oldUsername,newUsername){return{type:MSG.NICK,oldUsername,newUsername};}
export function createPing(timestamp){return{type:MSG.PING,timestamp};}
export function createPoll(question,options){return{type:MSG.CREATE_POLL,question,options};}
export function createVote(pollId,option){return{type:MSG.VOTE,pollId,option};}
export function createClosePoll(pollId){return{type:MSG.CLOSE_POLL,pollId};}
export function createGetPolls(){return{type:MSG.GET_POLLS};}
export function createDiscoveryPacket(name,ip,port,joinCode){return{type:DISCOVERY_TYPE,name,ip,port,version:PROTOCOL_VERSION,joinCode};}
export function parseMessage(raw){try{return JSON.parse(raw);}catch(e){return null;}}
