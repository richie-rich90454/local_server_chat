export function generateIdenticon(username,size=32){
	let hash=hashCode(username);
	let hue=Math.abs(hash)%360;
	let sat=50+Math.abs(hash>>8)%30;
	let light=40+Math.abs(hash>>16)%20;
	let bgColor=`hsl(${hue},${sat}%,${light}%)`;
	let fgColor=`hsl(${(hue+180)%360},${sat}%,${65+Math.abs(hash>>24)%15}%)`;
	let svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
	svg.setAttribute("width",size);
	svg.setAttribute("height",size);
	svg.setAttribute("viewBox","0 0 5 5");
	svg.style.borderRadius="50%";
	svg.style.flexShrink="0";
	let bg=document.createElementNS("http://www.w3.org/2000/svg","rect");
	bg.setAttribute("width","5");
	bg.setAttribute("height","5");
	bg.setAttribute("fill",bgColor);
	svg.appendChild(bg);
	let cells=[];
	for(let r=0;r<3;r++){
		for(let c=0;c<3;c++){
			let bit=(hash>>(r*3+c))&1;
			cells.push(bit);
		}
	}
	for(let r=0;r<3;r++){
		for(let c=0;c<2;c++){
			if(cells[r*3+c]){
				let rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
				rect.setAttribute("x",c);
				rect.setAttribute("y",r);
				rect.setAttribute("width","1");
				rect.setAttribute("height","1");
				rect.setAttribute("fill",fgColor);
				svg.appendChild(rect);
				let mirror=document.createElementNS("http://www.w3.org/2000/svg","rect");
				mirror.setAttribute("x",4-c);
				mirror.setAttribute("y",r);
				mirror.setAttribute("width","1");
				mirror.setAttribute("height","1");
				mirror.setAttribute("fill",fgColor);
				svg.appendChild(mirror);
			}
		}
	}
	return svg;
}
function hashCode(str){
	let hash=0;
	for(let i=0;i<str.length;i++){
		hash=((hash<<5)-hash)+str.charCodeAt(i);
		hash|=0;
	}
	return hash;
}
