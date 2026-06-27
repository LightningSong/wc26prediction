import requests
from bs4 import BeautifulSoup
import json
import random
from datetime import datetime, timedelta, timezone

from core.data import GROUPS_CONFIG

import re
from collections import defaultdict

WIKI_TEAM_TRANSLATIONS = {
    "Algeria": "Argelia", "Argentina": "Argentina", "Australia": "Australia",
    "Austria": "Austria", "Belgium": "Bélgica", "Bosnia and Herzegovina": "Bosnia y Herzegovina",
    "Brazil": "Brasil", "Canada": "Canadá", "Cape Verde": "Cabo Verde",
    "Colombia": "Colombia", "Croatia": "Croacia", "Curaçao": "Curazao",
    "Czech Republic": "Chequia", "DR Congo": "Congo", "Ecuador": "Ecuador",
    "Egypt": "Egipto", "England": "Inglaterra", "France": "Francia",
    "Germany": "Alemania", "Ghana": "Ghana", "Haiti": "Haití",
    "Iran": "Irán", "Iraq": "Irak", "Ivory Coast": "Costa de Marfil",
    "Japan": "Japón", "Jordan": "Jordania", "Mexico": "México",
    "Morocco": "Marruecos", "Netherlands": "Países Bajos", "New Zealand": "Nueva Zelanda",
    "Norway": "Noruega", "Panama": "Panamá", "Paraguay": "Paraguay",
    "Portugal": "Portugal", "Qatar": "Catar", "Saudi Arabia": "Arabia Saudita",
    "Scotland": "Escocia", "Senegal": "Senegal", "South Africa": "Sudáfrica",
    "South Korea": "Corea del Sur", "Spain": "España", "Sweden": "Suecia",
    "Switzerland": "Suiza", "Tunisia": "Túnez", "Turkey": "Turquía",
    "United States": "Estados Unidos", "Uruguay": "Uruguay", "Uzbekistan": "Uzbekistán"
}

