
// ==========================================
// IEEE PES UTP - SISTEMA PRIVADO
// ==========================================

// INICIO DE SESIÓN
const loginForm = document.getElementById("loginForm");

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const contrasena = document.getElementById("contrasena").value;
  const mensaje = document.getElementById("loginMensaje");

  if (usuario === "eventos" && contrasena === "2026") {
    sessionStorage.setItem("ieeePesDemo", "true");
    window.location.href = "dashboard.html";
  } else {
    mensaje.textContent = "Usuario o contraseña incorrectos.";
    mensaje.style.color = "#dc2626";
  }
});

// PROTECCIÓN DEL PANEL
if (
  window.location.pathname.endsWith("/dashboard.html") &&
  sessionStorage.getItem("ieeePesDemo") !== "true"
) {
  window.location.href = "login.html";
}

// CERRAR SESIÓN
document.getElementById("logoutButton")?.addEventListener("click", () => {
  sessionStorage.removeItem("ieeePesDemo");
  window.location.href = "login.html";
});

// NAVEGACIÓN
const tabs = document.querySelectorAll(".tab-button");
const views = document.querySelectorAll(".panel-view");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => {
      item.classList.toggle("active", item === tab);
    });

    views.forEach((view) => {
      view.classList.toggle(
        "active",
        view.id === `panel-${tab.dataset.tab}`
      );
    });
  });
});

// ELEMENTOS
const eventForm = document.getElementById("eventForm");
const history = document.getElementById("eventHistory");
const queue = document.getElementById("marketingQueue");
const eventCount = document.getElementById("eventCount");

const downloadButton = document.getElementById("downloadPng");
const publishButton = document.getElementById("publishEvent");

const savedEvents = JSON.parse(
  localStorage.getItem("ieeePesEvents") || "[]"
);

// CONTROL DE EDICIÓN Y SELECCIÓN
let editingIndex = null;
let selectedMarketingIndex = null;

// ESTADOS
const statusClasses = {
  "Pendiente de diseño": "status-pending",
  "Diseño generado": "status-designed",
  "Publicado": "status-published",
  "Evento realizado": "status-completed",
  "Cancelado": "status-cancelled"
};

// GUARDAR INFORMACIÓN
function saveEvents() {
  localStorage.setItem(
    "ieeePesEvents",
    JSON.stringify(savedEvents)
  );
}

// ACTUALIZAR BOTONES DE MARKETING
function updateMarketingButtons() {
  const item = savedEvents[selectedMarketingIndex];

  if (!item) {
    downloadButton.disabled = true;
    publishButton.disabled = true;
    return;
  }

  downloadButton.disabled =
    item.status !== "Pendiente de diseño";

  publishButton.disabled =
    item.status !== "Diseño generado";
}

// MOSTRAR ESTADO
function createStatus(item) {
  const badge = document.createElement("span");

  badge.className =
    `event-status ${statusClasses[item.status] || "status-pending"}`;

  badge.textContent = item.status;

  return badge;
}

// MOSTRAR HISTORIAL
function renderEvents() {
  history.innerHTML = "";
  queue.innerHTML = "";

  savedEvents.forEach((item) => {
    if (!item.status) {
      item.status = "Pendiente de diseño";
    }
  });

  if (savedEvents.length === 0) {
    history.textContent = "Todavía no hay ponencias registradas.";
    queue.textContent = "Las ponencias que registre Eventos aparecerán aquí.";
    eventCount.textContent = "0 registros";

    saveEvents();
    return;
  }

  savedEvents.forEach((item, index) => {

    // HISTORIAL DE EVENTOS
    const row = document.createElement("div");
    row.className = "history-item";

    const details = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = item.title;

    const meta = document.createElement("small");
    meta.textContent =
      `${item.speaker} · ${item.date} · ${item.mode}`;

    details.append(title, meta, createStatus(item));

    const edit = document.createElement("button");
    edit.className = "small-action";
    edit.textContent = "Editar";

    edit.addEventListener("click", () => {
      editingIndex = index;

      Object.entries(item).forEach(([key, value]) => {
        const field = eventForm.elements.namedItem(key);

        if (
          field &&
          typeof value === "string" &&
          field.type !== "file"
        ) {
          field.value = value;
        }
      });

      document.querySelector('[data-tab="eventos"]').click();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      document.getElementById("eventFeedback").textContent =
        "Editando ponencia. Guarda los cambios cuando termines.";
    });

    row.append(details, edit);
    history.append(row);

    // PONENCIAS DE MARKETING
    const marketingRow = document.createElement("div");
    marketingRow.className = "history-item";

    const marketingDetails = document.createElement("div");

    const marketingTitle = document.createElement("strong");
    marketingTitle.textContent = item.title;

    marketingDetails.append(
      marketingTitle,
      createStatus(item)
    );

    const select = document.createElement("button");
    select.className = "small-action";
    select.textContent = "Usar en plantilla";

    select.addEventListener("click", () => {
      selectedMarketingIndex = index;

      document.getElementById("previewTitle").textContent = item.title;
      document.getElementById("previewSpeaker").textContent = item.speaker;
      document.getElementById("previewDate").textContent = item.date;
      document.getElementById("previewTime").textContent = item.time;
      document.getElementById("previewMode").textContent = item.mode;

      updateMarketingButtons();

      document.querySelector('[data-tab="marketing"]').click();
    });

    marketingRow.append(marketingDetails, select);
    queue.append(marketingRow);
  });

  eventCount.textContent =
    `${savedEvents.length} registro${savedEvents.length === 1 ? "" : "s"}`;

  saveEvents();
}

// REGISTRAR Y EDITAR
eventForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = Object.fromEntries(
    new FormData(eventForm).entries()
  );

  delete data.speakerPhoto;

  if (editingIndex !== null) {
    // CONSERVAR ESTADO CUANDO SE EDITA
    data.status =
      savedEvents[editingIndex].status || "Pendiente de diseño";

    savedEvents[editingIndex] = {
      ...savedEvents[editingIndex],
      ...data
    };

    editingIndex = null;

    document.getElementById("eventFeedback").textContent =
      "Ponencia actualizada correctamente.";

  } else {
    // NUEVA PONENCIA
    data.status = "Pendiente de diseño";

    savedEvents.push(data);

    document.getElementById("eventFeedback").textContent =
      "Ponencia guardada correctamente.";
  }

  eventForm.reset();

  renderEvents();
  updateMarketingButtons();
});

// DESCARGAR
downloadButton?.addEventListener("click", () => {
  const item = savedEvents[selectedMarketingIndex];

  if (!item || item.status !== "Pendiente de diseño") {
    return;
  }

  item.status = "Diseño generado";

  renderEvents();
  updateMarketingButtons();

  document.getElementById("marketingFeedback").textContent =
    "Estado actualizado: Diseño generado.";
});

// PUBLICAR
publishButton?.addEventListener("click", () => {
  const item = savedEvents[selectedMarketingIndex];

  if (!item || item.status !== "Diseño generado") {
    return;
  }

  item.status = "Publicado";

  renderEvents();
  updateMarketingButtons();

  document.getElementById("marketingFeedback").textContent =
    "Estado actualizado: Publicado.";
});

// INICIALIZAR
if (eventForm) {
  renderEvents();
  updateMarketingButtons();
}
