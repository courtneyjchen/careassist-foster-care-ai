import cairosvg

html_path = r'c:\Users\Samantha Townsend\Downloads\v4_architecture_diagram.html'
png_path = r'c:\Users\Samantha Townsend\Downloads\v4_architecture_diagram.png'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

start = html.index('<svg')
end = html.index('</svg>') + 6
svg = html[start:end]

svg = '<?xml version="1.0" encoding="UTF-8"?>' + svg

cairosvg.svg2png(bytestring=svg.encode('utf-8'), write_to=png_path, scale=2)
print('PNG saved to', png_path)
