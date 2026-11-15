using SistemasDenuncias.Models;
using SistemasDenuncias.ViewModels;

namespace SistemasDenuncias.Services;

public record ResultadoOperacion(bool Exito, string? Error = null);

public interface ICatalogoService
{
    // --- Categorías ---
    Task<IReadOnlyList<Categoria>> ListarCategoriasAsync(bool soloActivas = true);
    Task<Categoria?> ObtenerCategoriaPorIdAsync(int id);
    Task<ResultadoOperacion> CrearCategoriaAsync(string nombre, string? descripcion);
    Task<ResultadoOperacion> EditarCategoriaAsync(int id, string nombre, string? descripcion);
    Task<ResultadoOperacion> ToggleActivoCategoriaAsync(int id);

    // --- Departamentos ---
    Task<IReadOnlyList<Departamento>> ListarDepartamentosAsync(bool soloActivos = true);
    Task<Departamento?> ObtenerDepartamentoPorIdAsync(int id);
    Task<ResultadoOperacion> CrearDepartamentoAsync(string nombre, string? correoContacto);
    Task<ResultadoOperacion> EditarDepartamentoAsync(int id, string nombre, string? correoContacto);
    Task<ResultadoOperacion> ToggleActivoDepartamentoAsync(int id);

    // --- Estados y Prioridades ---
    Task<IReadOnlyList<Estado>> ListarEstadosAsync(bool soloActivos = true);
    Task<Estado?> ObtenerEstadoPorIdAsync(int id);
    Task<IReadOnlyList<Prioridad>> ListarPrioridadesAsync(bool soloActivas = true);
    Task<Prioridad?> ObtenerPrioridadPorIdAsync(int id);

    // --- Soporte para listas desplegables (Paso 5) ---
    Task<OpcionesFormulariosViewModel> ObtenerOpcionesParaFormulariosAsync();
}
