import os
import glob
from PIL import Image, ImageFilter

input_dir = "output_frames"
output_dir = "final_clean_frames"

# Make sure the output directory exists
os.makedirs(output_dir, exist_ok=True)

# Search for BOTH .png and .webp files
images = glob.glob(os.path.join(input_dir, "*.webp")) + glob.glob(os.path.join(input_dir, "*.png"))

print(f"Found {len(images)} frames to fix...")

if len(images) == 0:
    print(f"⚠️ Warning: No images found in '{input_dir}'.")
    print(f"Current directory contents: {os.listdir('.')}")
    if os.path.exists(input_dir):
        print(f"Contents of '{input_dir}': {os.listdir(input_dir)[:5]}... (showing first 5)")

for img_path in images:
    filename = os.path.basename(img_path)
    # Ensure the output filename uses .webp for maximum web optimization
    output_filename = os.path.splitext(filename)[0] + ".webp"
    
    img = Image.open(img_path).convert("RGBA")
    
    # Separate the image into RGB and Alpha channels
    r, g, b, a = img.split()
    
    # Erode the alpha channel mask slightly to shave off the outer dark boundary
    clean_alpha = a.filter(ImageFilter.MinFilter(3))
    
    # Recombine the original colors with our newly trimmed transparency mask
    final_img = Image.merge("RGBA", (r, g, b, clean_alpha))
    
    # Save the polished frame cleanly as a lossless WebP
    final_img.save(os.path.join(output_dir, output_filename), "WEBP", lossless=True)

if len(images) > 0:
    print("Done! All frames are perfectly trimmed in 'final_clean_frames'.")