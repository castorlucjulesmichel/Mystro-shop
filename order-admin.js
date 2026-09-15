import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const cfg={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app);
const API="https://mystroshop-api.castormystro.workers.dev";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function isConflict(message,status){
  const m=String(message||"").toLowerCase();
  return status===409||m.includes("stored version")||m.includes("base version")||m.includes("aborted")||m.includes("contention");
}

async function adminOrder(action,orderId){
  const user=auth.currentUser;
  if(!user)throw Error("Konekte kòm admin anvan.");
  let lastError=null;
  for(let attempt=0;attempt<3;attempt++){
    const response=await fetch(`${API}/admin/orders/${action}`,{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${await user.getIdToken(attempt>0)}`},
      body:JSON.stringify({orderId})
    });
    const data=await response.json().catch(()=>({}));
    if(response.ok)return data;
    const message=data.error||data.message||`HTTP_${response.status}`;
    lastError=Error(message);
    if(isConflict(message,response.status)&&attempt<2){await sleep(350*(attempt+1));continue}
    if(message==="ORDER_NOT_APPROVABLE")throw Error("Kòmand sa a poko pare pou apwobasyon. Kliyan an dwe fin peye anvan.");
    if(message==="ORDER_NOT_REJECTABLE")throw Error("Kòmand sa a pa nan yon eta ki ka rejte.");
    throw lastError;
  }
  throw lastError||Error("Aksyon admin lan echwe.");
}

function sanitizeOrderCards(root=document){
  root.querySelectorAll?.("#mwAdminOrders .mw-a").forEach(card=>{
    const text=String(card.textContent||"").toLowerCase();
    const ready=text.includes("pending_admin");
    const actions=card.querySelector(".mw-actions");
    if(ready){
      card.dataset.orderReady="1";
      card.querySelectorAll("button").forEach(b=>b.disabled=false);
      card.querySelector(".order-wait-note")?.remove();
      return;
    }
    card.dataset.orderReady="0";
    card.querySelectorAll("[data-oa],[data-or]").forEach(b=>{
      b.removeAttribute("data-oa");
      b.removeAttribute("data-or");
      b.disabled=true;
      b.style.display="none";
    });
    if(actions&&!actions.querySelector(".order-wait-note")){
      const note=document.createElement("span");
      note.className="order-wait-note";
      note.textContent=text.includes("pending_wallet_payment")?"⏳ Ap tann peman kliyan an":"⏳ Kòmand lan poko pare";
      note.style.cssText="font-weight:800;color:#9a6700;padding:8px 0";
      actions.appendChild(note);
    }
  });
}

const observer=new MutationObserver(mutations=>{
  for(const m of mutations){
    if(m.addedNodes.length){sanitizeOrderCards(document);break}
  }
});
if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>sanitizeOrderCards(document),{once:true});else sanitizeOrderCards(document);

document.addEventListener("click",async event=>{
  const approve=event.target.closest?.("[data-oa]");
  const reject=event.target.closest?.("[data-or]");
  if(!approve&&!reject)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const button=approve||reject,card=button.closest?.(".mw-a");
  if(card&&card.dataset.orderReady==="0"){
    alert("Kòmand sa a poko fin peye. Li pa ka apwouve oswa rejte kòm yon kòmand peye.");
    return;
  }
  const action=approve?"approve":"reject",orderId=approve?.dataset.oa||reject?.dataset.or;
  const old=button.textContent;
  button.disabled=true;
  button.textContent="...";
  try{
    const result=await adminOrder(action,orderId);
    alert(action==="approve"?"Kòmand lan apwouve epi vant la finalize.":`Kòmand lan refize. Ranbousman: ${Number(result.refunded||0).toLocaleString()} HTG.`);
    document.getElementById("mwRefresh")?.click();
    document.getElementById("refreshAdminBtn")?.click();
  }catch(error){
    console.error(error);
    alert(error.message||"Aksyon admin lan echwe.");
  }finally{
    button.disabled=false;
    button.textContent=old;
    setTimeout(()=>sanitizeOrderCards(document),150);
  }
},true);
