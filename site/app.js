const DATA_PATH = "./data/conferences.json";

const state = {
  rows: [],
  filteredRows: [],
  fields: [],
  runDate: "",
  generatedAt: "",
  keyword: "",
  field: "",
  sort: "deadline_asc",
};

const elements = {
  metaLine: document.getElementById("metaLine"),
  keywordInput: document.getElementById("keywordInput"),
  fieldSelect: document.getElementById("fieldSelect"),
  sortSelect: document.getElementById("sortSelect"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  openCount: document.getElementById("openCount"),
  nonActiveCount: document.getElementById("nonActiveCount"),
  openTableBody: document.getElementById("openTableBody"),
  nonActiveTableBody: document.getElementById("nonActiveTableBody"),
  emptyRowTemplate: document.getElementById("emptyRowTemplate"),
};

async function init() {
  bindControls();
  try {
    const payload = await loadData();
    state.rows = Array.isArray(payload.conferences) ? payload.conferences : [];
    state.fields = Array.isArray(payload.fields) ? payload.fields : [];
    state.runDate = payload.run_date || "";
    state.generatedAt = payload.generated_at || "";
    buildFieldOptions(state.fields);
    applyFilters();
    renderMeta();
  } catch (error) {
    console.error(error);
    elements.metaLine.textContent = "Failed to load conference data.";
    renderRows([], []);
  }
}

async function loadData() {
  const response = await fetch(DATA_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${DATA_PATH}: ${response.status}`);
  }
  return response.json();
}

function bindControls() {
  elements.keywordInput.addEventListener("input", () => {
    state.keyword = elements.keywordInput.value.trim().toLowerCase();
    applyFilters();
  });

  elements.fieldSelect.addEventListener("change", () => {
    state.field = elements.fieldSelect.value;
    applyFilters();
  });

  elements.sortSelect.addEventListener("change", () => {
    state.sort = elements.sortSelect.value;
    applyFilters();
  });

  elements.resetFiltersBtn.addEventListener("click", () => {
    state.keyword = "";
    state.field = "";
    state.sort = "deadline_asc";
    elements.keywordInput.value = "";
    elements.fieldSelect.value = "";
    elements.sortSelect.value = "deadline_asc";
    applyFilters();
  });
}

function buildFieldOptions(fields) {
  const fragment = document.createDocumentFragment();
  for (const field of fields) {
    const option = document.createElement("option");
    option.value = field;
    option.textContent = field;
    fragment.appendChild(option);
  }
  elements.fieldSelect.appendChild(fragment);
}

function applyFilters() {
  const keyword = state.keyword;
  const field = state.field;

  state.filteredRows = state.rows
    .filter((row) => {
      if (field && row.field !== field) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const haystack = [
        row.conference_name,
        row.canonical_name,
        row.field,
        row.subfield,
        row.city,
        row.country,
        row.location_text,
        row.conference_dates_text,
        row.submission_deadline_primary,
        row.submission_deadlines_text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    })
    .sort(compareRows(state.sort));

  const open = state.filteredRows.filter((row) => row.open_call_status === "open");
  const nonActive = state.filteredRows.filter((row) => row.open_call_status !== "open");

  renderRows(open, nonActive);
  renderCounts(open.length, nonActive.length);
}

function compareRows(sortKey) {
  if (sortKey === "name_asc") {
    return (a, b) => byName(a, b, "asc");
  }
  if (sortKey === "name_desc") {
    return (a, b) => byName(a, b, "desc");
  }
  if (sortKey === "deadline_desc") {
    return (a, b) => byDeadline(a, b, "desc");
  }
  return (a, b) => byDeadline(a, b, "asc");
}

function byName(a, b, dir) {
  const left = (a.conference_name || "").toLowerCase();
  const right = (b.conference_name || "").toLowerCase();
  if (left === right) {
    return 0;
  }
  if (dir === "desc") {
    return left > right ? -1 : 1;
  }
  return left > right ? 1 : -1;
}

function byDeadline(a, b, dir) {
  const left = normalizedDeadlineValue(a.submission_deadline_primary);
  const right = normalizedDeadlineValue(b.submission_deadline_primary);
  if (left === right) {
    return byName(a, b, "asc");
  }
  if (dir === "desc") {
    return left > right ? -1 : 1;
  }
  return left > right ? 1 : -1;
}

function normalizedDeadlineValue(value) {
  if (!isIsoDate(value)) {
    return "9999-12-31";
  }
  return value;
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function renderMeta() {
  const generatedLabel = state.generatedAt ? formatDateTime(state.generatedAt) : "unknown";
  const runDateLabel = state.runDate || "unknown";
  elements.metaLine.textContent = `Run date: ${runDateLabel} | Last generated: ${generatedLabel}`;
}

function renderCounts(openCount, nonActiveCount) {
  elements.openCount.textContent = `${openCount} result${openCount === 1 ? "" : "s"}`;
  elements.nonActiveCount.textContent = `${nonActiveCount} result${nonActiveCount === 1 ? "" : "s"}`;
}

function renderRows(openRows, nonActiveRows) {
  renderTableBody(elements.openTableBody, openRows, "open");
  renderTableBody(elements.nonActiveTableBody, nonActiveRows, "non_active");
}

function renderTableBody(container, rows, statusType) {
  container.innerHTML = "";
  if (!rows.length) {
    container.appendChild(elements.emptyRowTemplate.content.cloneNode(true));
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${renderConferenceCell(row, statusType)}</td>
      <td>${safeText(row.field)}</td>
      <td>${safeText(locationLabel(row))}</td>
      <td>${safeText(dateLabel(row))}</td>
      <td>${safeText(deadlineLabel(row))}</td>
      <td>${renderWebsiteCell(row)}</td>
    `;
    fragment.appendChild(tr);
  }
  container.appendChild(fragment);
}

function renderConferenceCell(row, statusType) {
  const statusText = statusType === "open" ? "OPEN" : "NON-ACTIVE";
  const statusClass = statusType === "open" ? "tag-open" : "tag-non-active";
  const conferenceName = safeText(row.conference_name);
  const details = safeText(detailLabel(row));
  return `
    <div class="conference-title">${conferenceName}</div>
    <div class="conference-detail">${details}</div>
    <div class="tag ${statusClass}">${statusText}</div>
  `;
}

function renderWebsiteCell(row) {
  const url = row.official_website || "";
  if (!url) {
    return "<span class=\"conference-detail\">Not verified</span>";
  }
  const escaped = safeText(url);
  return `<a class="site-link" href="${escaped}" target="_blank" rel="noopener noreferrer">Official page</a>`;
}

function detailLabel(row) {
  const pieces = [];
  if (row.event_type) {
    pieces.push(row.event_type);
  }
  if (row.submission_type) {
    pieces.push(`Submission: ${row.submission_type}`);
  }
  return pieces.join(" | ") || "No extra details";
}

function locationLabel(row) {
  if (row.location_text) {
    return row.location_text;
  }
  const parts = [row.city, row.country].filter(Boolean);
  return parts.join(", ") || "";
}

function dateLabel(row) {
  if (row.conference_dates_text) {
    return row.conference_dates_text;
  }
  if (row.conference_start_date && row.conference_end_date) {
    return `${row.conference_start_date} to ${row.conference_end_date}`;
  }
  return row.conference_start_date || row.conference_end_date || "";
}

function deadlineLabel(row) {
  if (row.submission_deadline_primary) {
    return row.submission_deadline_primary;
  }
  return row.submission_deadlines_text || "";
}

function formatDateTime(iso) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeText(value) {
  const text = (value || "").toString();
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

init();
