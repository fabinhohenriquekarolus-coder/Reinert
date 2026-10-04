#!/usr/bin/env python3
"""Gera as páginas estáticas do site da Reinert.

Uso: python3 tools/build.py
Depois de definir SITE_URL (domínio final), o build também gera canonical,
og:url e sitemap.xml.
"""
import json
import re
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "tools" / "content"

# Preencher com o domínio final, ex.: "https://reinert.seudominio.com.br"
SITE_URL = ""

NAME = "Reinert Soluções em Solda"
PHONE_E164 = "+5547988024265"
PHONE_WA = "5547988024265"
PHONE_FMT = "(47) 98802-4265"
EMAIL = "reinertsoldas@gmail.com"
ADDRESS = {
    "street": "Rua Leopoldo Beninca, 108",
    "district": "Vila Nova",
    "city": "Joinville",
    "state": "SC",
    "zip": "89237-150",
}
MAPS = "https://www.google.com/maps/search/Reinert+Solu%C3%A7%C3%B5es+em+Solda+Joinville"
INSTA = "https://www.instagram.com/reinert.soldas/"

# ---------------------------------------------------------------- WhatsApp
def wa(context=None):
    origem = f" (página: {context})" if context else ""
    msg = (
        f"Olá, Reinert! Vim pelo site{origem} e gostaria de um orçamento.\n\n"
        "Vou enviar aqui na conversa:\n"
        "1) Fotos da peça ou do local (de vários ângulos)\n"
        "2) Descrição do que precisa ser feito (material, medidas e prazo)\n\n"
        "Meu nome: "
    )
    return f"https://wa.me/{PHONE_WA}?text=" + urllib.parse.quote(msg, safe="")


