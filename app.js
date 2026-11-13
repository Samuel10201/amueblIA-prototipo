// Lógica del prototipo: selección, análisis simulado, resultado, comparación y encuesta.
// Solo LEE el CATALOGO de datos.js; nunca lo modifica.

const DURACION_PASO_MS = 650;
const CLAVE_RESPUESTAS = "amueblia-respuestas";
const CLAVE_VISTA = "amueblia-vista";
const CLAVE_TEMA = "amueblia-tema";
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
const OPCIONES_ENCUESTA = ["Sí", "Más o menos", "No"];
const ICONOS = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  equis: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  alerta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.1"/></svg>',
  subir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V5M7 10l5-5 5 5M5 19h14"/></svg>',
  sol: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>',
  luna: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  externo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5"/></svg>',
};

const estado = { espacioId: null, muebleId: null, temporizadores: [], animacionCorte: null };
const formatoPesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const $ = (id) => document.getElementById(id);
const buscarEspacio = (id) => CATALOGO.espacios.find((e) => e.id === id);
const buscarMueble = (id) => CATALOGO.muebles.find((m) => m.id === id);
const claveCombinacion = (espacioId, muebleId) => `${espacioId}__${muebleId}`;
const buscarCombinacion = (espacioId, muebleId) => CATALOGO.combinaciones[claveCombinacion(espacioId, muebleId)];
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

/* ---------- Vista de la página: teléfono o pantalla completa ---------- */

function aplicarVista(vista) {
  document.documentElement.dataset.vista = vista;
  document.querySelectorAll(".selector-vista button").forEach((boton) => {
    boton.setAttribute("aria-pressed", boton.dataset.vista === vista ? "true" : "false");
  });
  try { localStorage.setItem(CLAVE_VISTA, vista); } catch (error) { console.warn("No se pudo recordar la vista:", error); }
}

function vistaGuardada() {
  try { return localStorage.getItem(CLAVE_VISTA) === "completa" ? "completa" : "telefono"; } catch { return "telefono"; }
}

/* ---------- Tema claro u oscuro ---------- */

