export const GROUP_COLORS: Record<string, string> = {
  'A': '#ff4d4d',
  'B': '#ff9933',
  'C': '#33cc33',
  'D': '#3399ff',
  'E': '#9933ff',
  'F': '#33ccff',
  'G': '#ff3399',
  'H': '#cccc00',
  'I': '#6666ff',
  'J': '#00cccc',
  'K': '#99cc66',
  'L': '#cccccc',
};

export const STADIUMS = [
  {n:'MetLife Stadium', city:'East Rutherford, NJ', cnt:'usa', f:'US', cap:82500, badge:'final', m:9, c:'#000'},
  {n:'Estadio Azteca', city:'Ciudad de Mexico', cnt:'mex', f:'MX', cap:87523, badge:'inaug', m:8, c:'#006847'},
  {n:'Rose Bowl', city:'Pasadena, CA', cnt:'usa', f:'US', cap:90888, badge:'semi', m:8, c:'#C1272D'},
  {n:'BC Place', city:'Vancouver, BC', cnt:'can', f:'CA', cap:54500, badge:null, m:7, c:'#D80621'},
  {n:'AT&T Stadium', city:'Arlington, TX', cnt:'usa', f:'US', cap:80000, badge:null, m:8, c:'#002244'},
  {n:'SoFi Stadium', city:'Inglewood, CA', cnt:'usa', f:'US', cap:70240, badge:null, m:7, c:'#003594'},
  {n:'Gillette Stadium', city:'Foxborough, MA', cnt:'usa', f:'US', cap:65878, badge:null, m:7, c:'#002244'},
  {n:'Estadio BBVA', city:'Monterrey, NL', cnt:'mex', f:'MX', cap:53500, badge:null, m:7, c:'#006847'},
];

export const TICKER_ITEMS = [
  {h:'México', a:'Corea del Sur', s:'1-0', l:true, m:'63\''},
  {h:'Estados Unidos', a:'Paraguay', s:'1-1', l:true, m:'79\''},
  {h:'Argentina', a:'Argelia', s:'2-0', l:false},
  {h:'Francia', a:'Noruega', s:'3-1', l:false}
];

export const PREDICTED_SCORERS = [
  {n:'Kylian Mbappe', t:'Francia', g:7},
  {n:'Vinicius Jr.', t:'Brasil', g:6},
  {n:'Lautaro Martinez', t:'Argentina', g:5},
  {n:'Lionel Messi', t:'Argentina', g:4},
  {n:'Harry Kane', t:'Inglaterra', g:4}
];

export const TITLE_PROBABILITIES = [
  {f:'BR', t:'Brasil', p:26, c:'#F7D117'},
  {f:'GB', t:'Inglaterra', p:20, c:'#000'},
  {f:'FR', t:'Francia', p:17, c:'#002395'},
  {f:'AR', t:'Argentina', p:14, c:'#75AADB'}
];
