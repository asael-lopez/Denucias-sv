using Microsoft.AspNetCore.Mvc.Rendering;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.ViewModels;

public class CatalogosIndexViewModel
{
    public IReadOnlyList<Categoria> Categorias { get; set; } = new List<Categoria>();
    public IReadOnlyList<Departamento> Departamentos { get; set; } = new List<Departamento>();
    public IReadOnlyList<Estado> Estados { get; set; } = new List<Estado>();
    public IReadOnlyList<Prioridad> Prioridades { get; set; } = new List<Prioridad>();
    public string? Exito { get; set; }
    public string? Error { get; set; }
    public string TabActiva { get; set; } = "categorias";
}

public class GuardarCategoriaViewModel
{
    public int? Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

public class GuardarDepartamentoViewModel
{
    public int? Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? CorreoContacto { get; set; }
}

public class OpcionesFormulariosViewModel
{
    public List<SelectListItem> Categorias { get; set; } = new();
    public List<SelectListItem> Departamentos { get; set; } = new();
    public List<SelectListItem> Estados { get; set; } = new();
    public List<SelectListItem> Prioridades { get; set; } = new();
}