class SoccerScraper:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        self.fallback_groups = GROUPS_CONFIG
        self.cache_time = None
        self.cached_matches = None
        
    def fetch_live_matches(self):
        if self.cache_time and (datetime.now() - self.cache_time).total_seconds() < 30:
            return self.cached_matches

        try:
            response = requests.get("https://en.wikipedia.org/wiki/2026_FIFA_World_Cup", headers=self.headers, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            boxes = soup.find_all('div', {'class': 'footballbox'})
            if len(boxes) == 0:
                raise ValueError("No match boxes found")
                
            # Map Spanish team name to Group name
            team_to_group = {}
            for g_name, teams in self.fallback_groups.items():
                for t in teams:
                    team_to_group[t] = g_name
                    
            group_matches = defaultdict(list)
            
            for box in boxes:
                home_el = box.find(class_='fhome')
                away_el = box.find(class_='faway')
                if not home_el or not away_el:
                    continue
                home_raw = home_el.text.strip()
                away_raw = away_el.text.strip()
                if home_raw not in WIKI_TEAM_TRANSLATIONS or away_raw not in WIKI_TEAM_TRANSLATIONS:
                    continue
                home_es = WIKI_TEAM_TRANSLATIONS[home_raw]
                away_es = WIKI_TEAM_TRANSLATIONS[away_raw]
                group_name = team_to_group.get(home_es, "Grupo Desconocido")
                
                score_el = box.find(class_='fscore')
                score_text = score_el.text.strip() if score_el else ""
                score_a = None
                score_b = None
                m = re.match(r'^(\d+)\s*\D+\s*(\d+)$', score_text)
                if m:
                    score_a = int(m.group(1))
                    score_b = int(m.group(2))

                # Score overrides removed - Wikipedia now has final scores for all completed matches
                    
                bday_el = box.find(class_='bday')
                bday_str = bday_el.text.strip() if bday_el else "2026-06-11"
                
                time_el = box.find(class_='ftime')
                time_text = time_el.text.strip() if time_el else "12:00 p.m."
                time_match = re.search(r'(\d+):(\d+)\s*([ap]\.?m\.?)', time_text, re.IGNORECASE)
                hour, minute = 12, 0
                if time_match:
                    hour = int(time_match.group(1))
                    minute = int(time_match.group(2))
                    ampm = time_match.group(3).lower().replace('.', '')
                    if ampm == 'pm' and hour < 12:
                        hour += 12
                    elif ampm == 'am' and hour == 12:
                        hour = 0
                
                # Parse UTC offset
                offset_hours = -5 # default
                offset_match = re.search(r'UTC([+−-]\d+)', time_text)
                if offset_match:
                    offset_str = offset_match.group(1).replace('−', '-')
                    offset_hours = int(offset_str)
                    
                tz = timezone(timedelta(hours=offset_hours))
                try:
                    match_date = datetime.strptime(f"{bday_str} {hour:02d}:{minute:02d}", "%Y-%m-%d %H:%M").replace(tzinfo=tz)
                except Exception:
                    match_date = datetime(2026, 6, 11, 12, 0, tzinfo=timezone(timedelta(hours=-5)))
                    
                stadium_el = box.find(itemprop='name address') or box.find(class_='fright')
                stadium_text = stadium_el.text.strip() if stadium_el else "A definir"
                if "," in stadium_text:
                    stadium_text = stadium_text.split(",")[0].strip()
                    
                group_matches[group_name].append({
                    "team_a": home_es,
                    "team_b": away_es,
                    "score_a": score_a,
                    "score_b": score_b,
                    "date": match_date,
                    "stadium": stadium_text,
                    "group": group_name
                })
                
            # Assign categories and build match IDs
            matches = []
            match_id = 1
            for g_name, m_list in group_matches.items():
                m_list.sort(key=lambda x: x["date"])
                for i, m in enumerate(m_list):
                    if i < 2:
                        m["category"] = "Jornada 1"
                    elif i < 4:
                        m["category"] = "Jornada 2"
                    else:
                        m["category"] = "Jornada 3"
                    m["id"] = f"g_f{match_id}"
                    m["status"] = "Próximamente"
                    matches.append(m)
                    match_id += 1
                    
            if len(matches) == 0:
                raise ValueError("Parsed 0 matches from Wikipedia")
                
            matches.sort(key=lambda x: x["date"])
            self.cached_matches = matches
            self.cache_time = datetime.now()
            return matches
        except Exception as e:
            matches = self._fallback_live_matches()
            self.cached_matches = matches
            self.cache_time = datetime.now()
            return matches

    def _fallback_live_matches(self):
        matches = []
        rng = random.Random(42) # Deterministic seed so scores don't change
        match_id = 1
        
        group_names = list(self.fallback_groups.keys())
        fallback_tz = timezone(timedelta(hours=-5)) # Server standard timezone

        for group_idx, group_name in enumerate(group_names):
            teams = self.fallback_groups[group_name]
            pairings = [(0, 1), (2, 3), (0, 2), (1, 3), (0, 3), (1, 2)]
            
            for p_idx, p in enumerate(pairings):
                t1, t2 = teams[p[0]], teams[p[1]]
                
                # Matchday 1: Jun 11 - Jun 22 (1 group per day)
                # Matchday 2: Jun 16 - Jun 25 
                # Matchday 3: Jun 21 - Jun 27
                # Realistic schedule ensuring Group E hasn't played by June 15
                md1_starts = [11, 12, 13, 14, 16, 16, 17, 17, 18, 18, 19, 19]
                md2_starts = [18, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24]
                md3_starts = [22, 23, 24, 24, 25, 25, 26, 26, 27, 27, 27, 27]

                if p_idx < 2:
                    day = md1_starts[group_idx]
                    category = "Jornada 1"
                    hour = 17 if p_idx == 0 else 20
                elif p_idx < 4:
                    day = md2_starts[group_idx]
                    category = "Jornada 2"
                    hour = 14 if p_idx == 2 else 17
                else:
                    day = md3_starts[group_idx]
                    category = "Jornada 3"
                    hour = 14 if p_idx == 4 else 17
                    
                match_date = datetime(2026, 6, day, hour, 0, 0, tzinfo=fallback_tz)
                
                # Final scores
                sa = rng.randint(0, 3)
                sb = rng.randint(0, 3)
                
                now = datetime.now(timezone.utc).astimezone(fallback_tz)
                if now > match_date + timedelta(minutes=110):
                    score_a, score_b = sa, sb
                elif now >= match_date:
                    score_a, score_b = 0, 0
                else:
                    score_a, score_b = None, None

                matches.append({
                    "id": f"g_f{match_id}", "group": group_name, "team_a": t1, "team_b": t2,
                    "score_a": score_a, "score_b": score_b, 
                    "date": match_date,
                    "stadium": rng.choice(["Miami Stadium", "New York / New Jersey Stadium", "Dallas Stadium", "Atlanta Stadium", "Boston Stadium", "Houston Stadium", "Toronto Stadium", "Azteca Stadium"]),
                    "status": "Próximamente", # overwritten by services.py
                    "category": category
                })
                match_id += 1
                
        matches.sort(key=lambda x: x["date"])
        return matches
        
    def get_groups(self):
        return self.fallback_groups

scraper = SoccerScraper()
