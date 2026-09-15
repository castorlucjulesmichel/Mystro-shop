const $=id=>document.getElementById(id);
const WORDS={
  ht:{locate:"📍 Lokalize",none:"Pa gen GPS ni adrès ki anrejistre pou itilizatè sa a."},
  fr:{locate:"📍 Localiser",none:"Aucune position GPS ni adresse n'est enregistrée pour cet utilisateur."},
  en:{locate:"📍 Locate",none:"No GPS location or address is recorded for this user."},
  es:{locate:"📍 Localizar",none:"No hay una ubicación GPS ni una dirección registrada para este usuario."}
};
const lang=()=>{const x=$("adminLanguage")?.value||localStorage.getItem("mystroAdminLang")||"ht";return WORDS[x]?x:"ht"};
const tr=k=>WORDS[lang()][k]||WORDS.ht[k]||k;

function closeOther(current){
  document.querySelectorAll("#adminAllUsersList details.admin-user-card[open]").forEach(x=>{if(x!==current)x.open=false});
}

function enhanceCard(card){
  const summary=card.querySelector(":scope > summary");
  if(!summary)return;
  summary.setAttribute("role","button");
  summary.setAttribute("tabindex","0");
  summary.setAttribute("aria-label","Gade detay itilizatè a");

  let button=summary.querySelector(".user-location-summary");
  const mapLink=card.querySelector('.user-details a[href*="openstreetmap.org"]');
  if(!button){
    button=document.createElement("button");
    button.type="button";
    button.className="user-location-summary";
    const badges=summary.querySelector(".user-badges")||summary;
    badges.appendChild(button);
  }
  button.textContent=tr("locate");
  button.dataset.href=mapLink?.href||"";
  button.classList.toggle("no-location",!button.dataset.href);

  if(!summary.querySelector(".details-chevron")){
    const arrow=document.createElement("span");
    arrow.className="details-chevron";
    arrow.textContent="⌄";
    summary.appendChild(arrow);
  }

  if(card.dataset.tapReady==="1")return;
  card.dataset.tapReady="1";
  summary.addEventListener("click",e=>{
    if(e.target.closest("button,a"))return;
    e.preventDefault();
    const next=!card.open;
    card.open=next;
    if(next)closeOther(card);
  });
  summary.addEventListener("keydown",e=>{
    if(e.key!=="Enter"&&e.key!==" ")return;
    if(e.target.closest("button,a"))return;
    e.preventDefault();
    const next=!card.open;
    card.open=next;
    if(next)closeOther(card);
  });
}

function enhanceAll(){
  document.querySelectorAll("#adminAllUsersList details.admin-user-card").forEach(enhanceCard);
}

function installStyle(){
  if($("adminUserDetailsFixCss"))return;
  const s=document.createElement("style");
  s.id="adminUserDetailsFixCss";
  s.textContent=`
  #adminAllUsersList .admin-user-card>summary{position:relative;cursor:pointer;padding-right:38px!important;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #adminAllUsersList .admin-user-card[open]>summary{background:#f8fbff;border-bottom:1px solid #e8edf5}
  #adminAllUsersList .details-chevron{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:22px;font-weight:900;color:#667085;transition:.18s}
  #adminAllUsersList .admin-user-card[open] .details-chevron{transform:translateY(-50%) rotate(180deg)}
  #adminAllUsersList .user-location-summary{border:0;border-radius:999px;padding:6px 9px;background:#eaf8ef;color:#067647;font:inherit;font-size:12px;font-weight:900;white-space:nowrap;cursor:pointer;box-shadow:0 0 0 1px #abefc6 inset}
  #adminAllUsersList .user-location-summary.no-location{background:#f2f4f7;color:#667085;box-shadow:none}
  #adminAllUsersList .user-details{display:grid!important}
  @media(max-width:600px){#adminAllUsersList .admin-user-card>summary{padding-right:34px!important}.user-badges{max-width:52%!important}.user-location-summary{max-width:100%;overflow:hidden;text-overflow:ellipsis}}
  `;
  document.head.appendChild(s);
}

function start(){
  installStyle();
  enhanceAll();
  const root=$("adminAllUsersList")||document.body;
  new MutationObserver(()=>enhanceAll()).observe(root,{childList:true,subtree:true});
  $("adminLanguage")?.addEventListener("change",()=>setTimeout(enhanceAll,0));
  document.addEventListener("click",e=>{
    const b=e.target.closest?.(".user-location-summary");
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const href=b.dataset.href||"";
    if(href)window.open(href,"_blank","noopener,noreferrer");
    else alert(tr("none"));
  },true);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
