// Lógica del prototipo: selección, análisis simulado y resultado.
// Solo LEE el CATALOGO de datos.js; nunca lo modifica.

const DURACION_PASO_MS = 650;
const PASOS_ANALISIS = ["Revisando la foto", "Midiendo el espacio", "Comprobando si el mueble cabe", "Ubicando el mueble en tu espacio"];
// Veredictos que detienen el análisis: en qué paso (contado desde 1) y con qué marca.
const PARADA_ANALISIS = {
  "foto-inadecuada": { paso: 2, tipo: "aviso" },
  "no-cabe": { paso: 3, tipo: "fallo" },
};
const TEXTO_VEREDICTO = {
  cabe: { titulo: "Cabe", clase: "veredicto-cabe", icono: "check" },
  justo: { titulo: "Cabe, pero justo", clase: "veredicto-justo", icono: "alerta" },
  "no-cabe": { titulo: "No cabe", clase: "veredicto-no-cabe", icono: "equis" },
  "foto-inadecuada": { titulo: "Necesitamos otra foto", clase: "veredicto-justo", icono: "alerta" },
};
const ICONOS = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  equis: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  alerta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.1"/></svg>',
  subir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V5M7 10l5-5 5 5M5 19h14"/></svg>',
  externo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5"/></svg>',
};

