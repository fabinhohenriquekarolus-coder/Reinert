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
