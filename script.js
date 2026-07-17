const WHATSAPP_NUMERO = "34691010409";

let productos = [];
let carrito = [];
let modalImages = [];
let modalImageIndex = 0;
let isSyncingScroll = false;

function esProductoVendido(prod) {
  return prod.vendido === true || prod.disponible === false;
}

// CONTADOR HASTA EL MARTES 21 A MEDIANOCHE (Julio 2026)
const fechaLimite = new Date("July 21, 2026 23:59:59").getTime();
const countdown = setInterval(() => {
  const ahora = new Date().getTime();
  const diferencia = fechaLimite - ahora;

  if (diferencia <= 0) {
    clearInterval(countdown);
    document.getElementById("cd-dias").innerText = "00";
    document.getElementById("cd-horas").innerText = "00";
    document.getElementById("cd-min").innerText = "00";
    document.getElementById("cd-seg").innerText = "00";
    return;
  }

  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

  document.getElementById("cd-dias").innerText = String(dias).padStart(2, "0");
  document.getElementById("cd-horas").innerText = String(horas).padStart(2, "0");
  document.getElementById("cd-min").innerText = String(minutos).padStart(2, "0");
  document.getElementById("cd-seg").innerText = String(segundos).padStart(2, "0");
}, 1000);

async function cargarProductos() {
  try {
    const respuesta = await fetch("productos.json");
    productos = await respuesta.json();
    renderCatalogo();
  } catch (error) {
    console.error("Error cargando productos.json:", error);
    document.getElementById("count-label").innerText = "No se pudieron cargar los artículos.";
  }
}

function renderCatalogo() {
  const catalogo = document.getElementById("catalogo");
  const disponibles = productos.filter(p => !esProductoVendido(p)).length;
  const vendidos = productos.length - disponibles;
  document.getElementById("count-label").innerText = vendidos > 0
    ? `${disponibles} disponibles · ${vendidos} vendido${vendidos > 1 ? "s" : ""}`
    : `${productos.length} artículos disponibles`;
  catalogo.innerHTML = "";

  productos.forEach(prod => {
    const coverImage = Array.isArray(prod.fotos) && prod.fotos.length ? prod.fotos[0] : prod.foto;
    const item = document.createElement("div");
    item.classList.add("producto-card");
    if (esProductoVendido(prod)) item.classList.add("vendido");
    if (!esProductoVendido(prod)) {
      item.setAttribute("onclick", `openModal(${prod.id})`);
    }

    item.innerHTML = `
      <div class="img-container">
        ${esProductoVendido(prod) ? '<span class="sold-badge">Vendido</span>' : ""}
        <img src="${coverImage}" alt="${prod.nombre}">
      </div>
      <div class="producto-info">
        <div class="producto-title-row">
          <h3>${prod.nombre}</h3>
          <p class="precio">${prod.precio}€</p>
        </div>
        <p class="descripcion-corta">${prod.descripcion}</p>
        <button class="card-add-btn" ${esProductoVendido(prod) ? "disabled" : `onclick="event.stopPropagation(); agregarAlCarrito(${prod.id})"`}>${esProductoVendido(prod) ? "Vendido" : "Añadir al carrito"}</button>
      </div>
    `;
    catalogo.appendChild(item);
  });
}

function openModal(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  modalImages = Array.isArray(prod.fotos) && prod.fotos.length ? prod.fotos : [prod.foto];
  modalImageIndex = 0;

  const track = document.getElementById("modal-slider-track");
  if (track) {
    track.innerHTML = "";
    modalImages.forEach((src, index) => {
      const slide = document.createElement("div");
      slide.className = "modal-image-slide";
      slide.innerHTML = `<img src="${src}" alt="${prod.nombre} ${index + 1}">`;
      track.appendChild(slide);
    });
  }

  actualizarImagenModal();

  document.getElementById("modal-title").innerText = prod.nombre;
  document.getElementById("modal-price").innerText = `${prod.precio}€`;
  document.getElementById("modal-description").innerText = prod.descripcion;

  const modalBtn = document.getElementById("modal-add-btn");
  if (esProductoVendido(prod)) {
    modalBtn.innerText = "Vendido";
    modalBtn.disabled = true;
    modalBtn.onclick = null;
  } else {
    modalBtn.innerText = "Añadir al carrito";
    modalBtn.disabled = false;
    modalBtn.onclick = (e) => {
      e.stopPropagation();
      agregarAlCarrito(prod.id);
      closeModal();
    };
  }

  document.getElementById("product-modal").classList.add("active");
}

