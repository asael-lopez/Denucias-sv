namespace SistemasDenuncias.Models;

/// <summary>
/// Nivel de prioridad / urgencia asignado a una denuncia (Común, Urgente, Súper urgente).
/// Incluye Nivel y TiempoRespuestaHoras según requerimiento del sistema.
/// </summary>
public class Prioridad
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Nivel { get; set; }
    public int TiempoRespuestaHoras { get; set; }
    public bool Activo { get; set; } = true;
}
