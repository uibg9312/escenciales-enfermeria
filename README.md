# Esenciales de Enfermería PWA

Aplicación web progresiva (PWA) con herramientas y recursos esenciales para profesionales de enfermería.

## Características

- Funciona offline
- Instalable como aplicación
- Interfaz responsive
- Herramientas médicas y calculadoras
- Base de datos NANDA

## Despliegue en GitHub Pages

1. Sube todo el contenido de este directorio a un repositorio de GitHub
2. Ve a Settings > Pages
3. En "Source", selecciona la rama principal (main o master)
4. En "Folder", selecciona "/ (root)"
5. Haz clic en "Save"

La aplicación estará disponible en: `https://[tu-usuario].github.io/[nombre-repositorio]/`

## Desarrollo Local

Para modificar los íconos o generar nuevos thumbnails:

1. Instala Python y las dependencias:
```bash
pip install -r requirements.txt
```

2. Ejecuta el generador de íconos:
```bash
python create_default_icon.py 