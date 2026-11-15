using System.Linq.Expressions;

namespace SistemasDenuncias.Repositories;

/// <summary>
/// Contrato genérico para el patrón Repositorio.
/// Permite desacoplar la lógica de negocio del acceso a datos directo con EF Core (SOLID: OCP, DIP).
/// </summary>
/// <typeparam name="T">Entidad del modelo relacional.</typeparam>
public interface IRepository<T> where T : class
{
    Task<T?> ObtenerPorIdAsync(int id);
    Task<IReadOnlyList<T>> ObtenerTodosAsync();
    Task<IReadOnlyList<T>> BuscarAsync(Expression<Func<T, bool>> predicado);
    Task<T?> PrimerOrDefaultAsync(Expression<Func<T, bool>> predicado);
    Task<bool> ExisteAsync(Expression<Func<T, bool>> predicado);
    Task AgregarAsync(T entidad);
    Task AgregarRangoAsync(IEnumerable<T> entidades);
    void Actualizar(T entidad);
    void Eliminar(T entidad);
    void EliminarRango(IEnumerable<T> entidades);
}
