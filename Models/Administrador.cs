namespace SistemasDenuncias.Models;

public class Administrador
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    /// <summary>Formato 12345678-9. Único.</summary>
    public string Dui { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public RolAdministrador Rol { get; set; } = RolAdministrador.Area;
    /// <summary>Categoría asignada. Solo aplica al administrador de área (null para el general).</summary>
    public string? Categoria { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
