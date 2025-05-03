from PIL import Image, ImageDraw, ImageFont
import os

def create_default_icon():
    # Definir el tamaño de la imagen base
    size = (512, 512)
    
    # Crear una nueva imagen con fondo blanco
    image = Image.new('RGB', size, '#2c5282')  # Usando el color azul del tema
    draw = ImageDraw.Draw(image)
    
    # Dibujar un círculo blanco
    margin = 50
    circle_bbox = (margin, margin, size[0] - margin, size[1] - margin)
    draw.ellipse(circle_bbox, fill='white')
    
    # Dibujar una cruz roja
    cross_color = '#e53e3e'  # Rojo
    cross_width = 60
    # Cruz horizontal
    draw.rectangle([
        size[0]//2 - size[0]//4, 
        size[1]//2 - cross_width//2,
        size[0]//2 + size[0]//4, 
        size[1]//2 + cross_width//2
    ], fill=cross_color)
    # Cruz vertical
    draw.rectangle([
        size[0]//2 - cross_width//2,
        size[1]//2 - size[1]//4,
        size[0]//2 + cross_width//2,
        size[1]//2 + size[1]//4
    ], fill=cross_color)
    
    # Asegurarse de que existe el directorio
    os.makedirs("Enfermeria/Progressive Web App (PWA)/images", exist_ok=True)
    
    # Guardar la imagen
    icon_path = "Enfermeria/Progressive Web App (PWA)/images/icon.png"
    image.save(icon_path, 'PNG', quality=95)
    print(f"Icono creado en: {icon_path}")
    return icon_path

if __name__ == "__main__":
    # Crear el ícono
    create_default_icon()
    
    # Importar y ejecutar el generador de thumbnails
    import generate_thumbnails
    generate_thumbnails.create_thumbnails(
        "Enfermeria/Progressive Web App (PWA)/images",
        "Enfermeria/Progressive Web App (PWA)/images/thumbnails",
        [
            (192, 192),  # Para íconos PWA
            (512, 512),  # Para pantalla de inicio
            (256, None), # Para thumbnails de contenido
            (128, None), # Para thumbnails pequeños
        ]
    ) 