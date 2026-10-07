# Reinert Soluções em Solda

Site institucional estático (HTML, CSS e JS, sem framework), hospedado na Vercel.
Endereço: https://www.reinertsoldas.com.br

## Como editar
1. Textos de serviços, títulos e descrições: `tools/build.py` (lista `SERVICES` e `PAGES_META`).
2. Blocos de conteúdo das páginas (início, guia, portfólio, sobre, contato): `tools/content/*.html`.
3. Domínio, horário de funcionamento e IDs de medição: `tools/config.py`.
4. Estilo: `assets/style.css` (a versão usada pelas páginas é gerada).
5. Depois de qualquer mudança, rode `python3 tools/build.py` e faça commit dos arquivos gerados.
   Não edite os `.html` da raiz à mão: o próximo build os sobrescreve.

## Estrutura
- `*.html`: páginas geradas (início, serviços, 5 páginas de serviço, guia de soldas, portfólio, sobre, contato e 404)
- `assets/`: `style.css` (fonte), `style.min.css` e `config.js` (gerados), `site.js`, `track.js` e `fonts/` (Big Shoulders Display e Barlow, licença SIL OFL)
- `img/`: fotos em WebP, logo vetorial (`logo-fundo-escuro.svg`, `logo-fundo-claro.svg`), `logo-512.png` e `og.jpg`
- `brand/`: PDF original da logo, do designer
- `tools/`: gerador (`build.py`), configuração (`config.py`), blocos de conteúdo (`content/`) e modelo da imagem de compartilhamento (`og/og.html`)
- `vercel.json`: URLs limpas, redirecionamento sem www para www, cabeçalhos de segurança e cache

## Marca
- Amarelo `#E8E308` (da logo), preto `#100F0D`, fundo claro predominante.
- Títulos: Big Shoulders Display (800). Texto: Barlow.
- A logo amarela só tem bom contraste sobre fundo escuro; por isso o cabeçalho e o rodapé são pretos.

## Domínio e deploy
- `SITE_URL` (padrão `https://www.reinertsoldas.com.br`) alimenta canonical, `og:url`, sitemap, robots e dados estruturados.
- Vercel: preset **Other**, sem build command, diretório raiz. O build do site roda localmente (passo 5 acima).
- Para o redirecionamento sem www para www funcionar, os dois domínios precisam estar no projeto da Vercel.

## WhatsApp e telefone
Todos os botões abrem `wa.me/5547988024265` com mensagem que pede fotos da peça e a descrição do serviço, e já informa a página de origem. Todos os links `tel:` usam `+5547988024265`.

## Horário de funcionamento
Única fonte: `tools/config.py` (`SEMANA_FECHA`, `SEXTA_FECHA`, `HORARIO`). Alimenta hero, faixa de chamada, rodapé, contato e dados estruturados. Dias com o mesmo horário são agrupados sozinhos.
Sexta confirmada às 17h. Se algum dia mudar, altere só `SEXTA_FECHA`.

## Medição de cliques (GA4 e Google Ads)
Todo link `wa.me`, `api.whatsapp.com` e `tel:` dispara, por delegação de eventos (`assets/track.js`):
- GA4: `whatsapp_click` ou `phone_click`, com `location` (menu, cabecalho, hero, rodape, servicos, contato, formulario, faixa_final, topo_pagina, botao_flutuante, barra_fixa), `page_path` e, no WhatsApp, `origin_page` (o texto "(página: ...)" da mensagem).
- Google Ads: evento `conversion` com `send_to` = `ADS_ID/ROTULO`.

IDs (um dos dois jeitos, depois rode o build e faça commit):
1. Em `tools/config.py`: `GA_ID`, `ADS_ID`, `ADS_LABEL`, `ADS_PHONE_LABEL`.
2. Por variável de ambiente na hora do build, com os mesmos nomes.

Com os IDs vazios nenhum script de medição é carregado e o site funciona normalmente.
Não há aviso de consentimento de cookies; avalie isso (LGPD) ao ativar a medição.

## Imagens
- Para trocar uma foto: substitua o arquivo em `img/` e rode o build. O build coloca largura e altura reais e um `?v=` no endereço, então o cache de 1 ano não prende a versão antiga.
- Imagem de compartilhamento (`img/og.jpg`, 1200x630): edite `tools/og/og.html` e gere a captura de 1200x630 em JPG.

## Desempenho
Lighthouse mobile (simulado, servidor local): desempenho 96 a 98, acessibilidade 100, boas práticas 100, SEO 100. Fontes, CSS e imagens são servidos pelo próprio site.
