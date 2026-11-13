// Catálogo del prototipo. Es el ÚNICO archivo que se edita al cambiar imágenes o datos.
// Las medidas de los espacios son ESTIMACIONES hechas a mano a partir de referencias visibles
// en cada foto (puertas de ~2,0 m de alto y ~0,8 m de ancho, mesones de ~0,9 m, tomacorrientes,
// altura de techo de ~2,3 m en vivienda colombiana). Las de los muebles son las de la tienda.
// Precios consultados el 13-11-2026.

const CATALOGO = {
  espacios: [
    {
      id: "espacio-1",
      nombre: "Sala comedor amplia",
      descripcion: "Sala comedor abierta a la cocina, con ventanal al balcón",
      ubicacion: "la pared blanca entre el pasillo y el ventanal",
      paredLibreCm: 400, // referencia: puerta del fondo (~2,0 m) y mesón de la cocina (~0,9 m)
      fondoLibreCm: 380,
      imagen: "imagenes/espacios/espacio-1.jpg",
    },
    {
      id: "espacio-2",
      nombre: "Sala de apartamento",
      descripcion: "Sala pequeña con ventana de piso a techo",
      ubicacion: "la pared lateral izquierda",
      paredLibreCm: 300, // referencia: altura de techo (~2,3 m) en la pared de la ventana
      fondoLibreCm: 230, // ancho de la sala, de la pared izquierda a la columna
      imagen: "imagenes/espacios/espacio-2.jpg",
    },
    {
      id: "espacio-3",
      nombre: "Habitación pequeña",
      descripcion: "Habitación con ventana al fondo y puerta que abre hacia adentro",
      ubicacion: "la pared de la ventana",
      paredLibreCm: 200, // estimación de Samuel (13-11): pared de la ventana de ~2,0 m
      fondoLibreCm: 110, // habitación de ~1,9 m de largo menos el giro de la puerta (~0,8 m)
      imagen: "imagenes/espacios/espacio-3.jpg",
    },
  ],

  muebles: [
    {
      id: "mueble-1",
      nombre: "Juego de sala Dalton (sofá, butaco y mesa)",
      tienda: "Jamar",
      precioCop: 3989000,
      medidasCm: { ancho: 180, fondo: 135, alto: 90 }, // armado en L: sofá 180 × 75 + butaco 60 × 75; la mesa va dentro de la L
      enlace: "https://www.jamar.com/products/juego-de-sala-dalton-eurolino-vitore-trigo-natural-7033994",
      imagen: "imagenes/muebles/mueble-1.jpg",
    },
    {
      id: "mueble-2",
      nombre: "Escritorio Tokyo",
      tienda: "Castor Muebles",
      precioCop: 1290000,
      medidasCm: { ancho: 100, fondo: 50, alto: 77 },
      enlace: "https://castormya.co/collections/escritorios/products/escritorio-tokyo-hogar-muebles",
      imagen: "imagenes/muebles/mueble-2.jpg",
    },
    {
      id: "mueble-3",
      nombre: "Clóset Casa Bonita de 6 puertas",
      tienda: "Homecenter",
      precioCop: 359900, // precio de oferta (normal: $899.900)
      medidasCm: { ancho: 138, fondo: 40, alto: 174 },
      enlace: "https://www.homecenter.com.co/homecenter-co/product/890483/closet-138x174x40-cm-cafe-1-cajones-6-puertas-casa-bonita/890483/",
      imagen: "imagenes/muebles/mueble-3.jpg",
    },
  ],

  // Indicaciones que se muestran cuando la foto no permite medir el espacio.
  consejosFoto: [
    "Párate de frente a la pared donde irá el mueble, no en diagonal.",
    "Que la pared se vea completa, de esquina a esquina, con algo de piso y de techo.",
    "Toma la foto a la altura del pecho y sin gran angular (zoom 1×).",
    "Que nada tape la pared ni el piso delante de ella: mesones, puertas abiertas, cajas.",
    "Deja a la vista una referencia de tamaño, como una puerta, una ventana o un tomacorriente.",
    "Usa buena luz: de día o con las luces encendidas.",
  ],

  // Clave: "<espacio>__<mueble>". imagen es null cuando el veredicto es "no-cabe" o "foto-inadecuada".
  combinaciones: {
    "espacio-1__mueble-1": {
      veredicto: "cabe",
      explicacion: "El juego ocupa 1,80 m de los ~4 m de la pared y deja más de 2 m libres al frente.",
      imagen: "imagenes/combinaciones/espacio-1__mueble-1.jpg",
    },
    "espacio-1__mueble-2": {
      veredicto: "cabe",
      explicacion: "El escritorio ocupa 1 m de la pared y deja libre el paso al balcón.",
      imagen: "imagenes/combinaciones/espacio-1__mueble-2.jpg",
    },
    "espacio-1__mueble-3": {
      veredicto: "cabe",
      explicacion: "El clóset ocupa 1,38 m de los ~4 m de la pared y su altura queda por debajo del techo.",
      imagen: "imagenes/combinaciones/espacio-1__mueble-3.jpg",
    },
    "espacio-2__mueble-1": {
      veredicto: "justo",
      explicacion: "El sofá ocupa 1,80 m de los ~2,30 m frente a la ventana: quedan unos 50 cm junto a la columna, un paso estrecho. Cabe, pero la sala queda llena.",
      ubicacion: "frente a la ventana, con el butaco hacia la entrada",
      paredLibreCm: 230, // ancho de la sala (pared de la ventana)
      fondoLibreCm: 300, // largo de la sala, de la ventana al mesón
      imagen: "imagenes/combinaciones/espacio-2__mueble-1.jpg",
    },
    "espacio-2__mueble-2": {
      veredicto: "cabe",
      explicacion: "El escritorio entra en la pared lateral y deja casi 1,8 m de paso.",
      imagen: "imagenes/combinaciones/espacio-2__mueble-2.jpg",
    },
    "espacio-2__mueble-3": {
      veredicto: "cabe",
      explicacion: "El clóset entra en la pared lateral, junto a la ventana, y deja 1,9 m de paso.",
      imagen: "imagenes/combinaciones/espacio-2__mueble-3.jpg",
    },
    "espacio-3__mueble-1": {
      veredicto: "no-cabe",
      explicacion: "De ancho entra (1,80 m en ~2 m), pero en L ocupa 1,35 m de fondo y solo hay ~1,10 m antes del giro de la puerta: la puerta ya no abriría por completo.",
      imagen: null,
    },
    "espacio-3__mueble-2": {
      veredicto: "cabe",
      explicacion: "Entra bajo la ventana: ocupa 1 m de la pared y 50 cm de fondo, y deja libre el giro de la puerta.",
      imagen: "imagenes/combinaciones/espacio-3__mueble-2.jpg",
    },
    "espacio-3__mueble-3": {
      veredicto: "foto-inadecuada",
      explicacion: "El clóset iría en la pared de la izquierda, pero en esta foto esa pared se ve muy de lado y queda cortada por el borde: no podemos medirla. La pared de la ventana no sirve, porque el clóset la taparía.",
      imagen: null,
    },
  },
};