# ---------------------------------------------------------------- Dados
SERVICES = [
    {
        "slug": "recuperacao-de-pecas",
        "name": "Recuperação de peças",
        "short": "Recuperação de peças para usinagem",
        "tag": "Indústria e manutenção",
        "img": "C4jSvkarUD0.webp",
        "alt": "Molde de injeção em recuperação por solda",
        "title": "Recuperação de peças para usinagem em Joinville/SC",
        "desc": "Recuperação de peças desgastadas ou trincadas por solda TIG, MIG e eletrodo em Joinville/SC: cilindros hidráulicos, eixos, moldes e ferro fundido. Orçamento por foto no WhatsApp.",
        "h1": "Recuperação de peças para usinagem",
        "lead": "Preenchemos desgaste, trincas e quebras com o material de adição correto, deixando sobremetal para a usinagem devolver a medida de projeto. É o caminho mais rápido e barato quando a peça nova demora ou custa caro.",
        "bullets": [
            "Cilindros hidráulicos: olhais, tampas e hastes",
            "Eixos em SAE 1045 e 4140",
            "Canais e cavidades de moldes e matrizes",
            "Olhais e alojamentos de rolamento",
            "Flanges e tubulação de máquina",
            "Trincas em ferro fundido cinzento e nodular",
        ],
        "how": [
            ("Avaliação", "Identificamos o material, o tipo de dano e a causa provável da falha."),
            ("Preparação", "Removemos a área comprometida e, quando necessário, pré-aquecemos a peça."),
            ("Deposição", "Soldamos com o processo e o material de adição certos, deixando sobremetal."),
            ("Entrega", "A peça segue pronta para a usinagem de acabamento que devolve a medida."),
        ],
        "gallery": ["C4jSvkarUD0.webp", "Cxz5OvfOaRE.webp", "CYr9VUSLAgD.webp"],
        "faq": [
            ("Quais peças vocês recuperam?", "Cilindros hidráulicos (olhais, tampas e hastes), eixos, flanges, alojamentos de rolamento, moldes de injeção, matrizes e peças de ferro fundido. Se a sua peça não está na lista, mande a foto: avaliamos cada caso."),
            ("Vale mais a pena recuperar ou comprar uma peça nova?", "Depende do material, do tamanho do desgaste e do prazo de uma peça nova. Quando recuperar não compensa, avisamos antes de começar."),
            ("É possível soldar ferro fundido trincado?", "Em muitos casos sim. O ferro fundido é frágil e pede aquecimento e resfriamento controlados, com eletrodo ou brasagem adequados. Envie fotos da trinca para confirmarmos."),
            ("A peça volta pronta para usinar?", "Sim. A solda deixa sobremetal, ou seja, material a mais, para que a usinagem de acabamento devolva a medida original."),
            ("Como peço o orçamento?", "Pelo WhatsApp, enviando fotos da peça de vários ângulos e uma descrição do que precisa ser feito (material, medidas e prazo). Também atendemos na oficina, sem agendamento."),
        ],
    },
    {
        "slug": "soldas-especiais",
        "name": "Soldas especiais",
        "short": "Soldas especiais em alumínio, inox e aço ferramenta",
        "tag": "Técnica e precisão",
        "img": "CYr9VUSLAgD.webp",
        "alt": "Solda TIG em aço carbono com cores de revenimento",
        "title": "Soldas especiais: TIG em alumínio, inox e aço ferramenta em Joinville/SC",
        "desc": "Solda TIG em alumínio, inox 304, magnésio, titânio e aços ferramenta (P20, D2, D6, H13) em Joinville/SC. Peças de precisão e fora de padrão. Orçamento por foto no WhatsApp.",
        "h1": "Soldas especiais",
        "lead": "Soldagem TIG em materiais sensíveis ao calor e em peças onde o acabamento conta. Alumínio com corrente alternada, inox sem contaminação, aço ferramenta com o cuidado que ele exige.",
        "bullets": [
            "Alumínio, magnésio e titânio",
            "Aço inox com acabamento polido",
            "Aços P20, D2, D6 e H13",
            "Latão e cobre",
            "Peças fora de padrão",
            "Solda TIG pulsada",
        ],
        "how": [
            ("Identificação", "Confirmamos o material, a espessura e o uso da peça."),
            ("Processo", "Definimos corrente, gás e material de adição para aquele metal."),
            ("Solda", "Soldagem TIG com controle fino de calor para evitar distorção."),
            ("Acabamento", "Cordão limpo, com o acabamento combinado no orçamento."),
        ],
        "gallery": ["CYr9VUSLAgD.webp", "Cxz5OvfOaRE.webp", "CcfiNlfrwlP.webp"],
        "faq": [
            ("Vocês soldam alumínio?", "Sim. Usamos TIG com corrente alternada, que quebra a camada de óxido do alumínio e dá um cordão limpo e resistente."),
            ("É possível soldar aço ferramenta (P20, D2, D6, H13)?", "Sim, com TIG, material de adição compatível e atenção ao pré-aquecimento e ao resfriamento para evitar trincas."),
            ("A solda no inox mantém a resistência à corrosão?", "Com controle do calor e boa proteção de gás, sim. O acabamento (polido ou bruto) é combinado no orçamento."),
            ("Soldam peças fora de padrão ou protótipos?", "Sim. Mande fotos e a descrição, e dizemos como é possível fazer."),
            ("O que preciso informar para orçar?", "Fotos da peça, o material (se souber), as medidas principais e o prazo desejado."),
        ],
    },
    {
        "slug": "estruturas-metalicas",
        "name": "Estruturas metálicas",
        "short": "Estruturas metálicas sob medida",
        "tag": "Fabricação",
        "img": "C-LZ9BwPJiG.webp",
        "alt": "Estruturas metálicas brancas fabricadas sob medida",
        "title": "Estruturas metálicas sob medida em Joinville/SC",
        "desc": "Fabricação de estruturas metálicas sob medida em aço carbono, metalon, inox e alumínio para indústrias, arquitetos e marcenarias em Joinville/SC. Do protótipo ao lote.",
        "h1": "Estruturas metálicas sob medida",
        "lead": "Fabricação de estruturas para empresas do ramo industrial, arquitetos, designers e marcenarias, em aço carbono, metalon, inox e alumínio. Do protótipo à produção em lote.",
        "bullets": [
            "Mesas em inox 304 com acabamento sanitário",
            "Bases e estruturas para móveis",
            "Proteções para condensadoras",
            "Grades de bueiro para 5 toneladas",
            "Coifas e tampas em inox",
            "Guarda-corpos",
        ],
        "how": [
            ("Briefing", "Você envia o projeto, o croqui ou a foto de referência com as medidas."),
            ("Orçamento", "Informamos o valor e o prazo antes de começar."),
            ("Fabricação", "Corte, montagem e solda com o processo certo para cada material."),
            ("Entrega", "Estrutura pronta, conforme combinado no orçamento."),
        ],
        "gallery": ["C84gK0HOsKE.webp", "DRxaIpFjmlM.webp", "C5TFwunrSkL.webp", "CcfiNlfrwlP.webp"],
        "faq": [
            ("Com quais materiais vocês fabricam?", "Aço carbono, metalon, aço inox (304) e alumínio, conforme o uso da estrutura."),
            ("Fazem produção em lote?", "Sim. Já produzimos lotes sob medida, como 100 proteções para condensadoras de ar-condicionado."),
            ("Trabalham com projeto de arquiteto ou de marcenaria?", "Sim. Atendemos arquitetos, designers e marcenarias, a partir do projeto ou da referência que você enviar."),
            ("E a pintura?", "Já entregamos estruturas pintadas. Combine no orçamento se você precisa de pintura ou de outro acabamento."),
            ("Como funciona o orçamento?", "Envie o projeto ou fotos e as medidas pelo WhatsApp. Informamos o valor e o prazo antes de começar."),
        ],
    },
    {
        "slug": "moveis-estilo-industrial",
        "name": "Móveis estilo industrial",
        "short": "Móveis em aço e metalon, estilo industrial",
        "tag": "Projetos residenciais e comerciais",
        "img": "DVMtWookW2N.webp",
        "alt": "Estante estilo industrial em aço com prateleiras de madeira",
        "title": "Móveis estilo industrial em aço e metalon em Joinville/SC",
        "desc": "Estruturas de móveis estilo industrial em aço inox e metalon sob medida, em Joinville/SC: estantes, cristaleiras, vitrines, mesas e bares. Em parceria com marcenarias.",
        "h1": "Móveis estilo industrial",
        "lead": "Estruturas sob medida em aço inox e metalon com acabamento de alto padrão, feitas em parceria com marcenarias ou a partir do projeto do arquiteto.",
        "bullets": ["Estantes e cristaleiras", "Vitrines e expositores de loja", "Mesas e bancadas", "Bares e adegas"],
        "how": [
            ("Projeto", "Você envia o projeto, o croqui ou uma foto de referência."),
            ("Orçamento", "Definimos material, acabamento, valor e prazo."),
            ("Fabricação", "Estrutura soldada e acabada sob medida."),
            ("Entrega", "Pronta para receber madeira, vidro ou o acabamento do projeto."),
        ],
        "gallery": ["DVMtWookW2N.webp", "DajNU8eKJRk.webp", "C-LZ9BwPJiG.webp"],
        "faq": [
            ("Vocês fabricam o móvel completo?", "Fazemos a estrutura metálica. Combine no orçamento como será o tampo ou a prateleira, em madeira ou vidro."),
            ("Posso levar o projeto do meu arquiteto?", "Sim. Trabalhamos a partir do projeto, do croqui ou de fotos de referência com as medidas."),
            ("Quais materiais usam?", "Aço carbono (metalon e tubos) e aço inox, de acordo com o ambiente e o acabamento desejado."),
            ("Atendem marcenarias?", "Sim, e é um dos nossos públicos. Fabricamos as bases metálicas sob medida para o projeto da marcenaria."),
        ],
    },
    {
        "slug": "reparos-e-serralheria",
        "name": "Reparos e serralheria",
        "short": "Reparos automotivos, náuticos e serralheria",
        "tag": "Automotivo, náutico e serralheria",
        "img": "C6EWpD9rqHY.webp",
        "alt": "Embarcação de alumínio em reparo",
        "title": "Reparos automotivos, náuticos e serralheria em Joinville/SC",
        "desc": "Reparo em rodas de liga leve, cárter e cabeçote em alumínio, embarcações em alumínio e inox, quadros de bicicleta e serralheria em Joinville/SC. Orçamento por foto.",
        "h1": "Reparos e serralheria",
        "lead": "Manutenção de peças automotivas, reparos em embarcações e serviços de serralheria com o mesmo cuidado aplicado na indústria.",
        "bullets": [
            "Rodas de liga leve e de ferro",
            "Cárter e cabeçote em alumínio",
            "Embarcações em alumínio e inox",
            "Quadros de bicicleta",
            "Serralheria de interiores",
            "Serviços no local (consulte disponibilidade)",
        ],
        "how": [
            ("Fotos", "Você envia fotos do dano e da peça inteira."),
            ("Avaliação", "Dizemos se o reparo é possível e como seria feito."),
            ("Reparo", "Solda com o processo certo para o material da peça."),
            ("Entrega", "Peça devolvida no prazo combinado."),
        ],
        "gallery": ["Czgo5ZlrjbI.webp", "C6EWpD9rqHY.webp"],
        "faq": [
            ("Vocês recuperam rodas de liga leve?", "Sim, rodas de liga leve e de ferro com trincas e amassados, com solda TIG em corrente alternada no alumínio."),
            ("Soldam peças de alumínio do motor, como cárter e cabeçote?", "Sim, dependendo do estado da peça. Envie fotos para avaliarmos se o reparo é viável."),
            ("Fazem reparo em embarcações?", "Sim, em alumínio, inox e aço carbono, no casco e em acessórios."),
            ("Atendem no local?", "Em alguns serviços sim. Consulte a disponibilidade pelo WhatsApp."),
        ],
    },
]

