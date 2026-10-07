/* Medição de cliques: GA4 e Google Ads. Só carrega se houver ID em assets/config.js. */
(function(){
  var C=window.REINERT_TRACK||{};
  var ga=C.ga||"", ads=C.ads||"";
  var phoneLabel=C.adsPhoneLabel||C.adsLabel||"";
  if(!ga&&!ads)return;

  window.dataLayer=window.dataLayer||[];
  function gtag(){window.dataLayer.push(arguments)}
  window.gtag=window.gtag||gtag;
  gtag("js",new Date());
  if(ga)gtag("config",ga);
  if(ads)gtag("config",ads);

  // carrega o gtag.js sem bloquear a página (depois do load)
  function inject(){
    var s=document.createElement("script");
    s.async=true;
    s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(ga||ads);
    document.head.appendChild(s);
  }
  if(document.readyState==="complete")inject();
  else window.addEventListener("load",function(){(window.requestIdleCallback||function(f){setTimeout(f,200)})(inject)});

  // de onde veio o clique
  function where(a){
    if(a.dataset.loc)return a.dataset.loc;
    if(a.closest(".dock"))return window.matchMedia("(max-width:760px)").matches?"barra_fixa":"botao_flutuante";
    if(a.closest(".nav"))return "menu";
    if(a.closest(".top"))return "cabecalho";
    if(a.closest(".hero"))return "hero";
    if(a.closest(".foot"))return "rodape";
    if(a.closest(".band"))return "faixa_final";
    if(a.closest(".pagehead"))return "topo_pagina";
    if(a.closest("#orc,.out"))return "formulario";
    if(a.closest(".quick,.ccard,.contact"))return "contato";
    if(a.closest(".svc"))return "servicos";
    return "conteudo";
  }
  // texto "(página: X)" da mensagem pré-preenchida do WhatsApp
  function origem(href){
    try{
      var t=new URL(href).searchParams.get("text")||"";
      var m=t.match(/\(página:\s*([^)]+)\)/i);
      return m?m[1]:"";
    }catch(e){return ""}
  }

  function onClick(e){
    var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;
    if(!a)return;
    var href=a.getAttribute("href")||"";
    var isWa=/^https?:\/\/(wa\.me|api\.whatsapp\.com)(\/|\?|$)/i.test(href);
    var isTel=/^tel:/i.test(href);
    if(!isWa&&!isTel)return;
    var params={location:where(a),page_path:location.pathname,transport_type:"beacon"};
    if(isWa){var o=origem(href);if(o)params.origin_page=o}
    if(ga)gtag("event",isWa?"whatsapp_click":"phone_click",params);
    var label=isWa?C.adsLabel:phoneLabel;
    if(ads&&label)gtag("event","conversion",{send_to:ads+"/"+label});
  }
  // captura antes da navegação; auxclick cobre o botão do meio
  document.addEventListener("click",onClick,true);
  document.addEventListener("auxclick",onClick,true);
})();
