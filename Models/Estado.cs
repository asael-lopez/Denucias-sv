namespace SistemasDenuncias.Models;

/// <summary>
/// Estado dentro del ciclo de vida de la denuncia (Recibido, En proceso, Enviado a Alcaldía, Finalizado).
/// Incluye Orden y EsFinal según requerimiento del sistema.
/// </summary>
public class Estado
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool EsFinal { get; set; }
    public string ColorIndicador { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}
