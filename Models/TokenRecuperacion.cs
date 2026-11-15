namespace SistemasDenuncias.Models;

public class TokenRecuperacion
{
    public int Id { get; set; }
    public int CiudadanoId { get; set; }
    public Ciudadano? Ciudadano { get; set; }
    /// <summary>SHA-256 (hex) del token enviado al usuario. El token original nunca se guarda.</summary>
    public string TokenHash { get; set; } = string.Empty;
    public DateTime Expira { get; set; }
    public bool Usado { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}
