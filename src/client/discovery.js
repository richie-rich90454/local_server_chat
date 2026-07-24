export function createDiscoveryClient(){
	let servers=[];
	let onServersFound=null;
	let polling=false;
	async function fetchServerInfo(host,port=2047){
		try{
			const response=await fetch(`http://${host}:${port}/server-info`);
			return await response.json();
		}
		catch(e){
			return null;
		}
	}
	async function joinWithCode(code,host,port=2047){
		try{
			const response=await fetch(`http://${host}:${port}/join-code/${code}`);
			const data=await response.json();
			if(data.found){
				return{ip:data.ip,port:data.uiPort||port,name:data.name};
			}
			return null;
		}
		catch(e){
			return null;
		}
	}
	function setServersFoundCallback(cb){onServersFound=cb;}
	return{fetchServerInfo,joinWithCode,setServersFoundCallback};
}
