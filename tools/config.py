"""Configuração central do site da Reinert.

Os IDs de medição abaixo podem ser definidos aqui ou por variáveis de ambiente
na hora do build (python3 tools/build.py). A variável de ambiente tem prioridade.
Com os IDs vazios o site funciona normalmente e nenhum script de medição é carregado.
"""
import os


def _env(name, default=""):
    return (os.environ.get(name) or default).strip()


# Endereço público do site (usado em canonical, og:url, sitemap e dados estruturados)
SITE_URL = _env("SITE_URL", "https://www.reinertsoldas.com.br").rstrip("/")

# Google Analytics 4, no formato G-XXXXXXXXXX
GA_ID = _env("GA_ID", "")
# Google Ads, no formato AW-XXXXXXXXX
ADS_ID = _env("ADS_ID", "")
# Rótulo da conversão de clique no WhatsApp (a parte depois da barra em AW-XXXXXXXXX/ROTULO)
ADS_LABEL = _env("ADS_LABEL", "")
# Rótulo da conversão de clique em telefone. Se vazio, usa o mesmo rótulo do WhatsApp
ADS_PHONE_LABEL = _env("ADS_PHONE_LABEL", "")


# ---------------------------------------------------------------------------
# Horário de funcionamento: ÚNICA fonte para hero, rodapé, contato e dados estruturados.
# Para mudar, edite só aqui e rode `python3 tools/build.py`.
# CONFIRMAR: a sexta fecha às 17h ou às 16h? Hoje está 17h. Se for 16h, troque SEXTA_FECHA.
# ---------------------------------------------------------------------------
MANHA = ("08:00", "12:00")
TARDE_ABRE = "13:00"
SEMANA_FECHA = "17:00"
SEXTA_FECHA = "17:00"  # CONFIRMAR (17:00 ou 16:00)

# dia -> faixas de atendimento (lista vazia = fechado)
HORARIO = [
    ("Monday", "Segunda", [MANHA, (TARDE_ABRE, SEMANA_FECHA)]),
    ("Tuesday", "Terça", [MANHA, (TARDE_ABRE, SEMANA_FECHA)]),
    ("Wednesday", "Quarta", [MANHA, (TARDE_ABRE, SEMANA_FECHA)]),
    ("Thursday", "Quinta", [MANHA, (TARDE_ABRE, SEMANA_FECHA)]),
    ("Friday", "Sexta", [MANHA, (TARDE_ABRE, SEXTA_FECHA)]),
    ("Saturday", "Sábado", []),
    ("Sunday", "Domingo", []),
]


def _hora(t):
    h, m = t.split(":")
    return f"{int(h)}h" + (m if m != "00" else "")


def _faixas(faixas):
    return " e ".join(f"{_hora(a)} às {_hora(b)}" for a, b in faixas)


def _grupos():
    """Agrupa dias consecutivos com o mesmo horário."""
    grupos = []
    for en, pt, faixas in HORARIO:
        if grupos and grupos[-1]["faixas"] == faixas:
            grupos[-1]["dias"].append((en, pt))
        else:
            grupos.append({"faixas": faixas, "dias": [(en, pt)]})
    return grupos


def _rotulo(dias):
    nomes = [pt for _, pt in dias]
    if len(nomes) == 1:
        return nomes[0]
    if len(nomes) == 2:
        return f"{nomes[0]} e {nomes[1].lower()}"
    return f"{nomes[0]} a {nomes[-1].lower()}"


def hours_lines():
    """Ex.: ['Segunda a sexta, 8h às 12h e 13h às 17h', 'Sábado e domingo: fechado']"""
    linhas = []
    for g in _grupos():
        rot = _rotulo(g["dias"])
        linhas.append(f"{rot}, {_faixas(g['faixas'])}" if g["faixas"] else f"{rot}: fechado")
    return linhas


def hours_inline():
    return ". ".join(hours_lines()) + "."


def opening_spec():
    """Para o JSON-LD: só os dias abertos."""
    spec = []
    for g in _grupos():
        for abre, fecha in g["faixas"]:
            spec.append(
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": [en for en, _ in g["dias"]],
                    "opens": abre,
                    "closes": fecha,
                }
            )
    return spec
