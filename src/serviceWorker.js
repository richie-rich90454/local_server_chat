if ("serviceWorker" in navigator){
    window.addEventListener("load", ()=>{
        navigator.serviceWorker.register("/sw.js").then(reg=>console.log("Service Worker registered", reg)).catch(err=>console.log("SW registration failed", err));
    });
}