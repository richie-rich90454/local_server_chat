export const PROTOCOL_VERSION=2;
export const WS_PORT=8191;
export const UI_PORT=2047;
export const DISCOVERY_PORT=9876;
export const DISCOVERY_ADDRESS="224.0.0.1";
export const DISCOVERY_INTERVAL=2000;
export const DISCOVERY_TYPE="local-server-chat";
export const RATE_LIMIT=3;
export const RATE_WINDOW=1000;
export const BAN_DURATION=5000;
export const DEFAULT_ROOMS=["General","Homework","Programming","Gaming","Robotics"];
export const MSG={
	JOIN:"join",
	JOIN_ROOM:"joinRoom",
	CREATE_ROOM:"createRoom",
	GET_ROOMS:"getRooms",
	ROOM_LIST:"roomList",
	ROOM_JOINED:"roomJoined",
	ROOM_CREATED:"roomCreated",
	TYPING:"typing",
	GET_USERS:"getUsers",
	GET_STATS:"getStats",
	PRIVATE:"private",
	NICK:"nick",
	NICK_ACCEPTED:"nickAccepted",
	PING:"ping",
	PONG:"pong",
	CREATE_POLL:"createPoll",
	VOTE:"vote",
	CLOSE_POLL:"closePoll",
	GET_POLLS:"getPolls",
	POLL_CREATED:"pollCreated",
	POLL_UPDATE:"pollUpdate",
	POLL_CLOSED:"pollClosed",
	POLL_LIST:"pollList",
	FILE_START:"file-start",
	FILE_END:"file-end",
	FILE_CANCEL:"file-cancel",
	IMAGE:"image",
	VOICE:"voice",
	ONLINE_COUNT:"onlineCount",
	SYSTEM:"system",
	MESSAGE:"message"
};
