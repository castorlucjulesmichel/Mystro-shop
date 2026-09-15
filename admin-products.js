import {getApps,getApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,collection,getDocs} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function loadAdminProducts(){
  const box=$("adminProductsList");
  if(!box||!getApps().length||!getAuth(getApp()).currentUser)return;
  box.innerHTML='<div class="empty">Ap chaje pwodwi yo...</div>';
  try{
    const db=getFirestore(getApp());
    const [ps,us]=await Promise.all([getDocs(collection(db,"products")),getDocs(collection(db,"users"))]);
    const users=new Map(us.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
    const products=ps.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
      const ta=a.createdAt?.toMillis?.()||0,tb=b.createdAt?.toMillis?.()||0;
      return tb-ta;
    });
    box.innerHTML=products.length?products.map(p=>{
      const u=users.get(p.sellerId)||{};
      const sellerName=p.sellerName||u.name||u.displayName||[u.firstName,u.lastName].filter(Boolean).join(" ")||p.sellerEmail||u.email||p.sellerId||"—";
      const sellerEmail=p.sellerEmail||u.email||"";
      return `<article class="product-admin-item">
        <div class="product-admin-main">
          <strong class="product-admin-name">${esc(p.name||"Pwodwi")}</strong>
          <div class="product-admin-seller">👤 <b>Vandè:</b> ${esc(sellerName)}</div>
          ${sellerEmail&&sellerEmail!==sellerName?`<small>${esc(sellerEmail)}</small>`:""}
          <div class="product-admin-meta">
            <span>${esc(p.currency||"HTG")} ${(Number(p.price)||0).toLocaleString()}</span>
            <span>Stock: ${esc(p.stock??0)}</span>
            <span>Estati: ${esc(p.status||"active")}</span>
          </div>
        </div>
        ${p.imageUrl?`<img class="product-admin-thumb" src="${esc(p.imageUrl)}" alt="${esc(p.name||"Pwodwi")}">`:""}
      </article>`;
    }).join(""):"<div class='empty'>Pa gen pwodwi.</div>";
  }catch(error){
    console.error(error);
    box.innerHTML="<div class='empty'>Nou pa ka chaje enfòmasyon pwodwi yo.</div>";
  }
}

function start(){if(!getApps().length)return;onAuthStateChanged(getAuth(getApp()),u=>{if(u)setTimeout(loadAdminProducts,350)});document.addEventListener("click",e=>{if(e.target.closest?.("#refreshAdminBtn"))setTimeout(loadAdminProducts,250)})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
