namespace SistemasDenuncias.Models;

public class IntentoAutenticacion
{
    public long Id { get; set; }
    /// <summary>ciudadano_login, admin_login...</summary>
    public string Tipo { get; set; } = string.Empty;
    /// <summary>SHA-256 (hex) del DUI intentado.</summary>
    public string IdentidadHash { get; set; } = string.Empty;
    /// <summary>SHA-256 (hex) de la IP.</summary>
    public string IpHash { get; set; } = string.Empty;
    public DateTime FechaIntento { get; set; } = DateTime.UtcNow;
}
