const $=id=>document.getElementById(id);
function findChat(){return [...document.querySelectorAll(".private-box")].find(x=>/Chat prive|Chat privé|Private chat|Admin.*Kliyan/i.test(x.textContent))||document.querySelector(".private-box")}
function openChat(){const box=findChat();if(box){box.scrollIntoView({behavior:"smooth",block:"start"});box.animate([{transform:"scale(1)"},{transform:"scale(1.01)"},{transform:"scale(1)"}],{duration:350})}}
function start(){const top=$("adminChatTopBtn");if(top)top.onclick=openChat;if(!$("adminChatMini")){const b=document.createElement("button");b.id="adminChatMini";b.type="button";b.className="admin-chat-mini";b.setAttribute("aria-label","Chat sekirize");b.title="Chat sekirize";b.textContent="💬";b.onclick=openChat;document.body.appendChild(b)}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
