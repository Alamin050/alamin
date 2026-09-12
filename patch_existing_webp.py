import os
import glob
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

target_dir = "public/final_clean_frames"
images = sorted(glob.glob(os.path.join(target_dir, "*.webp")))

print(f"Cleaning color artifacts and sealing alpha across {len(images)} frames...")

for img_path in images:
    filename = os.path.basename(img_path)
    img = Image.open(img_path).convert("RGBA")
    
    # Extract channels as NumPy arrays
    img_np = np.array(img)
    r = img_np[:, :, 0].astype(int)
    g = img_np[:, :, 1].astype(int)
    b = img_np[:, :, 2].astype(int)
    a = img_np[:, :, 3]

    # --- 1. REPAIR RGB COLOR ARTIFACTS ---
    # Detect purple/blue spikes (where Blue > Green + 15 or Red & Blue > Green + 25)
    is_blue_artifact = (b > g + 15) | (b > r + 15)
    is_purple_artifact = (r > g + 25) & (b > g + 25)
    artifact_mask = is_blue_artifact | is_purple_artifact

    # Replace artifact pixels with clean, natural dark shadow tone
    shadow_tone = np.minimum(r, g).astype(np.uint8)
    img_np[artifact_mask, 0] = shadow_tone[artifact_mask]
    img_np[artifact_mask, 1] = shadow_tone[artifact_mask]
    img_np[artifact_mask, 2] = shadow_tone[artifact_mask]

    # --- 2. SEAL ALPHA SILHOUETTE HOLES ---
    binary_mask = Image.fromarray(np.where(a > 10, 255, 0).astype(np.uint8))
    w, h = binary_mask.size
    padded = Image.new("L", (w + 2, h + 2), 0)
    padded.paste(binary_mask, (1, 1))
    
    ImageDraw.floodfill(padded, (0, 0), 128)
    floodfilled = padded.crop((1, 1, w + 1, h + 1))
    flood_array = np.array(floodfilled)
    
    # Outer background -> 0, Statue + filled holes -> 255
    solid_alpha_array = np.where(flood_array == 128, 0, 255).astype(np.uint8)
    clean_alpha = Image.fromarray(solid_alpha_array).filter(ImageFilter.MinFilter(3))

    # Recombine cleaned RGB channels with solid Alpha mask
    clean_rgb = Image.fromarray(img_np[:, :, :3])
    fixed_img = Image.merge("RGBA", (*clean_rgb.split(), clean_alpha))
    
    fixed_img.save(img_path, "WEBP", lossless=True)
    print(f"✅ Repaired colors & mask: {filename}")

print("\nComplete! All blue/purple patches cleaned and silhouettes sealed.")