PAGES_META = {
    "": ("Soldagem especial e recuperação de peças em Joinville/SC", "Soldagem especial, recuperação de peças e estruturas metálicas sob medida em Joinville/SC. TIG, MIG/MAG, eletrodo e oxiacetileno em alumínio, inox, aço carbono e ferro fundido. Nota 5,0 no Google."),
    "servicos": ("Serviços de solda e serralheria em Joinville/SC", "Recuperação de peças, soldas especiais, estruturas metálicas sob medida, móveis estilo industrial e reparos em Joinville/SC. Atendimento sem agendamento."),
    "guia-de-soldas": ("Guia de soldas: TIG, MIG/MAG, eletrodo e oxiacetileno", "Entenda qual processo de solda usar em cada metal: alumínio, inox, aço carbono, ferro fundido e aço ferramenta. Defeitos comuns, glossário e como pedir orçamento."),
    "portfolio": ("Portfólio de soldas e estruturas metálicas", "Trabalhos realizados pela Reinert em Joinville/SC: recuperação de peças, estruturas em inox, proteções em alumínio, móveis estilo industrial e reparos."),
    "sobre": ("Sobre a Reinert Soluções em Solda", "Conheça a Reinert: oficina de soldagem em Joinville/SC fundada por Rafael Reinert, com mais de 15 anos de profissão, nova sede na Vila Nova."),
    "contato": ("Contato e orçamento", "Fale com a Reinert pelo WhatsApp (47) 98802-4265 ou venha à oficina na Rua Leopoldo Beninca, 108, Vila Nova, Joinville/SC. Sem agendamento."),
}

