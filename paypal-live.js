import{getApps,getApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const API="https://mystroshop-api.castormystro.workers.dev";
const $=id=>document.getElementById(id);
let sdkPromise=null,startedFor="",internalOrderId="";

const TXT={
  ht:{loading:"PayPal LIVE ap prepare...",ready:"PayPal LIVE pare — peman yo se lajan reyèl.",login:"Konekte anvan ou itilize PayPal.",empty:"Panyen ou vid.",disabled:"PayPal LIVE poko aktive sou sèvè a.",cancel:"Peman PayPal la anile.",success:"✅ Peman PayPal LIVE konfime. Kòmand lan ap tann apwobasyon admin.",error:"Peman PayPal echwe."},
  fr:{loading:"Préparation de PayPal LIVE...",ready:"PayPal LIVE est prêt — les paiements utilisent de l’argent réel.",login:"Connectez-vous avant d'utiliser PayPal.",empty:"Votre panier est vide.",disabled:"PayPal LIVE n'est pas encore activé sur le serveur.",cancel:"Le paiement PayPal a été annulé.",success:"✅ Paiement PayPal LIVE confirmé. La commande attend l'approbation de l'administration.",error:"Le paiement PayPal a échoué."},
  en:{loading:"Preparing PayPal LIVE...",ready:"PayPal LIVE is ready — payments use real money.",login:"Log in before using PayPal.",empty:"Your cart is empty.",disabled:"PayPal LIVE is not enabled on the server yet.",cancel:"PayPal payment was cancelled.",success:"✅ PayPal LIVE payment confirmed. The order is awaiting admin approval.",error:"PayPal payment failed."},
  es:{loading:"Preparando PayPal LIVE...",ready:"PayPal LIVE está listo — los pagos usan dinero real.",login:"Inicie sesión antes de usar PayPal.",empty:"Su carrito está vacío.",disabled:"PayPal LIVE aún no está activado en el servidor.",cancel:"El pago de PayPal fue cancelado.",success:"✅ Pago PayPal LIVE confirmado. El pedido espera la aprobación del administrador.",error:"El pago PayPal falló."}
};
const lang=()=>{const l=localStorage.getItem("mystroLanguage")||"fr";return TXT[l]?l:"fr"};
const tr=k=>TXT[lang()][k]||TXT.fr[k]||k;
function status(text,type="info"){const e=$("paypalStatus");if(!e)return;e.textContent=text;e.dataset.type=type}
function cart(){try{return JSON.parse(localStorage.getItem("mystroCart")||"[]")}catch{return[]}}
function auth(){return getApps().length?getAuth(getApp()):null}
async function api(path,body=null,method="POST"){
  const a=auth(),u=a?.currentUser,h={"Content-Type":"application/json"};
  if(u)h.Authorization=`Bearer ${await u.getIdToken(false)}`;
  const r=await fetch(API+path,{method,headers:h,...(body?{body:JSON.stringify(body)}:{})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(d.error||d.message||`HTTP_${r.status}`);
  return d;
}
function loadSdk(clientId){
  if(window.paypal?.Buttons)return Promise.resolve(window.paypal);
  if(sdkPromise)return sdkPromise;
  sdkPromise=new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
    s.async=true;
    s.onload=()=>window.paypal?.Buttons?resolve(window.paypal):reject(Error("PAYPAL_SDK_NOT_READY"));
    s.onerror=()=>reject(Error("PAYPAL_SDK_LOAD_FAILED"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}
async function createPayPalOrder(){
  const a=auth(),u=a?.currentUser;if(!u)throw Error(tr("login"));
  const c=cart();if(!c.length)throw Error(tr("empty"));
  const items=c.map(i=>({productId:String(i.id),qty:Math.max(1,Number(i.qty)||1)}));
  const displayCurrency=(localStorage.getItem("mystroCurrency")||"HTG").toUpperCase();
  const deliveryRequested=localStorage.getItem("mystroDelivery")==="1";
  const internal=await api("/orders/create",{items,displayCurrency,deliveryRequested});
  internalOrderId=internal.orderId;
  const p=await api("/paypal/orders/create",{orderId:internalOrderId});
  return p.paypalOrderId;
}
async function capturePayPal(paypalOrderId){
  if(!internalOrderId)throw Error("INTERNAL_ORDER_MISSING");
  const d=await api("/paypal/orders/capture",{orderId:internalOrderId,paypalOrderId});
  if(!d.ok)throw Error("PAYPAL_CAPTURE_FAILED");
  localStorage.removeItem("mystroCart");
  localStorage.removeItem("mystroDelivery");
  status(tr("success"),"success");
  internalOrderId="";
  setTimeout(()=>location.reload(),900);
  return d;
}
async function init(){
  const box=$("paypalButton"),wrap=$("paypalBox");
  if(!box||!wrap)return;
  const a=auth(),u=a?.currentUser;
  if(!u){status(tr("login"),"error");box.innerHTML="";return}
  if(!cart().length){status(tr("empty"),"error");box.innerHTML="";return}
  if(startedFor===u.uid&&box.childElementCount)return;
  startedFor=u.uid;status(tr("loading"));
  try{
    const cfg=await api("/paypal/config",null,"GET");
    if(!cfg.enabled||cfg.mode!=="live"||!cfg.clientId){status(tr("disabled"),"error");box.innerHTML="";return}
    await loadSdk(cfg.clientId);
    box.innerHTML="";
    await window.paypal.Buttons({
      style:{layout:"vertical",shape:"rect",label:"paypal"},
      createOrder:async()=>{internalOrderId="";return await createPayPalOrder()},
      onApprove:async data=>await capturePayPal(data.orderID),
      onCancel:()=>{internalOrderId="";status(tr("cancel"),"info")},
      onError:e=>{console.error("PayPal LIVE",e);internalOrderId="";status(`${tr("error")} ${e?.message||""}`,"error")}
    }).render("#paypalButton");
    status(tr("ready"),"success");
  }catch(e){
    console.error("PayPal init",e);box.innerHTML="";const m=String(e?.message||"");status(m==="PAYPAL_AUTH_FAILED"?"PayPal LIVE credentials yo pa valab oswa yo pa soti nan menm REST API app la.":`${tr("disabled")} ${m}`,"error");
  }
}
function start(){
  const a=auth();if(!a)return;
  onAuthStateChanged(a,()=>init());
  document.getElementById("lang")?.addEventListener("change",()=>setTimeout(init,0));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
