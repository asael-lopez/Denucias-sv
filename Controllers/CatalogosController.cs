using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemasDenuncias.Models;
using SistemasDenuncias.Services;
using SistemasDenuncias.ViewModels;

namespace SistemasDenuncias.Controllers;

/// <summary>
/// Controlador para el CRUD y administración de Catálogos (Persona 2).
/// Protegido para Administradores de la Alcaldía de Soyapango.
/// </summary>
[Authorize(Roles = Roles.CualquierAdmin)]
public class CatalogosController : Controller
{
    private readonly ICatalogoService _catalogoService;

    public CatalogosController(ICatalogoService catalogoService)
    {
        _catalogoService = catalogoService;
    }

    [HttpGet("admin-catalogos")]
    public async Task<IActionResult> Index(string tab = "categorias")
    {
        var vm = new CatalogosIndexViewModel
        {
            Categorias = await _catalogoService.ListarCategoriasAsync(soloActivas: false),
            Departamentos = await _catalogoService.ListarDepartamentosAsync(soloActivos: false),
            Estados = await _catalogoService.ListarEstadosAsync(soloActivos: false),
            Prioridades = await _catalogoService.ListarPrioridadesAsync(soloActivas: false),
            Exito = TempData["Exito"] as string,
            Error = TempData["Error"] as string,
            TabActiva = tab
        };

        return View(vm);
    }

    // ------------------------------------------------------------- CATEGORÍAS
    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpPost("admin-catalogos/categoria/crear")]
    public async Task<IActionResult> CrearCategoria(GuardarCategoriaViewModel modelo)
    {
        var resultado = await _catalogoService.CrearCategoriaAsync(modelo.Nombre, modelo.Descripcion);
        if (resultado.Exito)
            TempData["Exito"] = $"Categoría '{modelo.Nombre}' registrada exitosamente.";
        else
            TempData["Error"] = resultado.Error;

        return RedirectToAction(nameof(Index), new { tab = "categorias" });
    }

    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpPost("admin-catalogos/categoria/editar")]
    public async Task<IActionResult> EditarCategoria(GuardarCategoriaViewModel modelo)
    {
        if (modelo.Id == null)
        {
            TempData["Error"] = "Identificador de categoría inválido.";
            return RedirectToAction(nameof(Index), new { tab = "categorias" });
        }

        var resultado = await _catalogoService.EditarCategoriaAsync(modelo.Id.Value, modelo.Nombre, modelo.Descripcion);
        if (resultado.Exito)
            TempData["Exito"] = "Categoría actualizada correctamente.";
        else
            TempData["Error"] = resultado.Error;

        return RedirectToAction(nameof(Index), new { tab = "categorias" });
    }

    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpPost("admin-catalogos/categoria/toggle/{id:int}")]
    public async Task<IActionResult> ToggleCategoria(int id)
    {
        var resultado = await _catalogoService.ToggleActivoCategoriaAsync(id);
        if (resultado.Exito)
            TempData["Exito"] = "Estado de la categoría modificado.";
        else
            TempData["Error"] = resultado.Error;

        return RedirectToAction(nameof(Index), new { tab = "categorias" });
    }

    // ---------------------------------------------------------- DEPARTAMENTOS
    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpPost("admin-catalogos/departamento/crear")]
    public async Task<IActionResult> CrearDepartamento(GuardarDepartamentoViewModel modelo)
    {
        var resultado = await _catalogoService.CrearDepartamentoAsync(modelo.Nombre, modelo.CorreoContacto);
        if (resultado.Exito)
            TempData["Exito"] = $"Departamento '{modelo.Nombre}' registrado exitosamente.";
        else
            TempData["Error"] = resultado.Error;

        return RedirectToAction(nameof(Index), new { tab = "departamentos" });
    }

    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpPost("admin-catalogos/departamento/editar")]
    public async Task<IActionResult> EditarDepartamento(GuardarDepartamentoViewModel modelo)
    {
        if (modelo.Id == null)
        {
            TempData["Error"] = "Identificador de departamento inválido.";
            return RedirectToAction(nameof(Index), new { tab = "departamentos" });
        }

        var resultado = await _catalogoService.EditarDepartamentoAsync(modelo.Id.Value, modelo.Nombre, modelo.CorreoContacto);
        if (resultado.Exito)
            TempData["Exito"] = "Departamento actualizado correctamente.";
        else
            TempData["Error"] = resultado.Error;

        return RedirectToAction(nameof(Index), new { tab = "departamentos" });
    }

    [Authorize(Roles = Roles.AdminGeneral)]
    [HttpPost("admin-catalogos/departamento/toggle/{id:int}")]
    public async Task<IActionResult> ToggleDepartamento(int id)
    {
        var resultado = await _catalogoService.ToggleActivoDepartamentoAsync(id);
        if (resultado.Exito)
            TempData["Exito"] = "Estado del departamento modificado.";
        else
            TempData["Error"] = resultado.Error;

        return RedirectToAction(nameof(Index), new { tab = "departamentos" });
    }

    // ------------------------------------------------ API JSON PARA FORMULARIOS
    [HttpGet("api/catalogos/opciones")]
    public async Task<IActionResult> ObtenerOpcionesApi()
    {
        var opciones = await _catalogoService.ObtenerOpcionesParaFormulariosAsync();
        return Json(opciones);
    }
}
