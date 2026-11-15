namespace SistemasDenuncias.Models;

/// <summary>
/// Departamentos y dependencias operativas de la Alcaldía de Soyapango encargadas de resolver denuncias.
/// </summary>
public class Departamento
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? CorreoContacto { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
