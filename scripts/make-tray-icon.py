import os
import numpy as np
from PIL import Image

src_path = r"C:\Users\OFFICE\.gemini\antigravity-ide\brain\d2ab715a-c3b4-47c5-83bf-b7fa7eee570a\eyes_care_tray_icon_1789114450188.jpg"
out_dir = r"g:\App\👁 Eyes Care\src\renderer\assets\icons"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert("RGB")
arr = np.array(img, dtype=np.float32)

# Calculate luminance / max color intensity for alpha channel
r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
# Eye is cyan/blue, so max(r,g,b) gives perfect glow coverage
intensity = np.maximum(np.maximum(r, g), b)

# Threshold & smooth curve for transparency
# Anything below 15 is black (alpha=0), smoothly increasing to 255
alpha = np.clip((intensity - 12.0) * (255.0 / (255.0 - 12.0)), 0, 255)

# Boost cyan/blue vibrance slightly so it pops on dark & light taskbars
r_out = np.clip(r * 1.1, 0, 255)
g_out = np.clip(g * 1.15, 0, 255)
b_out = np.clip(b * 1.2, 0, 255)

rgba_arr = np.dstack([r_out, g_out, b_out, alpha]).astype(np.uint8)
transparent_img = Image.fromarray(rgba_arr, mode="RGBA")

# Find bounding box of non-transparent pixels
bbox = transparent_img.getbbox()
if bbox:
    cropped = transparent_img.crop(bbox)
    # Make square with padding
    w, h = cropped.size
    max_dim = max(w, h)
    padding = int(max_dim * 0.15)
    target_dim = max_dim + padding * 2
    
    square_img = Image.new("RGBA", (target_dim, target_dim), (0, 0, 0, 0))
    offset_x = (target_dim - w) // 2
    offset_y = (target_dim - h) // 2
    square_img.paste(cropped, (offset_x, offset_y), cropped)
else:
    square_img = transparent_img

# Save various tray icon formats
# 1. 32x32 and 16x16 PNG for electron tray
tray_32 = square_img.resize((32, 32), Image.Resampling.LANCZOS)
tray_32.save(os.path.join(out_dir, "tray-icon.png"), "PNG")

tray_16 = square_img.resize((16, 16), Image.Resampling.LANCZOS)
tray_16.save(os.path.join(out_dir, "tray-icon-16.png"), "PNG")

# 2. Tray ICO file
tray_sizes = [(64, 64), (48, 48), (32, 32), (24, 24), (16, 16)]
square_img.resize((64, 64), Image.Resampling.LANCZOS).save(
    os.path.join(out_dir, "tray-icon.ico"),
    format="ICO",
    sizes=tray_sizes
)

# 3. Main App Icon PNG (256x256, 512x512)
app_icon_256 = square_img.resize((256, 256), Image.Resampling.LANCZOS)
app_icon_256.save(os.path.join(out_dir, "icon.png"), "PNG")

# 4. Main App ICO (multi-resolution 256, 128, 64, 48, 32, 16)
app_ico_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
app_icon_256.save(
    os.path.join(out_dir, "icon.ico"),
    format="ICO",
    sizes=app_ico_sizes
)

print("Tray icon and application icons generated successfully.")
