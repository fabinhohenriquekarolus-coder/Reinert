(function(){
  var nav=document.getElementById("nav"), menuBtn=document.getElementById("menuBtn");
  if(menuBtn&&nav){menuBtn.addEventListener("click",function(){var o=nav.classList.toggle("open");menuBtn.setAttribute("aria-expanded",o?"true":"false")})}

  // Filtros do portfólio
  var fb=document.querySelectorAll(".filters button");
  fb.forEach(function(b){b.addEventListener("click",function(){
    fb.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});
    var f=b.dataset.f;
    document.querySelectorAll("#grid .case").forEach(function(c){c.hidden=!(f==="todos"||c.dataset.cat===f)});
  })});

  // Copiar
  function sel(btn){var el=btn.previousElementSibling;if(!el)return;var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r)}
  function copy(text,btn){
    var done=function(){var t=btn.textContent;btn.textContent="Copiado";setTimeout(function(){btn.textContent=t},1600)};
    try{navigator.clipboard.writeText(text).then(done,function(){sel(btn)})}catch(e){sel(btn)}
  }
  document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){copy(document.getElementById(b.dataset.copy).textContent,b)})});

  // Formulário -> mensagem de WhatsApp
  var form=document.getElementById("orc");
  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var g=function(id){return document.getElementById(id).value.trim()};
      var err=document.getElementById("f-err");
      if(!g("f-nome")||!g("f-desc")){err.hidden=false;return}
      err.hidden=true;
      var m="Olá, Reinert! Vim pelo site e gostaria de um orçamento.\n\nVou enviar aqui na conversa as fotos da peça ou do local.\n\nNome: "+g("f-nome")+(g("f-emp")?"\nEmpresa: "+g("f-emp"):"")+"\nServiço: "+g("f-tipo")+"\nMaterial: "+g("f-mat")+"\n\n"+g("f-desc");
      document.getElementById("msg").textContent=m;
      document.getElementById("waLink").href="https://wa.me/5547988024265?text="+encodeURIComponent(m);
      document.getElementById("out").hidden=false;
    });
    var cm=document.getElementById("copyMsg");
    if(cm){cm.addEventListener("click",function(){copy(document.getElementById("msg").textContent,cm)})}
  }
})();
