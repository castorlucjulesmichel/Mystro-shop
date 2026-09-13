import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const cfg={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const app=getApps().length?getApp():initializeApp(cfg),auth=getAuth(app);
const API="https://mystroshop-api.castormystro.workers.dev";

async function adminOrder(action,orderId){
  const user=auth.currentUser;
  if(!user)throw Error("Konekte kòm admin anvan.");
  const response=await fetch(`${API}/admin/orders/${action}`,{
    method:"POST",
    headers:{"Content-Type":"application/json",Authorization:`Bearer ${await user.getIdToken(false)}`},
    body:JSON.stringify({orderId})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||data.message||`HTTP_${response.status}`);
  return data;
}

document.addEventListener("click",async event=>{
  const approve=event.target.closest?.("[data-oa]");
  const reject=event.target.closest?.("[data-or]");
  if(!approve&&!reject)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const button=approve||reject,action=approve?"approve":"reject",orderId=approve?.dataset.oa||reject?.dataset.or;
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
  }
},true);
