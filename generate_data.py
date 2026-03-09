import json
from datetime import datetime, timedelta

# Fechas base
start_date = datetime(2026, 6, 11)

matches = []
match_id = 1

# Estadios y Zonas Horarias (simplificado para el script, se ajustará luego a UTC)
# Zonas: West (UTC-7, UTC-8), Central (UTC-5, UTC-6), East (UTC-4, UTC-5)
stadiums = {
    "Estadio Azteca, CDMX": -6,
    "Estadio BBVA, Monterrey": -6,
    "Estadio Akron, Guadalajara": -6,
    "BMO Field, Toronto": -4,
    "BC Place, Vancouver": -7,
    "MetLife Stadium, NY/NJ": -4,
    "AT&T Stadium, Dallas": -5,
    "Arrowhead Stadium, Kansas City": -5,
    "NRG Stadium, Houston": -5,
    "Mercedes-Benz Stadium, Atlanta": -4,
    "SoFi Stadium, Los Angeles": -7,
    "Lincoln Financial Field, Philadelphia": -4,
    "Lumen Field, Seattle": -7,
    "Levi's Stadium, San Francisco": -7,
    "Gillette Stadium, Boston": -4,
    "Hard Rock Stadium, Miami": -4
}

stadium_list = list(stadiums.keys())

# Canales (Formato que espera el JS)
channels_all = [
    {"id": "dsports", "name": "DSports", "class": "channel-dsports"},
    {"id": "rcn", "name": "RCN", "class": "channel-rcn"},
    {"id": "caracol", "name": "Caracol", "class": "channel-caracol"}
]
channels_dsports_only = [
    {"id": "dsports", "name": "DSports", "class": "channel-dsports"}
]

# Fase de Grupos (72 partidos del 11 de junio al 27 de junio)
# 12 grupos de 4 equipos = 6 partidos por grupo = 72 partidos
current_date = start_date
for group_idx in range(12):
    group_letter = chr(65 + group_idx)
    # Distribuir los 6 partidos del grupo en diferentes días
    for match_in_group in range(6):
        # Asignar estadio aleatorio/distribuido
        stadium = stadium_list[(match_id) % len(stadium_list)]
        offset = stadiums[stadium]
        
        # Hora local típica: 12:00, 15:00, 18:00, 21:00
        local_hour = 12 + (match_id % 3) * 3
        
        # Crear fecha en UTC
        match_date = current_date + timedelta(days=(match_id % 16), hours=local_hour - offset)
        
        # Lógica de equipos (Simulando Colombia en Grupo H)
        team1_name = f"Equipo {match_id*2-1}"
        team2_name = f"Equipo {match_id*2}"
        team1_flag = "🏳️"
        team2_flag = "🏳️"
        
        # Asignar cabezas de serie conocidos
        if group_letter == 'A' and match_in_group == 0:
            team1_name = "México"
            team1_flag = "🇲🇽"
        elif group_letter == 'B' and match_in_group == 0:
            team1_name = "Canadá"
            team1_flag = "🇨🇦"
        elif group_letter == 'D' and match_in_group == 0:
            team1_name = "Estados Unidos"
            team1_flag = "🇺🇸"
            
        # Colombia en Grupo H (como muestra)
        is_colombia = False
        if group_letter == 'H':
            if match_in_group == 0:
                team1_name = "Colombia"
                team1_flag = "🇨🇴"
                is_colombia = True
            elif match_in_group == 3:
                team2_name = "Colombia"
                team2_flag = "🇨🇴"
                is_colombia = True
            elif match_in_group == 5:
                team1_name = "Colombia"
                team1_flag = "🇨🇴"
                is_colombia = True

        matches.append({
            "id": match_id,
            "phase": f"Fase de Grupos - Grupo {group_letter}",
            "dateUtc": match_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "team1": {"name": team1_name, "flag": team1_flag},
            "team2": {"name": team2_name, "flag": team2_flag},
            "stadium": stadium,
            "channels": channels_all if (is_colombia or match_id == 1) else channels_dsports_only
        })
        match_id += 1

