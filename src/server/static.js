import fs from"fs";
import path from"path";
import express from"express";
import{ASSETS}from"./embedded-assets.js";
const MIME={
	html:"text/html",
	js:"application/javascript",
	css:"text/css",
	json:"application/json",
	png:"image/png",
	ico:"image/x-icon",
	svg:"image/svg+xml",
	webmanifest:"application/manifest+json",
	txt:"text/plain",
	ttf:"font/ttf"
};
function extToMime(filePath){
	const ext=path.extname(filePath).slice(1).toLowerCase();
	return MIME[ext]||"application/octet-stream";
}
export function getDistDir(){
	const scriptDir=path.dirname(process.argv[1]||".");
	if(path.basename(process.argv[0]||"")==="node"||path.basename(process.argv[0]||"")==="node.exe"){
		return path.join(scriptDir,"dist");
	}
	return path.join(path.dirname(process.execPath),"dist");
}
function isSea(){
	const name=path.basename(process.argv[0]||"");
	return name!=="node"&&name!=="node.exe";
}
export function createStaticMiddleware(){
	const sea=isSea();
	const distDir=getDistDir();
	const disk=!sea&&fs.existsSync(distDir);
	return function(req,res,next){
		if(disk){
			express.static(distDir,{maxAge:"1h",etag:true,lastModified:true,setHeaders(res,filePath){
				if(filePath.endsWith("sw.js")||filePath.endsWith("index.html")){
					res.setHeader("Cache-Control","no-cache");
				}
			}})(req,res,next);
			return;
		}
		const urlPath=req.path==="/"?"index.html":req.path.replace(/^\//,"");
		const b64=ASSETS[urlPath];
		if(b64===undefined){
			next();
			return;
		}
		res.set("Content-Type",extToMime(urlPath));
		res.set("Cache-Control",(urlPath==="index.html"||urlPath==="sw.js")?"no-cache":"max-age=3600");
		res.send(Buffer.from(b64,"base64"));
	};
}
