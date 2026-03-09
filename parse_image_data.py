import json
from datetime import datetime
import pytz

# Texto crudo extraído de la imagen (Columna 1 y Columna 2 de la Primera Ronda)
raw_text = """
JUN 11 2:00PM MÉXICO VS SUDÁFRICA
JUN 11 9:00PM COREA DEL SUR VS GANADOR UEFA D
JUN 12 2:00PM CANADÁ VS GANADOR UEFA B
JUN 12 8:00PM ESTADOS UNIDOS VS PARAGUAY
JUN 13 2:00PM CATAR VS SUIZA
JUN 13 5:00PM BRASIL VS MARRUECOS
JUN 13 8:00PM HAITÍ VS ESCOCIA
JUN 13 11:00PM AUSTRALIA VS GANADOR UEFA C
JUN 14 12:00PM ALEMANIA VS CURAZAO
JUN 14 3:00PM PAÍSES BAJOS VS JAPÓN
JUN 14 6:00PM COSTA DE MARFIL VS ECUADOR
JUN 14 9:00PM GANADOR UEFA B VS TÚNEZ
JUN 15 11:00AM ESPAÑA VS CABO VERDE
JUN 15 2:00PM BÉLGICA VS EGIPTO
JUN 15 5:00PM ARABIA SAUDÍ VS URUGUAY
JUN 15 8:00PM RI DE IRÁN VS NUEVA ZELANDA
JUN 16 2:00PM FRANCIA VS SENEGAL
JUN 16 5:00PM GANADOR FIFA II VS NORUEGA
JUN 16 8:00PM ARGENTINA VS ARGELIA
JUN 16 11:00PM AUSTRIA VS JORDANIA
JUN 17 12:00PM PORTUGAL VS GANADOR FIFA I
JUN 17 3:00PM INGLATERRA VS CROACIA
JUN 17 6:00PM GHANA VS PANAMÁ
JUN 17 9:00PM UZBEKISTÁN VS COLOMBIA
JUN 18 11:00AM SUDÁFRICA VS GANADOR UEFA D
JUN 18 2:00PM GANADOR UEFA B VS SUIZA
JUN 18 5:00PM CANADÁ VS CATAR
JUN 18 8:00PM MÉXICO VS COREA DEL SUR
JUN 19 2:00PM ESTADOS UNIDOS VS AUSTRALIA
JUN 19 5:00PM ESCOCIA VS MARRUECOS
JUN 19 8:00PM BRASIL VS HAITÍ
JUN 19 11:00PM GANADOR UEFA C VS PARAGUAY
JUN 20 12:00PM PAÍSES BAJOS VS GANADOR UEFA B
JUN 20 3:00PM ALEMANIA VS COSTA DE MARFIL
JUN 20 7:00PM ECUADOR VS CURAZAO
JUN 20 11:00PM TÚNEZ VS JAPÓN
JUN 21 11:00AM ESPAÑA VS ARABIA SAUDÍ
JUN 21 2:00PM BÉLGICA VS RI DE IRÁN
JUN 21 5:00PM URUGUAY VS CABO VERDE
JUN 21 8:00PM NUEVA ZELANDA VS EGIPTO
JUN 22 12:00PM ARGENTINA VS AUSTRIA
JUN 22 4:00PM FRANCIA VS GANADOR FIFA II
JUN 22 7:00PM NORUEGA VS SENEGAL
JUN 22 10:00PM JORDANIA VS ARGELIA
JUN 23 12:00PM PORTUGAL VS UZBEKISTÁN
JUN 23 3:00PM INGLATERRA VS GHANA
JUN 23 6:00PM PANAMÁ VS CROACIA
JUN 23 9:00PM COLOMBIA VS FIFA I
JUN 24 11:00AM SUIZA VS CANADÁ
JUN 24 2:00PM GANADOR UEFA B VS CATAR
JUN 24 5:00PM ESCOCIA VS BRASIL
JUN 24 8:00PM GANADOR UEFA D VS MÉXICO
JUN 24 11:00PM SUDÁFRICA VS REPÚBLICA DE COREA
JUN 25 3:00PM ECUADOR VS ALEMANIA
JUN 25 6:00PM CURAZAO VS COSTA DE MARFIL
JUN 25 6:00PM TÚNEZ VS PAÍSES BAJOS
JUN 25 11:00PM JAPÓN VS GANADOR UEFA B
JUN 25 11:00PM GANADOR UEFA C VS ESTADOS UNIDOS
JUN 25 11:00PM PARAGUAY VS AUSTRALIA
JUN 26 2:00PM NORUEGA VS FRANCIA
JUN 26 2:00PM SENEGAL VS GANADOR FIFA II
JUN 26 7:00PM URUGUAY VS ESPAÑA
JUN 26 7:00PM CABO VERDE VS ARABIA SAUDÍ
JUN 26 10:00PM NUEVA ZELANDA VS BÉLGICA
JUN 26 10:00PM EGIPTO VS RI DE IRÁN
JUN 27 4:00PM PANAMÁ VS INGLATERRA
JUN 27 4:00PM CROACIA VS GHANA
JUN 27 6:30PM COLOMBIA VS PORTUGAL
JUN 27 6:30PM GANADOR TORNEO I VS UZBEKISTÁN
JUN 27 11:00PM JORDANIA VS ARGENTINA
JUN 27 11:00PM ARGELIA VS AUSTRIA
"""

