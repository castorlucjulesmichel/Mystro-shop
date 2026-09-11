(() => {
  const currencyLabels = {HTG:"HTG G",USD:"USD $",EUR:"EUR €",CAD:"CAD CA$",GBP:"GBP £",DOP:"DOP RD$",XOF:"XOF CFA"};
  const languageLabels = {fr:"🇫🇷 Français",ht:"🇭🇹 Kreyòl",en:"🇺🇸 English",es:"🇪🇸 Español"};

  function enhanceSelectors(){
    const currency=document.getElementById("currencySelector");
    if(currency){
      [...currency.options].forEach(o=>{ if(currencyLabels[o.value]) o.textContent=currencyLabels[o.value]; });
      currency.setAttribute("aria-label","Choix de devises");
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
    note.textContent="MonCash ak NatCash trete rechaj yo an HTG. Bouton deviz anlè a chanje afichaj pri ak balans yo.";
    note.style.cssText="display:block;color:#667085;line-height:1.4;margin-top:-4px";
    label.insertAdjacentElement("afterend",note);
  }

  function run(){ enhanceSelectors(); addWalletNote(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",run,{once:true}); else run();
})();
