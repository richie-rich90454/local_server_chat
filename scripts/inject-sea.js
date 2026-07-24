import{cpSync,existsSync,rmSync}from"fs";
import{execSync}from"child_process";
import{join}from"path";
const nodeExe=process.execPath;
const blob="sea-prep.blob";
const exeName=process.platform==="win32"?"LocalServerChat.exe":"LocalServerChat";
const target=join("release",exeName);
if(!existsSync(blob)){
    console.error("sea-prep.blob not found. Run 'npm run sea' first.");
    process.exit(1);
}
if(existsSync(target)){rmSync(target);}
if(!existsSync("release")){import("fs").then(fs=>fs.mkdirSync("release"));}
cpSync(nodeExe,target);
console.log("Copied node executable to "+target);
try{
    execSync(`npx postject "${target}" NODE_SEA_BLOB "${blob}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,{stdio:"inherit"});
    console.log("SEA blob injected successfully.");
    if(process.platform==="win32"){
        try{
            execSync(`npx postject "${target}" NODE_SEA_BLOB "${blob}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --overwrite`,{stdio:"inherit"});
        }
        catch(e){}
    }
    if(process.platform==="darwin"){
        try{
            execSync(`codesign --sign - "${target}"`,{stdio:"inherit"});
            console.log("Signed with codesign.");
        }
        catch(e){
            console.log("codesign not available, skipping. Sign manually if needed.");
        }
    }
    console.log("Build complete: "+target);
}
catch(err){
    console.error("postject failed:",err.message);
    console.log("Install postject: npm install -g postject");
    process.exit(1);
}
