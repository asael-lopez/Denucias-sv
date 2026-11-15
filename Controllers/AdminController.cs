using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemasDenuncias.Helpers;
using SistemasDenuncias.Models;
using SistemasDenuncias.Repositories;
using SistemasDenuncias.Services;
using SistemasDenuncias.ViewModels;

namespace SistemasDenuncias.Controllers;

/// <summary>Páginas administrativas (admin-*). Solo AdminGeneral o AdminArea.</summary>
[Authorize(Roles = Roles.CualquierAdmin)]
public class AdminController : Controller
{
    private readonly IAdministradorRepository _admins;
    private readonly IAuthService _auth;

    public AdminController(IAdministradorRepository admins, IAuthService auth)
    {
        _admins = admins;
        _auth = auth;
    }

    // P2/P3: conectan aquí las denuncias reales. El AdminArea solo debe ver su categoría
    // (claim "categoria"): User.FindFirst("categoria")?.Value
    [HttpGet("admin-dashboard")] public IActionResult Dashboard() => View();
    [HttpGet("admin-denuncias")] public IActionResult Denuncias() => View();
    [HttpGet("admin-detalle")] public IActionResult Detalle() => View();
    [HttpGet("admin-crear-denuncia")] public IActionResult CrearDenuncia() => View();
    [HttpGet("admin-duplicados")] public IActionResult Duplicados() => View();
    [HttpGet("admin-mapa")] public IActionResult Mapa() => View();
    [HttpGet("admin-reportes")] public IActionResult Reportes() => View();

    // ------------------------------------------------- Usuarios (solo general)
    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpGet("admin-usuarios")]
    public async Task<IActionResult> Usuarios()
    {
        var vm = await ConstruirAsync();
        vm.Exito = TempData["Exito"] as string;
        vm.Error = TempData["Error"] as string;
        return View(vm);
    }

    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpPost("admin-usuarios")]
    public async Task<IActionResult> Usuarios(string? nombre, string? dui, string? password, string? categoria)
    {
        var res = await _auth.CrearAdministradorAreaAsync(nombre ?? "", dui ?? "", password ?? "", categoria ?? "");
        if (res.Exito)
        {
            TempData["Exito"] = "Usuario creado. Ya puede iniciar sesión en el portal administrativo.";
            return RedirectToAction(nameof(Usuarios));
        }

        var vm = await ConstruirAsync();
        vm.Error = res.Error;
        vm.Nombre = nombre;
        vm.Dui = dui;
        vm.Categoria = categoria;
        return View(vm);
    }

    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpPost("admin-usuarios/eliminar")]
    public async Task<IActionResult> EliminarUsuario(int id)
    {
        var admin = await _admins.ObtenerPorIdAsync(id);
        // Solo se eliminan administradores de área; el general no se puede borrar.
        if (admin != null && admin.Rol == RolAdministrador.Area) await _admins.EliminarAsync(admin);
        return RedirectToAction(nameof(Usuarios));
    }

    private async Task<AdminUsuariosViewModel> ConstruirAsync()
    {
        var general = await _admins.ObtenerPorIdAsync(User.UsuarioId() ?? 0);
        return new AdminUsuariosViewModel
        {
            Administradores = await _admins.ListarAreaAsync(),
            AdminGeneralNombre = general?.NombreCompleto ?? User.NombreCompleto(),
            AdminGeneralDui = general?.Dui ?? ""
        };
    }
}