const estado = { espacioId: null, muebleId: null, temporizadores: [], animacionCorte: null };
const formatoPesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const $ = (id) => document.getElementById(id);
const buscarEspacio = (id) => CATALOGO.espacios.find((e) => e.id === id);
const buscarMueble = (id) => CATALOGO.muebles.find((m) => m.id === id);
const claveCombinacion = (espacioId, muebleId) => `${espacioId}__${muebleId}`;
const formatoMetros = (cm) => `${(cm / 100).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
const formatoCm = (cm) => cm.toLocaleString("es-CO");
const formatoPrecio = (cop) => (cop == null ? "Precio por confirmar" : formatoPesos.format(cop));
const textoMedidas = ({ ancho, fondo, alto }) => `${formatoCm(ancho)} × ${formatoCm(fondo)} × ${formatoCm(alto)} cm`;

// Crea un <img> que, si la ruta falla, se reemplaza por un aviso visible (nunca en silencio).
function crearImagen(ruta, alt, clase = "") {
  const img = document.createElement("img");
  img.src = ruta;
  img.alt = alt;
  img.className = clase;
  img.addEventListener("error", () => {
    console.error(`Imagen no disponible: ${ruta}`);
    const aviso = document.createElement("div");
    aviso.className = `imagen-faltante ${clase}`;
    aviso.textContent = `Imagen no disponible: ${ruta}`;
    img.replaceWith(aviso);
  });
  return img;
}

function crearTarjeta({ seleccionada, imagen, alt, titulo, detalle, alPulsar }) {
  const tarjeta = document.createElement("button");
  tarjeta.type = "button";
  tarjeta.className = "tarjeta";
  tarjeta.setAttribute("aria-pressed", seleccionada ? "true" : "false");
  const marco = document.createElement("div");
  marco.className = "tarjeta-imagen";
  marco.appendChild(crearImagen(imagen, alt));
  marco.insertAdjacentHTML("beforeend", `<span class="tarjeta-marca">${ICONOS.check}</span>`);
  tarjeta.appendChild(marco);
  tarjeta.insertAdjacentHTML("beforeend", `<span class="tarjeta-titulo">${titulo}</span><span class="tarjeta-detalle">${detalle}</span>`);
  tarjeta.addEventListener("click", alPulsar);
  return tarjeta;
}

function pintarEspacios() {
  const lista = $("lista-espacios");
  lista.replaceChildren();
  CATALOGO.espacios.forEach((espacio) => {
    lista.appendChild(crearTarjeta({
      seleccionada: estado.espacioId === espacio.id,
      imagen: espacio.imagen,
      alt: espacio.descripcion,
      titulo: espacio.nombre,
      detalle: `Pared ≈ ${formatoMetros(espacio.paredLibreCm)} · fondo ≈ ${formatoMetros(espacio.fondoLibreCm)} (estimados)`,
      alPulsar: () => { estado.espacioId = espacio.id; pintarSeleccion(); },
    }));
  });
  // La carga de foto propia es de la siguiente versión: se muestra, pero deshabilitada.
  lista.insertAdjacentHTML("beforeend", `
    <div class="tarjeta tarjeta-proxima" aria-disabled="true">
      <div class="tarjeta-imagen tarjeta-imagen-vacia">${ICONOS.subir}</div>
      <span class="tarjeta-titulo">Subir mi foto</span>
      <span class="tarjeta-detalle">Disponible en la siguiente versión</span>
    </div>`);
}

function pintarMuebles() {
  const lista = $("lista-muebles");
  lista.replaceChildren();
  CATALOGO.muebles.forEach((mueble) => {
    lista.appendChild(crearTarjeta({
      seleccionada: estado.muebleId === mueble.id,
      imagen: mueble.imagen,
      alt: mueble.nombre,
      titulo: mueble.nombre,
      detalle: `${mueble.tienda} · ${formatoPrecio(mueble.precioCop)}<br>${textoMedidas(mueble.medidasCm)}`,
      alPulsar: () => { estado.muebleId = mueble.id; pintarSeleccion(); },
    }));
  });
}

function pintarSeleccion() {
  pintarEspacios();
  pintarMuebles();
  const espacio = buscarEspacio(estado.espacioId);
  const mueble = buscarMueble(estado.muebleId);
  $("boton-ver").disabled = !(espacio && mueble);
  $("resumen-seleccion").innerHTML = espacio && mueble
    ? `<strong>${mueble.nombre}</strong> en <strong>${espacio.nombre}</strong>`
    : espacio ? `<strong>${espacio.nombre}</strong> · ahora elige un mueble`
    : mueble ? `<strong>${mueble.nombre}</strong> · ahora elige un espacio`
    : "Elige un espacio y un mueble";
}

function cancelarTemporizadores() {
  cancelAnimationFrame(estado.animacionCorte);
  estado.temporizadores.forEach(clearTimeout);
  estado.temporizadores = [];
}

function mostrarVista(id) {
  $("vista-elegir").hidden = id !== "vista-elegir";
  $("vista-resultado").hidden = id !== "vista-resultado";
  window.scrollTo({ top: 0 });
}

// Animación del análisis. Se detiene en el paso que falla: medir (foto inadecuada) o cabida (no cabe).
function iniciarAnalisis() {
  cancelarTemporizadores();
  const combinacion = CATALOGO.combinaciones[claveCombinacion(estado.espacioId, estado.muebleId)];
  mostrarVista("vista-resultado");
  $("resultado").hidden = true;
  $("analisis").hidden = false;
  if (!combinacion) {
    $("pasos-analisis").innerHTML = `<li class="paso-fallo">${ICONOS.alerta} Error: no existe la combinación ${claveCombinacion(estado.espacioId, estado.muebleId)} en datos.js</li>`;
    return;
  }
  const parada = PARADA_ANALISIS[combinacion.veredicto];
  const pasos = parada ? PASOS_ANALISIS.slice(0, parada.paso) : PASOS_ANALISIS;
  const lista = $("pasos-analisis");
  lista.innerHTML = pasos.map((texto) => `<li class="paso-pendiente"><span class="paso-icono"></span>${texto}</li>`).join("");
  const items = [...lista.children];
  items.forEach((item, i) => {
    estado.temporizadores.push(setTimeout(() => {
      if (i > 0) marcarPaso(items[i - 1], "hecho");
      item.className = "paso-activo";
    }, i * DURACION_PASO_MS));
  });
  estado.temporizadores.push(setTimeout(() => {
    marcarPaso(items[items.length - 1], parada ? parada.tipo : "hecho");
  }, pasos.length * DURACION_PASO_MS));
  estado.temporizadores.push(setTimeout(() => mostrarResultado(combinacion), pasos.length * DURACION_PASO_MS + 450));
}

function marcarPaso(item, tipo) {
  const icono = { hecho: ICONOS.check, fallo: ICONOS.equis, aviso: ICONOS.alerta }[tipo];
  item.className = `paso-${tipo}`;
  item.querySelector(".paso-icono").innerHTML = icono;
}

function mostrarResultado(combinacion) {
  const espacio = buscarEspacio(estado.espacioId);
  const mueble = buscarMueble(estado.muebleId);
  $("analisis").hidden = true;
  $("resultado").hidden = false;
  pintarImagenResultado(espacio, mueble, combinacion);
  pintarVeredicto(combinacion);
  pintarMedidas(espacio, mueble, combinacion);
  pintarFicha(mueble);
  pintarSugerencia(espacio, mueble, combinacion);
}

function pintarImagenResultado(espacio, mueble, combinacion) {
  const contenedor = $("resultado-imagen");
  contenedor.replaceChildren();
  if (combinacion.imagen === null) {
    const motivo = combinacion.veredicto === "foto-inadecuada"
      ? "con esta foto no podemos medir la pared donde iría el mueble."
      : `${mueble.nombre} no cabe en este espacio.`;
    const marco = document.createElement("figure");
    marco.className = "marco-no-cabe";
    marco.appendChild(crearImagen(espacio.imagen, espacio.descripcion));
    marco.insertAdjacentHTML("beforeend", `
      <figcaption>${ICONOS.alerta}<span>No generamos la imagen: ${motivo}
      Revisar la foto y las medidas antes de generar evita gastar una generación en un resultado que no sirve.</span></figcaption>`);
    contenedor.appendChild(marco);
    return;
  }
  contenedor.appendChild(crearComparador(espacio, mueble, combinacion));
  contenedor.insertAdjacentHTML("beforeend", `<p class="nota-imagen">Imagen generada con IA antes de la demostración. Desliza para comparar.</p>`);
}

// Comparador antes/después: la imagen "antes" se recorta sobre la "después" según el deslizador.
function crearComparador(espacio, mueble, combinacion) {
  const comparador = document.createElement("div");
  comparador.className = "comparador";
  comparador.appendChild(crearImagen(combinacion.imagen, `${mueble.nombre} en ${espacio.nombre}`, "comparador-despues"));
  comparador.appendChild(crearImagen(espacio.imagen, `${espacio.nombre} vacío`, "comparador-antes"));
  comparador.insertAdjacentHTML("beforeend", `
    <span class="comparador-etiqueta etiqueta-antes">Antes</span>
    <span class="comparador-etiqueta etiqueta-despues">Con el mueble</span>
    <span class="comparador-linea" aria-hidden="true"></span>
    <input type="range" min="0" max="100" value="100" aria-label="Comparar antes y después">`);
  const deslizador = comparador.querySelector("input");
  const moverCorte = (valor) => {
    deslizador.value = valor;
    comparador.style.setProperty("--corte", `${valor}%`);
    // Cada etiqueta solo se ve cuando su lado ocupa una parte visible de la imagen.
    comparador.querySelector(".etiqueta-antes").style.opacity = valor > 15 ? 1 : 0;
    comparador.querySelector(".etiqueta-despues").style.opacity = valor < 85 ? 1 : 0;
  };
  deslizador.addEventListener("input", () => {
    cancelAnimationFrame(estado.animacionCorte);
    moverCorte(Number(deslizador.value));
  });
  moverCorte(100);
  revelarMueble(moverCorte);
  return comparador;
}

// Revelado inicial: el corte va de 100 % (espacio vacío) a 0 % (mueble completo).
// El usuario puede tomar el deslizador en cualquier momento.
function revelarMueble(moverCorte) {
  const DURACION_MS = 1400, ESPERA_MS = 500;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { moverCorte(0); return; }
  const inicio = performance.now() + ESPERA_MS;
  const paso = (ahora) => {
    const t = Math.min(Math.max((ahora - inicio) / DURACION_MS, 0), 1);
    const suave = 1 - Math.pow(1 - t, 3);
    moverCorte(100 - 100 * suave);
    if (t < 1) estado.animacionCorte = requestAnimationFrame(paso);
  };
  estado.animacionCorte = requestAnimationFrame(paso);
}

function pintarVeredicto(combinacion) {
  const { titulo, clase, icono } = TEXTO_VEREDICTO[combinacion.veredicto];
  $("veredicto").className = `veredicto ${clase}`;
  $("veredicto").innerHTML = `<p class="veredicto-titulo">${ICONOS[icono]}${titulo}</p><p>${combinacion.explicacion}</p>`;
}

// Con foto inadecuada no hay medidas que comparar: se muestran las indicaciones para tomar la foto.
function pintarMedidas(espacio, mueble, combinacion) {
  if (combinacion.veredicto === "foto-inadecuada") {
    $("medidas").innerHTML = `
      <h3>Cómo tomar la foto para un mejor resultado</h3>
      <ul class="consejos">${CATALOGO.consejosFoto.map((consejo) => `<li>${ICONOS.check}<span>${consejo}</span></li>`).join("")}</ul>`;
    return;
  }
  // La combinación puede ubicar el mueble en otra pared que la del espacio.
  const ubicacion = combinacion.ubicacion ?? espacio.ubicacion;
  const pared = combinacion.paredLibreCm ?? espacio.paredLibreCm;
  const fondo = combinacion.fondoLibreCm ?? espacio.fondoLibreCm;
  $("medidas").innerHTML = `
    <h3>Medidas</h3>
    <p class="medidas-ubicacion">Ubicación: ${ubicacion}. Las medidas del espacio son estimadas.</p>
    ${compararDimension("Ancho", "pared libre", pared, mueble.medidasCm.ancho)}
    ${compararDimension("Fondo", "fondo disponible", fondo, mueble.medidasCm.fondo)}`;
}

// Una dimensión: barra del espacio arriba y del mueble abajo, a la misma escala (la más larga = 100 %).
// Si el mueble excede, el exceso va resaltado.
function compararDimension(titulo, nombreEspacio, espacioCm, muebleCm) {
  const porcentaje = (cm) => `${(cm / Math.max(espacioCm, muebleCm)) * 100}%`;
  const exceso = muebleCm - espacioCm;
  return `
    <div class="dimension">
      <p class="dimension-titulo">${titulo}</p>
      <div class="barra-medida">
        <span class="barra-texto">Espacio · ${nombreEspacio}</span><span class="barra-valor">${formatoMetros(espacioCm)}</span>
        <div class="barra-pista"><div class="barra-relleno barra-pared" style="width:${porcentaje(espacioCm)}"></div></div>
      </div>
      <div class="barra-medida">
        <span class="barra-texto">Mueble</span><span class="barra-valor">${formatoMetros(muebleCm)}</span>
        <div class="barra-pista">
          <div class="barra-relleno barra-mueble" style="width:${porcentaje(Math.min(muebleCm, espacioCm))}"></div>
          ${exceso > 0 ? `<div class="barra-exceso" style="left:${porcentaje(espacioCm)};width:${porcentaje(exceso)}"></div>` : ""}
        </div>
        ${exceso > 0
          ? `<span class="barra-aviso">Le faltan ${formatoCm(exceso)} cm</span>`
          : `<span class="barra-holgura">Quedan ${formatoCm(espacioCm - muebleCm)} cm libres</span>`}
      </div>
    </div>`;
}

function pintarFicha(mueble) {
  const ficha = $("ficha");
  ficha.replaceChildren();
  ficha.appendChild(crearImagen(mueble.imagen, mueble.nombre, "ficha-imagen"));
  ficha.insertAdjacentHTML("beforeend", `
    <div class="ficha-texto">
      <p class="ficha-tienda">${mueble.tienda}</p>
      <p class="ficha-nombre">${mueble.nombre}</p>
      <p class="ficha-precio">${formatoPrecio(mueble.precioCop)}</p>
      <p class="ficha-medidas">${textoMedidas(mueble.medidasCm)} (ancho × fondo × alto)</p>
      ${mueble.enlace
        ? `<a class="boton-tienda" href="${mueble.enlace}" target="_blank" rel="noopener">Ver en la tienda ${ICONOS.externo}</a>`
        : `<span class="boton-tienda boton-tienda-pendiente">Enlace pendiente</span>`}
    </div>`);
}

// Si no cabe, lista los muebles del catálogo que sí caben en ese espacio, cada uno con su botón.
// Alternativas cuando no hay imagen:
// - no cabe: los muebles que sí caben en ESTE espacio;
// - foto inadecuada: los espacios donde ESTE mueble sí se puede ver.
function pintarSugerencia(espacio, mueble, combinacion) {
  const caja = $("sugerencia");
  caja.hidden = combinacion.imagen !== null;
  if (caja.hidden) return;
  const sirve = (espacioId, muebleId) =>
    ["cabe", "justo"].includes(CATALOGO.combinaciones[claveCombinacion(espacioId, muebleId)]?.veredicto);
  const porMueble = combinacion.veredicto === "no-cabe";
  const opciones = porMueble
    ? CATALOGO.muebles.filter((m) => sirve(espacio.id, m.id)).map((m) => ({
        titulo: m.nombre, detalle: `${textoMedidas(m.medidasCm)} · ${formatoPrecio(m.precioCop)}`,
        elegir: () => { estado.muebleId = m.id; } }))
    : CATALOGO.espacios.filter((e) => sirve(e.id, mueble.id)).map((e) => ({
        titulo: e.nombre, detalle: e.descripcion,
        elegir: () => { estado.espacioId = e.id; } }));
  if (opciones.length === 0) {
    caja.innerHTML = "<p>No hay otra opción del catálogo para probar.</p>";
    return;
  }
  caja.innerHTML = `<h3>${porMueble ? "En este espacio sí caben" : "Pruébalo en otro de tus espacios"}</h3><ul class="alternativas"></ul>`;
  opciones.forEach((opcion) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span><strong>${opcion.titulo}</strong><br><small>${opcion.detalle}</small></span>
      <button class="boton-secundario" type="button">Probar</button>`;
    item.querySelector("button").addEventListener("click", () => {
      opcion.elegir();
      pintarSeleccion();
      iniciarAnalisis();
    });
    caja.querySelector("ul").appendChild(item);
  });
}

function volverAElegir() {
  cancelarTemporizadores();
  mostrarVista("vista-elegir");
}

$("boton-ver").addEventListener("click", iniciarAnalisis);
$("boton-volver").addEventListener("click", volverAElegir);
$("logo-inicio").addEventListener("click", (evento) => { evento.preventDefault(); volverAElegir(); });
pintarSeleccion();
