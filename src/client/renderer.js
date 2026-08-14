import{formatMarkdown,highlightMentions,escapeHtml}from"../highlight-config.js";
import{generateIdenticon}from"../identicon.js";
import{getCurrentTime}from"../ui-helpers.js";
export function renderMessage(data,currentUser){
	let time=data.timestamp||getCurrentTime();
	let ip=data.ip||"Unknown";
	let identiconSvg=generateIdenticon(data.username,20);
	let identiconHtml=identiconSvg?identiconSvg.outerHTML+" ":"";
	if(data.type==="system"){
		return{html:`<em>${escapeHtml(data.message)}</em>`,className:"",style:"white-space:pre-wrap;color:gray;font-style:italic;",sender:"",raw:data.message};
	}
	if(data.type==="private"){
		let formatted=formatMarkdown(data.message);
		let identiconName=data.self?data.target:data.from;
		let identSvg=generateIdenticon(identiconName,20);
		let identHtml=identSvg?" "+identSvg.outerHTML:"";
		let html=data.self?`[Private to ${escapeHtml(data.target)}] You [${ip}] (${time}): ${formatted}${identHtml}`:`[Private] ${escapeHtml(data.from)} [${ip}] (${time}): ${formatted}${identHtml}`;
		return{html,className:data.self?"userMessage":"otherMessage",style:"white-space:pre-wrap;",sender:data.self?data.target:data.from,raw:data.message};
	}
	if(data.type==="image"){
		let imgHtml=`<img src="${escapeHtml(data.image)}" style="max-width:100%;max-height:200px;border-radius:8px;margin-top:4px;cursor:pointer;" onclick="window.open(this.src,'_blank')">`;
		return{html:identiconHtml+`${escapeHtml(data.username)} [${ip}] (${time}):<br> ${imgHtml}`,className:data.username===currentUser?"userMessage":"otherMessage",style:"",sender:data.username,raw:data.message};
	}
	if(data.type==="voice"){
		let audioHtml=`<audio controls src="${escapeHtml(data.voice)}" style="max-width:100%;"></audio>`;
		return{html:identiconHtml+`${escapeHtml(data.username)} [${ip}] (${time}):<br> ${audioHtml}`,className:data.username===currentUser?"userMessage":"otherMessage",style:"",sender:data.username,raw:data.message};
	}
	let formatted=formatMarkdown(data.message||"");
	let baseHtml=identiconHtml+`${escapeHtml(data.username)} [${ip}] (${time}): ${formatted}`;
	let finalHtml=highlightMentions(baseHtml,currentUser);
	return{html:finalHtml,className:data.username===currentUser?"userMessage":"otherMessage",style:"white-space:pre-wrap;",sender:data.username,raw:data.message};
}
export function renderPoll(data){
	let li=document.createElement("li");
	li.id="poll_"+data.id;
	li.style.cssText="background:var(--background-card);border:1px solid var(--border-input);border-radius:var(--border-radius);padding:0.5rem;margin:0.3rem 0;";
	let title=document.createElement("div");
	title.style.cssText="font-weight:600;margin-bottom:0.3rem;color:var(--text-primary);";
	title.textContent=data.question+(data.createdBy?" (by "+data.createdBy+")":"");
	li.appendChild(title);
	let optionsDiv=document.createElement("div");
	optionsDiv.style.cssText="display:flex;flex-direction:column;gap:0.2rem;";
	data.options.forEach((opt,i)=>{
		let optRow=document.createElement("div");
		optRow.style.cssText="display:flex;align-items:center;gap:0.3rem;";
		let voteBtn=document.createElement("button");
		voteBtn.style.cssText="background:var(--button-bg);border:1px solid var(--border-card);border-radius:var(--border-radius);padding:0.2rem 0.5rem;cursor:pointer;color:var(--text-primary);font-size:0.85rem;flex-shrink:0;";
		voteBtn.textContent=opt.votes;
		voteBtn.title="Vote";
		voteBtn.dataset.pollId=data.id;
		voteBtn.dataset.option=i;
		let optText=document.createElement("span");
		optText.style.cssText="color:var(--text-primary);font-size:0.9rem;";
		optText.textContent=opt.text;
		let bar=document.createElement("div");
		bar.style.cssText="flex:1;height:6px;background:var(--button-bg);border-radius:3px;overflow:hidden;min-width:2rem;";
		let fill=document.createElement("div");
		fill.style.cssText="height:100%;background:var(--message-user);transition:width 0.3s;";
		fill.style.width=data.totalVotes>0?((opt.votes/data.totalVotes)*100)+"%":"0%";
		bar.appendChild(fill);
		optRow.appendChild(voteBtn);
		optRow.appendChild(optText);
		optRow.appendChild(bar);
		optionsDiv.appendChild(optRow);
	});
	li.appendChild(optionsDiv);
	let footer=document.createElement("div");
	footer.style.cssText="font-size:0.75rem;color:var(--text-secondary);margin-top:0.3rem;";
	footer.textContent=data.totalVotes+" vote"+(data.totalVotes!==1?"s":"");
	li.appendChild(footer);
	if(data.type==="pollClosed"){
		let closedBadge=document.createElement("span");
		closedBadge.style.cssText="color:var(--error-color);font-weight:600;margin-left:0.3rem;";
		closedBadge.textContent="[CLOSED]";
		footer.appendChild(closedBadge);
	}
	return li;
}
