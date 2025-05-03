import os
from PIL import Image

def create_thumbnails(source_dir, output_dir, sizes):
    """
    Create thumbnails for images in the source directory
    
    Args:
        source_dir (str): Directory containing source images
        output_dir (str): Directory where thumbnails will be saved
        sizes (list): List of tuples containing (width, height) for thumbnails
    """
    # Create output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Supported image formats
    supported_formats = ['.jpg', '.jpeg', '.png', '.webp']
    
    # Process each file in the source directory
    for filename in os.listdir(source_dir):
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext in supported_formats:
            input_path = os.path.join(source_dir, filename)
            
            try:
                with Image.open(input_path) as img:
                    # Convert to RGB if necessary
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    
                    # Generate thumbnails for each size
                    for width, height in sizes:
                        # Calculate proportional height if height is None
                        if height is None:
                            ratio = width / img.size[0]
                            height = int(img.size[1] * ratio)
                        
                        # Resize image
                        thumbnail = img.copy()
                        thumbnail.thumbnail((width, height), Image.Resampling.LANCZOS)
                        
                        # Generate output filename
                        name, ext = os.path.splitext(filename)
                        output_filename = f"{name}_{width}x{height}{ext}"
                        output_path = os.path.join(output_dir, output_filename)
                        
                        # Save thumbnail
                        thumbnail.save(output_path, quality=85, optimize=True)
                        print(f"Created thumbnail: {output_filename}")
                        
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")

if __name__ == "__main__":
    # Define paths
    source_directory = "Enfermeria/Progressive Web App (PWA)/images"
    thumbnails_directory = "Enfermeria/Progressive Web App (PWA)/images/thumbnails"
    
    # Define thumbnail sizes (width, height)
    # Height can be None for proportional scaling
    thumbnail_sizes = [
        (192, 192),  # For PWA icons
        (512, 512),  # For PWA splash screen
        (256, None), # For content thumbnails
        (128, None), # For smaller content thumbnails
    ]
    
    # Create thumbnails
    create_thumbnails(source_directory, thumbnails_directory, thumbnail_sizes) 