const $=id=>document.getElementById(id);
function chatBox(){return $("adminPrivateChat")||[...document.querySelectorAll(".private-box")].find(x=>/Chat prive|Chat privé|Private chat|Admin.*Kliyan/i.test(x.textContent))}
function setChat(show){const box=chatBox();if(!box)return;if(window.MystroAdminChat){show?window.MystroAdminChat.open():window.MystroAdminChat.close();return}box.hidden=!show;if(show)box.scrollIntoView({behavior:"smooth",block:"start"})}
function toggleChat(){const box=chatBox();if(!box)return;setChat(box.hidden===true)}
function start(){const top=$("adminChatTopBtn");if(top)top.onclick=toggleChat;setTimeout(()=>setChat(false),250);if(!$("adminChatMini")){const b=document.createElement("button");b.id="adminChatMini";b.type="button";b.className="admin-chat-mini";b.setAttribute("aria-label","Chat sekirize");b.title="Chat sekirize";b.textContent="💬";b.onclick=toggleChat;document.body.appendChild(b)}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
