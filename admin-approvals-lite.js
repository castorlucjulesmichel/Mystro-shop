import{getApps,getApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,collection,getDocs,query,where,limit,doc,updateDoc,runTransaction,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const app=getApps().length?getApp():null,auth=app?getAuth(app):null,db=app?getFirestore(app):null;
let busy=false;
const money=n=>`G ${(Number(n)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

function addPanel(){
 const d=$("adminDashboard");if(!d||$("mwAdmin"))return;
 d.insertAdjacentHTML("afterbegin",`<section id="mwAdmin" class="mw-admin panel"><h2>✅ Apwobasyon Admin</h2><p>Se sèlman admin ki ka valide/refize kòmand, depo ak retrè.</p><button id="mwRefresh" class="ghost" type="button">Rafrechi</button><div class="mw-grid"><div><h3>Depo / retrè an atant</h3><div id="mwAdminTx"><div class="empty">Ap chaje...</div></div></div><div><h3>Kòmand pou valide</h3><div id="mwAdminOrders"><div class="empty">Ap chaje...</div></div></div></div></section>`);
 $("mwRefresh").onclick=load;
 document.addEventListener("click",manualAction,true);
}

async function load(){
 if(busy||!auth?.currentUser||!db)return;busy=true;
 const txBox=$("mwAdminTx"),orderBox=$("mwAdminOrders");if(txBox)txBox.innerHTML='<div class="empty">Ap chaje...</div>';if(orderBox)orderBox.innerHTML='<div class="empty">Ap chaje...</div>';
 try{
  const [ts,os]=await Promise.all([
   getDocs(query(collection(db,"manualTransactions"),where("status","==","pending"),limit(80))),
   getDocs(query(collection(db,"orders"),where("status","in",["pending_admin","pending_wallet_payment","pending"]),limit(80)))
  ]);
  const ta=ts.docs.map(d=>({id:d.id,...d.data()}));
  const oa=os.docs.map(d=>({id:d.id,...d.data()}));
  if(txBox)txBox.innerHTML=ta.length?ta.map(x=>`<div class="mw-a"><b>${x.type==="deposit"?"⬇️ Depo":"⬆️ Retrè"} ${esc((x.provider||"").toUpperCase())}</b><p>${esc(x.userName||x.userEmail||x.userId||"Itilizatè")} · ${money(x.amount)}</p><p>${x.type==="deposit"?`Soti: ${esc(x.senderPhone||"—")} · Ref: ${esc(x.reference||"—")}`:`Pou: ${esc(x.phone||"—")}`}</p><div class="mw-actions">${x.proofDataUrl?`<button class="proof" data-lite-proof="${esc(x.id)}">Gade prèv</button>`:""}<button class="ok" data-lite-ta="${esc(x.id)}">Apwouve</button><button class="no" data-lite-tr="${esc(x.id)}">Refize</button></div></div>`).join(""):"Pa gen demann.";
  window.__mwproof=Object.fromEntries(ta.map(x=>[x.id,x.proofDataUrl||""]));
  if(orderBox)orderBox.innerHTML=oa.length?oa.map(o=>`<div class="mw-a"><b>📦 ${esc(o.id)}</b><p>${esc(o.buyerName||o.buyerEmail||o.buyerId||"Client")}</p><p>${esc(o.status||"pending")} · ${esc(o.currency||"HTG")} ${(Number(o.total)||0).toLocaleString()}</p><div class="mw-actions"><button class="ok" data-oa="${esc(o.id)}">Apwouve</button><button class="no" data-or="${esc(o.id)}">Refize</button></div></div>`).join(""):"Pa gen kòmand.";
  document.dispatchEvent(new Event("adminHistoryLoaded"));
 }catch(e){console.error(e);if(txBox)txBox.innerHTML='<div class="empty">Nou pa ka chaje demann yo.</div>';if(orderBox)orderBox.innerHTML='<div class="empty">Nou pa ka chaje kòmand yo.</div>'}
 finally{busy=false}
}

async function approveTx(id){
 const ref=doc(db,"manualTransactions",id);
 await runTransaction(db,async t=>{
  const s=await t.get(ref);if(!s.exists())throw Error("Demann lan pa egziste.");const x=s.data();if(x.status!=="pending")throw Error("Demann deja trete.");
  const ur=doc(db,"users",x.userId),us=await t.get(ur);if(!us.exists())throw Error("Kliyan pa egziste.");
  const u=us.data(),cur=Number(u.balances?.HTG??u.balance??0),amt=Number(x.amount)||0;if(x.type==="withdrawal"&&cur<amt)throw Error("Balans kliyan an pa sifi.");
  const next=x.type==="deposit"?cur+amt:cur-amt;t.update(ur,{"balances.HTG":next,balance:next});t.update(ref,{status:"approved",approvedAt:serverTimestamp(),approvedBy:auth.currentUser.uid});
 });
}

async function manualAction(e){
 const p=e.target.closest?.("[data-lite-proof]"),a=e.target.closest?.("[data-lite-ta]"),r=e.target.closest?.("[data-lite-tr]");if(!p&&!a&&!r)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(p){const src=window.__mwproof?.[p.dataset.liteProof];if(src){const w=window.open();if(w)w.document.write(`<img src="${src}" style="max-width:100%;height:auto">`)}return}
 const b=a||r;b.disabled=true;try{if(a)await approveTx(a.dataset.liteTa);else await updateDoc(doc(db,"manualTransactions",r.dataset.liteTr),{status:"rejected",rejectedAt:serverTimestamp(),rejectedBy:auth.currentUser.uid});await load()}catch(err){console.error(err);alert(err.message||"Aksyon an echwe.")}finally{b.disabled=false}
}

function start(){addPanel();if(auth)onAuthStateChanged(auth,u=>{if(u)setTimeout(load,50)})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
