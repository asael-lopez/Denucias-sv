using System.Security.Claims;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Helpers;

public static class ClaimsExtensions
{
    public static int? UsuarioId(this ClaimsPrincipal user) =>
        int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public static string NombreCompleto(this ClaimsPrincipal user) =>
        user.Identity?.Name ?? "";

    public static string PrimerNombre(this ClaimsPrincipal user) =>
        user.NombreCompleto().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "";

    public static string Iniciales(this ClaimsPrincipal user)
    {
        var partes = user.NombreCompleto().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (partes.Length == 0) return "?";
        if (partes.Length == 1) return partes[0][..1].ToUpperInvariant();
        return (partes[0][..1] + partes[1][..1]).ToUpperInvariant();
    }

    public static string EtiquetaRol(this ClaimsPrincipal user)
    {
        if (user.IsInRole(Roles.AdminGeneral)) return "Administrador general";
        if (user.IsInRole(Roles.AdminArea))
            return "Área: " + (user.FindFirstValue("categoria") ?? "");
        return "Ciudadano";
    }
}
