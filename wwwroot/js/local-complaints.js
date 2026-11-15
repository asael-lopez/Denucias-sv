(function () {
  "use strict";

  var REPORTS_KEY = "soyapango.localComplaints.v1";
  var SESSION_KEY = "soyapango.localSession.v1";
  var COMPLAINT_DRAFT_KEY = "soyapango.complaintDraft.v1";
  var MAP_CENTER = [13.715, -89.155];
  var STATUSES = ["Recibido", "En proceso", "Enviado a Alcaldía", "Finalizado"];
  var adminLeafletMap = null;
  var adminMarkersLayer = null;
  var SEED_REPORTS = [
    {
      ticket: "SOY-2026-000123",
      type: "Bacheo",
      description: "Hay un bache grande que dificulta el paso de vehículos y representa un riesgo.",
      location: "Col. Las Margaritas",
      latitude: 13.7156,
      longitude: -89.1518,
      coordinateApproximate: true,
      reference: "Final Calle La Campana",
      createdAt: "2026-03-12T10:42:00.000Z",
      status: "En proceso",
      priority: "Súper urgente",
      department: "Mantenimiento Vial",
      result: "",
      ownerDui: "",
      citizenName: "María González",
      demo: true,
      history: [
        { type: "status", status: "Recibido", message: "La denuncia fue registrada correctamente.", at: "2026-03-12T10:42:00.000Z", by: "Sistema" },
        { type: "status", status: "En proceso", message: "El equipo está revisando la información.", at: "2026-03-12T14:15:00.000Z", by: "Administración" }
      ]
    },
    {
      ticket: "SOY-2026-000087",
      type: "Luminaria dañada",
      description: "Una luminaria dejó de funcionar y la calle queda oscura por la noche.",
      location: "Col. Bosques de Prusia",
      latitude: 13.7124,
      longitude: -89.1581,
      coordinateApproximate: true,
      reference: "",
      createdAt: "2026-03-06T09:00:00.000Z",
      status: "Finalizado",
      priority: "Común",
      department: "Alumbrado público",
      result: "La luminaria fue reparada y quedó funcionando durante la verificación.",
      ownerDui: "",
      citizenName: "María González",
      demo: true,
      history: [
        { type: "status", status: "Recibido", message: "La denuncia fue registrada correctamente.", at: "2026-03-06T09:00:00.000Z", by: "Sistema" },
        { type: "status", status: "En proceso", message: "El equipo está revisando la información.", at: "2026-03-06T12:00:00.000Z", by: "Administración" },
        { type: "status", status: "Finalizado", message: "La denuncia fue finalizada.", at: "2026-03-08T16:30:00.000Z", by: "Administración" },
        { type: "result", message: "Resultado: la luminaria fue reparada y quedó funcionando durante la verificación.", at: "2026-03-08T16:30:00.000Z", by: "Administración" }
      ]
    },
    {
      ticket: "SOY-2026-000052",
      type: "Desechos sólidos",
      description: "Hay desechos acumulados que necesitan ser retirados.",
      location: "Urb. Montes de San Bartolo",
      latitude: 13.7191,
      longitude: -89.1497,
      coordinateApproximate: true,
      reference: "",
      createdAt: "2026-02-28T15:00:00.000Z",
      status: "Enviado a Alcaldía",
      priority: "Urgente",
      department: "Desechos sólidos",
      result: "",
      ownerDui: "",
      citizenName: "María González",
      demo: true,
      history: [
        { type: "status", status: "Recibido", message: "La denuncia fue registrada correctamente.", at: "2026-02-28T15:00:00.000Z", by: "Sistema" },
        { type: "status", status: "En proceso", message: "El equipo está revisando la información.", at: "2026-03-01T10:00:00.000Z", by: "Administración" },
        { type: "status", status: "Enviado a Alcaldía", message: "La denuncia fue asignada al departamento responsable.", at: "2026-03-02T11:30:00.000Z", by: "Administración" }
      ]
    }
  ];

  function showMessage(selector, message, visible) {
    var element = document.querySelector(selector);
    if (!element) return;
    if (message) element.textContent = message;
    element.hidden = !visible;
  }

  function showDataError(message) {
    var elements = document.querySelectorAll("[data-data-error]");
    if (!elements.length) {
      console.error(message);
      return;
    }
    elements.forEach(function (element) {
      element.textContent = message;
      element.hidden = false;
    });
  }

  function readReports() {
    var stored;
    try {
      stored = localStorage.getItem(REPORTS_KEY);
    } catch (error) {
      showDataError("No se pudo leer el almacenamiento local de denuncias.");
      return null;
    }

    if (stored === null) {
      try {
        localStorage.setItem(REPORTS_KEY, JSON.stringify(SEED_REPORTS));
      } catch (error) {
        showDataError("No se pudieron inicializar las denuncias de demostración en este navegador.");
      }
      return SEED_REPORTS.slice();
    }

    try {
      var reports = JSON.parse(stored);
      if (!Array.isArray(reports)) throw new Error("Formato de denuncias inválido.");
      return reports;
    } catch (error) {
      showDataError("Los datos locales de denuncias están dañados. Borra los datos del sitio para reiniciar la demostración.");
      return null;
    }
  }

  function writeReports(reports) {
    try {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
      return true;
    } catch (error) {
      showDataError("No se pudieron guardar los cambios. Revisa el espacio disponible del navegador.");
      return false;
    }
  }

  /* La sesión proviene del servidor (cookie de autenticación) y el layout la
     expone en el elemento [data-portal-session]. Se conserva el respaldo al
     sessionStorage que usaban las versiones anteriores del prototipo. */
  function readSession() {
    var holder = document.querySelector("[data-portal-session]");
    if (holder) {
      var role = holder.getAttribute("data-role");
      var dui = holder.getAttribute("data-dui") || "";
      var fullName = holder.getAttribute("data-name") || "";
      if (role === "admin") {
        return {
          role: "admin",
          dui: dui,
          fullName: fullName,
          adminRole: holder.getAttribute("data-admin-role") || "general",
          area: holder.getAttribute("data-area") || ""
        };
      }
      if (role === "citizen" && dui) {
        return { role: "citizen", dui: dui, fullName: fullName };
      }
      return null;
    }
    try {
      var session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      return session && typeof session === "object" ? session : null;
    } catch (error) {
      showDataError("No se pudo leer la sesión local actual.");
      return null;
    }
  }

  function currentCitizenDui() {
    var session = readSession();
    return session && session.role === "citizen" && session.dui ? session.dui : "";
  }

  function currentAdminSession() {
    var session = readSession();
    return session && session.role === "admin" ? session : null;
  }

  /* El administrador general ve todas las denuncias; el administrador de área
     solo las de la categoría que tiene asignada. */
  function visibleAdminReports(reports) {
    var session = currentAdminSession();
    if (!session || session.adminRole !== "area" || !session.area) return reports;
    return reports.filter(function (report) {
      return report.type === session.area;
    });
  }

  function adminCanManage(report) {
    var session = currentAdminSession();
    if (!session || session.adminRole !== "area" || !session.area) return true;
    return report.type === session.area;
  }

  function sortNewest(reports) {
    return reports.slice().sort(function (left, right) {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }

  function formatDate(value, includeTime) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "Fecha no disponible";
    return date.toLocaleString("es-SV", includeTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" });
  }

  function dateValue(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function statusClass(status) {
    if (status === "Finalizado") return "badge-green";
    if (status === "Enviado a Alcaldía") return "badge-blue";
    if (status === "En proceso") return "badge-orange";
    return "badge-gray";
  }

  function priorityClass(priority) {
    if (priority === "Súper urgente") return "badge-red";
    if (priority === "Urgente") return "badge-orange";
    return "badge-gray";
  }

  function setBadge(element, value, className) {
    if (!element) return;
    element.className = "badge " + className;
    var label = element.querySelector("span");
    if (label) label.textContent = value;
    else element.appendChild(document.createTextNode(value));
  }

  function citizenReports(reports) {
    var dui = currentCitizenDui();
    return sortNewest(reports.filter(function (report) {
      return report.demo === true || (dui && report.ownerDui === dui);
    }));
  }

  function populateTypeFilter(select, reports) {
    if (!select) return;
    var previousValue = select.value;
    while (select.options.length > 1) select.remove(1);
    var types = {};
    reports.forEach(function (report) {
      if (report.type) types[report.type] = true;
    });
    Object.keys(types).sort().forEach(function (type) {
      var option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      select.appendChild(option);
    });
    select.value = previousValue;
  }

  function matchesFilters(report, filters) {
    var search = filters.search.toLowerCase();
    var searchable = [report.ticket, report.type, report.location, report.description, report.status]
      .join(" ").toLowerCase();
    if (search && searchable.indexOf(search) === -1) return false;
    if (filters.status && report.status !== filters.status) return false;
    if (filters.type && report.type !== filters.type) return false;
    if (filters.priority && report.priority !== filters.priority) return false;
    if (filters.date && dateValue(report.createdAt) !== filters.date) return false;
    return true;
  }

  function renderCitizenReports() {
    var container = document.querySelector(".reports-table");
    var template = document.querySelector("[data-citizen-report-template]");
    if (!container || !template) return;

    var storedReports = readReports();
    if (!storedReports) return;
    var reports = citizenReports(storedReports);
    var statusFilter = document.querySelector("[data-citizen-status-filter]");
    var typeFilter = document.querySelector("[data-citizen-type-filter]");
    var searchInput = document.querySelector("[data-citizen-report-search]");
    populateTypeFilter(typeFilter, reports);

    var filters = {
      search: searchInput ? searchInput.value.trim() : "",
      status: statusFilter ? statusFilter.value : "",
      type: typeFilter ? typeFilter.value : ""
    };
    var filtered = reports.filter(function (report) {
      return matchesFilters(report, filters);
    });

    container.querySelectorAll("article").forEach(function (row) { row.remove(); });
    filtered.forEach(function (report) {
      var row = template.content.firstElementChild.cloneNode(true);
      row.querySelector("[data-report-ticket]").textContent = report.ticket;
      row.querySelector("[data-report-type]").textContent = report.type;
      row.querySelector("[data-report-date]").textContent = formatDate(report.createdAt, false);
      row.querySelector("[data-report-location]").textContent = report.location;
      var result = row.querySelector("[data-report-result]");
      if (result && report.status === "Finalizado" && report.result) {
        result.textContent = "Resultado: " + report.result;
        result.hidden = false;
      }
      setBadge(row.querySelector("[data-report-status]"), report.status, statusClass(report.status));
      row.querySelector("[data-report-link]").href = "/estado?ticket=" + encodeURIComponent(report.ticket);
      var pdfBtn = row.querySelector("[data-report-pdf]");
      if (pdfBtn) {
        pdfBtn.addEventListener("click", function (event) {
          event.stopPropagation();
          if (window.PdfReport) {
            var pdfType = report.status === "Finalizado" ? "cierre" : "registro";
            window.PdfReport.generate(report, pdfType);
          }
        });
      }
      row.addEventListener("click", function (event) {
        if (event.target.closest("a, button")) return;
        window.location.assign("/estado?ticket=" + encodeURIComponent(report.ticket));
      });
      container.appendChild(row);
    });
    var empty = document.querySelector("[data-citizen-reports-empty]");
    if (empty) empty.hidden = filtered.length !== 0;
  }

  function initCitizenReports() {
    if (!document.querySelector("[data-citizen-report-template]")) return;
    renderCitizenReports();
    ["[data-citizen-report-search]", "[data-citizen-status-filter]", "[data-citizen-type-filter]"]
      .forEach(function (selector) {
        var input = document.querySelector(selector);
        if (input) input.addEventListener("input", renderCitizenReports);
        if (input) input.addEventListener("change", renderCitizenReports);
      });
  }

  function readAdminFilters() {
    var search = document.querySelector("[data-admin-report-search]");
    var status = document.querySelector("[data-admin-status-filter]");
    var priority = document.querySelector("[data-admin-priority-filter]");
    var type = document.querySelector("[data-admin-type-filter]");
    var date = document.querySelector("[data-admin-date-filter]");
    return {
      search: search ? search.value.trim() : "",
      status: status ? status.value : "",
      priority: priority ? priority.value : "",
      type: type ? type.value : "",
      date: date ? date.value : ""
    };
  }

  function renderAdminStats(reports) {
    var counts = {
      total: reports.length,
      urgent: reports.filter(function (report) { return report.priority === "Súper urgente"; }).length,
      "in-progress": reports.filter(function (report) { return report.status === "En proceso"; }).length,
      finished: reports.filter(function (report) { return report.status === "Finalizado"; }).length,
      sent: reports.filter(function (report) { return report.status === "Enviado a Alcaldía"; }).length
    };
    Object.keys(counts).forEach(function (name) {
      var element = document.querySelector('[data-admin-stat="' + name + '"]');
      if (element) element.textContent = String(counts[name]);
    });
  }

  function renderAdminReports() {
    var table = document.querySelector("[data-admin-table]");
    var template = document.querySelector("[data-admin-report-template]");
    if (!table || !template) return;

    var storedReports = readReports();
    if (!storedReports) return;
    var reports = sortNewest(visibleAdminReports(storedReports));
    populateTypeFilter(document.querySelector("[data-admin-type-filter]"), reports);
    renderAdminStats(reports);
    var filters = readAdminFilters();
    var filtered = reports.filter(function (report) {
      return matchesFilters(report, filters);
    });

    table.querySelectorAll("article").forEach(function (row) { row.remove(); });
    filtered.forEach(function (report) {
      var row = template.content.firstElementChild.cloneNode(true);
      row.querySelector("[data-admin-report-ticket]").textContent = report.ticket;
      row.querySelector("[data-admin-report-type]").textContent = report.type;
      row.querySelector("[data-admin-report-date]").textContent = formatDate(report.createdAt, true);
      row.querySelector("[data-admin-report-location]").textContent = report.location;
      setBadge(row.querySelector("[data-admin-report-priority]"), report.priority, priorityClass(report.priority));
      setBadge(row.querySelector("[data-admin-report-status]"), report.status, statusClass(report.status));
      row.querySelector("[data-admin-report-link]").href = "/admin-detalle?ticket=" + encodeURIComponent(report.ticket);
      table.appendChild(row);
    });

    var count = document.querySelector("[data-admin-results-count]");
    if (count) count.textContent = "Mostrando " + filtered.length + " de " + reports.length + " denuncias";
    var empty = document.querySelector("[data-admin-reports-empty]");
    if (empty) empty.hidden = filtered.length !== 0;
    var pagination = document.querySelector(".pagination");
    if (pagination) pagination.hidden = true;
  }

  function initAdminReports() {
    if (!document.querySelector("[data-admin-report-template]")) return;
    renderAdminReports();
    [
      "[data-admin-report-search]",
      "[data-admin-status-filter]",
      "[data-admin-priority-filter]",
      "[data-admin-type-filter]",
      "[data-admin-date-filter]"
    ].forEach(function (selector) {
      var input = document.querySelector(selector);
      if (input) input.addEventListener("input", renderAdminReports);
      if (input) input.addEventListener("change", renderAdminReports);
    });
    var clearButton = document.querySelector("[data-clear-admin-filters]");
    if (clearButton) {
      clearButton.addEventListener("click", function () {
        [
          "[data-admin-report-search]",
          "[data-admin-status-filter]",
          "[data-admin-priority-filter]",
          "[data-admin-type-filter]",
          "[data-admin-date-filter]"
        ].forEach(function (selector) {
          var input = document.querySelector(selector);
          if (input) input.value = "";
        });
        renderAdminReports();
      });
    }
  }

  function findReport(ticket) {
    if (!ticket) return null;
    var reports = readReports();
    if (!reports) return null;
    return reports.find(function (report) { return report.ticket === ticket; }) || null;
  }

  function currentTicket() {
    return new URLSearchParams(window.location.search).get("ticket");
  }

  function renderTimeline(report) {
    var timeline = document.querySelector("[data-case-timeline]");
    if (!timeline) return;
    timeline.textContent = "";
    var events = (report.history || []).filter(function (event) {
      return event.type === "status";
    });
    events.forEach(function (event, index) {
      var item = document.createElement("div");
      item.className = index === events.length - 1 ? "active" : "done";
      var marker = document.createElement("span");
      if (item.className === "active") {
        var dot = document.createElement("i");
        marker.appendChild(dot);
      } else {
        marker.textContent = "✓";
      }
      var content = document.createElement("div");
      var title = document.createElement("strong");
      title.textContent = event.status;
      var message = document.createElement("p");
      message.textContent = event.message;
      var date = document.createElement("small");
      date.textContent = formatDate(event.at, true);
      content.appendChild(title);
      content.appendChild(message);
      content.appendChild(date);
      item.appendChild(marker);
      item.appendChild(content);
      timeline.appendChild(item);
    });
  }

  function renderCitizenCase() {
    if (!document.querySelector("[data-case-timeline]")) return;
    var report = findReport(currentTicket());
    if (!report) {
      showNotFound("[data-case-error]", "No se encontró la denuncia solicitada. Vuelve a Mis denuncias.");
      return;
    }
    var set = function (selector, value) {
      var element = document.querySelector(selector);
      if (element) element.textContent = value || "";
    };
    set("[data-case-ticket]", report.ticket);
    set("[data-case-created]", "Creado el " + formatDate(report.createdAt, true));
    set("[data-case-type]", report.type);
    set("[data-case-description]", report.description);
    set("[data-case-location]", [report.reference, report.location].filter(Boolean).join(", "));
    renderReportLocationMap(report, "[data-case-location-map]", "[data-case-coordinate-note]", false);
    setBadge(document.querySelector("[data-case-status]"), report.status, statusClass(report.status));
    renderTimeline(report);

    var resultBlock = document.querySelector("[data-case-result]");
    if (resultBlock) {
      resultBlock.hidden = report.status !== "Finalizado" || !report.result;
      set("[data-case-result-text]", report.result);
    }
    var image = document.querySelector("[data-case-photo]");
    if (image && report.photoData) {
      image.src = report.photoData;
      if (image.parentElement) image.parentElement.hidden = false;
    }
    if (image && !report.photoData && image.parentElement) image.parentElement.hidden = true;
  }

  function showNotFound(selector, message) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = message;
      element.hidden = false;
    }
  }

  function renderTicket() {
    if (!document.querySelector("[data-ticket-number]")) return;
    var report = findReport(currentTicket());
    if (!report) {
      showNotFound("[data-ticket-error]", "No se encontró el ticket. Ve a Mis denuncias para consultar tus reportes.");
      return;
    }
    document.querySelector("[data-ticket-number]").textContent = report.ticket;
    document.querySelector("[data-ticket-type]").textContent = report.type;
    document.querySelector("[data-ticket-description]").textContent = report.description;
    document.querySelector("[data-ticket-date]").textContent = formatDate(report.createdAt, true);
    document.querySelector("[data-ticket-location]").textContent = [report.reference, report.location].filter(Boolean).join(", ");
    setBadge(document.querySelector("[data-ticket-status]"), report.status, statusClass(report.status));
    document.querySelector("[data-ticket-state-link]").href = "/estado?ticket=" + encodeURIComponent(report.ticket);
    var image = document.querySelector("[data-ticket-photo]");
    var summary = document.querySelector(".summary-card");
    if (image && report.photoData) {
      image.src = report.photoData;
      if (image.parentElement) image.parentElement.hidden = false;
      if (summary) summary.classList.remove("no-photo");
    }
    if (image && !report.photoData && image.parentElement) image.parentElement.hidden = true;
    if (summary && !report.photoData) summary.classList.add("no-photo");
  }

  function generateTicket(reports) {
    var currentYear = new Date().getFullYear();
    var highest = reports.reduce(function (maximum, report) {
      var match = /^SOY-\d{4}-(\d+)$/.exec(report.ticket || "");
      return match ? Math.max(maximum, Number(match[1])) : maximum;
    }, 0);
    return "SOY-" + currentYear + "-" + String(highest + 1).padStart(6, "0");
  }

  function showComplaintError(message) {
    showMessage("[data-complaint-error]", message, true);
  }

  function saveComplaintDraft() {
    var draft = {
      type: document.querySelector("[data-complaint-type]").value,
      description: document.querySelector("[data-complaint-description]").value,
      location: document.querySelector("[data-complaint-location]").value,
      reference: document.querySelector("[data-complaint-reference]").value,
      latitude: document.querySelector("[data-complaint-latitude]").value,
      longitude: document.querySelector("[data-complaint-longitude]").value,
      locationSource: document.querySelector("[data-complaint-location-source]").value,
      locationAccuracy: document.querySelector("[data-complaint-location-accuracy]").value
    };

    try {
      sessionStorage.setItem(COMPLAINT_DRAFT_KEY, JSON.stringify(draft));
      return true;
    } catch (error) {
      showComplaintError("No se pudo conservar la denuncia. Copia los datos antes de iniciar sesión.");
      return false;
    }
  }

  function restoreComplaintDraft() {
    try {
      var draft = JSON.parse(sessionStorage.getItem(COMPLAINT_DRAFT_KEY) || "null");
      if (!draft) return;

      var typeInput = document.querySelector("[data-complaint-type]");
      var descriptionInput = document.querySelector("[data-complaint-description]");
      var locationInput = document.querySelector("[data-complaint-location]");
      var referenceInput = document.querySelector("[data-complaint-reference]");
      var latitudeInput = document.querySelector("[data-complaint-latitude]");
      var longitudeInput = document.querySelector("[data-complaint-longitude]");
      var sourceInput = document.querySelector("[data-complaint-location-source]");
      var accuracyInput = document.querySelector("[data-complaint-location-accuracy]");
      if (typeInput && draft.type) typeInput.value = draft.type;
      if (descriptionInput && typeof draft.description === "string") {
        descriptionInput.value = draft.description;
        descriptionInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (locationInput && typeof draft.location === "string") locationInput.value = draft.location;
      if (referenceInput && typeof draft.reference === "string") referenceInput.value = draft.reference;
      if (latitudeInput && draft.latitude) latitudeInput.value = draft.latitude;
      if (longitudeInput && draft.longitude) longitudeInput.value = draft.longitude;
      if (sourceInput && draft.locationSource) sourceInput.value = draft.locationSource;
      if (accuracyInput && draft.locationAccuracy) accuracyInput.value = draft.locationAccuracy;
      sessionStorage.removeItem(COMPLAINT_DRAFT_KEY);
    } catch (error) {
      showComplaintError("No se pudieron restaurar los datos de la denuncia. Revísalos antes de enviarla.");
    }
  }

  function submitComplaint() {
    showMessage("[data-complaint-error]", "", false);
    var typeInput = document.querySelector("[data-complaint-type]");
    var descriptionInput = document.querySelector("[data-complaint-description]");
    var locationInput = document.querySelector("[data-complaint-location]");
    var referenceInput = document.querySelector("[data-complaint-reference]");
    var latitudeInput = document.querySelector("[data-complaint-latitude]");
    var longitudeInput = document.querySelector("[data-complaint-longitude]");
    var sourceInput = document.querySelector("[data-complaint-location-source]");
    var accuracyInput = document.querySelector("[data-complaint-location-accuracy]");
    var session = readSession();
    /* En modo admin se permite registrar sin sesión ciudadana */
    var isAdmin = session && session.role === "admin";
    if (!isAdmin && (!session || session.role !== "citizen" || !session.dui)) {
      if (!saveComplaintDraft()) return;
      window.location.assign("/login?returnUrl=/crear-denuncia");
      return;
    }
    if (!typeInput.value || !descriptionInput.value.trim() || !locationInput.value.trim()) {
      showComplaintError("Completa el tipo, la descripción y la dirección de la denuncia.");
      if (!descriptionInput.value.trim()) descriptionInput.focus();
      else if (!locationInput.value.trim()) locationInput.focus();
      return;
    }

    var reports = readReports();
    if (!reports) return;
    var now = new Date().toISOString();
    var priorityInput = document.querySelector("[data-complaint-priority]");
    var report = {
      ticket: generateTicket(reports),
      type: typeInput.value,
      description: descriptionInput.value.trim(),
      location: locationInput.value.trim(),
      reference: referenceInput.value.trim(),
      latitude: Number(latitudeInput && latitudeInput.value) || MAP_CENTER[0],
      longitude: Number(longitudeInput && longitudeInput.value) || MAP_CENTER[1],
      locationSource: sourceInput ? sourceInput.value || "reference" : "reference",
      locationAccuracy: accuracyInput && accuracyInput.value ? Number(accuracyInput.value) : null,
      coordinateApproximate: !sourceInput || sourceInput.value === "reference",
      createdAt: now,
      status: "Recibido",
      priority: priorityInput ? priorityInput.value || "Común" : "Común",
      department: "",
      result: "",
      ownerDui: isAdmin ? (session.dui || "ADMIN") : session.dui,
      citizenName: isAdmin ? (session.fullName || "Administrador") : (session.fullName || "Ciudadano"),
      demo: false,
      history: [{
        type: "status",
        status: "Recibido",
        message: "La denuncia fue registrada correctamente.",
        at: now,
        by: isAdmin ? "Administración" : "Sistema"
      }]
    };
    reports.push(report);
    if (!writeReports(reports)) return;
    if (isAdmin) {
      window.location.assign("/admin-detalle?ticket=" + encodeURIComponent(report.ticket));
    } else {
      window.location.assign("/ticket?ticket=" + encodeURIComponent(report.ticket));
    }
  }

  function addLeafletBase(map) {
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
    }).addTo(map);
  }

  function bindMapZoomControls(element, map) {
    var control = element.querySelector("[data-map-zoom]");
    if (!control) return;
    window.L.DomEvent.disableClickPropagation(control);
    var zoomIn = control.querySelector("[data-map-zoom-in]");
    var zoomOut = control.querySelector("[data-map-zoom-out]");
    if (zoomIn) zoomIn.addEventListener("click", function () { map.zoomIn(); });
    if (zoomOut) zoomOut.addEventListener("click", function () { map.zoomOut(); });
  }

  function initComplaintLocationMaps() {
    var containers = document.querySelectorAll("[data-complaint-map]");
    if (!containers.length) return;
    if (!window.L) {
      containers.forEach(function (container) {
        var notice = document.createElement("p");
        notice.className = "map-load-error";
        notice.textContent = "No se pudo cargar el mapa. Comprueba tu conexión a Internet.";
        container.appendChild(notice);
      });
      return;
    }

    var latitudeInput = document.querySelector("[data-complaint-latitude]");
    var longitudeInput = document.querySelector("[data-complaint-longitude]");
    var sourceInput = document.querySelector("[data-complaint-location-source]");
    var accuracyInput = document.querySelector("[data-complaint-location-accuracy]");
    var locationInput = document.querySelector("[data-complaint-location]");
    var title = document.querySelector("[data-location-title]");
    var description = document.querySelector("[data-location-description]");
    var locationManuallyEdited = false;
    var locationEditVersion = 0;
    var addressRequest = 0;
    var addressLookupTimer = null;
    var lastAddressLookup = 0;
    var gpsWatchId = null;
    var gpsWatchTimer = null;
    var bestGpsPosition = null;
    var gpsRequestId = 0;
    var maps = [];
    var markers = [];
    var locationManuallySelected = false;
    var savedLat = latitudeInput ? Number(latitudeInput.value) : NaN;
    var savedLng = longitudeInput ? Number(longitudeInput.value) : NaN;
    var savedSource = sourceInput ? sourceInput.value || "reference" : "reference";
    var start = isFinite(savedLat) && isFinite(savedLng) && latitudeInput.value && longitudeInput.value
      ? [savedLat, savedLng]
      : MAP_CENTER;

    function updateLocationCaption() {
      var address = locationInput ? locationInput.value : "";
      document.querySelectorAll("[data-location-address]").forEach(function (element) {
        element.textContent = address;
      });
    }

    function stopGPSWatch() {
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
      }
      window.clearTimeout(gpsWatchTimer);
      gpsWatchTimer = null;
    }

    function applyGPSPosition(position, editVersionAtRequest, requestId) {
      stopGPSWatch();
      if (locationManuallySelected || requestId !== gpsRequestId) return;

      locationManuallyEdited = locationEditVersion !== editVersionAtRequest;
      var accuracy = Math.round(position.coords.accuracy);
      var coordinates = [position.coords.latitude, position.coords.longitude];
      var approximate = accuracy > 100;
      var message = approximate
        ? "Precisión baja (" + accuracy + " m). Ajusta el pin para indicar el punto exacto."
        : "Precisión aproximada: " + accuracy + " metros.";
      setLocation(coordinates, {
        title: approximate ? "Ubicación aproximada" : "Ubicación encontrada",
        description: message
      }, accuracy > 500 ? 13 : accuracy > 100 ? 15 : 17, "gps", accuracy);
      reverseGeocode({ lat: coordinates[0], lng: coordinates[1] }, accuracy);
    }

    function reverseGeocode(latlng, accuracy) {
      var request = ++addressRequest;
      var editVersion = locationEditVersion;
      var precision = typeof accuracy === "number" && isFinite(accuracy) ? accuracy : 0;
      var addressZoom = precision > 500 ? 13 : precision > 100 ? 16 : 18;
      var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2"
        + "&lat=" + encodeURIComponent(latlng.lat)
        + "&lon=" + encodeURIComponent(latlng.lng)
        + "&zoom=" + addressZoom + "&addressdetails=1";

      window.clearTimeout(addressLookupTimer);
      addressLookupTimer = window.setTimeout(function () {
        var wait = Math.max(0, 1000 - (Date.now() - lastAddressLookup));
        addressLookupTimer = window.setTimeout(function () {
          lastAddressLookup = Date.now();
          fetch(url, { headers: { Accept: "application/json" } })
            .then(function (response) {
              if (!response.ok) throw new Error("No se pudo consultar la dirección.");
              return response.json();
            })
            .then(function (result) {
              if (request !== addressRequest || locationManuallyEdited
                || editVersion !== locationEditVersion || !locationInput) return;
              var address = result.address || {};
              var road = [address.house_number, address.road].filter(Boolean).join(" ");
              var parts = (precision <= 100 ? [road] : []).concat([
                address.neighbourhood || address.suburb || address.quarter,
                address.city || address.town || address.village || address.municipality,
                address.state
              ]).filter(Boolean);
              var uniqueParts = parts.filter(function (part, index) {
                return parts.indexOf(part) === index;
              });
              var formatted = uniqueParts.join(", ")
                || (precision <= 100 ? result.display_name || "" : "");
              if (!formatted) return;
              locationInput.value = formatted.slice(0, 180);
              updateLocationCaption();
            })
            .catch(function () {
              // La dirección se puede completar manualmente si el servicio no responde.
            });
        }, wait);
      }, 250);
    }

    function setLocation(latlng, message, zoom, source, accuracy) {
      var position = window.L.latLng(latlng);
      markers.forEach(function (marker) { marker.setLatLng(position); });
      maps.forEach(function (map) {
        if (zoom) map.setView(position, zoom);
      });
      if (latitudeInput) latitudeInput.value = position.lat.toFixed(6);
      if (longitudeInput) longitudeInput.value = position.lng.toFixed(6);
      if (sourceInput && source) sourceInput.value = source;
      if (accuracyInput) accuracyInput.value = accuracy ? String(Math.round(accuracy)) : "";
      if (message && title) title.textContent = message.title;
      if (message && description) description.textContent = message.description;
    }

    if (locationInput) {
      locationInput.addEventListener("input", function () {
        locationEditVersion += 1;
        locationManuallyEdited = true;
        updateLocationCaption();
      });
      updateLocationCaption();
    }

    containers.forEach(function (container) {
      var map = window.L.map(container, { zoomControl: false }).setView(start, 14);
      addLeafletBase(map);
      var marker = window.L.marker(start, { draggable: true, keyboard: true }).addTo(map);
      bindMapZoomControls(container, map);
      map.on("click", function (event) {
        gpsRequestId += 1;
        stopGPSWatch();
        locationManuallySelected = true;
        locationManuallyEdited = false;
        setLocation(event.latlng, {
          title: "Ubicación seleccionada",
          description: "Coordenadas: " + event.latlng.lat.toFixed(6) + ", " + event.latlng.lng.toFixed(6)
        }, Math.max(map.getZoom(), 15), "manual");
        reverseGeocode(event.latlng);
      });
      marker.on("dragend", function () {
        gpsRequestId += 1;
        stopGPSWatch();
        locationManuallySelected = true;
        locationManuallyEdited = false;
        var position = marker.getLatLng();
        setLocation(position, {
          title: "Ubicación ajustada",
          description: "Coordenadas: " + position.lat.toFixed(6) + ", " + position.lng.toFixed(6)
        }, map.getZoom(), "manual");
        reverseGeocode(position);
      });
      maps.push(map);
      markers.push(marker);
    });

    setLocation(start, {
      title: savedSource === "reference" ? "Ubicación de referencia" : "Ubicación guardada",
      description: savedSource === "reference"
        ? "Centro de Soyapango. Arrastra el pin o selecciona el mapa."
        : "Coordenadas guardadas: " + start[0].toFixed(6) + ", " + start[1].toFixed(6)
    }, null, savedSource, accuracyInput && accuracyInput.value ? Number(accuracyInput.value) : null);

    function requestUserLocation() {
      locationManuallySelected = false;
      var requestId = ++gpsRequestId;
      var editVersionAtRequest = locationEditVersion;
      if (!navigator.geolocation) {
        if (title) title.textContent = "GPS no disponible";
        if (description) description.textContent = "Selecciona la ubicación directamente en el mapa.";
        return;
      }
      stopGPSWatch();
      bestGpsPosition = null;
      if (title) title.textContent = "Buscando ubicación";
      if (description) description.textContent = "Esperando una señal más precisa...";

      gpsWatchId = navigator.geolocation.watchPosition(function (position) {
        if (locationManuallySelected || requestId !== gpsRequestId) return;
        if (!bestGpsPosition || position.coords.accuracy < bestGpsPosition.coords.accuracy) {
          bestGpsPosition = position;
        }
        if (position.coords.accuracy <= 75) {
          applyGPSPosition(position, editVersionAtRequest, requestId);
        } else if (description) {
          description.textContent = "Señal aproximada (" + Math.round(position.coords.accuracy)
            + " m); buscando una ubicación más precisa...";
        }
      }, function (error) {
        if (locationManuallySelected || requestId !== gpsRequestId) return;
        if (bestGpsPosition) {
          applyGPSPosition(bestGpsPosition, editVersionAtRequest, requestId);
          return;
        }
        stopGPSWatch();
        if (title) title.textContent = "No se obtuvo la ubicación";
        if (description) {
          description.textContent = error.code === 1
            ? "Permite el acceso a la ubicación en el navegador e inténtalo de nuevo."
            : "Revisa la señal y los servicios de ubicación, o selecciona el punto en el mapa.";
        }
      }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });

      gpsWatchTimer = window.setTimeout(function () {
        if (locationManuallySelected || requestId !== gpsRequestId) return;
        if (bestGpsPosition) {
          applyGPSPosition(bestGpsPosition, editVersionAtRequest, requestId);
          return;
        }
        stopGPSWatch();
        if (title) title.textContent = "No se obtuvo la ubicación";
        if (description) description.textContent = "Revisa los servicios de ubicación o selecciona el punto en el mapa.";
      }, 20000);
    }

    var locationButton = document.querySelector("[data-use-location]");
    if (locationButton) locationButton.addEventListener("click", requestUserLocation);

    var locationRequested = savedSource !== "reference";
    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-next]")) return;
      window.setTimeout(function () {
        var locationStep = document.querySelector('[data-step="3"]');
        if (!locationStep || locationStep.hidden) return;
        maps.forEach(function (map) { map.invalidateSize(); });
        if (!locationRequested) {
          locationRequested = true;
          requestUserLocation();
        }
      }, 0);
    });

    window.addEventListener("resize", function () {
      maps.forEach(function (map) { map.invalidateSize(); });
    });
  }

  function coordinatesForReport(report, index) {
    var latitude = Number(report.latitude);
    var longitude = Number(report.longitude);
    if (isFinite(latitude) && isFinite(longitude)
      && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
      && report.latitude !== null && report.latitude !== ""
      && report.longitude !== null && report.longitude !== "") {
      return {
        position: [latitude, longitude],
        approximate: report.coordinateApproximate === true
          || report.locationSource === "reference"
          || (!report.locationSource && latitude === MAP_CENTER[0] && longitude === MAP_CENTER[1])
      };
    }

    var offset = (index % 7) - 3;
    return {
      position: [MAP_CENTER[0] + offset * 0.0012, MAP_CENTER[1] + (index % 3 - 1) * 0.0015],
      approximate: true
    };
  }

  function territoryMarkerIcon(priority) {
    var colorClass = priority === "Súper urgente" ? "critical"
      : priority === "Urgente" ? "urgent" : "common";
    return window.L.divIcon({
      className: "territory-marker-icon",
      html: '<span class="territory-pin territory-pin--' + colorClass + '" aria-hidden="true"></span>',
      iconSize: [26, 34],
      iconAnchor: [13, 34],
      popupAnchor: [0, -32]
    });
  }

  function territoryPopup(report, approximate) {
    var popup = document.createElement("div");
    popup.className = "territory-popup";
    var heading = document.createElement("strong");
    heading.textContent = report.location || report.ticket || "Denuncia ciudadana";
    var category = document.createElement("span");
    category.textContent = report.type || "Categoría no especificada";
    var status = document.createElement("span");
    status.textContent = "Estado: " + (report.status || "Recibido");
    popup.appendChild(heading);
    popup.appendChild(category);
    popup.appendChild(status);
    if (approximate) {
      var note = document.createElement("span");
      note.textContent = "Ubicación aproximada: no representa un punto GPS exacto.";
      popup.appendChild(note);
    }
    return popup;
  }

  function locationSourceText(report, approximate) {
    if (approximate || report.locationSource === "reference") {
      return "Ubicación aproximada: no se guardó una selección GPS o manual.";
    }
    if (report.locationSource === "gps") {
      var accuracy = Number(report.locationAccuracy);
      return accuracy
        ? "Ubicación detectada por GPS, precisión aproximada de " + Math.round(accuracy) + " metros."
        : "Ubicación detectada por GPS.";
    }
    if (report.locationSource === "manual") return "Ubicación seleccionada manualmente en el mapa.";
    return "Ubicación registrada en el mapa.";
  }

  function reportLocationPopup(report, coordinates, approximate) {
    var popup = document.createElement("div");
    popup.className = "territory-popup";
    var heading = document.createElement("strong");
    heading.textContent = report.type || "Ubicación del reporte";
    var address = document.createElement("span");
    address.textContent = [report.reference, report.location].filter(Boolean).join(", ") || "Dirección no especificada";
    var point = document.createElement("span");
    point.textContent = "Coordenadas: " + coordinates[0].toFixed(6) + ", " + coordinates[1].toFixed(6);
    var source = document.createElement("span");
    source.textContent = locationSourceText(report, approximate);
    popup.appendChild(heading);
    popup.appendChild(address);
    popup.appendChild(point);
    popup.appendChild(source);
    return popup;
  }

  function renderReportLocationMap(report, mapSelector, noteSelector, adminView) {
    var container = document.querySelector(mapSelector);
    var note = document.querySelector(noteSelector);
    if (!container) return;

    var resolved = coordinatesForReport(report, 0);
    var latitude = resolved.position[0];
    var longitude = resolved.position[1];
    if (note) note.textContent = locationSourceText(report, resolved.approximate);

    var route = adminView ? document.querySelector("[data-admin-case-route]") : null;
    if (route) {
      route.href = "https://www.openstreetmap.org/?mlat=" + latitude
        + "&mlon=" + longitude + "#map=17/" + latitude + "/" + longitude;
    }

    if (!window.L) {
      container.textContent = "No se pudo cargar el mapa. Comprueba tu conexión a Internet.";
      return;
    }

    var map = container._reportLocationMap;
    var marker = container._reportLocationMarker;
    var position = [latitude, longitude];
    if (!map) {
      map = window.L.map(container, { zoomControl: false }).setView(position, resolved.approximate ? 14 : 16);
      addLeafletBase(map);
      marker = window.L.marker(position, adminView
        ? { icon: territoryMarkerIcon(report.priority) }
        : {}).addTo(map);
      bindMapZoomControls(container, map);
      container._reportLocationMap = map;
      container._reportLocationMarker = marker;
    } else {
      map.setView(position, resolved.approximate ? 14 : 16);
      marker.setLatLng(position);
      if (adminView) marker.setIcon(territoryMarkerIcon(report.priority));
    }
    marker.bindPopup(reportLocationPopup(report, position, resolved.approximate));
    window.setTimeout(function () { map.invalidateSize(); }, 0);
  }

  function renderAdminMap() {
    if (!adminLeafletMap || !adminMarkersLayer) return;
    var storedReports = readReports();
    if (!storedReports) return;
    var reports = visibleAdminReports(storedReports);

    var searchInput = document.querySelector("[data-admin-map-search]");
    var typeSelect = document.querySelector("[data-admin-map-type]");
    var prioritySelect = document.querySelector("[data-admin-map-priority]");
    var search = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var type = typeSelect ? typeSelect.value : "";
    var priority = prioritySelect ? prioritySelect.value : "";

    if (typeSelect) {
      var selectedType = typeSelect.value;
      while (typeSelect.options.length > 1) typeSelect.remove(1);
      var types = {};
      reports.forEach(function (report) { if (report.type) types[report.type] = true; });
      Object.keys(types).sort().forEach(function (name) {
        var option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        typeSelect.appendChild(option);
      });
      typeSelect.value = selectedType;
      type = typeSelect.value;
    }

    adminMarkersLayer.clearLayers();
    reports.forEach(function (report, index) {
      var searchable = [
        report.ticket, report.location, report.reference, report.description, report.type
      ].join(" ").toLowerCase();
      if (search && searchable.indexOf(search) === -1) return;
      if (type && report.type !== type) return;
      if (priority && report.priority !== priority) return;

      var coordinates = coordinatesForReport(report, index);
      window.L.marker(coordinates.position, {
        icon: territoryMarkerIcon(report.priority)
      }).bindPopup(territoryPopup(report, coordinates.approximate)).addTo(adminMarkersLayer);
    });

    var total = document.querySelector("[data-map-total]");
    var urgent = document.querySelector("[data-map-urgent]");
    var inProgress = document.querySelector("[data-map-progress]");
    if (total) total.textContent = String(reports.length);
    if (urgent) urgent.textContent = String(reports.filter(function (report) {
      return report.priority === "Súper urgente";
    }).length);
    if (inProgress) inProgress.textContent = String(reports.filter(function (report) {
      return report.status === "En proceso";
    }).length);
  }

  function initAdminMap() {
    var container = document.querySelector("[data-admin-map]");
    if (!container) return;
    if (!window.L) {
      container.textContent = "No se pudo cargar el mapa. Comprueba tu conexión a Internet.";
      return;
    }

    adminLeafletMap = window.L.map(container, { zoomControl: false }).setView(MAP_CENTER, 14);
    addLeafletBase(adminLeafletMap);
    bindMapZoomControls(container, adminLeafletMap);
    adminMarkersLayer = window.L.layerGroup().addTo(adminLeafletMap);
    renderAdminMap();
    window.setTimeout(function () { adminLeafletMap.invalidateSize(); }, 0);

    ["[data-admin-map-search]", "[data-admin-map-type]", "[data-admin-map-priority]"]
      .forEach(function (selector) {
        var control = document.querySelector(selector);
        if (!control) return;
        control.addEventListener("input", renderAdminMap);
        control.addEventListener("change", renderAdminMap);
      });
  }

  function initComplaintForm() {
    if (!document.querySelector("[data-submit-complaint]")) return;
    restoreComplaintDraft();
    document.querySelectorAll("[data-submit-complaint]").forEach(function (button) {
      button.addEventListener("click", submitComplaint);
    });
  }

  function appendHistory(report, entry) {
    if (!Array.isArray(report.history)) report.history = [];
    report.history.push(entry);
  }

  function renderAdminHistory(report) {
    var container = document.querySelector("[data-admin-case-history]");
    if (!container) return;
    container.textContent = "";
    (report.history || []).slice().reverse().forEach(function (event) {
      var row = document.createElement("div");
      var marker = document.createElement("span");
      marker.className = "history-dot " + (event.type === "status" ? "orange" : event.type === "result" ? "green" : "blue");
      var content = document.createElement("p");
      var title = document.createElement("strong");
      title.textContent = event.message;
      var detail = document.createElement("small");
      detail.textContent = (event.by || "Sistema") + " · " + formatDate(event.at, true);
      content.appendChild(title);
      content.appendChild(detail);
      row.appendChild(marker);
      row.appendChild(content);
      container.appendChild(row);
    });
  }

  function renderAdminCase() {
    if (!document.querySelector("[data-admin-case-status]")) return;
    var report = findReport(currentTicket());
    if (!report) {
      showDataError("No se encontró la denuncia solicitada. Vuelve al panel de administración.");
      return;
    }
    var set = function (selector, value) {
      var element = document.querySelector(selector);
      if (element) element.textContent = value || "";
    };
    set("[data-case-ticket]", report.ticket);
    set("[data-case-created]", "Recibida el " + formatDate(report.createdAt, true));
    set("[data-case-created-short]", formatDate(report.createdAt, false));
    set("[data-case-type]", report.type);
    set("[data-case-description]", report.description);
    set("[data-admin-case-location]", report.location);
    set("[data-admin-case-reference]", report.reference || "Sin referencia");
    renderReportLocationMap(report, "[data-admin-case-map]", "[data-admin-case-coordinate-note]", true);
    set("[data-case-citizen-name]", report.citizenName || "Ciudadano de demostración");
    set("[data-case-citizen-dui]", report.ownerDui || "Demo");
    var initials = (report.citizenName || "CD").split(/\s+/).slice(0, 2).map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join("");
    set("[data-case-citizen-initials]", initials);
    setBadge(document.querySelector("[data-admin-case-priority-badge]"), report.priority, priorityClass(report.priority));
    setBadge(document.querySelector("[data-admin-case-status-badge]"), report.status, statusClass(report.status));

    var prioritySelect = document.querySelector("[data-admin-case-priority]");
    var statusSelect = document.querySelector("[data-admin-case-status]");
    var departmentSelect = document.querySelector("[data-admin-case-department]");
    var resultInput = document.querySelector("[data-admin-case-result]");
    if (prioritySelect) prioritySelect.value = report.priority || "Común";
    if (statusSelect) statusSelect.value = report.status;
    if (departmentSelect) departmentSelect.value = report.department || "";
    if (resultInput) resultInput.value = report.result || "";
    if (statusSelect && resultInput) {
      var resultField = document.querySelector("[data-admin-case-result-field]");
      if (resultField) resultField.hidden = statusSelect.value !== "Finalizado";
      resultInput.required = statusSelect.value === "Finalizado";
    }
    var photoWrap = document.querySelector("[data-admin-case-photo-wrap]");
    var photo = document.querySelector("[data-admin-case-photo]");
    if (photoWrap && photo) {
      photoWrap.hidden = !report.photoData;
      if (report.photoData) photo.src = report.photoData;
    }
    renderAdminHistory(report);

    /* El administrador de área solo gestiona las denuncias de su categoría;
       las demás se muestran sin el panel de gestión. */
    if (!adminCanManage(report)) {
      var management = document.querySelector(".management");
      if (management) management.hidden = true;
      var session = currentAdminSession();
      showMessage("[data-admin-case-error]", "Esta denuncia corresponde al área de " + report.type
        + ". Tu usuario administra " + ((session && session.area) || "otra área") + ".", true);
    }
  }

  function saveAdminCase(derive) {
    var ticket = currentTicket();
    var reports = readReports();
    if (!reports) return;
    var index = reports.findIndex(function (report) { return report.ticket === ticket; });
    if (index === -1) {
      showMessage("[data-admin-case-error]", "No se encontró la denuncia que intentas actualizar.", true);
      return;
    }

    var report = reports[index];
    if (!adminCanManage(report)) {
      showMessage("[data-admin-case-error]", "No tienes permiso para modificar denuncias de otra área.", true);
      return;
    }
    var nextStatus = derive ? "Enviado a Alcaldía" : document.querySelector("[data-admin-case-status]").value;
    var nextPriority = document.querySelector("[data-admin-case-priority]").value;
    var nextDepartment = document.querySelector("[data-admin-case-department]").value;
    var nextResult = document.querySelector("[data-admin-case-result]").value.trim();
    if (nextStatus === "Finalizado" && !nextResult) {
      showMessage("[data-admin-case-error]", "Escribe el resultado antes de finalizar la denuncia.", true);
      document.querySelector("[data-admin-case-result]").focus();
      return;
    }

    showMessage("[data-admin-case-error]", "", false);
    showMessage("[data-admin-case-saved]", "", false);
    var now = new Date().toISOString();
    var changed = false;
    if (report.status !== nextStatus) {
      report.status = nextStatus;
      appendHistory(report, {
        type: "status",
        status: nextStatus,
        message: statusMessage(nextStatus),
        at: now,
        by: "Administración"
      });
      changed = true;
    }
    if (report.priority !== nextPriority) {
      report.priority = nextPriority;
      appendHistory(report, {
        type: "priority",
        message: "Prioridad actualizada a " + nextPriority + ".",
        at: now,
        by: "Administración"
      });
      changed = true;
    }
    if (report.department !== nextDepartment) {
      report.department = nextDepartment;
      if (nextDepartment) {
        appendHistory(report, {
          type: "department",
          message: "Departamento asignado: " + nextDepartment + ".",
          at: now,
          by: "Administración"
        });
      }
      changed = true;
    }
    if (report.result !== nextResult) {
      report.result = nextResult;
      if (nextResult) {
        appendHistory(report, {
          type: "result",
          message: "Resultado: " + nextResult,
          at: now,
          by: "Administración"
        });
      }
      changed = true;
    }
    if (changed) report.updatedAt = now;
    reports[index] = report;
    if (!writeReports(reports)) return;
    /* Generar PDF de cierre si el nuevo estado es Finalizado */
    if (nextStatus === "Finalizado" && window.PdfReport) {
      window.PdfReport.generate(report, "cierre");
    }
    renderAdminCase();
    showMessage("[data-admin-case-saved]", "", true);
    if (derive) showMessage("[data-derived-notice]", "", true);
  }

  function statusMessage(status) {
    if (status === "Recibido") return "La denuncia fue recibida.";
    if (status === "En proceso") return "El equipo está atendiendo la denuncia.";
    if (status === "Enviado a Alcaldía") return "La denuncia fue asignada al departamento responsable.";
    return "La denuncia fue finalizada.";
  }

  function initAdminCase() {
    if (!document.querySelector("[data-admin-case-status]")) return;
    var saveButton = document.querySelector("[data-save-case]");
    var deriveButton = document.querySelector("[data-derive-case]");
    var statusSelect = document.querySelector("[data-admin-case-status]");
    var resultInput = document.querySelector("[data-admin-case-result]");
    if (statusSelect && resultInput) {
      statusSelect.addEventListener("change", function () {
        var resultField = document.querySelector("[data-admin-case-result-field]");
        if (resultField) resultField.hidden = statusSelect.value !== "Finalizado";
        resultInput.required = statusSelect.value === "Finalizado";
      });
    }
    if (saveButton) saveButton.addEventListener("click", function () { saveAdminCase(false); });
    if (deriveButton) deriveButton.addEventListener("click", function () { saveAdminCase(true); });

    /* Botón descargar PDF manual */
    var pdfButton = document.querySelector("[data-download-pdf]");
    if (pdfButton) {
      pdfButton.addEventListener("click", function () {
        var rep = findReport(currentTicket());
        if (rep && window.PdfReport) {
          var pdfType = rep.status === "Finalizado" ? "cierre" : "registro";
          window.PdfReport.generate(rep, pdfType);
        }
      });
    }
  }

  /* Botón descargar PDF en la página de detalle del ciudadano (/estado). */
  function initCitizenCasePdf() {
    var btn = document.querySelector("[data-citizen-download-pdf]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var report = findReport(currentTicket());
      if (report && window.PdfReport) {
        var pdfType = report.status === "Finalizado" ? "cierre" : "registro";
        window.PdfReport.generate(report, pdfType);
      }
    });
  }

  /* Búsqueda de ticket. */
  function initHomeSearch() {
    var input = document.querySelector("[data-ticket-search]");
    var button = document.querySelector("[data-ticket-search-btn]");
    if (!input || !button) return;

    function doSearch() {
      var value = input.value.trim().toUpperCase();
      if (!value) {
        input.focus();
        input.classList.add("field-error");
        return;
      }
      input.classList.remove("field-error");
      var report = findReport(value);
      if (report) {
        window.location.assign("/estado?ticket=" + encodeURIComponent(value));
      } else {
        /* Aviso de ticket no encontrado. */
        var errorEl = document.querySelector("[data-ticket-search-error]");
        if (errorEl) {
          errorEl.textContent = "No se encontró el ticket \"" + value + "\". Verifica el número e inténtalo de nuevo.";
          errorEl.hidden = false;
        }
      }
    }

    button.addEventListener("click", doSearch);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") doSearch();
    });
    input.addEventListener("input", function () {
      var errorEl = document.querySelector("[data-ticket-search-error]");
      if (errorEl) errorEl.hidden = true;
      input.classList.remove("field-error");
    });
  }

  /* Denuncias recientes. */
  function renderHomeRecent() {
    var container = document.querySelector("[data-home-recent-cards]");
    var template = document.querySelector("[data-home-recent-template]");
    if (!container || !template) return;

    var reports = readReports();
    if (!reports) return;
    var recent = citizenReports(reports).slice(0, 3);

    /* Quitar tarjetas previas. */
    container.querySelectorAll("a.report-card").forEach(function (el) { el.remove(); });

    var empty = container.querySelector("[data-home-recent-empty]");

    if (recent.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    recent.forEach(function (report) {
      var card = template.content.firstElementChild.cloneNode(true);
      card.href = "/estado?ticket=" + encodeURIComponent(report.ticket);
      card.querySelector("[data-home-card-type]").textContent = report.type;
      card.querySelector("[data-home-card-ticket]").textContent = report.ticket;
      card.querySelector("[data-home-card-location]").textContent = report.location;
      setBadge(card.querySelector("[data-home-card-status]"), report.status, statusClass(report.status));
      container.insertBefore(card, template);
    });
  }

  initCitizenReports();
  initAdminReports();
  initComplaintForm();
  initComplaintLocationMaps();
  initAdminMap();
  initAdminCase();
  initCitizenCasePdf();
  renderTicket();
  renderCitizenCase();
  renderAdminCase();
  initHomeSearch();
  renderHomeRecent();

  window.addEventListener("storage", function (event) {
    if (event.key !== REPORTS_KEY) return;
    renderCitizenReports();
    renderAdminReports();
    renderTicket();
    renderCitizenCase();
    renderAdminCase();
    renderHomeRecent();
    renderAdminMap();
  });
})();
