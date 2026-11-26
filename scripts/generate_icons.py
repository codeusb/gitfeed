import subprocess
import os
from PIL import Image

# 1. Generate 1024x1024 SVG with white background and Royal Blue (#2563EB) Snail icon
svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#FFFFFF"/>
  <!-- Center 640x640 snail (scale 640/24 = 26.6667, translate (1024-640)/2 = 192) -->
  <g transform="translate(192, 192) scale(26.666667)"
     fill="none"
     stroke="#2563EB"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
    <path d="M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0" />
    <circle cx="10" cy="13" r="8" />
    <path d="M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6" />
    <path d="M18 3 19.1 5.2" />
    <path d="M22 3 20.9 5.2" />
  </g>
</svg>'''

svg_path = '/tmp/snail_icon.svg'
master_png = '/tmp/snail_master.png'

with open(svg_path, 'w') as f:
    f.write(svg_content)

# Render with Chrome headless
chrome_bin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
cmd = [
    chrome_bin,
    '--headless',
    '--disable-gpu',
    '--force-device-scale-factor=1',
    '--window-size=1024,1024',
    f'--screenshot={master_png}',
    svg_path
]
subprocess.run(cmd, check=True)

# Load master PNG and verify dimensions
img = Image.open(master_png).convert('RGBA')
if img.size != (1024, 1024):
    img = img.crop((0, 0, 1024, 1024))

sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

base_res_dir = 'mobile/android/app/src/main/res'

for folder, size in sizes.items():
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    # Save as RGB/RGBA PNG
    launcher_path = os.path.join(base_res_dir, folder, 'ic_launcher.png')
    round_path = os.path.join(base_res_dir, folder, 'ic_launcher_round.png')
    resized.save(launcher_path, 'PNG', optimize=True)
    resized.save(round_path, 'PNG', optimize=True)
    print(f"Generated {size}x{size} for {folder}")

# Also copy master to artifacts directory for preview
artifact_preview = '/Users/daixiaofeng/.gemini/antigravity/brain/67b56b31-4b67-41e6-a1e9-9aec047acc58/snail_icon_preview.png'
img.resize((512, 512), Image.Resampling.LANCZOS).save(artifact_preview, 'PNG')
print("Done! Artifact preview saved to:", artifact_preview)
