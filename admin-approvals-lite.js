import{getApps,getApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,collection,query,where,limit,doc,updateDoc,runTransaction,serverTimestamp,onSnapshot}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const app=getApps().length?getApp():null,auth=app?getAuth(app):null,db=app?getFirestore(app):null;
let pendingTx=[],pendingOrders=[],stopTx=null,stopOrders=null;
const money=n=>`G ${(Number(n)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

function addPanel(){
 const d=$("adminDashboard");if(!d||$("mwAdmin"))return;
 d.insertAdjacentHTML("afterbegin",`<section id="mwAdmin" class="mw-admin panel"><h2>✅ Apwobasyon Admin</h2><p>Demann depo/retrè ak kòmand yo parèt otomatikman an tan reyèl.</p><button id="mwRefresh" class="ghost" type="button">Rekonekte</button><div class="mw-grid"><div><h3>Depo / retrè an atant</h3><div id="mwAdminTx"><div class="empty">Ap chaje...</div></div></div><div><h3>Kòmand pou valide</h3><div id="mwAdminOrders"><div class="empty">Ap chaje...</div></div></div></section>`);
 $("mwRefresh").onclick=watch;
 document.addEventListener("click",manualAction,true);
}
function render(){
 const txBox=$("mwAdminTx"),orderBox=$("mwAdminOrders");
 if(txBox)txBox.innerHTML=pendingTx.length?pendingTx.map(x=>`<div class="mw-a"><b>${x.type==="deposit"?"⬇️ Depo":"⬆️ Retrè"} ${esc((x.provider||"").toUpperCase())}</b><p>${esc(x.userName||x.userEmail||x.userId||"Itilizatè")} · ${money(x.amount)}</p><p>${x.type==="deposit"?`Soti: ${esc(x.senderPhone||"—")} · Ref: ${esc(x.reference||"—")}`:`Pou: ${esc(x.phone||"—")}`}</p><div class="mw-actions">${x.proofDataUrl?`<button class="proof" data-lite-proof="${esc(x.id)}">Gade prèv</button>`:""}<button class="ok" data-lite-ta="${esc(x.id)}">Apwouve</button><button class="no" data-lite-tr="${esc(x.id)}">Refize</button></div></div>`).join(""):"Pa gen demann.";
 window.__mwproof=Object.fromEntries(pendingTx.map(x=>[x.id,x.proofDataUrl||""]));
 if(orderBox)orderBox.innerHTML=pendingOrders.length?pendingOrders.map(o=>`<div class="mw-a"><b>📦 ${esc(o.id)}</b><p>${esc(o.buyerName||o.buyerEmail||o.buyerId||"Client")}</p><p>${esc(o.status||"pending")} · ${esc(o.currency||"HTG")} ${(Number(o.total)||0).toLocaleString()}</p><div class="mw-actions"><button class="ok" data-oa="${esc(o.id)}">Apwouve</button><button class="no" data-or="${esc(o.id)}">Refize</button></div></div>`).join(""):"Pa gen kòmand.";
 document.dispatchEvent(new Event("adminHistoryLoaded"));
}
function watch(){
 if(!auth?.currentUser||!db)return;
 stopTx?.();stopOrders?.();stopTx=stopOrders=null;
 stopTx=onSnapshot(query(collection(db,"manualTransactions"),where("status","==","pending"),limit(80)),snap=>{pendingTx=snap.docs.map(d=>({id:d.id,...d.data()}));render()},e=>{console.error("pending transactions",e);if($("mwAdminTx"))$("mwAdminTx").innerHTML='<div class="empty">Nou pa ka chaje demann yo.</div>'});
 stopOrders=onSnapshot(query(collection(db,"orders"),where("status","in",["pending_admin","pending_wallet_payment","pending"]),limit(100)),snap=>{pendingOrders=snap.docs.map(d=>({id:d.id,...d.data()}));render()},e=>{console.error("pending orders",e);if($("mwAdminOrders"))$("mwAdminOrders").innerHTML='<div class="empty">Nou pa ka chaje kòmand yo.</div>'});
}
async function approveTx(id){
 const ref=doc(db,"manualTransactions",id),logRef=doc(db,"walletTransactions",`manual_${id}`);
 await runTransaction(db,async t=>{
  const s=await t.get(ref);if(!s.exists())throw Error("Demann lan pa egziste.");const x=s.data();if(x.status!=="pending")throw Error("Demann deja trete.");
  const ur=doc(db,"users",x.userId),us=await t.get(ur);if(!us.exists())throw Error("Kliyan pa egziste.");
  const ls=await t.get(logRef),u=us.data(),cur=Number(u.balances?.HTG??u.balance??0),amt=Number(x.amount)||0;
  if(x.type==="withdrawal"&&cur<amt)throw Error("Balans kliyan an pa sifi.");
  const next=x.type==="deposit"?cur+amt:cur-amt;
  t.update(ur,{"balances.HTG":next,balance:next});
  t.update(ref,{status:"approved",approvedAt:serverTimestamp(),approvedBy:auth.currentUser.uid});
  if(!ls.exists())t.set(logRef,{type:x.type==="deposit"?"admin_manual_deposit":"admin_manual_withdrawal",userId:x.userId,userName:x.userName||u.name||u.displayName||u.email||"Itilizatè",userEmail:x.userEmail||u.email||"",userPhone:x.userPhone||u.phone||u.phoneNumber||"",amount:x.type==="deposit"?amt:-amt,grossAmount:amt,currency:x.currency||"HTG",provider:x.provider||"",reference:x.reference||"",sourceRequestId:id,status:"completed",adminId:auth.currentUser.uid,createdAt:serverTimestamp()});
 });
}
async function manualAction(e){
 const p=e.target.closest?.("[data-lite-proof]"),a=e.target.closest?.("[data-lite-ta]"),r=e.target.closest?.("[data-lite-tr]");if(!p&&!a&&!r)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(p){const src=window.__mwproof?.[p.dataset.liteProof];if(src){const w=window.open();if(w)w.document.write(`<img src="${src}" style="max-width:100%;height:auto">`)}return}
 const b=a||r;b.disabled=true;
 try{
  if(a)await approveTx(a.dataset.liteTa);
  else await updateDoc(doc(db,"manualTransactions",r.dataset.liteTr),{status:"rejected",rejectedAt:serverTimestamp(),rejectedBy:auth.currentUser.uid});
  document.dispatchEvent(new Event("adminHistoryChanged"));
 }catch(err){console.error(err);alert(err.message||"Aksyon an echwe.")}
 finally{b.disabled=false}
}
function start(){
 addPanel();
 if(auth)onAuthStateChanged(auth,u=>{stopTx?.();stopOrders?.();stopTx=stopOrders=null;if(u)watch()});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
