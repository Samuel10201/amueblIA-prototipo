# AmueblIA — prototipo

AmueblIA te muestra un mueble en tu espacio y comprueba si cabe antes de que lo compres.

Este prototipo es una demostración con un catálogo cerrado de 3 espacios y 3 muebles. El usuario
elige un espacio y un mueble, y la app muestra el veredicto (cabe, justo, no cabe o necesitamos
otra foto), la comparación de ancho y fondo, el antes y el después del espacio y la ficha de compra
del mueble. Cuando no cabe o la foto no sirve, no se genera imagen.

## Cómo abrirlo
- En línea: https://samuel10201.github.io/amueblIA-prototipo/
- En local: abrir `index.html` con doble clic. No necesita instalar nada.

## Qué es real y qué está simulado
| Real | Simulado |
|---|---|
| Elección de espacio y mueble | Las imágenes compuestas se hicieron antes con IA, no en vivo |
| Comparación de medidas y veredicto | Las medidas de los espacios, y si la foto sirve, se evaluaron a mano |
| Enlace a la tienda del mueble | La animación de "análisis" |

## Estructura
- `index.html`: la página.
- `estilos.css`: el diseño (tema claro y oscuro).
- `datos.js`: el catálogo (espacios, muebles y veredicto de cada combinación). Es el único archivo
  que hay que tocar para cambiar imágenes o datos.
- `app.js`: la lógica de la interfaz.
- `imagenes/`: espacios vacíos, fotos de producto y composiciones.

## Créditos de imágenes
- Espacios: fotos de apartamentos vacíos tomadas de internet, recortadas a 3:2.
- Productos: fotos de las páginas de cada tienda (Jamar, Castor Muebles y Homecenter).
- Composiciones (mueble en el espacio): generadas con IA a partir de las dos fotos anteriores.

## Uso de inteligencia artificial
Las composiciones se generaron con IA, y el prototipo (la página y su código) se desarrolló con
asistencia de IA.
