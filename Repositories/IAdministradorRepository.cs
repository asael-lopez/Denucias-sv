using SistemasDenuncias.Models;

namespace SistemasDenuncias.Repositories;

public interface IAdministradorRepository
{
    Task<Administrador?> ObtenerPorIdAsync(int id);
    Task<Administrador?> ObtenerPorDuiAsync(string dui);
    Task<bool> ExisteDuiAsync(string dui);
    Task<bool> ExisteGeneralAsync();
    Task<List<Administrador>> ListarAreaAsync();
    Task AgregarAsync(Administrador administrador);
    Task EliminarAsync(Administrador administrador);
    Task GuardarAsync();
}
