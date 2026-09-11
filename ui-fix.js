(() => {
  const currencyLabels = {HTG:"HTG G",USD:"USD $",EUR:"EUR €",CAD:"CAD CA$",GBP:"GBP £",DOP:"DOP RD$",XOF:"XOF CFA"};
  const languageLabels = {fr:"🇫🇷 Français",ht:"🇭🇹 Kreyòl",en:"🇺🇸 English",es:"🇪🇸 Español"};
  const supported = Object.keys(currencyLabels);

  function normalizeCurrency(value){
    const raw=String(value||"").trim().toUpperCase();
    const code=supported.find(c=>raw===c||raw.startsWith(c+" "));
    return code||"HTG";
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
    note.textContent="MonCash ak NatCash trete rechaj yo an HTG. Bouton deviz anlè a chanje afichaj pri, panyen, balans ak frè livrezon selon to echanj la.";
    note.style.cssText="display:block;color:#667085;line-height:1.4;margin-top:-4px";
    label.insertAdjacentElement("afterend",note);
  }

  function run(){ enhanceSelectors(); addWalletNote(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run,{once:true}); else run();
})();
