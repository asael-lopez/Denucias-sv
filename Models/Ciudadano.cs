namespace SistemasDenuncias.Models;

public class Ciudadano
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    /// <summary>Formato 12345678-9. Único.</summary>
    public string Dui { get; set; } = string.Empty;
    /// <summary>Único.</summary>
    public string Correo { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<TokenRecuperacion> Tokens { get; set; } = new List<TokenRecuperacion>();
}
