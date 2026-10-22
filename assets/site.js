(function(){
  var nav=document.getElementById("nav"), menuBtn=document.getElementById("menuBtn");
  var subBox=document.querySelector(".has-sub"), subBtn=subBox&&subBox.querySelector(".sub-btn");
  function closeSub(){if(subBox){subBox.classList.remove("open");subBtn.setAttribute("aria-expanded","false")}}
  function setMenu(o){nav.classList.toggle("open",o);menuBtn.setAttribute("aria-expanded",o?"true":"false");document.documentElement.classList.toggle("menu-lock",o)}
  function closeMenu(){if(nav&&menuBtn)setMenu(false)}
  if(menuBtn&&nav){
    menuBtn.addEventListener("click",function(){setMenu(!nav.classList.contains("open"))});
    nav.addEventListener("click",function(e){if(e.target.closest("a"))closeMenu()});
    window.matchMedia("(min-width:941px)").addEventListener("change",closeMenu);
  }
  if(subBox&&subBtn){
    subBtn.addEventListener("click",function(){var o=subBox.classList.toggle("open");subBtn.setAttribute("aria-expanded",o?"true":"false")});
    document.addEventListener("click",function(e){if(!subBox.contains(e.target))closeSub()});
  }
  document.addEventListener("keydown",function(e){
    if(e.key!=="Escape")return;
    if(nav&&nav.classList.contains("open")){closeMenu();menuBtn.focus()}
    else if(subBox&&subBox.classList.contains("open")){closeSub();subBtn.focus()}
  });

  var calm=window.matchMedia("(prefers-reduced-motion: reduce)");
  if("IntersectionObserver" in window&&!calm.matches){
    var rvSel=".works .mosaic figure,.tile,.how-list li,.review,.pcard,.step,.qa,.ct-row,.cols2>div,.tbl,.gloss div,.rail li,.vals>div,.mat,.flow li,.svc-pics .pics img,.svc-cols h2,.sec-head,.ab-time h2,.ab-values h2";
    var seen=0, rvIo=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        var t=e.target;rvIo.unobserve(t);
        t.classList.add("in");
        setTimeout(function(){t.classList.remove("rv","in");t.style.removeProperty("--d")},1100);
      });
    },{threshold:0.12,rootMargin:"0px 0px -5% 0px"});
    document.querySelectorAll(rvSel).forEach(function(el){
      if(el.closest("#grid,dialog"))return;
      var r=el.getBoundingClientRect();
      if(r.top<window.innerHeight*0.95)return;
      var sib=Array.prototype.indexOf.call(el.parentNode.children,el);
      el.style.setProperty("--d",(Math.min(sib,5)*0.07).toFixed(2)+"s");
      el.classList.add("rv");
      rvIo.observe(el);
    });
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

  var grid=document.getElementById("grid"), lb=document.getElementById("lb"), shown=[];
  var fb=document.querySelectorAll(".filters button");
  if(grid){
    var all=Array.prototype.slice.call(grid.querySelectorAll(".case")), more=document.getElementById("pfMore"), stat=document.getElementById("pfStatus");
    var per=12, cnt=per, filt="todos", cols=[], hs=[], mq=window.matchMedia("(max-width:700px)");
    var ratio=function(c){var i=c.querySelector("img");return (+i.getAttribute("height")||1)/(+i.getAttribute("width")||1)};
    var put=function(c){var m=0;for(var i=1;i<cols.length;i++)if(hs[i]<hs[m])m=i;cols[m].appendChild(c);hs[m]+=ratio(c)};
    var list=function(){return all.filter(function(c){return filt==="todos"||c.dataset.cat===filt})};
    var info=function(l){
      if(more){var left=l.length-shown.length;more.hidden=left<=0;more.textContent="Ver mais trabalhos ("+left+")"}
      if(stat)stat.textContent="Mostrando "+shown.length+" de "+l.length+" trabalhos";
    };
    var build=function(){
      var l=list(), k=mq.matches?2:3;
      grid.textContent="";
      grid.classList.add("is-js");
      cols=[];hs=[];
      for(var i=0;i<k;i++){var col=document.createElement("div");col.className="col";grid.appendChild(col);cols.push(col);hs.push(0)}
      shown=l.slice(0,cnt);
      shown.forEach(put);
      info(l);
    };
    build();
    if(mq.addEventListener)mq.addEventListener("change",build);
    if(more)more.addEventListener("click",function(){
      var l=list(), next=l.slice(shown.length,shown.length+per);
      next.forEach(function(c){put(c);shown.push(c)});
      cnt=shown.length;
      info(l);
      if(next[0])next[0].querySelector(".ph").focus({preventScroll:true});
    });
    fb.forEach(function(b){b.addEventListener("click",function(){
      fb.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});
      filt=b.dataset.f;cnt=per;build();
    })});
  }
  if(grid&&lb&&typeof lb.showModal==="function"){
    var fig=lb.querySelector(".lb-fig"), big=document.createElement("img"), cur=null, opener=null;
    var lc=document.getElementById("lb-c"), lt=document.getElementById("lb-t"), ld=document.getElementById("lb-d"), ln=document.getElementById("lb-n");
    big.decoding="async";
    fig.appendChild(big);
    var visible=function(){return shown.slice()};
    var show=function(c){
      var im=c.querySelector(".ph img"), list=visible(), i=list.indexOf(c);
      cur=c;
      big.removeAttribute("src");
      big.width=+im.getAttribute("width")||0;
      big.height=+im.getAttribute("height")||0;
      big.alt=im.alt;
      big.src=im.currentSrc||im.src;
      lb.dataset.cat=c.dataset.cat;
      lc.textContent=c.dataset.label;
      lt.textContent=c.dataset.title;
      ld.textContent=c.dataset.desc;
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
