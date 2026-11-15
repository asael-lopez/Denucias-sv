namespace SistemasDenuncias.Models;

/// <summary>Categorías de denuncia (las mismas del formulario crear-denuncia del prototipo).</summary>
public static class CategoriasDenuncia
{
    public static readonly IReadOnlyList<string> Todas = new[]
    {
        "Bacheo",
        "Desechos sólidos",
        "Chapoda y Áreas Verdes",
        "Obstrucción de vía",
        "Luminaria dañada",
        "Otro"
    };
}
