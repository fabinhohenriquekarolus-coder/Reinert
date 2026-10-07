"""Configuração central do site da Reinert.

Os IDs de medição abaixo podem ser definidos aqui ou por variáveis de ambiente
na hora do build (python3 tools/build.py). A variável de ambiente tem prioridade.
Com os IDs vazios o site funciona normalmente e nenhum script de medição é carregado.
"""
import os


def _env(name, default=""):
    return (os.environ.get(name) or default).strip()


# Google Analytics 4, no formato G-XXXXXXXXXX
GA_ID = _env("GA_ID", "")
# Google Ads, no formato AW-XXXXXXXXX
ADS_ID = _env("ADS_ID", "")
# Rótulo da conversão de clique no WhatsApp (a parte depois da barra em AW-XXXXXXXXX/ROTULO)
ADS_LABEL = _env("ADS_LABEL", "")
# Rótulo da conversão de clique em telefone. Se vazio, usa o mesmo rótulo do WhatsApp
ADS_PHONE_LABEL = _env("ADS_PHONE_LABEL", "")