NAV = [("/", "Início"), ("/servicos", "Serviços"), ("/guia-de-soldas", "Guia"), ("/portfolio", "Portfólio"), ("/sobre", "Sobre"), ("/contato", "Contato")]

SVG_DEFS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="mask" viewBox="0 0 40 40">
      <path d="M8 8.5C8 5.5 10.5 3 13.5 3h13C29.5 3 32 5.5 32 8.5V27c0 5.5-5.4 10-12 10S8 32.5 8 27V8.5Z" fill="none" stroke="#f4c20d" stroke-width="2.6"/>
      <rect x="12.5" y="10.5" width="15" height="7.5" rx="1.6" fill="#f4c20d"/>
      <rect x="14.5" y="12.4" width="11" height="3.7" rx=".8" fill="#0d0f11"/>
      <path d="M14 24.5h12M15.5 28.5h9" stroke="#f4c20d" stroke-width="2.2" stroke-linecap="round"/>
    </symbol>
    <symbol id="wa" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.03c-.25.69-1.43 1.33-1.98 1.38-.5.05-1.13.07-1.83-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.3.58-.37.78-.37h.56c.18 0 .42-.07.66.5.25.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5l-.44.52c-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.05 1.13 1.01 2.09 1.32 2.39 1.47.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.66-.15.27.1 1.73.82 2.02.96.3.15.5.22.57.35.07.12.07.71-.18 1.4Z"/></symbol>
    <symbol id="ph" viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.6 21 3 13.4 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.2 2.5.57 3.6a1 1 0 0 1-.25 1l-2.2 2.2Z"/></symbol>
  </defs>
</svg>"""


# ---------------------------------------------------------------- Helpers
def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def url(path):
    return (SITE_URL + "/" + path).rstrip("/") if SITE_URL else None


def jsonld_business():
    data = {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "ProfessionalService"],
        "name": NAME,
        "legalName": "Reinert – Soluções em Solda LTDA",
        "description": PAGES_META[""][1],
        "telephone": PHONE_E164,
        "email": EMAIL,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": ADDRESS["street"],
            "addressLocality": ADDRESS["city"],
            "addressRegion": ADDRESS["state"],
            "postalCode": ADDRESS["zip"],
            "addressCountry": "BR",
        },
        "openingHoursSpecification": [
            {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "08:00", "closes": "12:00"},
            {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "13:00", "closes": "17:00"},
        ],
        "sameAs": [INSTA],
        "areaServed": {"@type": "City", "name": "Joinville"},
    }
    if SITE_URL:
        data["url"] = SITE_URL + "/"
        data["image"] = SITE_URL + "/img/Cxz5OvfOaRE.webp"
    return data


def jsonld_faq(faq):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq
        ],
    }


def jsonld_breadcrumb(items):
    if not SITE_URL:
        return None
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE_URL + p} if SITE_URL else {})}
            for i, (n, p) in enumerate(items)
        ],
    }


def head(title, desc, path, ld, extra=""):
    full_title = title if path == "" else f"{title} · {NAME}"
    if path == "":
        full_title = f"{NAME} · {title}"
    canon = url(path)
    og_img = (SITE_URL + "/img/Cxz5OvfOaRE.webp") if SITE_URL else ""
    canon_tag = ""
    if canon and path != "404":
        canon_tag = f'<link rel="canonical" href="{canon}">' if path else f'<link rel="canonical" href="{SITE_URL}/">'
    scripts = "\n".join(
        '<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False).replace("</", "<\\/") + "</script>"
        for d in ld if d
    )
    FONTS = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800;900&family=Barlow:wght@400;500;600;700&display=swap"
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="theme-color" content="#0d0f11">
{canon_tag}
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{esc(full_title)}">
<meta property="og:description" content="{esc(desc)}">
{f'<meta property="og:image" content="{og_img}">' if og_img else ''}
{f'<meta property="og:url" content="{canon}">' if canon and path != "404" else ''}
<meta name="twitter:card" content="{'summary_large_image' if og_img else 'summary'}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="{FONTS}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="{FONTS}"></noscript>
<link rel="stylesheet" href="/assets/style.css">
{extra}
{scripts}
</head>
<body>
{SVG_DEFS}
"""


