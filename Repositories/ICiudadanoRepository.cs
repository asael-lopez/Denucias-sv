using SistemasDenuncias.Models;

namespace SistemasDenuncias.Repositories;

public interface ICiudadanoRepository
{
    Task<Ciudadano?> ObtenerPorIdAsync(int id);
    Task<Ciudadano?> ObtenerPorDuiAsync(string dui);
    Task<Ciudadano?> ObtenerPorCorreoAsync(string correo);
    Task<bool> ExisteDuiAsync(string dui);
    Task<bool> ExisteCorreoAsync(string correo, int? exceptoId = null);
    Task AgregarAsync(Ciudadano ciudadano);
    Task GuardarAsync();
}
