/* ============================================================
   admin-reportes.js — Gráficas de barras sin dependencias
   Semanal / Mensual / Anual   ·   Canvas 2D puro
   ============================================================ */
(function () {
  "use strict";

  var REPORTS_KEY = "soyapango.localComplaints.v1";

  /* ── Lectura de denuncias ── */
  function readReports() {
    try {
      var raw = localStorage.getItem(REPORTS_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }

  /* ── Helpers de fecha ── */
  var DAYS_ES   = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  var MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                   "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  function startOfDay(d) {
    var c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  }

  function isoDate(d) {
    return d.getFullYear() + "-"
      + String(d.getMonth() + 1).padStart(2, "0") + "-"
      + String(d.getDate()).padStart(2, "0");
  }

  function isoMonth(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  /* ── Generación de buckets según período ── */
  function buildBuckets(period) {
    var now = new Date();
    var buckets = [];

    if (period === "week") {
      /* Últimos 7 días incluyendo hoy */
      for (var i = 6; i >= 0; i--) {
        var d = startOfDay(now);
        d.setDate(d.getDate() - i);
        buckets.push({
          key: isoDate(d),
          label: DAYS_ES[d.getDay()] + " " + d.getDate(),
          received: 0,
          done: 0
        });
      }
    } else if (period === "month") {
      /* Últimos 30 días agrupados en semanas (4 semanas) */
      var weekLabels = [];
      for (var w = 3; w >= 0; w--) {
        var end = startOfDay(now);
        end.setDate(end.getDate() - w * 7);
        var start = new Date(end);
        start.setDate(start.getDate() - 6);
        weekLabels.push({
          key: "w" + w,
          startDate: new Date(start),
          endDate: new Date(end),
          label: (start.getDate()) + " " + MONTHS_ES[start.getMonth()]
                 + " – " + end.getDate() + " " + MONTHS_ES[end.getMonth()],
          received: 0,
          done: 0
        });
      }
      buckets = weekLabels;
    } else {
      /* Últimos 12 meses */
      for (var m = 11; m >= 0; m--) {
        var md = new Date(now.getFullYear(), now.getMonth() - m, 1);
        buckets.push({
          key: isoMonth(md),
          label: MONTHS_ES[md.getMonth()] + " " + md.getFullYear(),
          received: 0,
          done: 0
        });
      }
    }
    return buckets;
  }

  function assignToBuckets(reports, buckets, period) {
    reports.forEach(function (r) {
      var date = new Date(r.createdAt);
      if (isNaN(date.getTime())) return;

      if (period === "week") {
        var key = isoDate(date);
        var b = buckets.find(function (x) { return x.key === key; });
        if (b) {
          b.received++;
          if (r.status === "Finalizado") b.done++;
        }
      } else if (period === "month") {
        buckets.forEach(function (b) {
          var t = date.getTime();
          if (t >= b.startDate.getTime() && t <= b.endDate.getTime() + 86399999) {
            b.received++;
            if (r.status === "Finalizado") b.done++;
          }
        });
      } else {
        var mk = isoMonth(date);
        var bm = buckets.find(function (x) { return x.key === mk; });
        if (bm) {
          bm.received++;
          if (r.status === "Finalizado") bm.done++;
        }
      }
    });
    return buckets;
  }

  /* ── Dibujado de gráfica de barras en Canvas ── */
  function drawBarChart(canvas, labels, datasets, options) {
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.offsetWidth;
    var H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    var paddingLeft  = options.paddingLeft  || 42;
    var paddingRight = options.paddingRight || 16;
    var paddingTop   = options.paddingTop   || 16;
    var paddingBot   = options.paddingBot   || 48;
    var barColors    = options.colors       || ["#2f6fde", "#16a34a"];
    var gridColor    = options.gridColor    || "#dce2ea";
    var labelColor   = options.labelColor   || "#5b6678";
    var fontSize     = options.fontSize     || 11;

    var n       = labels.length;
    var series  = datasets.length;
    var plotW   = W - paddingLeft - paddingRight;
    var plotH   = H - paddingTop - paddingBot;

    /* Max valor */
    var maxVal = 1;
    datasets.forEach(function (ds) {
      ds.forEach(function (v) { if (v > maxVal) maxVal = v; });
    });
    /* Redondear al siguiente múltiplo limpio */
    var step = Math.ceil(maxVal / 5) || 1;
    maxVal = step * 5;

    /* Líneas de cuadrícula + etiquetas Y */
    ctx.strokeStyle = gridColor;
    ctx.lineWidth   = 1;
    ctx.fillStyle   = labelColor;
    ctx.font        = "500 " + fontSize + "px Inter, sans-serif";
    ctx.textAlign   = "right";
    ctx.textBaseline = "middle";
    for (var gi = 0; gi <= 5; gi++) {
      var yVal  = gi * step;
      var yPos  = paddingTop + plotH - (yVal / maxVal) * plotH;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, yPos);
      ctx.lineTo(W - paddingRight, yPos);
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(String(yVal), paddingLeft - 6, yPos);
    }

    /* Barras */
    var groupW  = plotW / n;
    var padding = groupW * 0.18;
    var barW    = (groupW - padding * 2) / series;

    for (var i = 0; i < n; i++) {
      var gx = paddingLeft + i * groupW + padding;

      for (var s = 0; s < series; s++) {
        var val    = datasets[s][i] || 0;
        var barH   = (val / maxVal) * plotH;
        var bx     = gx + s * barW;
        var by     = paddingTop + plotH - barH;
        var radius = Math.min(4, barW / 2);

        ctx.fillStyle = barColors[s % barColors.length];
        ctx.beginPath();
        ctx.moveTo(bx + radius, by);
        ctx.lineTo(bx + barW - radius, by);
        ctx.quadraticCurveTo(bx + barW, by, bx + barW, by + radius);
        ctx.lineTo(bx + barW, by + barH);
        ctx.lineTo(bx, by + barH);
        ctx.lineTo(bx, by + radius);
        ctx.quadraticCurveTo(bx, by, bx + radius, by);
        ctx.closePath();
        ctx.fill();

        /* Valor encima si > 0 */
        if (val > 0) {
          ctx.fillStyle   = barColors[s % barColors.length];
          ctx.font        = "600 " + (fontSize - 1) + "px Inter, sans-serif";
          ctx.textAlign   = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(String(val), bx + barW / 2, by - 2);
        }
      }

      /* Etiqueta X */
      ctx.fillStyle    = labelColor;
      ctx.font         = "500 " + fontSize + "px Inter, sans-serif";
      ctx.textAlign    = "center";
      ctx.textBaseline = "top";
      ctx.fillText(labels[i], paddingLeft + i * groupW + groupW / 2,
                   paddingTop + plotH + 10);
    }
  }

  /* ── Gráfica de tipo (barras horizontales simples) ── */
  function drawTypeChart(canvas, labels, values, colors) {
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.offsetWidth;
    var H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    if (!labels.length) return;

    var maxVal = Math.max.apply(null, values) || 1;
    var rowH   = H / labels.length;
    var padL   = 10;
    var padR   = 36;
    var padV   = 4;
    var barH   = Math.max(rowH * 0.42, 10);
    var trackW = W - padL - padR;

    labels.forEach(function (label, i) {
      var ratio = values[i] / maxVal;
      var barW  = ratio * trackW;
      var by    = i * rowH + (rowH - barH) / 2;
      var color = colors[i % colors.length];

      /* Fondo gris */
      ctx.fillStyle = "#eef1f5";
      ctx.beginPath();
      ctx.roundRect(padL, by, trackW, barH, barH / 2);
      ctx.fill();

      /* Barra coloreada */
      if (barW > 0) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(padL, by, barW, barH, barH / 2);
        ctx.fill();
      }

      /* Label */
      ctx.fillStyle    = "#1a2433";
      ctx.font         = "600 11px Inter, sans-serif";
      ctx.textAlign    = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, padL, by + barH + padV + 7);

      /* Valor */
      ctx.fillStyle    = "#5b6678";
      ctx.font         = "600 11px Inter, sans-serif";
      ctx.textAlign    = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(String(values[i]), W - 4, by + barH / 2);
    });
  }

  /* ── Barras de estado (HTML) ── */
  var STATUS_DEFS = [
    { key: "Recibido",          label: "Recibido",          fill: "fill-gray"   },
    { key: "En proceso",        label: "En proceso",        fill: "fill-orange" },
    { key: "Enviado a Alcaldía",label: "Enviado a Alcaldía",fill: "fill-blue"   },
    { key: "Finalizado",        label: "Finalizado",        fill: "fill-green"  }
  ];

  function renderStatusBars(container, reports) {
    if (!container) return;
    var total = reports.length || 1;
    container.innerHTML = "";
    STATUS_DEFS.forEach(function (def) {
      var count = reports.filter(function (r) { return r.status === def.key; }).length;
      var pct   = Math.round((count / total) * 100);
      var row   = document.createElement("div");
      row.className = "status-bar-row";
      row.innerHTML =
        '<div class="status-bar-label">' +
          '<span>' + def.label + '</span>' +
          '<span>' + count + ' (' + pct + '%)</span>' +
        '</div>' +
        '<div class="status-bar-track">' +
          '<div class="status-bar-fill ' + def.fill + '" style="width:' + pct + '%"></div>' +
        '</div>';
      container.appendChild(row);
    });
  }

  /* ── KPIs ── */
  function updateKpis(reports) {
    var total    = reports.length;
    var done     = reports.filter(function (r) { return r.status === "Finalizado"; }).length;
    var progress = reports.filter(function (r) { return r.status === "En proceso"; }).length;
    var urgent   = reports.filter(function (r) { return r.priority === "Súper urgente"; }).length;
    var pct = function (n) { return total ? Math.round((n / total) * 100) + "% del total" : "0%"; };

    var set = function (sel, val) {
      var el = document.querySelector(sel);
      if (el) el.textContent = val;
    };
    set("[data-kpi-total]",        String(total));
    set("[data-kpi-done]",         String(done));
    set("[data-kpi-done-pct]",     pct(done));
    set("[data-kpi-progress]",     String(progress));
    set("[data-kpi-progress-pct]", pct(progress));
    set("[data-kpi-urgent]",       String(urgent));
    set("[data-kpi-urgent-pct]",   pct(urgent));
  }

  /* ── Colores por tipo ── */
  var TYPE_COLORS = ["#2f6fde","#16a34a","#f59e0b","#dc2626","#8b5cf6","#06b6d4","#ec4899"];

  /* ── Render completo ── */
  var currentPeriod = "week";

  function render(period) {
    currentPeriod = period;
    var reports = readReports();

    /* Filtrar por período */
    var now = new Date();
    var cutoff;
    if (period === "week")  cutoff = new Date(now - 7  * 86400000);
    if (period === "month") cutoff = new Date(now - 30 * 86400000);
    if (period === "year")  cutoff = new Date(now - 365 * 86400000);

    var inPeriod = reports.filter(function (r) {
      return new Date(r.createdAt) >= cutoff;
    });

    /* Títulos */
    var titleMap  = { week: "Denuncias por día", month: "Denuncias por semana", year: "Denuncias por mes" };
    var subMap    = { week: "Últimos 7 días",    month: "Últimas 4 semanas",    year: "Últimos 12 meses" };
    var typeSubMap = { week: "Esta semana", month: "Este mes", year: "Este año" };
    var setT = function (sel, val) {
      var el = document.querySelector(sel);
      if (el) el.textContent = val;
    };
    setT("[data-chart-title]",   titleMap[period]);
    setT("[data-chart-subtitle]", subMap[period]);
    setT("[data-type-subtitle]",  typeSubMap[period]);

    /* KPIs */
    updateKpis(inPeriod);

    /* Buckets para gráfica principal */
    var buckets = buildBuckets(period);
    assignToBuckets(inPeriod, buckets, period);

    var labels   = buckets.map(function (b) { return b.label; });
    var received = buckets.map(function (b) { return b.received; });
    var done     = buckets.map(function (b) { return b.done; });

    /* Gráfica principal */
    var mainCanvas = document.getElementById("mainChart");
    if (mainCanvas) {
      window.requestAnimationFrame(function () {
        drawBarChart(mainCanvas, labels, [received, done], {
          colors: ["#2f6fde", "#16a34a"],
          paddingLeft: 38,
          paddingBot: period === "month" ? 56 : 44
        });
      });
    }

    /* Gráfica por tipo */
    var typeCanvas = document.getElementById("typeChart");
    if (typeCanvas) {
      var typeCounts = {};
      inPeriod.forEach(function (r) {
        typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
      });
      var typeKeys = Object.keys(typeCounts).sort(function (a, b) {
        return typeCounts[b] - typeCounts[a];
      }).slice(0, 6);
      var typeVals = typeKeys.map(function (k) { return typeCounts[k]; });
      window.requestAnimationFrame(function () {
        drawTypeChart(typeCanvas, typeKeys, typeVals, TYPE_COLORS);
      });
    }

    /* Barras de estado */
    var statusContainer = document.querySelector("[data-status-bars]");
    renderStatusBars(statusContainer, inPeriod);
  }

  /* ── Tabs ── */
  function initTabs() {
    var tabs = document.querySelectorAll("[data-period]");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        render(tab.getAttribute("data-period"));
      });
    });
  }

  /* ── Redibujar al redimensionar ── */
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { render(currentPeriod); }, 150);
  });

  /* ── Inicio ── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initTabs();
      render("week");
    });
  } else {
    initTabs();
    render("week");
  }
})();