def header(active):
    links = []
    for href, label in NAV:
        cur = ' aria-current="page"' if active == href else ""
        links.append(f'<a href="{href}"{cur}>{label}</a>')
    return f"""<a class="skip" href="#main">Pular para o conteúdo</a>
<header class="top">
  <div class="wrap">
    <a class="brand" href="/" aria-label="{NAME}, página inicial">
      <svg><use href="#mask"/></svg>
      <span><b>REINERT</b><small>Soluções em Solda</small></span>
    </a>
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="nav">MENU</button>
    <nav class="nav" id="nav" aria-label="Principal">
      {chr(10).join('      ' + l for l in links).strip()}
      <a class="btn btn-accent nav-cta" href="{wa('menu')}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>Pedir orçamento</a>
    </nav>
    <a class="btn btn-accent hd-cta" href="{wa('cabeçalho')}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>Orçamento</a>
  </div>
</header>
<main id="main">
"""


def footer(ctx):
    svc_links = "".join(f'<li><a href="/{s["slug"]}">{s["name"]}</a></li>' for s in SERVICES)
    return f"""</main>
<footer class="foot">
  <div class="wrap">
    <div style="display:grid;gap:12px">
      <a class="brand" href="/"><svg><use href="#mask"/></svg><span><b>REINERT</b><small>Soluções em Solda</small></span></a>
      <p>Soldagem especial, recuperação de peças e estruturas sob medida em Joinville e região.</p>
      <p><a href="{INSTA}" target="_blank" rel="noopener">Instagram @reinert.soldas</a></p>
    </div>
    <div><h4>Serviços</h4><ul>{svc_links}</ul></div>
    <div><h4>Site</h4><ul><li><a href="/guia-de-soldas">Guia de soldas</a></li><li><a href="/portfolio">Portfólio</a></li><li><a href="/sobre">Sobre</a></li><li><a href="/contato">Contato</a></li></ul></div>
    <div><h4>Oficina</h4><ul><li>{ADDRESS["street"]}</li><li>{ADDRESS["district"]}, {ADDRESS["city"]}/{ADDRESS["state"]}</li><li><a href="tel:{PHONE_E164}">{PHONE_FMT}</a></li><li><a href="mailto:{EMAIL}">{EMAIL}</a></li><li>Segunda a sexta, 8h às 12h e 13h às 17h</li></ul></div>
    <div class="legal"><span>Reinert – Soluções em Solda LTDA, CNPJ 41.449.969/0001-21</span><span>© 2026 Reinert. Todos os direitos reservados.</span></div>
  </div>
</footer>
<div class="dock" id="dock">
  <a class="dock-call" href="tel:{PHONE_E164}"><svg><use href="#ph"/></svg><span>Ligar</span></a>
  <a class="dock-wa" href="{wa(ctx)}" target="_blank" rel="noopener" aria-label="Pedir orçamento no WhatsApp"><svg><use href="#wa"/></svg><span>Pedir orçamento</span></a>
</div>
<script src="/assets/site.js" defer></script>
</body>
</html>
"""


def band(title, text, ctx, btn="Pedir orçamento no WhatsApp"):
    return f"""  <div class="band" data-cta>
    <div class="wrap">
      <div style="display:grid;gap:14px"><h2>{title}</h2><p>{text}</p></div>
      <div style="display:grid;gap:16px;justify-items:start">
        <a class="btn btn-dark" href="{wa(ctx)}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>{btn}</a>
        <div class="meta"><span>{ADDRESS["street"]}, {ADDRESS["district"]}, {ADDRESS["city"]}/{ADDRESS["state"]}</span><span>Segunda a sexta, 8h às 12h e 13h às 17h. Sem agendamento.</span></div>
      </div>
    </div>
  </div>
"""


def faq_html(faq):
    items = "".join(
        f'<details class="qa"><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in faq
    )
    return f"""  <section style="padding-top:0">
    <div class="wrap">
      <div class="sec-head"><p class="eyebrow">Perguntas frequentes</p><h2>Dúvidas comuns</h2></div>
      <div class="faq">{items}</div>
    </div>
  </section>
"""


