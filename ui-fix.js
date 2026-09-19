(() => {
  const currencyLabels = {HTG:"HTG G",USD:"USD $",EUR:"EUR €",CAD:"CAD CA$",GBP:"GBP £",DOP:"DOP RD$",XOF:"XOF CFA"};
  const languageLabels = {fr:"🇫🇷 Français",ht:"🇭🇹 Kreyòl",en:"🇺🇸 English",es:"🇪🇸 Español"};
  const supported = Object.keys(currencyLabels);
  const FIREBASE_CONFIG={apiKey:"AIzaSyC3JebExbgH1n40wzpwNjtASmOPG1tuKIs",authDomain:"mystroshop-eab92.firebaseapp.com",projectId:"mystroshop-eab92",storageBucket:"mystroshop-eab92.firebasestorage.app",messagingSenderId:"104073035061",appId:"1:104073035061:web:59d2779f2db7a8a3be207c"};
  let firebasePromise=null;
  const productImageCache=new WeakMap();

  function normalizeCurrency(value){
    const raw=String(value||"").trim().toUpperCase();
    const code=supported.find(c=>raw===c||raw.startsWith(c+" "));
    return code||"HTG";
  }

  function showToast(message,type="info"){
    let box=document.getElementById("publishFixToast");
    if(!box){
      box=document.createElement("div");
      box.id="publishFixToast";
      box.style.cssText="position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:1000002;max-width:min(92vw,520px);padding:13px 16px;border-radius:13px;color:#fff;font-weight:800;box-shadow:0 12px 35px #0003;text-align:center";
      document.body.appendChild(box);
    }
    box.style.background=type==="success"?"#067647":type==="error"?"#b42318":"#3159db";
    box.textContent=message;
    box.hidden=false;
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>{box.hidden=true},4200);
  }

  function enhanceSelectors(){
    const currency=document.getElementById("currencySelector");
    if(currency){
      [...currency.options].forEach(o=>{
        const code=normalizeCurrency(o.getAttribute("value")||o.value||o.textContent);
        o.value=code;
        o.textContent=currencyLabels[code]||code;
      });
      const saved=normalizeCurrency(localStorage.getItem("mystroCurrency")||currency.value||"HTG");
      localStorage.setItem("mystroCurrency",saved);
      currency.value=saved;
      currency.setAttribute("aria-label","Choix de devises");
      setTimeout(()=>currency.dispatchEvent(new Event("change",{bubbles:true})),0);
    }
    const language=document.getElementById("languageSelector");
    if(language){
      [...language.options].forEach(o=>{ if(languageLabels[o.value]) o.textContent=languageLabels[o.value]; });
      language.setAttribute("aria-label","Choix de langue");
    }
  }

  function addWalletNote(){
    const modal=document.getElementById("walletModal");
    if(!modal || modal.querySelector(".provider-currency-note")) return;
    const amount=document.getElementById("walletAmount");
    const label=amount?.closest("label");
    if(!label) return;
    const note=document.createElement("small");
    note.className="provider-currency-note";
    note.textContent="MonCash ak NatCash trete depo/retrè yo an HTG. Admin dwe valide tranzaksyon manyèl la anvan balans lan chanje.";
    note.style.cssText="display:block;color:#667085;line-height:1.4;margin-top:-4px";
    label.insertAdjacentElement("afterend",note);
  }

  function addAdminEntry(){
    const welcome=document.querySelector(".welcome-card");
    if(welcome&&!welcome.querySelector(".admin-entry-link")){
      const a=document.createElement("a");
      a.href="./admin.html";
      a.className="admin-entry-link";
      a.textContent="🛡️ Espace Admin";
      a.style.cssText="display:block;margin-top:14px;text-align:center;text-decoration:none;font-weight:800;color:#3159db";
      welcome.appendChild(a);
    }
    const nav=document.getElementById("mobileNav");
    if(nav&&!nav.querySelector(".admin-nav-link")){
      const a=document.createElement("a");
      a.href="./admin.html";
      a.className="admin-nav-link";
      a.textContent="🛡️ Admin";
      a.style.cssText="display:block;padding:12px 14px;text-decoration:none;color:inherit;font-weight:700";
      const logout=document.getElementById("logoutBtn");
      nav.insertBefore(a,logout||null);
    }
  }

  async function firebase(){
    if(firebasePromise)return firebasePromise;
    firebasePromise=Promise.all([
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js")
    ]).then(([appMod,authMod,fsMod])=>{
      const app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(FIREBASE_CONFIG);
      return {auth:authMod.getAuth(app),db:fsMod.getFirestore(app),fs:fsMod};
    });
    return firebasePromise;
  }

  function imageAllowed(file){
    if(!file)return false;
    const type=String(file.type||"").toLowerCase();
    const name=String(file.name||"").toLowerCase();
    return ["image/jpeg","image/jpg","image/png","image/webp"].includes(type)||/\.(jpe?g|png|webp)$/.test(name);
  }

  function fileKey(files){
    return files.map(f=>[f.name,f.size,f.lastModified,f.type].join(":")).join("|");
  }

  function loadImageFile(file){
    return new Promise((resolve,reject)=>{
      let url="";
      try{
        url=URL.createObjectURL(file);
        const img=new Image();
        const clean=()=>{if(url)URL.revokeObjectURL(url)};
        img.onload=()=>{clean();resolve(img)};
        img.onerror=()=>{clean();reject(Error("Foto a pa ka ouvri sou telefòn nan."))};
        img.src=url;
      }catch(error){
        if(url)URL.revokeObjectURL(url);
        reject(Error("Nou pa ka prepare foto a."));
      }
    });
  }

  async function compressProductImage(file,maxChars=85000){
    if(!imageAllowed(file))throw Error("Foto yo dwe JPEG, PNG oswa WebP.");
    if(file.size>8*1024*1024)throw Error("Chak foto dwe pi piti pase 8 MB.");
    if(productImageCache.has(file))return productImageCache.get(file);
    const task=(async()=>{
      const img=await loadImageFile(file);
      const target=Math.min(85000,Math.max(55000,Number(maxChars)||85000));
      let maxSide=900,quality=.68,out="";
      for(let attempt=0;attempt<9;attempt++){
        const scale=Math.min(1,maxSide/Math.max(img.width||1,img.height||1));
        const canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round((img.width||1)*scale));
        canvas.height=Math.max(1,Math.round((img.height||1)*scale));
        const ctx=canvas.getContext("2d",{alpha:false});
        if(!ctx)throw Error("Navigatè a pa ka prepare foto a.");
        ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        out=canvas.toDataURL("image/jpeg",quality);
        if(out&&out.length<=target)return out;
        maxSide=Math.max(360,Math.round(maxSide*.80));
        quality=Math.max(.38,quality-.05);
      }
      if(!out)throw Error("Nou pa ka konvèti foto a.");
      if(out.length>120000)throw Error("Foto a twò lou menm apre konpresyon. Chwazi yon foto pi lejè.");
      return out;
    })();
    productImageCache.set(file,task);
    try{return await task}catch(error){productImageCache.delete(file);throw error}
  }

  async function previewSelectedFiles(input,preview){
    const files=[...(input.files||[])].slice(0,5);
    const key=fileKey(files);
    input._mystroPhotoCache=null;
    preview.innerHTML="";
    const urls=[];
    for(const file of files){
      try{
        const src=await compressProductImage(file,85000);
        if(fileKey([...(input.files||[])].slice(0,5))!==key)return;
        urls.push(src);
        const img=document.createElement("img");
        img.src=src;img.alt=file.name||"Foto pwodwi";
        preview.appendChild(img);
      }catch(error){
        console.error("Mystro-Shop photo preview",error);
        const warn=document.createElement("div");
        warn.textContent="⚠️ "+(error.message||file.name||"Foto");
        warn.style.cssText="padding:10px;background:#fff1f2;color:#b42318;border-radius:10px";
        preview.appendChild(warn);
      }
    }
    if(urls.length===files.length&&files.length)input._mystroPhotoCache={key,urls};
  }

  function productData(imageUrls,user,profile,fs){
    const val=id=>document.getElementById(id)?.value;
    const name=String(val("productName")||"").trim();
    const price=Number(val("productPrice"));
    const stock=Math.max(1,Math.floor(Number(val("productStock"))||1));
    if(!name||!price||price<=0)throw Error("Non pwodwi ak pri a obligatwa.");
    return {
      name,
      category:String(val("productCategory")||"Autres"),
      currency:String(val("productCurrency")||"HTG").toUpperCase(),
      price,
      discountPercent:Math.max(0,Math.min(90,Number(val("productDiscount"))||0)),
      stock,
      description:String(val("productDescription")||"").trim(),
      imageUrls,
      imageUrl:imageUrls[0]||"",
      imagePaths:[],
      sellerId:user.uid,
      sellerEmail:user.email||"",
      sellerName:profile.name||[profile.firstName,profile.lastName].filter(Boolean).join(" ")||"Vendeur",
      status:"active",
      createdAt:fs.serverTimestamp()
    };
  }

  function installProductPublishFix(){
    const form=document.getElementById("productForm"),input=document.getElementById("productImage"),preview=document.getElementById("productImagePreview");
    if(!form||!input||form.dataset.localPublishFix==="1")return;
    form.dataset.localPublishFix="1";
    input.addEventListener("change",event=>{event.stopImmediatePropagation();if(preview)previewSelectedFiles(input,preview)},true);
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      const button=document.getElementById("publishProductBtn");
      const old=button?.textContent||"Pibliye pwodwi a";
      if(button){button.disabled=true;button.textContent="Ap pibliye...";}
      try{
        const {auth,db,fs}=await firebase();
        const user=auth.currentUser;
        if(!user)throw Error("Konekte anvan ou pibliye yon pwodwi.");
        const snap=await fs.getDoc(fs.doc(db,"users",user.uid));
        const profile=snap.exists()?snap.data():{};
        const role=String(profile.role||"").toLowerCase();
        if(!["seller","vendeur","admin","administrator","administrateur"].includes(role))throw Error("Fonksyon sa a rezève pou vandè ak admin.");
        const files=[...(input.files||[])].slice(0,5);
        if(!files.length)throw Error("Ajoute omwen 1 foto pwodwi.");
        const key=fileKey(files);
        let urls=input._mystroPhotoCache?.key===key?[...input._mystroPhotoCache.urls]:[];
        if(urls.length!==files.length){
          urls=[];
          for(let i=0;i<files.length;i++){
            if(button)button.textContent=`Foto ${i+1}/${files.length}...`;
            urls.push(await compressProductImage(files[i],85000));
          }
          input._mystroPhotoCache={key,urls:[...urls]};
        }
        if(urls.reduce((n,x)=>n+x.length,0)>700000)throw Error("Tout foto yo ansanm twò lou. Chwazi foto pi lejè.");
        const data=productData(urls,user,profile,fs);
        await fs.addDoc(fs.collection(db,"products"),data);
        form.reset();if(preview)preview.innerHTML="";
        showToast("✅ Pwodwi a pibliye avèk siksè.","success");
        setTimeout(()=>location.reload(),650);
      }catch(error){
        console.error("Mystro-Shop local publish fix",error);
        showToast(`Piblikasyon echwe: ${error.message||error}`,"error");
      }finally{
        if(button){button.disabled=false;button.textContent=old;}
      }
    },true);
  }

  function run(){
    enhanceSelectors();
    addWalletNote();
    addAdminEntry();
    installProductPublishFix();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run,{once:true}); else run();
})();
