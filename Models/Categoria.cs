namespace SistemasDenuncias.Models;

/// <summary>
/// Catálogo de tipos de incidente / categorías de denuncia ciudadana en Soyapango.
/// </summary>
public class Categoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
