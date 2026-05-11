import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import cpp from "highlight.js/lib/languages/cpp";
import rust from "highlight.js/lib/languages/rust";
import go from "highlight.js/lib/languages/go";
import python from "highlight.js/lib/languages/python";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import swift from "highlight.js/lib/languages/swift";
import r from "highlight.js/lib/languages/r";
import kotlin from "highlight.js/lib/languages/kotlin";
import scala from "highlight.js/lib/languages/scala";
import dart from "highlight.js/lib/languages/dart";
import perl from "highlight.js/lib/languages/perl";
import ocaml from "highlight.js/lib/languages/ocaml";
import matlab from "highlight.js/lib/languages/matlab";
import sql from "highlight.js/lib/languages/sql";
import vbnet from "highlight.js/lib/languages/vbnet";
import powershell from "highlight.js/lib/languages/powershell";
import json from "highlight.js/lib/languages/json";
import java from "highlight.js/lib/languages/java";
import bash from "highlight.js/lib/languages/bash";
import fortran from "highlight.js/lib/languages/fortran";
import armasm from "highlight.js/lib/languages/armasm";
import avrasm from "highlight.js/lib/languages/avrasm";
import x86asm from "highlight.js/lib/languages/x86asm";
import yaml from "highlight.js/lib/languages/yaml";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import cmake from "highlight.js/lib/languages/cmake";
import elixir from "highlight.js/lib/languages/elixir";
import lua from "highlight.js/lib/languages/lua";
import haskell from "highlight.js/lib/languages/haskell";
import clojure from "highlight.js/lib/languages/clojure";
import erlang from "highlight.js/lib/languages/erlang";
import fsharp from "highlight.js/lib/languages/fsharp";
import objectivec from "highlight.js/lib/languages/objectivec";
import groovy from "highlight.js/lib/languages/groovy";
import scss from "highlight.js/lib/languages/scss";
import less from "highlight.js/lib/languages/less";
import stylus from "highlight.js/lib/languages/stylus";
import handlebars from "highlight.js/lib/languages/handlebars";
import twig from "highlight.js/lib/languages/twig";
import nginx from "highlight.js/lib/languages/nginx";
import makefile from "highlight.js/lib/languages/makefile";
import ini from "highlight.js/lib/languages/ini";
import hljsDefineZig from "highlightjs-zig";
import hljsDefineCobol from "highlightjs-cobol";
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xaml", xml);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c", cpp);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("go", go);
hljs.registerLanguage("python", python);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("r", r);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("scala", scala);
hljs.registerLanguage("dart", dart);
hljs.registerLanguage("perl", perl);
hljs.registerLanguage("ocaml", ocaml);
hljs.registerLanguage("matlab", matlab);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("vbnet", vbnet);
hljs.registerLanguage("powershell", powershell);
hljs.registerLanguage("json", json);
hljs.registerLanguage("java", java);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("fortran", fortran);
hljs.registerLanguage("armasm", armasm);
hljs.registerLanguage("avrasm", avrasm);
hljs.registerLanguage("x86asm", x86asm);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("cmake", cmake);
hljs.registerLanguage("elixir", elixir);
hljs.registerLanguage("lua", lua);
hljs.registerLanguage("haskell", haskell);
hljs.registerLanguage("clojure", clojure);
hljs.registerLanguage("erlang", erlang);
hljs.registerLanguage("fsharp", fsharp);
hljs.registerLanguage("objectivec", objectivec);
hljs.registerLanguage("groovy", groovy);
hljs.registerLanguage("scss", scss);
hljs.registerLanguage("less", less);
hljs.registerLanguage("stylus", stylus);
hljs.registerLanguage("handlebars", handlebars);
hljs.registerLanguage("twig", twig);
hljs.registerLanguage("nginx", nginx);
hljs.registerLanguage("makefile", makefile);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("toml", ini);
hljsDefineZig(hljs);
hljs.registerLanguage("cobol", hljsDefineCobol);
export { hljs };
export function escapeHtml(str){
    return str.replace(/[&<>]/g,function(m){
        if(m=="&"){return "&amp;";}
        if(m=="<"){return "&lt;";}
        if(m==">"){return "&gt;";}
        return m;
    });
}
export function formatMarkdown(text){
    let codeBlocks=[];
    let withoutCode=text.replace(/^[ \t]*```(\w*)\s*\n([\s\S]*?)\n[ \t]*```/gm,function(match,lang,code){
        let idx=codeBlocks.length;
        codeBlocks.push({lang:lang||"",code});
        return `__CODEBLOCK_${idx}__`;
    });
    let escaped=escapeHtml(withoutCode);
    escaped=escaped.replace(/`([^`]+)`/g,"<code>$1</code>");
    escaped=escaped.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
    escaped=escaped.replace(/\*([^*]+)\*/g,"<em>$1</em>");
    escaped=escaped.replace(/\n/g,"<br>");
    escaped=escaped.replace(/__CODEBLOCK_(\d+)__/g,function(match,idx){
        let block=codeBlocks[parseInt(idx)];
        let highlighted;
        try{
            if(block.lang&&hljs.getLanguage(block.lang)){
                highlighted=hljs.highlight(block.code,{language:block.lang}).value;
            }
            else{
                highlighted=hljs.highlightAuto(block.code).value;
            }
        }
        catch(e){
            highlighted=escapeHtml(block.code);
        }
        if(block.lang){
            return `<div class="code-block-container"><span class="code-lang">${escapeHtml(block.lang)}</span><pre><code class="hljs">${highlighted}</code></pre></div>`;
        }
        return `<pre><code class="hljs">${highlighted}</code></pre>`;
    });
    return escaped;
}
export function highlightMentions(html,currentUsername){
    let div=document.createElement("div");
    div.innerHTML=html;
    let skipElements=div.querySelectorAll("pre,code");
    skipElements.forEach(el=>{el.setAttribute("data-skip-mention","true");});
    let regex=/(?:@([a-zA-Z0-9_]+)|@\"([^\"]+)\"|@&quot;([^&]+)&quot;)/g;
    let walker=document.createTreeWalker(div,NodeFilter.SHOW_TEXT,{
        acceptNode:function(node){
            let parent=node.parentElement;
            while(parent){
                if(parent.hasAttribute&&parent.hasAttribute("data-skip-mention")){
                    return NodeFilter.FILTER_SKIP;
                }
                parent=parent.parentElement;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    let nodes=[];
    while(walker.nextNode()){nodes.push(walker.currentNode);}
    for(let node of nodes){
        let text=node.nodeValue;
        let newText=text.replace(regex,function(match,simpleName,quotedName,escapedQuotedName){
            let username=simpleName||quotedName||escapedQuotedName;
            if(username===currentUsername){
                return `<span style="background-color:#FFD700; color:#000; border-radius:4px; padding:0 2px;">@${escapeHtml(username)}</span>`;
            }
            else{
                return `<span style="background-color:#E0E0E0; color:#000; border-radius:4px; padding:0 2px;">@${escapeHtml(username)}</span>`;
            }
        });
        if(newText!==text){
            let span=document.createElement("span");
            span.innerHTML=newText;
            node.parentNode.replaceChild(span,node);
        }
    }
    skipElements.forEach(el=>el.removeAttribute("data-skip-mention"));
    return div.innerHTML;
}