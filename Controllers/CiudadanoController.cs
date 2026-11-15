using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemasDenuncias.Helpers;
using SistemasDenuncias.Models;
using SistemasDenuncias.Repositories;
using SistemasDenuncias.Services;
using SistemasDenuncias.ViewModels;

namespace SistemasDenuncias.Controllers;

/// <summary>Páginas del ciudadano. Todas protegidas: solo el rol Ciudadano.</summary>
[Authorize(Roles = Roles.Ciudadano)]
public class CiudadanoController : Controller
{
    private readonly ICiudadanoRepository _ciudadanos;
    private readonly IAuthService _auth;

    public CiudadanoController(ICiudadanoRepository ciudadanos, IAuthService auth)
    {
        _ciudadanos = ciudadanos;
        _auth = auth;
    }

    // P2/P3: estas cuatro acciones devuelven las vistas del prototipo; ahí conectan sus denuncias.
    [HttpGet("home")] public IActionResult Home() => View();
    [HttpGet("crear-denuncia")] public IActionResult CrearDenuncia() => View();
    [HttpGet("mis-denuncias")] public IActionResult MisDenuncias() => View();
    [HttpGet("estado")] public IActionResult Estado() => View();
    [HttpGet("ticket")] public IActionResult Ticket() => View();

    // ------------------------------------------------------------ Mi cuenta
    [HttpGet("mi-cuenta")]
    public async Task<IActionResult> MiCuenta()
    {
        var vm = await ConstruirMiCuentaAsync();
        if (vm == null) return await CerrarYSalirAsync();
        vm.Exito = TempData["Exito"] as string;
        vm.Error = TempData["Error"] as string;
        vm.Seccion = TempData["Seccion"] as string ?? "datos";
        return View(vm);
    }

    [HttpPost("mi-cuenta/perfil")]
    public async Task<IActionResult> ActualizarPerfil(string? nombreCompleto, string? correo, string? seccion)
    {
        var res = await _auth.ActualizarPerfilAsync(User.UsuarioId()!.Value, nombreCompleto ?? "", correo ?? "");
        TempData["Seccion"] = seccion == "contacto" ? "contacto" : "datos";
        if (res.Exito)
        {
            TempData["Exito"] = "Datos actualizados.";
            // El nombre vive en la cookie: se vuelve a emitir para que el menú lo refleje.
            var c = await _ciudadanos.ObtenerPorIdAsync(User.UsuarioId()!.Value);
            if (c != null) await RefrescarCookieAsync(c.Id, c.NombreCompleto, c.Dui);
        }
        else TempData["Error"] = res.Error;
        return RedirectToAction(nameof(MiCuenta));
    }

    [HttpPost("mi-cuenta/password")]
    public async Task<IActionResult> CambiarPassword(string? actual, string? nueva, string? confirmar)
    {
        TempData["Seccion"] = "seguridad";
        if (nueva != confirmar) TempData["Error"] = "Las contraseñas nuevas no coinciden.";
        else
        {
            var res = await _auth.CambiarPasswordAsync(User.UsuarioId()!.Value, actual ?? "", nueva ?? "");
            if (res.Exito) TempData["Exito"] = "Contraseña actualizada.";
            else TempData["Error"] = res.Error;
        }
        return RedirectToAction(nameof(MiCuenta));
    }

    // ------------------------------------------------------------ Helpers
    private async Task<MiCuentaViewModel?> ConstruirMiCuentaAsync()
    {
        var c = await _ciudadanos.ObtenerPorIdAsync(User.UsuarioId() ?? 0);
        if (c == null) return null;
        return new MiCuentaViewModel
        {
            NombreCompleto = c.NombreCompleto,
            Dui = c.Dui,
            Correo = c.Correo,
            FechaCreacion = c.FechaCreacion
        };
    }

    private async Task<IActionResult> CerrarYSalirAsync()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Redirect("/login");
    }

    private async Task RefrescarCookieAsync(int id, string nombre, string dui)
    {
        var claims = new List<System.Security.Claims.Claim>
        {
            new(System.Security.Claims.ClaimTypes.NameIdentifier, id.ToString()),
            new(System.Security.Claims.ClaimTypes.Name, nombre),
            new("dui", dui),
            new(System.Security.Claims.ClaimTypes.Role, Roles.Ciudadano)
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new System.Security.Claims.ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = false });
    }
}
