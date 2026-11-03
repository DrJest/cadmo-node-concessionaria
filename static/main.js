const PAGE_SIZE = 25;

const titleEl = document.querySelector("#title");
const mainEl = document.querySelector("#main");

// contenuto iniziale della pagina, mostrato quando l'hash è vuoto
const homeView = {
  title: titleEl.textContent,
  html: mainEl.innerHTML,
};

const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

function link(href) {
  if (!href) return null;
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = href;
  return a;
}

function formatPrice(value) {
  return value == null ? null : euro.format(value);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("it-IT") : null;
}

// ogni rotta corrisponde a un endpoint /api/v1/<nome> e definisce le colonne della tabella.
// "value" può restituire un testo/numero o un nodo DOM; null/undefined viene mostrato come "-"
const routes = {
  brands: {
    title: "Brands",
    columns: [
      { label: "ID", value: (row) => row.id },
      { label: "Nome", value: (row) => row.name },
      { label: "Logo", value: (row) => link(row.logo) },
      { label: "Anno", value: (row) => row.foundation_year },
    ],
  },
  models: {
    title: "Models",
    columns: [
      { label: "ID", value: (row) => row.id },
      { label: "Nome", value: (row) => row.name },
      { label: "Anno", value: (row) => row.year },
      { label: "Colori", value: (row) => row.available_colors?.join(", ") },
      { label: "Prezzo", value: (row) => formatPrice(row.price) },
      { label: "Brand", value: (row) => row.brand?.name },
    ],
  },
  sales: {
    title: "Sales",
    columns: [
      { label: "ID", value: (row) => row.id },
      { label: "Cliente", value: (row) => row.customer },
      { label: "Modello", value: (row) => row.model?.name },
      { label: "Data", value: (row) => formatDate(row.date) },
      { label: "Prezzo", value: (row) => formatPrice(row.price) },
    ],
  },
};

// "#brands?page=2" -> { route: "brands", page: 2 }
function parseHash() {
  const [route, query] = location.hash.slice(1).split("?");
  const params = new URLSearchParams(query);
  const page = Math.max(1, Math.trunc(Number(params.get("page"))) || 1);
  return { route, page };
}

function pageHref(route, page) {
  return page > 1 ? `#${route}?page=${page}` : `#${route}`;
}

async function fetchPage(endpoint, page, pageSize, order, q) {
  const url = new URL("/api/v1/" + endpoint, location.origin);
  url.searchParams.set("page", page || 1);
  url.searchParams.set("pageSize", pageSize || PAGE_SIZE);
  url.searchParams.set("order", order || "id");
  url.searchParams.set("q", JSON.stringify(q || {}));
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || res.statusText);
  }
  return json;
}

function setActiveLink(route) {
  for (const a of document.querySelectorAll(".navbar-nav .nav-link")) {
    const isActive = a.getAttribute("href") === "#" + route;
    a.classList.toggle("active", isActive);
    if (isActive) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

function renderHome() {
  titleEl.textContent = homeView.title;
  mainEl.innerHTML = homeView.html;
}

function renderMessage(title, message) {
  titleEl.textContent = title;
  const alert = document.createElement("div");
  alert.className = "alert theme-danger";
  alert.setAttribute("role", "alert");
  alert.textContent = message;
  mainEl.replaceChildren(alert);
}

function renderTable(route, json) {
  const { title, columns } = routes[route];
  titleEl.textContent = title;

  const table = document.createElement("table");
  table.className = "table";

  const header = table.createTHead().insertRow();
  for (const column of columns) {
    const th = document.createElement("th");
    th.textContent = column.label;
    header.appendChild(th);
  }

  const tbody = table.createTBody();
  if (json.data.length === 0) {
    const td = tbody.insertRow().insertCell();
    td.colSpan = columns.length;
    td.textContent = "Nessun risultato";
  }
  for (const row of json.data) {
    const tr = tbody.insertRow();
    for (const column of columns) {
      const td = tr.insertCell();
      const value = column.value(row);
      if (value instanceof Node) td.appendChild(value);
      else td.textContent = value ?? "-";
    }
  }

  const wrapper = document.createElement("div");
  wrapper.className = "table-responsive";
  wrapper.appendChild(table);

  mainEl.replaceChildren(wrapper, renderPagination(route, json));
}

// pagine da mostrare: la prima, l'ultima e quelle vicine alla corrente,
// con "…" al posto dei salti. es: [1, "…", 4, 5, 6, 7, 8, "…", 20]
function pageNumbers(current, totalPages, delta = 2) {
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= delta) {
      pages.push(p);
    } else if (pages.at(-1) !== "…") {
      pages.push("…");
    }
  }
  return pages;
}

function renderPagination(route, { page, pageSize, total, totalPages }) {
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "Paginazione");
  nav.className =
    "d-flex flex-wrap justify-content-between align-items-center gap-3";

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const info = document.createElement("p");
  info.className = "mb-0";
  info.textContent = `Risultati ${from}–${to} di ${total}`;
  nav.appendChild(info);

  if (totalPages <= 1) return nav;

  const ul = document.createElement("ul");
  ul.className = "pagination mb-0";

  const addItem = (label, targetPage, { active, disabled, ariaLabel } = {}) => {
    const li = document.createElement("li");
    li.className = "page-item";
    const a = document.createElement("a");
    a.className = "page-link";
    a.textContent = label;
    if (ariaLabel) a.setAttribute("aria-label", ariaLabel);
    if (active) {
      li.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
    if (disabled) {
      li.classList.add("disabled");
      a.setAttribute("aria-disabled", "true");
    } else {
      a.href = pageHref(route, targetPage);
    }
    li.appendChild(a);
    ul.appendChild(li);
  };

  addItem("«", page - 1, { disabled: page <= 1, ariaLabel: "Precedente" });
  for (const p of pageNumbers(page, totalPages)) {
    if (p === "…") addItem("…", null, { disabled: true });
    else addItem(String(p), p, { active: p === page });
  }
  addItem("»", page + 1, {
    disabled: page >= totalPages,
    ariaLabel: "Successiva",
  });

  nav.appendChild(ul);
  return nav;
}

// usato per ignorare le risposte arrivate dopo che l'utente ha già cambiato hash
let currentRender = 0;

async function router() {
  const renderId = ++currentRender;
  const { route, page } = parseHash();
  setActiveLink(route);

  if (!route) return renderHome();
  if (!(route in routes)) {
    return renderMessage("Pagina non trovata", `La sezione "${route}" non esiste.`);
  }

  try {
    const json = await fetchPage(route, page);
    if (renderId !== currentRender) return;
    // pagina oltre l'ultima: vai all'ultima disponibile
    if (json.totalPages > 0 && page > json.totalPages) {
      location.replace(pageHref(route, json.totalPages));
      return;
    }
    renderTable(route, json);
  } catch (err) {
    if (renderId !== currentRender) return;
    renderMessage(routes[route].title, `Errore nel caricamento: ${err.message}`);
  }
}

window.addEventListener("hashchange", router);
// all'avvio carica la sezione indicata dall'hash corrente (es. dopo un refresh)
router();
