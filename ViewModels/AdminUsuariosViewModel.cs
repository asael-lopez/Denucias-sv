using SistemasDenuncias.Models;

namespace SistemasDenuncias.ViewModels;

public class AdminUsuariosViewModel
{
    public List<Administrador> Administradores { get; set; } = new();
    public string AdminGeneralNombre { get; set; } = "";
    public string AdminGeneralDui { get; set; } = "";
    public string? Error { get; set; }
    public string? Exito { get; set; }

    public string? Nombre { get; set; }
    public string? Dui { get; set; }
    public string? Categoria { get; set; }
}