function actualizarImagenModal() {
  const track = document.getElementById("modal-slider-track");
  const indicator = document.getElementById("modal-image-indicator");
  if (!track || !indicator) return;

  isSyncingScroll = true;
  const slideWidth = track.clientWidth;
  track.scrollTo({ left: slideWidth * modalImageIndex, behavior: "smooth" });
  setTimeout(() => isSyncingScroll = false, 300);

  indicator.innerText = `${modalImageIndex + 1} / ${modalImages.length}`;

  const prevBtn = document.querySelector(".slider-prev");
  const nextBtn = document.querySelector(".slider-next");
  if (prevBtn) prevBtn.disabled = modalImageIndex === 0;
  if (nextBtn) nextBtn.disabled = modalImageIndex >= modalImages.length - 1;
}

function cambiarImagenModal(direction) {
  modalImageIndex = Math.min(Math.max(0, modalImageIndex + direction), modalImages.length - 1);
  actualizarImagenModal();
}

function closeModal() {
  document.getElementById("product-modal").classList.remove("active");
}

const sliderTrack = document.getElementById("modal-slider-track");
if (sliderTrack) {
  sliderTrack.addEventListener("scroll", () => {
    if (isSyncingScroll) return;
    const newIndex = Math.round(sliderTrack.scrollLeft / sliderTrack.clientWidth);
    if (newIndex !== modalImageIndex) {
      modalImageIndex = newIndex;
      const indicator = document.getElementById("modal-image-indicator");
      if (indicator) indicator.innerText = `${modalImageIndex + 1} / ${modalImages.length}`;
      const prevBtn = document.querySelector(".slider-prev");
      const nextBtn = document.querySelector(".slider-next");
      if (prevBtn) prevBtn.disabled = modalImageIndex === 0;
      if (nextBtn) nextBtn.disabled = modalImageIndex >= modalImages.length - 1;
    }
  });
}

function toggleCart(open) {
  const sidebar = document.getElementById("cart-sidebar");
  if (open) sidebar.classList.add("active");
  else sidebar.classList.remove("active");
}

function toggleDrawer(open) {
  document.getElementById("mobile-drawer").classList.toggle("active", open);
  document.getElementById("drawer-overlay").classList.toggle("active", open);
}

function agregarAlCarrito(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  if (carrito.find(item => item.id === id)) {
    showToast("Este artículo ya está en el carrito");
    return;
  }

  carrito.push(prod);
  actualizarInterfazCarrito();
  showToast(`¡${prod.nombre} añadido!`);
}

function removerDelCarrito(id) {
  carrito = carrito.filter(item => item.id !== id);
  actualizarInterfazCarrito();
}

function actualizarInterfazCarrito() {
  document.getElementById("cart-counter").innerText = carrito.length;
  document.getElementById("header-cart-count").innerText = carrito.length;
  const container = document.getElementById("cart-items-container");
  container.innerHTML = "";

  if (carrito.length === 0) {
    container.innerHTML = `<p class="cart-empty">El carrito está vacío.</p>`;
    document.getElementById("cart-total-amount").innerText = "0€";
    return;
  }

  let total = 0;
  carrito.forEach(item => {
    total += item.precio;
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <img src="${item.foto}" alt="${item.nombre}">
      <div class="cart-item-details">
        <h4>${item.nombre}</h4>
        <p>${item.precio}€</p>
        <button class="remove-item" onclick="removerDelCarrito(${item.id})">Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });

  document.getElementById("cart-total-amount").innerText = `${total}€`;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.classList.add("active");
  setTimeout(() => toast.classList.remove("active"), 2700);
}

function enviarPedidoWhatsApp() {
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  let mensaje = "¡Hola! Me interesan estos artículos de tu venta por mudanza en Madrid:\n\n";
  let total = 0;

  carrito.forEach((item, index) => {
    mensaje += `${index + 1}. *${item.nombre}* (${item.precio}€)\n`;
    total += item.precio;
  });

  mensaje += `\n*Total de la compra:* ${total}€\n\n¿Cuándo te viene bien que pase a recogerlos?`;

  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

window.onload = cargarProductos;