namespace SistemasDenuncias.ViewModels;

public class LoginPageViewModel
{
    /// <summary>Panel visible: login, register o forgot.</summary>
    public string Panel { get; set; } = "login";
    public string? ReturnUrl { get; set; }

    public string? ErrorLogin { get; set; }
    public string? ExitoLogin { get; set; }
    public string? ErrorRegistro { get; set; }
    public string? ErrorRecuperar { get; set; }
    public string? ExitoRecuperar { get; set; }

    // Para no perder lo que el usuario escribió
    public string? Dui { get; set; }
    public string? NombreCompleto { get; set; }
    public string? Correo { get; set; }

    /// <summary>Solo en Development: enlace de recuperación (no hay servidor de correo).</summary>
    public string? EnlaceDesarrollo { get; set; }
}
