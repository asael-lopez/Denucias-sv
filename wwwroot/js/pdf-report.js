/* ============================================================
   pdf-report.js — Generación de PDF para denuncias
   Usa jsPDF (cargado como UMD desde CDN).
   Se invoca desde local-complaints.js en dos momentos:
     · Al registrar una denuncia  → tipo "registro"
     · Al finalizar una denuncia  → tipo "cierre"
   ============================================================ */
(function (global) {
  "use strict";

  /* Paleta de colores corporativa */
  var COLOR = {
    navy:    [11,  42,  85],
    blue:    [47, 111, 222],
    green:   [22, 163,  74],
    orange:  [245,158, 11],
    red:     [220, 38,  38],
    muted:   [91, 102, 120],
    line:    [220, 226, 234],
    white:   [255, 255, 255],
    bg:      [245, 247, 250],
    ink:     [26,  36,  51]
  };

  var MONTHS_ES = ["enero","febrero","marzo","abril","mayo","junio",
                   "julio","agosto","septiembre","octubre","noviembre","diciembre"];

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.getDate() + " de " + MONTHS_ES[d.getMonth()] + " de " + d.getFullYear()
      + ", " + String(d.getHours()).padStart(2,"0") + ":"
      + String(d.getMinutes()).padStart(2,"0");
  }

  function priorityColor(p) {
    if (p === "Súper urgente") return COLOR.red;
    if (p === "Urgente")       return COLOR.orange;
    return COLOR.blue;
  }

  function statusColor(s) {
    if (s === "Finalizado")        return COLOR.green;
    if (s === "En proceso")        return COLOR.orange;
    if (s === "Enviado a Alcaldía")return COLOR.blue;
    return COLOR.muted;
  }

  /* ── Dibuja un badge de colores ── */
  function drawBadge(doc, text, color, x, y) {
    var pad = 3;
    doc.setFontSize(8);
    var w = doc.getTextWidth(text) + pad * 2 + 6;
    doc.setFillColor.apply(doc, color);
    doc.roundedRect(x, y - 5, w, 7, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.text(text, x + pad + 3, y);
    doc.setTextColor.apply(doc, COLOR.ink);
    return w;
  }

  /* ── Línea separadora ── */
  function hline(doc, y, margin) {
    doc.setDrawColor.apply(doc, COLOR.line);
    doc.setLineWidth(0.3);
    doc.line(margin, y, 210 - margin, y);
  }

  /* ── Bloque de campo (label + valor) ── */
  function field(doc, label, value, x, y, maxW) {
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, COLOR.muted);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x, y);

    doc.setFontSize(10);
    doc.setTextColor.apply(doc, COLOR.ink);
    doc.setFont("helvetica", "normal");
    var lines = doc.splitTextToSize(value || "—", maxW || 80);
    doc.text(lines, x, y + 5);
    return y + 5 + lines.length * 5;
  }

  /* ── Genera y descarga el PDF ── */
  function generate(report, type) {
    if (typeof window.jspdf === "undefined" && typeof window.jsPDF === "undefined") {
      console.warn("pdf-report: jsPDF no disponible.");
      return;
    }
    var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var margin = 18;
    var pageW  = 210;
    var colW   = (pageW - margin * 2 - 6) / 2;   /* dos columnas */
    var y = margin;

    /* ── CABECERA ── */
    doc.setFillColor.apply(doc, COLOR.navy);
    doc.rect(0, 0, pageW, 28, "F");

    /* Logo texto */
    doc.setTextColor(255,255,255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SOYAPANGO", margin, 11);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Alcaldía Municipal · Sistema de Denuncias Ciudadanas", margin, 17);

    /* Tipo de documento */
    var docTitle = type === "registro"
      ? "COMPROBANTE DE REGISTRO"
      : "INFORME DE CIERRE";
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    var tw = doc.getTextWidth(docTitle);
    doc.text(docTitle, pageW - margin - tw, 13);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    var dateStr = fmtDate(new Date().toISOString());
    var dw = doc.getTextWidth(dateStr);
    doc.text(dateStr, pageW - margin - dw, 20);

    y = 36;

    /* ── NÚMERO DE TICKET ── */
    doc.setFillColor.apply(doc, COLOR.bg);
    doc.roundedRect(margin, y, pageW - margin * 2, 14, 3, 3, "F");
    doc.setTextColor.apply(doc, COLOR.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("NÚMERO DE TICKET", margin + 4, y + 5);
    doc.setTextColor.apply(doc, COLOR.navy);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(report.ticket || "—", margin + 4, y + 12);

    /* Badges prioridad + estado a la derecha */
    var bx = pageW - margin - 4;
    var pBadgeW = doc.getTextWidth(report.priority || "Común") + 12;
    var sBadgeW = doc.getTextWidth(report.status || "Recibido") + 12;
    bx = bx - pBadgeW;
    drawBadge(doc, report.priority || "Común", priorityColor(report.priority), bx, y + 7);
    bx = bx - sBadgeW - 3;
    drawBadge(doc, report.status || "Recibido", statusColor(report.status), bx, y + 7);

    y += 20;
    hline(doc, y, margin);
    y += 6;

    /* ── SECCIÓN: DETALLES DEL INCIDENTE ── */
    doc.setTextColor.apply(doc, COLOR.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Detalles del incidente", margin, y);
    y += 7;

    /* Columna izquierda */
    var col1x = margin;
    var col2x = margin + colW + 6;
    var yL = y;
    var yR = y;

    yL = field(doc, "Tipo de incidente", report.type, col1x, yL, colW) + 5;
    yL = field(doc, "Fecha de registro", fmtDate(report.createdAt), col1x, yL, colW) + 5;
    yL = field(doc, "Departamento asignado", report.department || "Sin asignar", col1x, yL, colW) + 5;

    yR = field(doc, "Estado", report.status, col2x, yR, colW) + 5;
    yR = field(doc, "Prioridad", report.priority || "Común", col2x, yR, colW) + 5;
    if (report.updatedAt) {
      yR = field(doc, "Última actualización", fmtDate(report.updatedAt), col2x, yR, colW) + 5;
    }

    y = Math.max(yL, yR) + 2;
    hline(doc, y, margin);
    y += 6;

    /* ── DESCRIPCIÓN ── */
    doc.setTextColor.apply(doc, COLOR.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Descripción del problema", margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor.apply(doc, COLOR.ink);
    var descLines = doc.splitTextToSize(report.description || "Sin descripción.", pageW - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;

    hline(doc, y, margin);
    y += 6;

    /* ── UBICACIÓN ── */
    doc.setTextColor.apply(doc, COLOR.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Ubicación", margin, y);
    y += 7;

    yL = margin; yR = margin;
    var yLocL = y;
    var yLocR = y;
    yLocL = field(doc, "Dirección", report.location, col1x, yLocL, colW) + 5;
    if (report.reference) {
      yLocL = field(doc, "Referencia", report.reference, col1x, yLocL, colW) + 5;
    }
    if (report.latitude && report.longitude) {
      var coordStr = Number(report.latitude).toFixed(6) + ", " + Number(report.longitude).toFixed(6);
      yLocR = field(doc, "Coordenadas GPS", coordStr, col2x, yLocR, colW) + 5;
      var srcMap = { gps: "GPS automático", manual: "Selección manual", reference: "Aproximada (referencia)" };
      yLocR = field(doc, "Fuente de ubicación", srcMap[report.locationSource] || "Referencia", col2x, yLocR, colW) + 5;
    }
    y = Math.max(yLocL, yLocR) + 2;

    hline(doc, y, margin);
    y += 6;

    /* ── CIUDADANO ── */
    doc.setTextColor.apply(doc, COLOR.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Datos del ciudadano", margin, y);
    y += 7;

    var yCL = y; var yCR = y;
    yCL = field(doc, "Nombre", report.citizenName || "No registrado", col1x, yCL, colW) + 5;
    yCR = field(doc, "DUI", report.ownerDui || "No registrado", col2x, yCR, colW) + 5;
    y = Math.max(yCL, yCR) + 2;

    /* ── RESULTADO (solo cierre) ── */
    if (type === "cierre" && report.result) {
      hline(doc, y, margin);
      y += 6;
      doc.setTextColor.apply(doc, COLOR.navy);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Resultado de la atención", margin, y);
      y += 6;
      doc.setFillColor.apply(doc, COLOR.green.concat ? COLOR.green : COLOR.green);
      doc.setFillColor(220, 253, 231);   /* green-soft */
      var resLines = doc.splitTextToSize(report.result, pageW - margin * 2 - 8);
      doc.roundedRect(margin, y - 4, pageW - margin * 2, resLines.length * 5 + 8, 3, 3, "F");
      doc.setTextColor.apply(doc, [14, 122, 55]);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(resLines, margin + 4, y + 1);
      y += resLines.length * 5 + 10;
    }

    /* ── HISTORIAL ── */
    hline(doc, y, margin);
    y += 6;
    doc.setTextColor.apply(doc, COLOR.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Historial de seguimiento", margin, y);
    y += 6;

    var history = (report.history || []).filter(function (e) { return e.type === "status"; });
    history.forEach(function (event) {
      /* Verificar si necesitamos nueva página */
      if (y > 265) {
        doc.addPage();
        y = margin;
      }
      doc.setFillColor.apply(doc, COLOR.bg);
      doc.roundedRect(margin, y - 4, pageW - margin * 2, 12, 2, 2, "F");

      /* Punto de color */
      var dotColor = statusColor(event.status);
      doc.setFillColor.apply(doc, dotColor);
      doc.circle(margin + 5, y + 2, 2, "F");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor.apply(doc, COLOR.ink);
      doc.text(event.status || "", margin + 10, y + 2);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor.apply(doc, COLOR.muted);
      doc.text(event.message || "", margin + 10, y + 6.5);

      var dateRight = fmtDate(event.at);
      var drW = doc.getTextWidth(dateRight);
      doc.text(dateRight, pageW - margin - drW, y + 2);
      doc.text((event.by || "Sistema"), pageW - margin - doc.getTextWidth(event.by || "Sistema"), y + 6.5);

      y += 14;
    });

    /* ── PIE DE PÁGINA ── */
    var pageCount = doc.internal.getNumberOfPages();
    for (var p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFillColor.apply(doc, COLOR.navy);
      doc.rect(0, 285, pageW, 12, "F");
      doc.setTextColor(255,255,255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Alcaldía Municipal de Soyapango · Sistema de Denuncias Ciudadanas · Documento generado automáticamente",
               margin, 292);
      doc.text("Página " + p + " de " + pageCount, pageW - margin - 18, 292);
    }

    /* ── DESCARGA ── */
    var suffix = type === "registro" ? "registro" : "cierre";
    doc.save("denuncia-" + (report.ticket || "SOY") + "-" + suffix + ".pdf");
  }

  /* Exponer globalmente */
  global.PdfReport = { generate: generate };

})(window);