# Dieciseisavos de final (16 partidos, 28 junio - 3 julio)
current_date = datetime(2026, 6, 28)
for i in range(16):
    stadium = stadium_list[i % len(stadium_list)]
    offset = stadiums[stadium]
    local_hour = 17 if i % 2 == 0 else 20
    match_date = current_date + timedelta(days=i//3, hours=local_hour - offset)
    
    matches.append({
        "id": match_id,
        "phase": "Dieciseisavos de Final",
        "dateUtc": match_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "team1": {"name": f"1ro/2do/3ro", "flag": "❓"},
        "team2": {"name": f"1ro/2do/3ro", "flag": "❓"},
        "stadium": stadium,
        "channels": channels_all if match_id % 4 == 0 else channels_dsports_only # Caracol/RCN dan algunos
    })
    match_id += 1

# Octavos de final (8 partidos, 4 julio - 7 julio)
current_date = datetime(2026, 7, 4)
for i in range(8):
    stadium = stadium_list[i % len(stadium_list)]
    offset = stadiums[stadium]
    local_hour = 17 if i % 2 == 0 else 20
    match_date = current_date + timedelta(days=i//2, hours=local_hour - offset)
    
    matches.append({
        "id": match_id,
        "phase": "Octavos de Final",
        "dateUtc": match_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "team1": {"name": f"Ganador 16vos", "flag": "❓"},
        "team2": {"name": f"Ganador 16vos", "flag": "❓"},
        "stadium": stadium,
        "channels": channels_all if i % 2 == 0 else channels_dsports_only
    })
    match_id += 1

# Cuartos de final (4 partidos, 9 julio - 11 julio)
current_date = datetime(2026, 7, 9)
for i in range(4):
    stadium = stadium_list[i % len(stadium_list)]
    offset = stadiums[stadium]
    local_hour = 18
    match_date = current_date + timedelta(days=i//2, hours=local_hour - offset)
    
    matches.append({
        "id": match_id,
        "phase": "Cuartos de Final",
        "dateUtc": match_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "team1": {"name": f"Ganador 8vos", "flag": "❓"},
        "team2": {"name": f"Ganador 8vos", "flag": "❓"},
        "stadium": stadium,
        "channels": channels_all
    })
    match_id += 1

# Semifinales (2 partidos, 14 julio - 15 julio)
matches.append({
    "id": 101,
    "phase": "Semifinal 1",
    "dateUtc": "2026-07-14T00:00:00Z", # Ajustar a UTC
    "team1": {"name": "Ganador Cuartos", "flag": "❓"},
    "team2": {"name": "Ganador Cuartos", "flag": "❓"},
    "stadium": "AT&T Stadium, Dallas",
    "channels": channels_all
})
matches.append({
    "id": 102,
    "phase": "Semifinal 2",
    "dateUtc": "2026-07-15T00:00:00Z", 
    "team1": {"name": "Ganador Cuartos", "flag": "❓"},
    "team2": {"name": "Ganador Cuartos", "flag": "❓"},
    "stadium": "Mercedes-Benz Stadium, Atlanta",
    "channels": channels_all
})

# Tercer Puesto
matches.append({
    "id": 103,
    "phase": "Tercer Puesto",
    "dateUtc": "2026-07-18T00:00:00Z", 
    "team1": {"name": "Perdedor Semi 1", "flag": "❓"},
    "team2": {"name": "Perdedor Semi 2", "flag": "❓"},
    "stadium": "Hard Rock Stadium, Miami",
    "channels": channels_all
})

# Final
matches.append({
    "id": 104,
    "phase": "Gran Final",
    "dateUtc": "2026-07-19T20:00:00Z", 
    "team1": {"name": "Ganador Semi 1", "flag": "🏆"},
    "team2": {"name": "Ganador Semi 2", "flag": "🏆"},
    "stadium": "MetLife Stadium, NY/NJ",
    "channels": channels_all
})

# Generar el archivo JS
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
