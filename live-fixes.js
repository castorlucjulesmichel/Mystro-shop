import {getApps,getApp,initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getFirestore,collection,getDocs} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const cfg={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",storageBucket:"mystroshop-eab92.firebasestorage.app",messagingSenderId:"104073035061",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
const app=getApps().length?getApp():initializeApp(cfg),db=getFirestore(app);
let soldOutTimer=null,soldOutIds=new Set(),scrubObserver=null;

function scrubSoldOut(){
  if(!soldOutIds.size)return;
  document.querySelectorAll("[data-product-id]").forEach(card=>{if(soldOutIds.has(String(card.dataset.productId||"")))card.remove()});
  document.querySelectorAll("[data-remove]").forEach(button=>{if(soldOutIds.has(String(button.dataset.remove||"")))button.click()});
  const modal=document.getElementById("productDetailModal"),body=document.getElementById("productDetailBody");
  if(modal?.classList.contains("open")&&/Stock\s*0\b/i.test(body?.textContent||"")){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
}
async function scanSoldOut(){
  if(!document.getElementById("productsGrid")&&!document.getElementById("productsContainer"))return;
  try{const snap=await getDocs(collection(db,"products"));soldOutIds=new Set(snap.docs.filter(d=>(Number(d.data()?.stock)||0)<=0).map(d=>d.id));scrubSoldOut()}
  catch(e){console.warn("soldout",e)}
}
function startSoldOutGuard(){
  if(!document.getElementById("productsGrid")&&!document.getElementById("productsContainer"))return;
  clearInterval(soldOutTimer);scanSoldOut();soldOutTimer=setInterval(scanSoldOut,15000);
  if(!scrubObserver){scrubObserver=new MutationObserver(scrubSoldOut);scrubObserver.observe(document.body,{childList:true,subtree:true})}
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startSoldOutGuard,{once:true});else startSoldOutGuard();
