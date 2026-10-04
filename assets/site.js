(function(){
  var nav=document.getElementById("nav"), menuBtn=document.getElementById("menuBtn");
  function closeMenu(){if(!nav)return;nav.classList.remove("open");if(menuBtn)menuBtn.setAttribute("aria-expanded","false")}
  if(menuBtn&&nav){
    menuBtn.addEventListener("click",function(){var o=nav.classList.toggle("open");menuBtn.setAttribute("aria-expanded",o?"true":"false")});
    nav.addEventListener("click",function(e){if(e.target.closest("a"))closeMenu()});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&nav.classList.contains("open")){closeMenu();menuBtn.focus()}});
  }

  // Barra de contato do celular: some enquanto já existe um botão de orçamento na tela
  var dock=document.getElementById("dock"), ctas=document.querySelectorAll("[data-cta]");
  if(dock&&ctas.length&&"IntersectionObserver" in window){
    var vis=new Set();
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){e.isIntersecting?vis.add(e.target):vis.delete(e.target)});
      dock.classList.toggle("is-hidden",vis.size>0&&window.matchMedia("(max-width:760px)").matches);
    },{threshold:0.6});
    ctas.forEach(function(c){io.observe(c)});
  }

  // Filtros do portfólio
  var fb=document.querySelectorAll(".filters button");
  fb.forEach(function(b){b.addEventListener("click",function(){
    fb.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});
    var f=b.dataset.f;
    document.querySelectorAll("#grid .case").forEach(function(c){c.hidden=!(f==="todos"||c.dataset.cat===f)});
  })});

  // Copiar: seleciona o texto certo como alternativa e avisa o resultado
  function flash(btn,txt){var t=btn.dataset.label||btn.textContent;btn.dataset.label=t;btn.textContent=txt;setTimeout(function(){btn.textContent=t},1800)}
  function select(el){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r)}
  function copy(el,btn){
    var text=el.textContent;
    var fallback=function(){select(el);flash(btn,"Selecionado, copie")};
    try{navigator.clipboard.writeText(text).then(function(){flash(btn,"Copiado")},fallback)}catch(e){fallback()}
  }
  document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){copy(document.getElementById(b.dataset.copy),b)})});

  // Formulário -> mensagem de WhatsApp
  var form=document.getElementById("orc");
  if(form){
    var nome=document.getElementById("f-nome"), desc=document.getElementById("f-desc");
    var err=document.getElementById("f-err"), out=document.getElementById("out");
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var g=function(id){return document.getElementById(id).value.trim()};
      var bad=[nome,desc].filter(function(el){return !el.value.trim()});
      [nome,desc].forEach(function(el){el.setAttribute("aria-invalid",bad.indexOf(el)>=0?"true":"false")});
      if(bad.length){err.hidden=false;bad[0].focus();return}
      err.hidden=true;
      var m="Olá, Reinert! Vim pelo site e gostaria de um orçamento.\n\nVou enviar aqui na conversa as fotos da peça ou do local.\n\nNome: "+g("f-nome")+(g("f-emp")?"\nEmpresa: "+g("f-emp"):"")+"\nServiço: "+g("f-tipo")+"\nMaterial: "+g("f-mat")+"\n\n"+g("f-desc");
      document.getElementById("msg").textContent=m;
      var wl=document.getElementById("waLink");
      wl.href="https://wa.me/5547988024265?text="+encodeURIComponent(m);
      out.hidden=false;
      out.scrollIntoView({behavior:"smooth",block:"center"});
      wl.focus({preventScroll:true});
    });
    var cm=document.getElementById("copyMsg");
    if(cm){cm.addEventListener("click",function(){copy(document.getElementById("msg"),cm)})}
  }
})();
