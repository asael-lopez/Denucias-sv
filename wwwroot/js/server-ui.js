/* Comportamientos de interfaz que antes vivían en local-auth.js (sin localStorage):
   máscara del DUI (12345678-9) y botón de mostrar/ocultar contraseña. */
(function () {
  document.querySelectorAll("[data-dui-input]").forEach(function (input) {
    input.addEventListener("input", function () {
      var original = input.value;
      var cursor = input.selectionStart === null ? original.length : input.selectionStart;
      var digitPosition = original.slice(0, cursor).replace(/\D/g, "").length;
      var digits = original.replace(/\D/g, "").slice(0, 9);
      var formatted = digits.length >= 8 ? digits.slice(0, 8) + "-" + digits.slice(8) : digits;
      if (formatted !== original) {
        input.value = formatted;
        var newCursor = digitPosition > 8 ? digitPosition + 1 : (digitPosition === 8 && digits.length >= 8 ? 9 : digitPosition);
        input.setSelectionRange(newCursor, newCursor);
      }
    });
  });

  document.querySelectorAll(".password-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      var wrapper = button.closest(".input-wrap");
      var input = wrapper ? wrapper.querySelector("input") : null;
      if (!input) return;
      var reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      button.setAttribute("aria-label", reveal ? "Ocultar contraseña" : "Mostrar contraseña");
      button.setAttribute("aria-pressed", reveal ? "true" : "false");
      var eye = button.querySelector(".icon-eye");
      var eyeOff = button.querySelector(".icon-eye-off");
      if (eye) eye.hidden = reveal;
      if (eyeOff) eyeOff.hidden = !reveal;
    });
  });
})();