def fix_links(h, ctx):
    return h.replace("{WA}", wa(ctx))


def write(path, html):
    out = ROOT / (path or "index")
    if path:
        out = ROOT / f"{path}.html"
    else:
        out = ROOT / "index.html"
    out.write_text(html, encoding="utf-8")


def read(name):
    return (CONTENT / f"{name}.html").read_text(encoding="utf-8")


def pagehead(crumbs, eyebrow, h1, lead="", cta=None):
    bc = " ".join(
        f'<a href="{p}">{n}</a>' if p else f'<span aria-current="page">{n}</span>' for n, p in crumbs
    )
    lead_html = f'<p class="lead">{lead}</p>' if lead else ""
    if cta:
        lead_html += f"""
    <div class="cta-row" data-cta>
      <a class="btn btn-accent" href="{wa(cta)}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>Pedir orçamento no WhatsApp</a>
      <a class="btn btn-ghost only-m" href="tel:{PHONE_E164}"><svg><use href="#ph"/></svg>Ligar agora</a>
    </div>
    <p class="trust"><span class="stars"><span role="img" aria-label="5 estrelas">★★★★★</span></span> 5,0 no Google, com 19 avaliações. Envie fotos da peça e a descrição do serviço.</p>"""
    return f"""  <div class="pagehead"><div class="wrap">
    <nav class="crumbs" aria-label="Você está em">{bc}</nav>
    <p class="eyebrow">{eyebrow}</p>
    <h1>{h1}</h1>
    {lead_html}
  </div></div>
"""


# ---------------------------------------------------------------- Páginas
def build_home():
    ctx = "início"
    meta = PAGES_META[""]
    body = fix_links(read("inicio"), ctx)
    # links dos três pilares para as páginas de serviço
    targets = [("/recuperacao-de-pecas", "Ver recuperação de peças"), ("/soldas-especiais", "Ver soldas especiais"), ("/estruturas-metalicas", "Ver estruturas sob medida")]
    parts = body.split("</ul>\n          </div>\n        </article>")
    assert len(parts) == 4, len(parts)
    body = ""
    for i, p in enumerate(parts[:-1]):
        body += p + f'</ul>\n            <a class="more" href="{targets[i][0]}">{targets[i][1]}</a>\n          </div>\n        </article>'
    body += parts[-1]
    body = body.replace('<a href="/servicos">móveis estilo industrial, serralheria e reparos automotivos e náuticos</a>',
                        '<a href="/moveis-estilo-industrial">móveis estilo industrial</a>, <a href="/reparos-e-serralheria">serralheria e reparos automotivos e náuticos</a>')
    html = head(meta[0], meta[1], "", [jsonld_business()], extra='<link rel="preload" as="image" href="/img/Cxz5OvfOaRE.webp" fetchpriority="high">') + header("/") + body + "\n" + footer(ctx)
    write("", html)


def build_servicos():
    ctx = "serviços"
    meta = PAGES_META["servicos"]
    cards = ""
    for s in SERVICES:
        cards += f"""      <article class="svc{' flip' if SERVICES.index(s) % 2 else ''}">
        <figure><a href="/{s['slug']}"><img src="/img/{s['img']}" alt="{esc(s['alt'])}" loading="lazy" width="800" height="600"></a></figure>
        <div class="txt">
          <p class="tag">{s['tag']}</p>
          <h2><a href="/{s['slug']}" style="text-decoration:none">{s['short']}</a></h2>
          <p class="lead">{s['lead']}</p>
          <ul>{''.join('<li>' + b + '</li>' for b in s['bullets'][:4])}</ul>
          <div class="cta-row"><a class="btn btn-ghost" href="/{s['slug']}">Ver detalhes</a><a class="btn btn-accent" href="{wa(s['name'])}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>Orçamento</a></div>
        </div>
      </article>
"""
    seg = '<div class="segments"><span>Metalurgia e usinagem</span><span>Ferramentarias e injeção plástica</span><span>Hidráulica e agronegócio</span><span>Transportadoras</span><span>Indústria moveleira e marcenarias</span><span>Arquitetura e design</span><span>Náutico</span><span>Automotivo</span></div>'
    html = (
        head(meta[0], meta[1], "servicos", [jsonld_breadcrumb([("Início", "/"), ("Serviços", "/servicos")])])
        + header("/servicos")
        + pagehead([("Início", "/"), ("Serviços", None)], "Serviços", "Soldagem para quem não pode parar",
                   "Da manutenção de uma peça única à produção de estruturas em lote. Atendimento na oficina, sem agendamento, e serviços no local quando a peça não pode sair da máquina.")
        + f'  <section style="padding-top:40px">\n    <div class="wrap">\n{cards}    </div>\n  </section>\n'
        + f'  <section style="padding-top:0">\n    <div class="wrap">\n      <div class="sec-head"><p class="eyebrow">Para quem trabalhamos</p><h2>Segmentos atendidos</h2></div>\n      {seg}\n    </div>\n  </section>\n'
        + band("Não achou o seu caso?", "Se é metal e precisa de solda, mande a foto. A gente diz se dá para fazer e como.", ctx)
        + footer(ctx)
    )
    write("servicos", html)


