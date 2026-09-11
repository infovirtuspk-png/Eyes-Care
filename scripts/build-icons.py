import os
from PIL import Image

src_img_path = r"C:\Users\OFFICE\.gemini\antigravity-ide\brain\d2ab715a-c3b4-47c5-83bf-b7fa7eee570a\eyes_care_icon_1789113658342.jpg"
out_dir = r"g:\App\👁 Eyes Care\src\renderer\assets\icons"

os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_img_path).convert("RGBA")

# Save 256x256 and 512x512 PNG
img_256 = img.resize((256, 256), Image.Resampling.LANCZOS)
img_256.save(os.path.join(out_dir, "icon.png"), "PNG")

img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
img_32.save(os.path.join(out_dir, "tray-icon.png"), "PNG")

# Save ICO with multiple standard Windows sizes
ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
img_256.save(
    os.path.join(out_dir, "icon.ico"),
    format="ICO",
    sizes=ico_sizes
)

print("Generated icons successfully.")
