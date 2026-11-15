namespace SistemasDenuncias.ViewModels;

public class MiCuentaViewModel
{
    public string NombreCompleto { get; set; } = "";
    public string Dui { get; set; } = "";
    public string Correo { get; set; } = "";
    public DateTime FechaCreacion { get; set; }
    public string? Exito { get; set; }
    public string? Error { get; set; }
    /// <summary>datos, contacto o seguridad: sección donde se muestra el mensaje.</summary>
    public string Seccion { get; set; } = "datos";
}
