# Reinert Soluções em Solda

Site institucional estático (HTML + CSS + JS, sem framework). Joinville/SC.

## Estrutura
- `*.html`: páginas geradas (início, serviços, 5 páginas de serviço, guia de soldas, portfólio, sobre, contato, 404)
- `assets/`: `style.css` e `site.js`
- `img/`: imagens WebP
- `tools/build.py`: gera todas as páginas. Rode `python3 tools/build.py` depois de editar textos ou serviços
- `tools/content/`: blocos de conteúdo usados pelo gerador
- `vercel.json`: URLs limpas (`/servicos`) e cache

## Domínio
Defina `SITE_URL` em `tools/build.py` (ex.: `https://reinert.seudominio.com.br`) e rode o build:
isso ativa `canonical`, `og:url`, `sitemap.xml` e o sitemap no `robots.txt`.

## Deploy
Vercel, preset **Other**, sem build command, diretório raiz.

## WhatsApp
Todos os botões abrem `wa.me/5547988024265` com mensagem que pede fotos da peça e a descrição do serviço.

## Medição de cliques (GA4 e Google Ads)
Todo link `wa.me`, `api.whatsapp.com` e `tel:` dispara, por delegação de eventos (`assets/track.js`):
- GA4: `whatsapp_click` ou `phone_click`, com `location` (menu, cabecalho, hero, rodape, servicos, contato, formulario, faixa_final, botao_flutuante, barra_fixa), `page_path` e, no WhatsApp, `origin_page` (o texto "(página: ...)" da mensagem).
- Google Ads: evento `conversion` com `send_to` = `ADS_ID/ROTULO`.

Onde colocar os IDs (qualquer um dos dois jeitos, depois rode `python3 tools/build.py` e faça commit):
1. Em `tools/config.py`: `GA_ID`, `ADS_ID`, `ADS_LABEL`, `ADS_PHONE_LABEL`.
2. Por variável de ambiente na hora do build: `GA_ID`, `ADS_ID`, `ADS_LABEL`, `ADS_PHONE_LABEL`.

O build grava `assets/config.js`. Com os IDs vazios nenhum script de medição é carregado e o site funciona normalmente.
