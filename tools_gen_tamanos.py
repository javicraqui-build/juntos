#!/usr/bin/env python3
"""Genera el set de ilustraciones homogéneas para las comparaciones de tamaño (una unidad por semana).
Estilo: formas redondeadas, volumen con degradado radial, luz arriba-izquierda, sombra suave, paleta apagada."""
import os

OUT = os.path.join(os.path.dirname(__file__), 'public', 'img', 'tamano')
os.makedirs(OUT, exist_ok=True)

def grad(id_, c1, c2, cx=0.38, cy=0.35, r=0.75):
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient>'
def lgrad(id_, stops, x1=0, y1=0, x2=0, y2=1):
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{id_}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>'
SHADOW = '<ellipse cx="100" cy="170" rx="46" ry="9" fill="#2A2733" opacity=".10" filter="url(#blur)"/>'
def svg(defs, body, shadow=True):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><filter id="blur" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>{defs}</defs>{SHADOW if shadow else ''}{body}</svg>'''
def hl(cx, cy, rx, ry, rot=-30, op=.28):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" transform="rotate({rot} {cx} {cy})" fill="#fff" opacity="{op}"/>'
def stem(x, y, h=18, w=5, color='#6B5237'):
    return f'<path d="M{x-w/2} {y} q{w/4} {-h*0.6} {w*0.9} {-h}" stroke="{color}" stroke-width="{w}" stroke-linecap="round" fill="none"/>'
def leaf(x, y, w, h, rot, c1='#7FA56B', c2='#4F7A4A'):
    return f'<g transform="translate({x} {y}) rotate({rot})"><path d="M0 0 C {w*0.5} {-h*0.9}, {w} {-h*0.6}, {w} 0 C {w} {h*0.6}, {w*0.5} {h*0.9}, 0 0 Z" fill="{c1}"/><path d="M0 0 Q {w*0.5} 0 {w} 0" stroke="{c2}" stroke-width="1.6" fill="none" opacity=".8"/></g>'

ITEMS = {}

# 4 · semilla de amapola: riñón azul grisáceo con retícula
ITEMS['amapola'] = svg(grad('g','#7C8296','#3D4152'),
  '<g transform="translate(100 104) scale(1.15) translate(-100 -104)">' + '<path d="M62 92 C 58 58, 112 48, 138 76 C 158 98, 142 150, 100 148 C 66 146, 52 118, 68 104 C 76 98, 74 96, 62 92 Z" fill="url(#g)"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="2.4" fill="#1F2230" opacity=".28"/>' for x, y in [(88,80),(104,72),(120,82),(96,98),(114,100),(130,104),(84,116),(102,120),(120,124),(96,136),(114,138)])
  + hl(88, 78, 18, 9, -25) + '</g>')

# 5 · semilla de sésamo: lágrima crema
ITEMS['sesamo'] = svg(grad('g','#FBF4DC','#D9C79A'),
  '<path d="M100 42 C 132 78, 140 112, 128 138 C 118 160, 82 160, 72 138 C 60 112, 68 78, 100 42 Z" fill="url(#g)"/>'
  '<path d="M100 60 C 100 90, 100 120, 100 146" stroke="#C7B27E" stroke-width="2" fill="none" opacity=".7"/>' + hl(88, 86, 8, 22, 12))

# 6 · lenteja: disco lenticular marrón claro, visto en escorzo
ITEMS['lenteja'] = svg(grad('g','#D9A868','#8E5F2C', cx=.4, cy=.35),
  '<ellipse cx="100" cy="104" rx="60" ry="46" fill="url(#g)"/>'
  '<ellipse cx="100" cy="104" rx="36" ry="27" fill="none" stroke="#7A4E22" stroke-width="2" opacity=".35"/>'
  '<ellipse cx="100" cy="104" rx="14" ry="10" fill="#7A4E22" opacity=".18"/>' + hl(80, 82, 22, 11, -20))

# 7 · arándano: esfera azul violácea con corona
ITEMS['arandano'] = svg(grad('g','#8A8FC0','#3F4483'),
  '<circle cx="100" cy="104" r="58" fill="url(#g)"/>'
  '<path d="M100 60 l 6 10 l 11 -4 l -3 11 l 10 6 l -10 5 l 3 11 l -11 -4 l -6 10 l -6 -10 l -11 4 l 3 -11 l -10 -5 l 10 -6 l -3 -11 l 11 4 z" fill="#2E3266" opacity=".75" transform="translate(0 -22) scale(.9) translate(11 10)"/>'
  '<circle cx="100" cy="60" r="7" fill="#2E3266" opacity=".9"/>' + hl(78, 78, 16, 12, -30))

# 8 · frambuesa: cúpula de drupéolas rojas
_d = []
for cx, cy, r in [(100,74,13),(84,86,13),(116,86,13),(72,104,13),(100,102,13),(128,104,13),(84,122,13),(116,122,13),(100,140,13),(72,124,12),(128,124,12)]:
    _d.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#g)"/>' + hl(cx-4, cy-4, 5, 3, -30, .35))
ITEMS['frambuesa'] = svg(grad('g','#E27A72','#A83A36'),
  '<g transform="translate(100 106) scale(1.28) translate(-100 -104)">' + '<path d="M64 76 Q100 40 136 76 Q 100 66 64 76 Z" fill="#6F9A5E"/>' + ''.join(_d) + stem(100, 60, 18, 5, '#6B7A4A') + '</g>')

# 9 · uva: baya ovalada morada
ITEMS['uva'] = svg(grad('g','#A98BBA','#5E3F70'),
  '<ellipse cx="100" cy="108" rx="50" ry="58" fill="url(#g)"/>' + stem(100, 52, 20, 5) + hl(80, 82, 14, 20, -20))

# 10 · fresa
ITEMS['fresa'] = svg(grad('g','#E86D5F','#B93A34', cx=.4, cy=.3),
  '<path d="M100 160 C 62 138, 46 108, 52 82 C 58 58, 84 52, 100 66 C 116 52, 142 58, 148 82 C 154 108, 138 138, 100 160 Z" fill="url(#g)"/>'
  + ''.join(f'<ellipse cx="{x}" cy="{y}" rx="2.6" ry="3.4" fill="#F7E4A0" opacity=".85"/>' for x, y in [(84,88),(100,84),(116,88),(76,106),(92,104),(108,104),(124,106),(84,122),(100,120),(116,122),(94,138),(108,138)])
  + leaf(100, 64, 26, 10, -160) + leaf(100, 64, 26, 10, -20) + leaf(100, 64, 22, 9, -110) + leaf(100, 64, 22, 9, -70)
  + stem(100, 62, 16, 4, '#5A7F4B') + hl(80, 86, 10, 16, -25))

# 11 · higo
ITEMS['higo'] = svg(grad('g','#9B72A8','#4E2F5C', cx=.4, cy=.4),
  '<path d="M100 44 C 104 70, 150 84, 148 120 C 146 150, 122 164, 100 164 C 78 164, 54 150, 52 120 C 50 84, 96 70, 100 44 Z" fill="url(#g)"/>'
  + stem(100, 48, 16, 4, '#5F4A3B') + hl(82, 108, 12, 20, -15))

# 12 · ciruela
ITEMS['ciruela'] = svg(grad('g','#9C6AAE','#4A2D5C'),
  '<circle cx="100" cy="108" r="56" fill="url(#g)"/>'
  '<path d="M100 54 C 90 80, 90 130, 100 160" stroke="#3A2148" stroke-width="3" fill="none" opacity=".35"/>'
  + stem(100, 54, 18, 5) + leaf(103, 46, 26, 9, -30) + hl(80, 84, 14, 18, -25))

# 13 · kiwi: óvalo marrón aterciopelado
ITEMS['kiwi'] = svg(grad('g','#C49A63','#7D5A2E'),
  '<ellipse cx="100" cy="106" rx="62" ry="48" fill="url(#g)"/>'
  '<ellipse cx="100" cy="106" rx="62" ry="48" fill="none" stroke="#6B4A22" stroke-width="5" stroke-dasharray="1.5 4" opacity=".5"/>'
  + hl(78, 86, 18, 11, -20))

# 14 · limón
ITEMS['limon'] = svg(grad('g','#F4DB6A','#D9A722'),
  '<path d="M46 106 C 46 76, 72 56, 100 56 C 128 56, 154 76, 154 106 C 154 134, 128 152, 100 152 C 72 152, 46 134, 46 106 Z" fill="url(#g)"/>'
  '<ellipse cx="46" cy="106" rx="8" ry="6" fill="#D9A722"/><ellipse cx="154" cy="106" rx="8" ry="6" fill="#D9A722"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="#B98A14" opacity=".35"/>' for x, y in [(80,90),(96,84),(114,88),(128,100),(72,112),(90,110),(108,112),(124,124),(84,130),(104,134)])
  + leaf(134, 70, 26, 9, -35) + hl(78, 84, 16, 10, -25))

# 15 · manzana
ITEMS['manzana'] = svg(grad('g','#E77066','#B3312F', cx=.38, cy=.32),
  '<path d="M100 72 C 84 54, 46 58, 46 100 C 46 134, 70 162, 90 160 C 96 160, 98 158, 100 158 C 102 158, 104 160, 110 160 C 130 162, 154 134, 154 100 C 154 58, 116 54, 100 72 Z" fill="url(#g)"/>'
  + stem(100, 72, 22, 5) + leaf(104, 60, 28, 10, -30) + hl(76, 92, 12, 22, -15))

# 16 · aguacate (entero)
ITEMS['aguacate'] = svg(grad('g','#5F8A4C','#2E4A2B', cx=.4, cy=.4),
  '<path d="M100 40 C 116 40, 124 66, 130 88 C 140 120, 130 164, 100 164 C 70 164, 60 120, 70 88 C 76 66, 84 40, 100 40 Z" fill="url(#g)"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="1.4" fill="#1F331D" opacity=".45"/>' for x, y in [(92,70),(108,76),(84,96),(104,100),(120,108),(90,122),(110,130),(96,146),(118,140)])
  + stem(100, 42, 10, 4, '#5F4A3B') + hl(84, 100, 10, 26, -8))

# 17 · pera
ITEMS['pera'] = svg(grad('g','#C9DA8C','#7E9E4E', cx=.38, cy=.4),
  '<path d="M100 48 C 112 48, 112 72, 122 92 C 134 112, 150 122, 150 138 C 150 158, 124 166, 100 166 C 76 166, 50 158, 50 138 C 50 122, 66 112, 78 92 C 88 72, 88 48, 100 48 Z" fill="url(#g)"/>'
  + stem(100, 50, 20, 4) + leaf(103, 40, 24, 9, -25) + hl(80, 120, 12, 20, -10))

# 18 · pimiento
ITEMS['pimiento'] = svg(grad('g','#E9635A','#B02E2C', cx=.35, cy=.3),
  '<path d="M60 74 C 60 58, 84 56, 100 62 C 116 56, 140 58, 140 74 C 156 90, 154 140, 134 156 C 124 164, 112 158, 100 160 C 88 158, 76 164, 66 156 C 46 140, 44 90, 60 74 Z" fill="url(#g)"/>'
  '<path d="M84 66 C 80 100, 80 130, 88 158 M116 66 C 120 100, 120 130, 112 158" stroke="#8C1F1F" stroke-width="3" fill="none" opacity=".35"/>'
  + stem(100, 62, 18, 6, '#5A8A4B') + hl(74, 96, 10, 24, -8))

# 19 · mango
ITEMS['mango'] = svg(lgrad('g', [(0,'#C9C25A'),(.35,'#F2C14E'),(.7,'#E9853C'),(1,'#C94B45')], 0, 0, 1, 1),
  '<path d="M58 84 C 54 56, 92 40, 124 52 C 154 64, 162 112, 144 140 C 126 168, 84 172, 62 150 C 44 132, 48 108, 58 84 Z" fill="url(#g)"/>'
  + stem(60, 84, 12, 4, '#5F4A3B') + hl(84, 84, 16, 12, -35))

# 20 · banana
ITEMS['banana'] = svg(lgrad('g', [(0,'#F5DE74'),(1,'#D9AE2E')], 0, 0, 0, 1),
  '<path d="M42 78 C 40 70, 50 66, 54 74 C 70 112, 100 136, 142 140 C 158 141, 160 154, 148 158 C 96 170, 52 130, 42 78 Z" fill="url(#g)"/>'
  '<path d="M52 82 C 66 118, 98 142, 142 146" stroke="#C99B22" stroke-width="2" fill="none" opacity=".5"/>'
  '<path d="M148 158 C 156 152, 160 148, 162 144" stroke="#6B4A22" stroke-width="6" stroke-linecap="round"/>'
  '<circle cx="48" cy="72" r="5" fill="#6B4A22" opacity=".7"/>' + hl(70, 96, 6, 18, -50))

# 21 · zanahoria
ITEMS['zanahoria'] = svg(lgrad('g', [(0,'#F0A04B'),(1,'#D6691F')], 0, 0, 1, 0),
  '<path d="M66 66 C 78 60, 100 62, 118 72 C 144 88, 154 122, 156 156 C 150 146, 124 120, 100 104 C 82 92, 70 80, 66 66 Z" fill="url(#g)"/>'
  '<path d="M96 88 q 6 -4 12 2 M112 104 q 6 -4 12 2 M128 122 q 6 -4 12 2" stroke="#B85615" stroke-width="2" fill="none" opacity=".5"/>'
  + leaf(62, 62, 30, 9, -120) + leaf(62, 62, 34, 9, -150) + leaf(62, 62, 30, 9, -90) + hl(96, 82, 6, 14, 40))

# 22 · papaya
ITEMS['papaya'] = svg(lgrad('g', [(0,'#B9C96B'),(.5,'#F0B54C'),(1,'#E48A3E')], 0, 0, 0, 1),
  '<path d="M100 40 C 120 40, 130 70, 134 96 C 140 128, 132 166, 100 166 C 68 166, 60 128, 66 96 C 70 70, 80 40, 100 40 Z" fill="url(#g)"/>'
  '<path d="M100 44 C 100 90, 100 130, 100 162" stroke="#B87A2E" stroke-width="2" fill="none" opacity=".25"/>'
  + stem(100, 42, 8, 4, '#6B7A4A') + hl(84, 96, 10, 26, -6))

# 23 · berenjena
ITEMS['berenjena'] = svg(grad('g','#7A5A93','#2E1B45', cx=.38, cy=.4, r=.8),
  '<path d="M96 52 C 110 52, 116 78, 124 104 C 134 134, 140 166, 106 168 C 72 170, 58 144, 66 108 C 72 82, 82 52, 96 52 Z" fill="url(#g)"/>'
  + leaf(96, 56, 26, 8, -30, '#6F9A5E', '#4F7A4A') + leaf(96, 56, 24, 8, -150, '#6F9A5E', '#4F7A4A') + leaf(96, 56, 20, 7, 90, '#6F9A5E', '#4F7A4A')
  + stem(96, 54, 18, 5, '#5A8A4B') + hl(84, 110, 10, 26, -12))

# 24 · mazorca de maíz
_k = ''.join(f'<ellipse cx="{x}" cy="{y}" rx="6" ry="7" fill="#F2D35A" stroke="#D9AE2E" stroke-width="1"/>' for y in range(64, 150, 14) for x in range(84, 121, 12))
ITEMS['mazorca'] = svg(lgrad('g', [(0,'#F6DF7A'),(1,'#E2B63A')], 0, 0, 1, 0),
  '<path d="M78 60 C 78 40, 122 40, 122 60 L 122 150 C 122 166, 78 166, 78 150 Z" fill="url(#g)"/>' + _k
  + '<path d="M78 90 C 60 120, 56 150, 64 168 C 76 158, 82 140, 82 120 Z" fill="#7FA56B"/><path d="M122 90 C 140 120, 144 150, 136 168 C 124 158, 118 140, 118 120 Z" fill="#6F9A5E"/>'
  + '<path d="M62 168 C 70 150, 76 130, 78 100" stroke="#4F7A4A" stroke-width="1.5" fill="none" opacity=".6"/><path d="M138 168 C 130 150, 124 130, 122 100" stroke="#4F7A4A" stroke-width="1.5" fill="none" opacity=".6"/>')

# 25 · puerro
ITEMS['puerro'] = svg(lgrad('g', [(0,'#F6F1E3'),(.45,'#DDE6C4'),(1,'#5E8A5E')], 0, 1, 0, 0),
  '<path d="M88 168 L 88 96 C 88 80, 80 60, 70 40 L 84 44 L 92 36 L 100 46 L 108 36 L 116 44 L 130 40 C 120 60, 112 80, 112 96 L 112 168 Z" fill="url(#g)"/>'
  '<path d="M96 168 L 96 96 C 96 76, 92 60, 88 46 M104 168 L 104 96 C 104 76, 108 60, 112 46" stroke="#9FB98A" stroke-width="1.5" fill="none" opacity=".7"/>'
  '<path d="M84 170 q 16 4 32 0" stroke="#C9B98A" stroke-width="3" fill="none" stroke-linecap="round"/>')

# 26 · lechuga romana
ITEMS['lechuga'] = svg(grad('g','#BFD98A','#5E8A4A', cx=.4, cy=.5, r=.7),
  '<path d="M100 42 C 126 50, 146 82, 146 118 C 146 150, 124 166, 100 166 C 76 166, 54 150, 54 118 C 54 82, 74 50, 100 42 Z" fill="url(#g)"/>'
  '<path d="M84 60 C 74 90, 74 130, 84 160 M116 60 C 126 90, 126 130, 116 160 M100 46 C 100 90, 100 130, 100 164" stroke="#EAF2C8" stroke-width="3" fill="none" opacity=".6"/>'
  '<path d="M68 76 C 60 100, 62 140, 76 160 M132 76 C 140 100, 138 140, 124 160" stroke="#4F7A4A" stroke-width="2" fill="none" opacity=".5"/>')

# 27 · acelga
ITEMS['acelga'] = svg(grad('g','#5E9A4E','#2F5E33', cx=.4, cy=.4, r=.8),
  '<path d="M100 36 C 132 40, 154 74, 150 110 C 146 134, 124 142, 108 132 L 108 168 L 92 168 L 92 132 C 76 142, 54 134, 50 110 C 46 74, 68 40, 100 36 Z" fill="url(#g)"/>'
  '<path d="M100 40 L 100 132 M100 70 C 116 74, 130 88, 138 106 M100 70 C 84 74, 70 88, 62 106 M100 96 C 112 100, 122 110, 128 122 M100 96 C 88 100, 78 110, 72 122" stroke="#F3E6CF" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/>'
  '<path d="M92 132 L 92 168 L 108 168 L 108 132 Z" fill="#F3E6CF"/><path d="M100 134 L 100 166" stroke="#D9C4A0" stroke-width="1.5"/>', shadow=True)

# 28 · repollo
ITEMS['repollo'] = svg(grad('g','#C3D5B0','#6F9A6B', cx=.4, cy=.4, r=.75),
  '<circle cx="100" cy="106" r="58" fill="url(#g)"/>'
  '<path d="M46 98 C 60 70, 90 60, 100 48 C 110 60, 140 70, 154 98" stroke="#EAF2DC" stroke-width="3" fill="none" opacity=".7"/>'
  '<path d="M100 48 C 100 90, 100 130, 100 164 M100 80 C 84 90, 72 108, 66 130 M100 80 C 116 90, 128 108, 134 130 M100 110 C 90 120, 84 136, 82 154 M100 110 C 110 120, 116 136, 118 154" stroke="#EAF2DC" stroke-width="2.5" fill="none" opacity=".75"/>'
  '<path d="M52 120 C 40 96, 48 76, 62 66 C 56 86, 56 104, 60 122 Z M148 120 C 160 96, 152 76, 138 66 C 144 86, 144 104, 140 122 Z" fill="#5E8A5E" opacity=".8"/>' + hl(78, 84, 14, 10, -25))

# 29 · piña
_pd = ''.join(f'<path d="M{x} {y} l 9 9 l -9 9 l -9 -9 z" fill="none" stroke="#B57A22" stroke-width="1.6" opacity=".7"/>' for y in range(82, 160, 18) for x in range(70, 132, 18)) + ''.join(f'<path d="M{x} {y} l 9 9 l -9 9 l -9 -9 z" fill="none" stroke="#B57A22" stroke-width="1.6" opacity=".7"/>' for y in range(91, 152, 18) for x in range(79, 123, 18))
ITEMS['pina'] = svg(grad('g','#F0C25A','#C07A22', cx=.4, cy=.4, r=.8),
  '<ellipse cx="100" cy="122" rx="40" ry="48" fill="url(#g)"/><clipPath id="c"><ellipse cx="100" cy="122" rx="40" ry="48"/></clipPath><g clip-path="url(#c)">' + _pd + '</g>'
  + ''.join(leaf(100, 80, w, h, r, '#6F9A5E', '#3F6A3F') for w, h, r in [(46,8,-90),(40,8,-70),(40,8,-110),(34,8,-50),(34,8,-130),(28,7,-30),(28,7,-150)]))

# 30 · melón cantalupo
ITEMS['cantalupo'] = svg(grad('g','#E8D4A2','#A88A52', cx=.38, cy=.36),
  '<circle cx="100" cy="106" r="58" fill="url(#g)"/>'
  '<path d="M100 48 C 100 90, 100 130, 100 164 M64 60 C 70 100, 70 130, 66 152 M136 60 C 130 100, 130 130, 134 152" stroke="#8E7040" stroke-width="2" fill="none" opacity=".35"/>'
  + ''.join(f'<path d="M{x} {y} q 5 -3 10 0 q -5 3 -10 0" fill="none" stroke="#7A5E32" stroke-width="1.1" opacity=".35"/>' for x, y in [(78,80),(96,74),(114,80),(128,94),(70,100),(88,96),(106,98),(122,112),(80,120),(98,118),(114,128),(72,136),(90,140),(108,146),(126,138)])
  + hl(78, 82, 14, 10, -25))

# 31 · coliflor
_fl = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#g)"/>' for x, y, r in [(100,72,20),(74,86,18),(126,86,18),(60,108,16),(140,108,16),(86,104,18),(114,104,18),(100,124,20),(72,128,15),(128,128,15)])
ITEMS['coliflor'] = svg(grad('g','#FBF6EA','#D8CBB0', cx=.4, cy=.35),
  '<path d="M44 130 C 40 150, 60 166, 100 166 C 140 166, 160 150, 156 130 Z" fill="#7FA56B"/><path d="M58 138 C 70 150, 90 156, 100 156 C 110 156, 130 150, 142 138" stroke="#4F7A4A" stroke-width="2" fill="none" opacity=".6"/>' + _fl + hl(84, 76, 10, 8, -25, .5))

# 32 · calabaza pequeña
def calabaza(c1, c2, ry=44, rx=62, cy=112):
    ribs = ''.join(f'<path d="M{100+dx} {cy-ry+6} C {100+dx*1.35} {cy}, {100+dx*1.35} {cy}, {100+dx} {cy+ry-6}" stroke="#9A4A14" stroke-width="2.5" fill="none" opacity=".35"/>' for dx in [-32,-14,4,22])
    return svg(grad('g', c1, c2, cx=.38, cy=.35),
      f'<ellipse cx="100" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#g)"/>' + ribs
      + f'<path d="M100 {cy-ry+2} C 92 {cy-ry-4}, 92 {cy-ry-16}, 98 {cy-ry-24} L 106 {cy-ry-22} C 104 {cy-ry-12}, 106 {cy-ry-6}, 108 {cy-ry+2} Z" fill="#6B5237"/>'
      + hl(72, cy-18, 14, 10, -25))
ITEMS['calabaza-pequena'] = calabaza('#F2A85B','#C55E1C', ry=40, rx=50, cy=116)
ITEMS['calabaza'] = calabaza('#EF9A48','#B24E14', ry=46, rx=66, cy=112)

# 33 · melón galia
ITEMS['melon-galia'] = svg(grad('g','#E6E39A','#9AA84E', cx=.38, cy=.36),
  '<circle cx="100" cy="106" r="58" fill="url(#g)"/>'
  + ''.join(f'<path d="M{x} {y} l 6 -4 l 6 4 l -6 4 z" fill="none" stroke="#7E8A36" stroke-width="1.1" opacity=".45"/>' for y in range(60, 156, 12) for x in range(58, 140, 12) if (x-100)**2 + (y-106)**2 < 52**2)
  + hl(78, 82, 14, 10, -25))

# 34 · sandía (entera)
ITEMS['sandia'] = svg(grad('g','#7FB56A','#2F6B3A', cx=.38, cy=.36),
  '<circle cx="100" cy="106" r="60" fill="url(#g)"/><clipPath id="c"><circle cx="100" cy="106" r="60"/></clipPath>'
  '<g clip-path="url(#c)">' + ''.join(f'<path d="M{x} 40 C {x-14} 80, {x-14} 130, {x} 175" stroke="#1F4A2A" stroke-width="9" fill="none" opacity=".55"/>' for x in [62, 86, 110, 134, 158]) + '</g>'
  + stem(100, 48, 10, 5, '#6B5237') + hl(76, 82, 14, 10, -25))

# 1-3 · célula / blastocisto: esfera translúcida con un racimo de células dentro
ITEMS['celula'] = svg(grad('g','#F2E4EC','#B98FB0', cx=.4, cy=.36) + grad('n','#C9A3C4','#7E5A8A', cx=.4, cy=.35),
  '<circle cx="100" cy="106" r="56" fill="url(#g)"/><circle cx="100" cy="106" r="56" fill="none" stroke="#8E6A98" stroke-width="3" opacity=".55"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#n)" opacity=".92"/>' for x, y, r in [(90,96,13),(108,94,12),(96,112,12),(112,110,11),(101,103,9)])
  + hl(80, 82, 16, 10, -30, .5))

for k, s in ITEMS.items():
    open(os.path.join(OUT, f'{k}.svg'), 'w').write(s)
print(len(ITEMS), 'svg escritos en', OUT)
