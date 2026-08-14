export function parseArgs(argv){
	let serverName=null;
	let noHttp=false;
	for(let i=2;i<argv.length;i++){
		if(argv[i]==="--name"&&argv[i+1]){
			serverName=argv[i+1];
			i++;
		}
		if(argv[i]==="--no-http"){
			noHttp=true;
		}
	}
	return{serverName,noHttp};
}
