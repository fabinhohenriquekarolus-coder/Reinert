(function(){
  var nav=document.getElementById("nav"), menuBtn=document.getElementById("menuBtn");
  function closeMenu(){if(!nav)return;nav.classList.remove("open");if(menuBtn)menuBtn.setAttribute("aria-expanded","false")}
  if(menuBtn&&nav){
    menuBtn.addEventListener("click",function(){var o=nav.classList.toggle("open");menuBtn.setAttribute("aria-expanded",o?"true":"false")});
    nav.addEventListener("click",function(e){if(e.target.closest("a"))closeMenu()});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&nav.classList.contains("open")){closeMenu();menuBtn.focus()}});
  }

  var dock=document.getElementById("dock"), ctas=document.querySelectorAll("[data-cta]");
  if(dock){
    var vis=new Set(), mobile=window.matchMedia("(max-width:760px)"), tick=false;
    var update=function(){
      var seen=vis.size>0;
      if(mobile.matches){dock.classList.remove("is-shown");dock.classList.toggle("is-hidden",seen)}
      else{dock.classList.remove("is-hidden");dock.classList.toggle("is-shown",!seen&&window.scrollY>window.innerHeight)}
    };
    if("IntersectionObserver" in window&&ctas.length){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(e){e.isIntersecting?vis.add(e.target):vis.delete(e.target)});
        update();
      },{threshold:0.6});
      ctas.forEach(function(c){io.observe(c)});
    }
    window.addEventListener("scroll",function(){
      if(tick)return;
      tick=true;
      requestAnimationFrame(function(){tick=false;update()});
    },{passive:true});
    window.addEventListener("resize",update);
    update();
  }

  var tiles=document.querySelectorAll(".tile");
  if(tiles.length){
    var noHover=window.matchMedia("(hover: none)");
    var closeTiles=function(except){tiles.forEach(function(x){if(x!==except)x.classList.remove("is-open")})};
    tiles.forEach(function(t){t.addEventListener("click",function(e){
      if(!noHover.matches||t.classList.contains("is-open"))return;
      e.preventDefault();
      closeTiles(t);
      t.classList.add("is-open");
    })});
    document.addEventListener("click",function(e){if(!e.target.closest(".tile"))closeTiles(null)});
  }

  var fb=document.querySelectorAll(".filters button");
  fb.forEach(function(b){b.addEventListener("click",function(){
    fb.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});
    var f=b.dataset.f;
    document.querySelectorAll("#grid .case").forEach(function(c){c.hidden=!(f==="todos"||c.dataset.cat===f)});
  })});

  var grid=document.getElementById("grid"), lb=document.getElementById("lb");
  if(grid&&lb&&typeof lb.showModal==="function"){
    var fig=lb.querySelector(".lb-fig"), big=document.createElement("img"), cur=null, opener=null;
    var lc=document.getElementById("lb-c"), lt=document.getElementById("lb-t"), ld=document.getElementById("lb-d"), ln=document.getElementById("lb-n");
    big.decoding="async";
    fig.appendChild(big);
    var visible=function(){return Array.prototype.filter.call(grid.querySelectorAll(".case"),function(c){return !c.hidden})};
    var show=function(c){
      var im=c.querySelector(".ph img"), list=visible(), i=list.indexOf(c);
      cur=c;
      big.removeAttribute("src");
      big.width=+im.getAttribute("width")||0;
      big.height=+im.getAttribute("height")||0;
      big.alt=im.alt;
      big.src=im.currentSrc||im.src;
      lb.dataset.cat=c.dataset.cat;
      lc.textContent=c.querySelector(".badge").textContent;
      lt.textContent=c.querySelector("h2").textContent;
      ld.textContent=c.querySelector(".desc").textContent;
      ln.textContent=(i+1)+" de "+list.length;
      lb.classList.toggle("is-single",list.length<2);
      var nx=list[(i+1)%list.length];
      if(nx&&nx!==c){var pre=new Image();pre.src=nx.querySelector(".ph img").src}
    };
    var step=function(d){var list=visible(), i=list.indexOf(cur);if(list.length>1)show(list[(i+d+list.length)%list.length])};
    grid.addEventListener("click",function(e){
      var b=e.target.closest(".ph");
      if(!b)return;
      opener=b;
      show(b.closest(".case"));
      document.documentElement.classList.add("lb-open");
      lb.showModal();
    });
    lb.addEventListener("click",function(e){
      var a=e.target.closest("[data-lb]");
      if(a){if(a.dataset.lb==="close")lb.close();else step(a.dataset.lb==="next"?1:-1);return}
      if(e.target===lb||e.target.classList.contains("lb-in")||e.target===fig)lb.close();
    });
    lb.addEventListener("keydown",function(e){
      if(e.key==="ArrowRight"){e.preventDefault();step(1)}
      else if(e.key==="ArrowLeft"){e.preventDefault();step(-1)}
    });
    lb.addEventListener("close",function(){
      document.documentElement.classList.remove("lb-open");
      if(opener)opener.focus();
    });
  }

  function flash(btn,txt){var t=btn.dataset.label||btn.textContent;btn.dataset.label=t;btn.textContent=txt;setTimeout(function(){btn.textContent=t},1800)}
  function select(el){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r)}
  function copy(el,btn){
    var text=el.textContent;
    var fallback=function(){select(el);flash(btn,"Selecionado, copie")};
    try{navigator.clipboard.writeText(text).then(function(){flash(btn,"Copiado")},fallback)}catch(e){fallback()}
  }
  document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){copy(document.getElementById(b.dataset.copy),b)})});

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
