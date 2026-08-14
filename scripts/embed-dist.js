import{existsSync,readdirSync,readFileSync,writeFileSync}from"fs";
import{join,relative}from"path";
const root="dist";
if(!existsSync(root)){
	console.error("dist/ not found. Run 'npm run build' first.");
	process.exit(1);
}
const assets={};
function walk(dir){
	for(const entry of readdirSync(dir,{withFileTypes:true})){
		const full=join(dir,entry.name);
		if(entry.isDirectory()){
			walk(full);
		}
		else{
			const key=relative(root,full).replace(/\\/g,"/");
			assets[key]=readFileSync(full).toString("base64");
		}
	}
}
walk(root);
const out="export const ASSETS="+JSON.stringify(assets)+";\n";
writeFileSync("src/server/embedded-assets.js",out);
console.log("Embedded "+Object.keys(assets).length+" files into src/server/embedded-assets.js");
