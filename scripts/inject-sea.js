import{cpSync,existsSync}from"fs";
import{execSync}from"child_process";
import{join}from"path";
const isClient=process.argv.includes("--client");
const nodeExe=process.execPath;
const blob=isClient?"client-sea-prep.blob":"sea-prep.blob";
const exeName=isClient?(process.platform==="win32"?"LocalServerChatClient.exe":"LocalServerChatClient"):(process.platform==="win32"?"LocalServerChat.exe":"LocalServerChat");
const target=join("release",exeName);
if(!existsSync(blob)){
	console.error(blob+" not found. Run the sea step first.");
	process.exit(1);
}
cpSync(nodeExe,target);
console.log("Copied node executable to "+target);
try{
	execSync(`npx postject "${target}" NODE_SEA_BLOB "${blob}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --overwrite`,{stdio:"inherit"});
	console.log("SEA blob injected successfully.");
	if(process.platform==="darwin"){
		try{
			execSync(`codesign --sign - "${target}"`,{stdio:"inherit"});
			console.log("Signed with codesign.");
		}
		catch(e){
			console.log("codesign not available, skipping.");
		}
	}
	if(existsSync("dist")){
		console.log("Note: dist/ is embedded in the exe; no separate copy needed.");
	}
	console.log("Build complete: "+target);
}
catch(err){
	console.error("postject failed:",err.message);
	process.exit(1);
}
