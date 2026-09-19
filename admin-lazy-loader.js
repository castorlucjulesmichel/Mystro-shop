const loaded=new Set(),loading=new Map();
const files={
 users:["./admin-users-v2.js?v=11"],
 products:["./admin-products.js?v=5"],
 approvals:["./admin-approvals-lite.js?v=3"],
 manual:["./admin-wallet-history-lite.js?v=4"],
 history:["./admin-wallet-history-lite.js?v=4"],
 chat:["./private-chat.js?v=21"]
};
function status(text){const el=document.getElementById("adminStatus");if(el)el.textContent=text||""}
async function loadView(view){
 if(loaded.has(view))return;
 if(loading.has(view))return loading.get(view);
 const p=(async()=>{
  status("Ap chaje seksyon an...");
  try{
   if(view==="users")await import(files.users[0]);
   else if(view==="products")await import(files.products[0]);
   else if(view==="approvals")await import(files.approvals[0]);
   else if(view==="manual"||view==="history"){
    const mod=await import(files[view][0]);
    loaded.add("manual");loaded.add("history");
    if(view==="manual")await mod.prepareManual?.();
    if(view==="history")await mod.loadHistory?.(true);
   }else if(view==="chat")await import(files.chat[0]);
   loaded.add(view);status("");
  }catch(e){console.error("lazy admin",view,e);status("Seksyon an pa t ka chaje. Peze ankò oswa rafrechi paj la.");throw e}
  finally{loading.delete(view)}
 })();loading.set(view,p);return p;
}

document.addEventListener("click",async e=>{
 const item=e.target.closest?.(".am-item[data-view]");
 if(item){const view=item.dataset.view;if(!files[view]||loaded.has(view))return;e.preventDefault();e.stopImmediatePropagation();try{await loadView(view);setTimeout(()=>item.click(),20)}catch{}return}
 const chat=e.target.closest?.("#adminChatTopBtn,#adminChatMini");
 if(chat&&!loaded.has("chat")){e.preventDefault();e.stopImmediatePropagation();try{await loadView("chat");setTimeout(()=>chat.click(),20)}catch{}}
},true);