// Sin elección guardada manda el tema del sistema; el botón fija uno y lo recuerda.
function temaActual() {
  return document.documentElement.dataset.theme
    ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

function pintarBotonTema() {
  const oscuro = temaActual() === "dark";
  $("boton-tema").innerHTML = `${oscuro ? ICONOS.sol : ICONOS.luna}<span>${oscuro ? "Modo claro" : "Modo oscuro"}</span>`;
}

function alternarTema() {
  const nuevo = temaActual() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nuevo;
  try { localStorage.setItem(CLAVE_TEMA, nuevo); } catch (error) { console.warn("No se pudo recordar el tema:", error); }
  pintarBotonTema();
}

// Descarga las composiciones en segundo plano para que el resultado aparezca sin esperas.
function precargarImagenes() {
  Object.values(CATALOGO.combinaciones).forEach(({ imagen }) => { if (imagen) new Image().src = imagen; });
}

/* ---------- Selección ---------- */

// Portada: un ejemplo real del catálogo (primera combinación con imagen) que se revela en bucle.
function pintarPortada() {
  const clave = Object.keys(CATALOGO.combinaciones).find((k) => CATALOGO.combinaciones[k].imagen);
  if (!clave) return;
  const espacio = buscarEspacio(clave.split("__")[0]);
  const marco = $("portada-ejemplo");
  marco.appendChild(crearImagen(CATALOGO.combinaciones[clave].imagen, "", "portada-despues"));
  marco.appendChild(crearImagen(espacio.imagen, "", "portada-antes"));
  marco.insertAdjacentHTML("beforeend", '<span class="portada-linea"></span>');
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
  $("barra-accion").classList.toggle("barra-lista", Boolean(espacio && mueble));
  $("resumen-seleccion").innerHTML = espacio && mueble
    ? `<strong>${mueble.nombre}</strong> en <strong>${espacio.nombre}</strong>`
    : espacio ? `<strong>${espacio.nombre}</strong> · ahora elige un mueble`
    : mueble ? `<strong>${mueble.nombre}</strong> · ahora elige un espacio`
    : "Elige un espacio y un mueble";
}

/* ---------- Análisis simulado ---------- */

function cancelarTemporizadores() {
  cancelAnimationFrame(estado.animacionCorte);
  estado.temporizadores.forEach(clearTimeout);
  estado.temporizadores = [];
}

// Lleva al inicio tanto la pantalla del teléfono simulado como la ventana (pantalla completa).
function mostrarVista(id) {
  $("vista-elegir").hidden = id !== "vista-elegir";
  $("vista-resultado").hidden = id !== "vista-resultado";
  $("pantalla").scrollTo({ top: 0 });
  if (document.documentElement.dataset.vista === "completa" || window.innerWidth <= 640) window.scrollTo({ top: 0 });
}

// Animación del análisis. Se detiene en el paso que falla: medir (foto inadecuada) o cabida (no cabe).
function iniciarAnalisis() {
  cancelarTemporizadores();
  const combinacion = buscarCombinacion(estado.espacioId, estado.muebleId);
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

/* ---------- Resultado ---------- */

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
  pintarComparacion(espacio, mueble);
  pintarEncuesta(espacio, mueble, combinacion);
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

// Cambia la selección y vuelve a analizar (lo usan la sugerencia y la comparación).
function probar({ espacioId = estado.espacioId, muebleId = estado.muebleId }) {
  estado.espacioId = espacioId;
  estado.muebleId = muebleId;
  pintarSeleccion();
  iniciarAnalisis();
}

// Con foto inadecuada: los otros espacios donde ESTE mueble sí se puede ver.
// (Con "no cabe" no hace falta: la comparación de abajo ya muestra los muebles que sí caben.)
function pintarSugerencia(espacio, mueble, combinacion) {
  const caja = $("sugerencia");
  caja.hidden = combinacion.veredicto !== "foto-inadecuada";
  if (caja.hidden) return;
  const espacios = CATALOGO.espacios.filter((e) => ["cabe", "justo"].includes(buscarCombinacion(e.id, mueble.id)?.veredicto));
  if (espacios.length === 0) {
    caja.innerHTML = "<p>No hay otro espacio del catálogo donde probarlo.</p>";
    return;
  }
  caja.innerHTML = `<h3>Pruébalo en otro de tus espacios</h3><ul class="alternativas"></ul>`;
  espacios.forEach((otro) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span><strong>${otro.nombre}</strong><br><small>${otro.descripcion}</small></span>
      <button class="boton-secundario" type="button">Probar</button>`;
    item.querySelector("button").addEventListener("click", () => probar({ espacioId: otro.id }));
    caja.querySelector("ul").appendChild(item);
  });
}

/* ---------- Comparación de los muebles del catálogo en el mismo espacio ---------- */

function pintarComparacion(espacio, muebleActual) {
  const seccion = $("comparacion");
  seccion.innerHTML = `
    <h3>Compara en tu ${espacio.nombre.toLowerCase()}</h3>
    <p class="comparacion-intro">Los muebles del catálogo en este mismo espacio.</p>
    <div class="comparacion-lista"></div>`;
  const lista = seccion.querySelector(".comparacion-lista");
  CATALOGO.muebles.forEach((mueble) => {
    const combinacion = buscarCombinacion(espacio.id, mueble.id);
    if (!combinacion) return;
    const { titulo, clase } = TEXTO_VEREDICTO[combinacion.veredicto];
    const actual = mueble.id === muebleActual.id;
    const pared = combinacion.paredLibreCm ?? espacio.paredLibreCm;
    const detalle = combinacion.imagen
      ? `Quedan ${formatoCm(pared - mueble.medidasCm.ancho)} cm de pared`
      : "No se genera imagen";
    const tarjeta = document.createElement("article");
    tarjeta.className = `comparacion-tarjeta${actual ? " comparacion-actual" : ""}`;
    const marco = document.createElement("div");
    marco.className = `comparacion-imagen${combinacion.imagen ? "" : " comparacion-sin-imagen"}`;
    marco.appendChild(crearImagen(combinacion.imagen ?? espacio.imagen, `${mueble.nombre} en ${espacio.nombre}`));
    marco.insertAdjacentHTML("beforeend", `<span class="insignia ${clase}">${titulo}</span>`);
    tarjeta.appendChild(marco);
    tarjeta.insertAdjacentHTML("beforeend", `
      <p class="comparacion-nombre">${mueble.nombre}</p>
      <p class="comparacion-precio">${formatoPrecio(mueble.precioCop)}</p>
      <p class="comparacion-detalle">${detalle}</p>
      ${actual ? `<span class="comparacion-viendo">Lo estás viendo</span>` : `<button class="boton-secundario" type="button">Ver este</button>`}`);
    tarjeta.querySelector("button")?.addEventListener("click", () => probar({ muebleId: mueble.id }));
    lista.appendChild(tarjeta);
  });
}

/* ---------- Encuesta de validación (respuestas en localStorage de este dispositivo) ---------- */

function leerRespuestas() {
  try { return JSON.parse(localStorage.getItem(CLAVE_RESPUESTAS)) ?? []; } catch { return []; }
}

// Devuelve false si el navegador no deja guardar (modo privado, almacenamiento bloqueado).
function guardarRespuesta(respuesta) {
  try {
    localStorage.setItem(CLAVE_RESPUESTAS, JSON.stringify([...leerRespuestas(), respuesta]));
    return true;
  } catch (error) {
    console.error("No se pudo guardar la respuesta:", error);
    return false;
  }
}

function pintarEncuesta(espacio, mueble, combinacion) {
  const seccion = $("encuesta");
  seccion.innerHTML = `
    <h3>¿Este resultado te ayudó a decidir?</h3>
    <div class="encuesta-opciones">
      ${OPCIONES_ENCUESTA.map((opcion) => `<button type="button" aria-pressed="false">${opcion}</button>`).join("")}
    </div>
    <label class="encuesta-comentario"><span>¿Por qué? <small>(opcional)</small></span>
      <textarea rows="2" maxlength="300"></textarea>
    </label>
    <button type="button" class="boton-principal" disabled>Enviar respuesta</button>`;
  const enviar = seccion.querySelector(".boton-principal");
  let elegida = null;
  seccion.querySelectorAll(".encuesta-opciones button").forEach((boton) => {
    boton.addEventListener("click", () => {
      elegida = boton.textContent;
      seccion.querySelectorAll(".encuesta-opciones button").forEach((b) => b.setAttribute("aria-pressed", b === boton ? "true" : "false"));
      enviar.disabled = false;
    });
  });
  enviar.addEventListener("click", () => {
    const guardada = guardarRespuesta({
      fecha: new Date().toISOString(),
      espacio: espacio.nombre,
      mueble: mueble.nombre,
      veredicto: TEXTO_VEREDICTO[combinacion.veredicto].titulo,
      respuesta: elegida,
      comentario: seccion.querySelector("textarea").value.trim(),
    });
    seccion.innerHTML = guardada
      ? `<p class="encuesta-gracias">${ICONOS.check} Gracias. Tu respuesta quedó guardada.</p>`
      : `<p class="encuesta-error">${ICONOS.alerta} No se pudo guardar la respuesta: el navegador bloqueó el almacenamiento.</p>`;
    pintarConteoRespuestas();
  });
}

function pintarConteoRespuestas() {
  const total = leerRespuestas().length;
  $("pruebas-conteo").innerHTML = `<strong>${total}</strong> ${total === 1 ? "respuesta" : "respuestas"}`;
  $("boton-exportar").disabled = total === 0;
  $("boton-borrar").disabled = total === 0;
}

// CSV con BOM y punto y coma, que es lo que Excel en español abre directo en columnas.
function exportarRespuestas() {
  const columnas = ["fecha", "espacio", "mueble", "veredicto", "respuesta", "comentario"];
  const celda = (valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`;
  const filas = [columnas.join(";"), ...leerRespuestas().map((r) => columnas.map((c) => celda(r[c])).join(";"))];
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob(["﻿" + filas.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  enlace.download = "amueblia-respuestas.csv";
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

function borrarRespuestas() {
  if (!confirm("¿Borrar todas las respuestas guardadas en este dispositivo?")) return;
  try { localStorage.removeItem(CLAVE_RESPUESTAS); } catch (error) { console.error("No se pudieron borrar las respuestas:", error); }
  pintarConteoRespuestas();
}

/* ---------- Arranque ---------- */

function volverAElegir() {
  cancelarTemporizadores();
  mostrarVista("vista-elegir");
}

document.querySelectorAll(".selector-vista button").forEach((boton) => {
  boton.addEventListener("click", () => aplicarVista(boton.dataset.vista));
});
$("boton-tema").addEventListener("click", alternarTema);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", pintarBotonTema);
$("boton-ver").addEventListener("click", iniciarAnalisis);
$("boton-volver").addEventListener("click", volverAElegir);
$("logo-inicio").addEventListener("click", (evento) => { evento.preventDefault(); volverAElegir(); });
$("boton-exportar").addEventListener("click", exportarRespuestas);
$("boton-borrar").addEventListener("click", borrarRespuestas);
aplicarVista(vistaGuardada());
pintarPortada();
pintarSeleccion();
pintarConteoRespuestas();
pintarBotonTema();
window.addEventListener("load", precargarImagenes);