def build_service(s):
    ctx = s["name"]
    crumbs = [("Início", "/"), ("Serviços", "/servicos"), (s["name"], None)]
    steps = "".join(f'<div class="step"><h3>{t}</h3><p>{d}</p></div>' for t, d in s["how"])
    gal = "".join(
        f'<img src="/img/{g}" alt="{esc(s["name"])}: trabalho realizado" loading="lazy" width="800" height="800">' for g in s["gallery"]
    )
    others = "".join(
        f'<a class="ocard" href="/{o["slug"]}"><img src="/img/{o["img"]}" alt="" loading="lazy" width="400" height="300"><span>{o["name"]}</span></a>'
        for o in SERVICES if o["slug"] != s["slug"]
    )
    html = (
        head(s["title"], s["desc"], s["slug"], [jsonld_breadcrumb([("Início", "/"), ("Serviços", "/servicos"), (s["name"], "/" + s["slug"])]) ])
        + header(None)
        + pagehead(crumbs, s["tag"], s["h1"], s["lead"], cta=ctx)
        + f"""  <section style="padding-top:36px">
    <div class="wrap svc-top">
      <figure><img src="/img/{s['img']}" alt="{esc(s['alt'])}" width="800" height="600"></figure>
      <div class="txt">
        <h2>O que fazemos</h2>
        <ul class="ticks">{''.join('<li>' + b + '</li>' for b in s['bullets'])}</ul>
      </div>
    </div>
  </section>
  <section style="padding-top:0">
    <div class="wrap">
      <div class="sec-head"><p class="eyebrow">Como fazemos</p><h2>Do pedido à entrega</h2></div>
      <div class="steps">{steps}</div>
    </div>
  </section>
  <section style="padding-top:0">
    <div class="wrap">
      <div class="sec-head"><p class="eyebrow">Trabalhos</p><h2>Alguns exemplos</h2></div>
      <div class="gal">{gal}</div>
      <p class="insta">Veja mais no <a href="/portfolio">portfólio</a> e no Instagram <a class="btn btn-ghost" href="{INSTA}" target="_blank" rel="noopener">@reinert.soldas</a></p>
    </div>
  </section>
"""
        + faq_html(s["faq"])
        + f"""  <section style="padding-top:0">
    <div class="wrap">
      <div class="sec-head"><p class="eyebrow">Outros serviços</p><h2>Veja também</h2></div>
      <div class="others">{others}</div>
      <p class="also">Quer entender melhor os processos? Leia o <a href="/guia-de-soldas">guia de soldas</a>.</p>
    </div>
  </section>
"""
        + band("Tem uma peça para avaliar?", "Mande as fotos e a descrição pelo WhatsApp. Ou traga direto na oficina, sem precisar agendar.", ctx)
        + footer(ctx)
    )
    write(s["slug"], html)


def build_guia():
    ctx = "guia de soldas"
    meta = PAGES_META["guia-de-soldas"]
    body = fix_links(read("guia"), ctx)
    # troca o cabeçalho antigo (pagehead) por migalhas + h1
    body = re.sub(r'<div class="pagehead">.*?</div></div>\n',
                  pagehead([("Início", "/"), ("Guia de soldas", None)], "Guia de soldas",
                           "Entenda a solda antes de pedir o orçamento",
                           "Cada processo e cada metal pedem uma técnica diferente. Aqui está, sem complicação, o que usamos, quando usamos e o que você deve observar em uma solda bem feita."),
                  body, count=1, flags=re.S)
    faq = [
        ("Qual a diferença entre solda TIG e MIG?", "A TIG usa um eletrodo de tungstênio e o soldador adiciona o metal de adição à parte: é mais lenta, mas dá mais controle e melhor acabamento. A MIG usa arame contínuo alimentado pela máquina: é mais rápida e produtiva, ideal para estruturas."),
        ("Qual solda é melhor para alumínio?", "Normalmente a TIG com corrente alternada, que remove a camada de óxido do alumínio e dá um cordão limpo."),
        ("Dá para soldar ferro fundido?", "Em muitos casos sim, com eletrodo ou brasagem e aquecimento e resfriamento controlados, porque o material é frágil e trinca com facilidade."),
        ("Preciso saber o material da peça para pedir orçamento?", "Não. Se você não souber, mande as fotos e a descrição, e identificamos o material na avaliação."),
    ]
    html = (
        head(meta[0], meta[1], "guia-de-soldas", [jsonld_breadcrumb([("Início", "/"), ("Guia de soldas", "/guia-de-soldas")]) ])
        + header("/guia-de-soldas")
        + body.replace('  <div class="band">', faq_html(faq) + '  <div class="band">', 1)
        + "\n"
        + footer(ctx)
    )
    write("guia-de-soldas", html)