# Limpiar y parsear el texto
lines = [l.strip() for l in raw_text.split('\n') if l.strip()]

# Determinar Grupos en base a los primeros 48 equipos únicos
teams_to_groups = {}
current_group_char = ord('A')
teams_in_current_group = 0

flags = {
    "MÉXICO": "🇲🇽", "CANADÁ": "🇨🇦", "ESTADOS UNIDOS": "🇺🇸", "BRASIL": "🇧🇷", "COLOMBIA": "🇨🇴",
    "ALEMANIA": "🇩🇪", "PAÍSES BAJOS": "🇳🇱", "HOLANDA": "🇳🇱", "BÉLGICA": "🇧🇪", "ESPAÑA": "🇪🇸",
    "URUGUAY": "🇺🇾", "FRANCIA": "🇫🇷", "ARGENTINA": "🇦🇷", "PORTUGAL": "🇵🇹", "INGLATERRA": "🇬🇧",
    "SUDÁFRICA": "🇿🇦", "COREA DEL SUR": "🇰🇷", "REPÚBLICA DE COREA": "🇰🇷", "PARAGUAY": "🇵🇾", "CATAR": "🇶🇦",
    "SUIZA": "🇨🇭", "MARRUECOS": "🇲🇦", "HAITÍ": "🇭🇹", "ESCOCIA": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "AUSTRALIA": "🇦🇺",
    "CURAZAO": "🇨🇼", "JAPÓN": "🇯🇵", "COSTA DE MARFIL": "🇨🇮", "ECUADOR": "🇪🇨", "TÚNEZ": "🇹🇳",
    "CABO VERDE": "🇨🇻", "EGIPTO": "🇪🇬", "ARABIA SAUDÍ": "🇸🇦", "RI DE IRÁN": "🇮🇷", "NUEVA ZELANDA": "🇳🇿",
    "SENEGAL": "🇸🇳", "NORUEGA": "🇳🇴", "ARGELIA": "🇩🇿", "AUSTRIA": "🇦🇹", "JORDANIA": "🇯🇴",
    "CROACIA": "🇭🇷", "GHANA": "🇬🇭", "PANAMÁ": "🇵🇦", "UZBEKISTÁN": "🇺🇿"
}

matches = []
match_id = 1

channels_all = [
    {"id": "dsports", "name": "DSports", "class": "channel-dsports"},
    {"id": "rcn", "name": "RCN", "class": "channel-rcn"},
    {"id": "caracol", "name": "Caracol", "class": "channel-caracol"}
]
channels_dsports_only = [
    {"id": "dsports", "name": "DSports", "class": "channel-dsports"}
]

colombia_tz = pytz.timezone('America/Bogota')

