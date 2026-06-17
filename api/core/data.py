import json

RANKINGS = {
    "Argentina": {"rank": 1, "points": 1855, "flag": "ar"},
    "Francia": {"rank": 2, "points": 1845, "flag": "fr"},
    "Inglaterra": {"rank": 3, "points": 1800, "flag": "gb-eng"},
    "Bélgica": {"rank": 4, "points": 1790, "flag": "be"},
    "Brasil": {"rank": 5, "points": 1784, "flag": "br"},
    "Países Bajos": {"rank": 6, "points": 1740, "flag": "nl"},
    "Portugal": {"rank": 7, "points": 1730, "flag": "pt"},
    "España": {"rank": 8, "points": 1720, "flag": "es"},
    "Italia": {"rank": 9, "points": 1710, "flag": "it"},
    "Croacia": {"rank": 10, "points": 1700, "flag": "hr"},
    "Estados Unidos": {"rank": 11, "points": 1685, "flag": "us"},
    "Colombia": {"rank": 12, "points": 1670, "flag": "co"},
    "Marruecos": {"rank": 13, "points": 1660, "flag": "ma"},
    "Uruguay": {"rank": 14, "points": 1655, "flag": "uy"},
    "México": {"rank": 15, "points": 1681, "flag": "mx"},
    "Alemania": {"rank": 16, "points": 1630, "flag": "de"},
    "Japón": {"rank": 18, "points": 1620, "flag": "jp"},
    "Suiza": {"rank": 19, "points": 1610, "flag": "ch"},
    "Senegal": {"rank": 20, "points": 1600, "flag": "sn"},
    "Irán": {"rank": 21, "points": 1580, "flag": "ir"},
    "Australia": {"rank": 23, "points": 1550, "flag": "au"},
    "Austria": {"rank": 25, "points": 1540, "flag": "at"},
    "Corea del Sur": {"rank": 28, "points": 1530, "flag": "kr"},
    "Suecia": {"rank": 29, "points": 1525, "flag": "se"},
    "Ecuador": {"rank": 31, "points": 1515, "flag": "ec"},
    "Turquía": {"rank": 37, "points": 1495, "flag": "tr"},
    "Chequia": {"rank": 39, "points": 1490, "flag": "cz"},
    "Canadá": {"rank": 40, "points": 1492, "flag": "ca"},
    "Argelia": {"rank": 43, "points": 1480, "flag": "dz"},
    "Panamá": {"rank": 45, "points": 1470, "flag": "pa"},
    "Costa de Marfil": {"rank": 50, "points": 1445, "flag": "ci"},
    "Paraguay": {"rank": 52, "points": 1440, "flag": "py"},
    "Arabia Saudita": {"rank": 53, "points": 1435, "flag": "sa"},
    "Jamaica": {"rank": 55, "points": 1425, "flag": "jm"},
    "Catar": {"rank": 58, "points": 1420, "flag": "qa"},
    "Sudáfrica": {"rank": 60, "points": 1430, "flag": "za"},
    "Ghana": {"rank": 64, "points": 1385, "flag": "gh"},
    "Uzbekistán": {"rank": 66, "points": 1375, "flag": "uz"},
    "Bosnia y Herzegovina": {"rank": 70, "points": 1350, "flag": "ba"},
    "Haití": {"rank": 85, "points": 1280, "flag": "ht"},
    "Escocia": {"rank": 34, "points": 1505, "flag": "gb-sct"},
    "Túnez": {"rank": 41, "points": 1485, "flag": "tn"},
    "Egipto": {"rank": 33, "points": 1508, "flag": "eg"},
    "Cabo Verde": {"rank": 65, "points": 1380, "flag": "cv"},
    "Noruega": {"rank": 44, "points": 1475, "flag": "no"},
    "Irak": {"rank": 58, "points": 1420, "flag": "iq"},
    "Jordania": {"rank": 70, "points": 1350, "flag": "jo"},
    "Congo": {"rank": 67, "points": 1365, "flag": "cd"},
    "Nueva Zelanda": {"rank": 104, "points": 1210, "flag": "nz"},
    "Curazao": {"rank": 90, "points": 1250, "flag": "cw"},
}

GROUPS_CONFIG = {
    "Grupo A": ["México", "Sudáfrica", "Chequia", "Corea del Sur"],
    "Grupo B": ["Bosnia y Herzegovina", "Canadá", "Catar", "Suiza"],
    "Grupo C": ["Brasil", "Haití", "Marruecos", "Escocia"],
    "Grupo D": ["Australia", "Paraguay", "Turquía", "Estados Unidos"],
    "Grupo E": ["Curazao", "Ecuador", "Alemania", "Costa de Marfil"],
    "Grupo F": ["Países Bajos", "Japón", "Túnez", "Suecia"],
    "Grupo G": ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"],
    "Grupo H": ["España", "Arabia Saudita", "Uruguay", "Cabo Verde"],
    "Grupo I": ["Francia", "Senegal", "Noruega", "Irak"],
    "Grupo J": ["Argentina", "Argelia", "Austria", "Jordania"],
    "Grupo K": ["Portugal", "Uzbekistán", "Colombia", "Congo"],
    "Grupo L": ["Inglaterra", "Croacia", "Ghana", "Panamá"]
}

STADIUMS = [
    {"n": "Estadio Azteca", "city": "CDMX", "cap": 83000, "m": 5, "badge": "inauguracion"},
    {"n": "MetLife Stadium", "city": "Nueva York", "cap": 82500, "m": 8, "badge": "final"},
    {"n": "AT&T Stadium", "city": "Dallas", "cap": 80000, "m": 9, "badge": "semifinal"},
    {"n": "Arrowhead Stadium", "city": "Kansas City", "cap": 76400, "m": 6},
    {"n": "NRG Stadium", "city": "Houston", "cap": 72200, "m": 7},
    {"n": "Mercedes-Benz Stadium", "city": "Atlanta", "cap": 71000, "m": 8, "badge": "semifinal"},
    {"n": "SoFi Stadium", "city": "Los Ángeles", "cap": 70200, "m": 8},
    {"n": "Lincoln Financial", "city": "Filadelfia", "cap": 69700, "m": 6},
    {"n": "Lumen Field", "city": "Seattle", "cap": 69000, "m": 6},
    {"n": "Levi's Stadium", "city": "San Francisco", "cap": 68500, "m": 6},
    {"n": "Gillette Stadium", "city": "Boston", "cap": 65800, "m": 7},
    {"n": "Hard Rock Stadium", "city": "Miami", "cap": 64700, "m": 7, "badge": "tercer_puesto"},
    {"n": "BC Place", "city": "Vancouver", "cap": 54500, "m": 7},
    {"n": "Estadio Akron", "city": "Guadalajara", "cap": 49800, "m": 4},
    {"n": "Estadio BBVA", "city": "Monterrey", "cap": 53500, "m": 4},
    {"n": "BMO Field", "city": "Toronto", "cap": 30000, "m": 6}
]

def get_fifa_ranking():
    return RANKINGS

def get_groups():
    return GROUPS_CONFIG

def get_stadiums():
    return STADIUMS

if __name__ == '__main__':
    teams = []
    for g in GROUPS_CONFIG.values():
        teams.extend(g)
    print("Total teams:", len(teams))
    missing = [t for t in teams if t not in RANKINGS]
    print("Missing in rankings:", missing)