def build_simple(slug, active, h_eyebrow, h1, lead, ctx, title_key=None, extra_ld=None):
    quick = ""
    if slug == "contato":
        quick = f"""  <div class="wrap quick" data-cta>
    <a class="btn btn-accent" href="{wa('contato')}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>Chamar no WhatsApp</a>
    <a class="btn btn-ghost" href="tel:{PHONE_E164}"><svg><use href="#ph"/></svg>Ligar {PHONE_FMT}</a>
    <a class="btn btn-ghost" href="{MAPS}" target="_blank" rel="noopener">Como chegar</a>
  </div>
"""
    meta = PAGES_META[slug]
    body = fix_links(read(slug), ctx)
    body = re.sub(r'<div class="pagehead">.*?</div></div>\n',
                  pagehead([("Início", "/"), (h_eyebrow, None)], h_eyebrow, h1, lead), body, count=1, flags=re.S)
    html = (
        head(meta[0], meta[1], slug, ([jsonld_business()] if slug == "contato" else []) + [jsonld_breadcrumb([("Início", "/"), (h_eyebrow, "/" + slug)])] + (extra_ld or []))
        + header(active) + body.replace("</div></div>\n", "</div></div>\n" + quick, 1) + "\n" + footer(ctx)
    )
    write(slug, html)


def build_404():
    html = (
        head("Página não encontrada", "Página não encontrada.", "404", [])
        .replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"')
        + header("")
        + f"""  <section><div class="wrap" style="display:grid;gap:20px;justify-items:start">
    <p class="eyebrow">Erro 404</p><h1>Essa página não existe</h1>
    <p class="lead">O endereço pode ter mudado. Volte ao início ou fale direto com a oficina.</p>
    <div class="cta-row"><a class="btn btn-ghost" href="/">Ir para o início</a><a class="btn btn-accent" href="{wa('404')}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>WhatsApp</a></div>
  </div></section>
"""
        + footer("404")
    )
    (ROOT / "404.html").write_text(html, encoding="utf-8")


def build_misc():
    (ROOT / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#0d0f11"/>'
        '<path d="M8 8.5C8 5.5 10.5 3 13.5 3h13C29.5 3 32 5.5 32 8.5V27c0 5.5-5.4 10-12 10S8 32.5 8 27V8.5Z" fill="none" stroke="#f4c20d" stroke-width="2.6"/>'
        '<rect x="12.5" y="10.5" width="15" height="7.5" rx="1.6" fill="#f4c20d"/><rect x="14.5" y="12.4" width="11" height="3.7" rx=".8" fill="#0d0f11"/>'
        '<path d="M14 24.5h12M15.5 28.5h9" stroke="#f4c20d" stroke-width="2.2" stroke-linecap="round"/></svg>',
        encoding="utf-8",
    )
    paths = ["", "servicos", "guia-de-soldas", "portfolio", "sobre", "contato"] + [s["slug"] for s in SERVICES]
    if SITE_URL:
        urls = "".join(f"  <url><loc>{SITE_URL}/{p}</loc></url>\n" for p in paths)
        (ROOT / "sitemap.xml").write_text(
            f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n',
            encoding="utf-8",
        )
        (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")
    else:
        (ROOT / "robots.txt").write_text("User-agent: *\nAllow: /\n", encoding="utf-8")
        sm = ROOT / "sitemap.xml"
        if sm.exists():
            sm.unlink()


def main():
    build_home()
    build_servicos()
    for s in SERVICES:
        build_service(s)
    build_guia()
    build_simple("portfolio", "/portfolio", "Portfólio", "Trabalhos realizados",
                 "Uma parte do que passou pela oficina. Cada trabalho traz o material e o processo usados.", "portfólio")
    build_simple("sobre", "/sobre", "Sobre", "Uma oficina feita por quem vive a solda", "", "sobre")
    build_simple("contato", "/contato", "Contato", "Fale com a oficina",
                 "O jeito mais rápido é o WhatsApp com fotos da peça e a descrição do serviço. Se preferir, venha direto: atendemos sem agendamento.", "contato")
    build_404()
    build_misc()
    print("ok")


if __name__ == "__main__":
    main()
