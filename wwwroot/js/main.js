/* Interacciones compartidas del portal. */
(function () {
  "use strict";

  /* Selector múltiple. */
  function qsa(selector, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
  }

  /* Pestañas de acceso. */
  var tabs = qsa("[data-tab]");

  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-tab");
        qsa("[data-tab]").forEach(function (t) {
          t.classList.toggle("active", t === tab);
        });
        qsa("[data-panel]").forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-panel") !== name;
        });
      });
    });
  }

  /* Pasos del formulario. */
  var stepPanels = qsa("[data-step]");
  if (stepPanels.length) {
    var TOTAL = 3;
    var current = 1;
    var bar = document.querySelector("[data-progress-bar]");
    var dots = qsa("[data-step-dot]");
    var layout = document.querySelector(".create-layout");

    var render = function () {
      /* Mostrar paso activo. */
      stepPanels.forEach(function (panel) {
        panel.hidden = Number(panel.getAttribute("data-step")) !== current;
      });

      /* Actualizar progreso. */
      if (bar) bar.style.width = (current * 33.3) + "%";

      /* Actualizar indicadores. */
      dots.forEach(function (dot, i) {
        var n = i + 1;
        dot.classList.toggle("active", current >= n);
        var num = dot.querySelector("[data-dot-index]");
        var check = dot.querySelector("[data-dot-check]");
        var done = current > n;
        if (num) num.hidden = done;
        if (check) check.hidden = !done;
      });

      /* Ajustar mapa al último paso. */
      if (layout) layout.classList.toggle("with-map", current === 3);

      /* Mostrar acciones del paso. */
      qsa("[data-step-actions]").forEach(function (el) {
        var steps = el.getAttribute("data-step-actions").split(",");
        el.hidden = steps.indexOf(String(current)) === -1;
      });
    };

    qsa("[data-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var currentPanel = document.querySelector('[data-step="' + current + '"]');
        var requiredFields = currentPanel ? qsa("[required]", currentPanel) : [];
        for (var i = 0; i < requiredFields.length; i++) {
          if (!requiredFields[i].reportValidity()) return;
        }
        if (current < TOTAL) { current++; render(); }
      });
    });

    qsa("[data-prev]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        if (current > 1) {
          event.preventDefault();
          current--;
          render();
        } else if (btn.tagName === "A") {
          /* Mantener destino del enlace. */
        } else {
          window.location.href = "/home";
        }
      });
    });

    /* Contador de texto. */
    var counterInput = document.querySelector("[data-counter]");
    var counterOutput = document.querySelector("[data-counter-output]");
    if (counterInput && counterOutput) {
      var updateCounter = function () {
        counterOutput.textContent = counterInput.value.length + " / 500";
      };
      counterInput.addEventListener("input", updateCounter);
      updateCounter();
    }

    render();
  }

  /* Vista previa de fotografía. */
  var photoButton = document.querySelector("[data-photo-button]");
  var photoInput = document.querySelector("[data-photo-input]");
  var photoEditButton = document.querySelector("[data-photo-edit]");

  if (photoButton && photoInput) {
    var photoUrl = null;
    var photoStatus = document.querySelector("[data-photo-status]");
    var photoStatusLabel = document.querySelector("[data-photo-status-label]");
    var photoStatusIcon = document.querySelector("[data-photo-status-icon]");
    var photoName = document.querySelector("[data-photo-name]");
    var photoButtonLabel = document.querySelector("[data-photo-button-label]");
    var photoCard = document.querySelector("[data-photo-preview-card]");
    var uploadZone = photoButton.closest(".upload-zone");

    var openPhotoPicker = function () {
      photoInput.click();
    };

    photoButton.addEventListener("click", openPhotoPicker);
    if (photoEditButton) photoEditButton.addEventListener("click", openPhotoPicker);

    photoInput.addEventListener("change", function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file) return;

      var isImage = file.type.indexOf("image/") === 0;
      var isWithinLimit = file.size <= 10 * 1024 * 1024;
      var preview = document.querySelector("[data-photo-preview]");
      var meta = document.querySelector("[data-photo-meta]");

      if (!isImage || !isWithinLimit) {
        photoInput.value = "";
        if (photoStatus) {
          photoStatus.hidden = false;
          photoStatus.classList.add("is-error");
        }
        if (photoStatusIcon) photoStatusIcon.setAttribute("d", "M12 8v4m0 4h.01");
        if (photoStatusLabel) photoStatusLabel.textContent = "No se pudo cargar la imagen";
        if (photoName) {
          photoName.textContent = isImage
            ? "El archivo supera el límite de 10 MB."
            : "Selecciona un archivo de imagen.";
        }
        if (uploadZone) uploadZone.classList.remove("has-photo");
        if (photoCard) photoCard.hidden = true;
        if (photoButtonLabel) photoButtonLabel.textContent = "Seleccionar fotografía";
        if (photoUrl) {
          URL.revokeObjectURL(photoUrl);
          photoUrl = null;
        }
        return;
      }

      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = URL.createObjectURL(file);

      if (preview) {
        preview.src = photoUrl;
        preview.classList.remove("img-fallback");
        preview.alt = "Fotografía seleccionada";
      }

      if (meta) {
        var sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        meta.textContent = file.name + " · " + sizeMb + " MB";
      }
      if (photoStatus) {
        photoStatus.hidden = false;
        photoStatus.classList.remove("is-error");
      }
      if (photoStatusIcon) photoStatusIcon.setAttribute("d", "m5 12 4 4L19 6");
      if (photoStatusLabel) photoStatusLabel.textContent = "Fotografía cargada";
      if (photoName) photoName.textContent = file.name;
      if (photoButtonLabel) photoButtonLabel.textContent = "Cambiar fotografía";
      if (photoCard) photoCard.hidden = false;
      if (uploadZone) uploadZone.classList.add("has-photo");
    });
  }

  /* Copiar ticket. */
  var copyBtn = document.querySelector("[data-copy-ticket]");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var numberEl = document.querySelector("[data-ticket-number]");
      var text = numberEl ? numberEl.textContent.trim() : "";
      if (!text) return;

      var label     = copyBtn.querySelector("[data-copy-label]");
      var copyIcon  = copyBtn.querySelector(".icon-copy");
      var checkIcon = copyBtn.querySelector(".icon-check");

      function markCopied(success) {
        if (label)     label.textContent = success ? "Copiado" : "Error";
        if (copyIcon)  copyIcon.hidden   = true;
        if (checkIcon) checkIcon.hidden  = !success;
        /* Restaurar al estado original tras 2 s */
        window.setTimeout(function () {
          if (label)     label.textContent = "Copiar ticket";
          if (copyIcon)  copyIcon.hidden   = false;
          if (checkIcon) checkIcon.hidden  = true;
        }, 2000);
      }

      /* Intentar API moderna primero */
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () { markCopied(true); })
          .catch(function () { fallbackCopy(text, markCopied); });
      } else {
        fallbackCopy(text, markCopied);
      }
    });
  }

  function fallbackCopy(text, cb) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      cb(ok);
    } catch (e) {
      cb(false);
    }
  }

  /* Vista del panel. */
  var viewButtons = qsa("[data-view]");
  if (viewButtons.length) {
    viewButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cards = btn.getAttribute("data-view") === "cards";
        viewButtons.forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        var table = document.querySelector("[data-admin-table]");
        if (table) table.classList.toggle("card-view", cards);
      });
    });
  }

  /* Derivar denuncia. */
  var deriveBtn = document.querySelector("[data-derive]");
  if (deriveBtn) {
    deriveBtn.addEventListener("click", function () {
      var notice = document.querySelector("[data-derived-notice]");
      if (notice) notice.hidden = false;
    });
  }

  /* Menú móvil. */
  var menuBtn = document.querySelector("[data-menu-toggle]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", function () {
      mobileMenu.hidden = !mobileMenu.hidden;
    });
  }

  /* Navegación por filas. */
  qsa("[data-href]").forEach(function (el) {
    el.addEventListener("click", function () {
      window.location.href = el.getAttribute("data-href");
    });
  });

  /* Menú de usuario. */
  qsa("[data-user-menu]").forEach(function (menu) {
    var toggle = menu.querySelector("[data-user-menu-toggle]");
    var dropdown = menu.querySelector("[data-user-dropdown]");
    if (!toggle || !dropdown) return;

    function openMenu() {
      dropdown.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      dropdown.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.hidden ? openMenu() : closeMenu();
    });

    /* Cerrar al salir. */
    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target)) closeMenu();
    });

    /* Cerrar con Escape. */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  });
})();