for line in lines:
    parts = line.split(' VS ')
    if len(parts) != 2:
        continue
    
    left_part = parts[0]
    team2 = parts[1].strip()
    
    # Left part usually "JUN 11 2:00PM MÉXICO"
    # Buscar el primer espacio después de PM o AM
    am_pm_idx = max(left_part.find('PM'), left_part.find('AM'))
    date_str = left_part[:am_pm_idx+2].strip()
    team1 = left_part[am_pm_idx+2:].strip()
    
    # Asignar grupo lógicamente (los primeros 4 equipos en aparecer son Grupo A, etc.)
    for team in [team1, team2]:
        if team not in teams_to_groups:
            if current_group_char > ord('L'):
                teams_to_groups[team] = "Misc"
            else:
                teams_to_groups[team] = chr(current_group_char)
                teams_in_current_group += 1
                if teams_in_current_group == 4:
                    teams_in_current_group = 0
                    current_group_char += 1

    group = teams_to_groups[team1]
    
    # La fecha está en Hora COLOMBIA según la imagen "HORA COL"
    # Vamos a convertir esto a UTC para mantener la lógica original del JS
    date_format = "2026 %b %d %I:%M%p"
    month_map = {"JUN": "Jun", "JUL": "Jul"}
    month_es = date_str[:3]
    date_str = date_str.replace(month_es, month_map[month_es])
    
    dt_colombia = datetime.strptime(f"2026 {date_str}", "%Y %b %d %I:%M%p")
    dt_colombia = colombia_tz.localize(dt_colombia)
    dt_utc = dt_colombia.astimezone(pytz.utc)

    # Lógica de Canales: Si juega Colombia, Caracol/RCN. Si no, algunos aleatorios o DSports.
    is_colombia = "COLOMBIA" in team1 or "COLOMBIA" in team2
    match_channels = channels_all if is_colombia or match_id % 7 == 0 else channels_dsports_only

    matches.append({
        "id": match_id,
        "phase": f"Fase de Grupos - Grupo {group}",
        "group": f"Grupo {group}",
        "dateUtc": dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "team1": {"name": team1, "flag": flags.get(team1.upper(), "🏳️")},
        "team2": {"name": team2, "flag": flags.get(team2.upper(), "🏳️")},
        "stadium": "Designado por la FIFA", # Ya no hay sede en la imagen, omitimos o dejamos un placeholder
        "channels": match_channels
    })
    match_id += 1

# Agregamos rondas finales genéricas para llegar a 104
final_phases = [
    ("Dieciseisavos de Final", 16, "2026-06-28T12:00:00Z"),
    ("Octavos de Final", 8, "2026-07-04T12:00:00Z"),
    ("Cuartos de Final", 4, "2026-07-09T12:00:00Z"),
    ("Semifinales", 2, "2026-07-14T12:00:00Z"),
    ("Tercer Puesto", 1, "2026-07-18T12:00:00Z"),
    ("Gran Final", 1, "2026-07-19T12:00:00Z")
]

for phase_name, count, start_date in final_phases:
    dt = datetime.strptime(start_date, "%Y-%m-%dT%H:%M:%SZ")
    for i in range(count):
        match_channels = channels_all if phase_name in ["Semifinales", "Tercer Puesto", "Gran Final"] else channels_dsports_only
        
        matches.append({
            "id": match_id,
            "phase": phase_name,
            "group": "Eliminatorias",
            "dateUtc": dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "team1": {"name": "Por definir", "flag": "❓"},
            "team2": {"name": "Por definir", "flag": "❓"},
            "stadium": "Designado por la FIFA",
            "channels": match_channels
        })
        match_id += 1

js_content = f"""// Definición de Canales
const CHANNELS = {{
    DSPORTS: {{ id: 'dsports', name: 'DSports', class: 'channel-dsports' }},
    RCN: {{ id: 'rcn', name: 'RCN', class: 'channel-rcn' }},
    CARACOL: {{ id: 'caracol', name: 'Caracol', class: 'channel-caracol' }}
}};

// Datos del fixture (Los 104 partidos)
const matches = {json.dumps(matches, indent=4, ensure_ascii=False)};
"""

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)
