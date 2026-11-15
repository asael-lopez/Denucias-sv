using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SistemasDenuncias.Data;

namespace SistemasDenuncias.Repositories;

/// <summary>
/// Implementación genérica del patrón Repositorio sobre Entity Framework Core.
/// Centraliza operaciones CRUD comunes aplicando reutilización de código (DRY) y optimización AsNoTracking en consultas.
/// </summary>
/// <typeparam name="T">Entidad del modelo relacional.</typeparam>
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _db;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext db)
    {
        _db = db;
        _dbSet = db.Set<T>();
    }

    public virtual async Task<T?> ObtenerPorIdAsync(int id) =>
        await _dbSet.FindAsync(id);

    public virtual async Task<IReadOnlyList<T>> ObtenerTodosAsync() =>
        await _dbSet.AsNoTracking().ToListAsync();

    public virtual async Task<IReadOnlyList<T>> BuscarAsync(Expression<Func<T, bool>> predicado) =>
        await _dbSet.AsNoTracking().Where(predicado).ToListAsync();

    public virtual async Task<T?> PrimerOrDefaultAsync(Expression<Func<T, bool>> predicado) =>
        await _dbSet.FirstOrDefaultAsync(predicado);

    public virtual async Task<bool> ExisteAsync(Expression<Func<T, bool>> predicado) =>
        await _dbSet.AnyAsync(predicado);

    public virtual async Task AgregarAsync(T entidad) =>
        await _dbSet.AddAsync(entidad);

    public virtual async Task AgregarRangoAsync(IEnumerable<T> entidades) =>
        await _dbSet.AddRangeAsync(entidades);

    public virtual void Actualizar(T entidad) =>
        _dbSet.Update(entidad);

    public virtual void Eliminar(T entidad) =>
        _dbSet.Remove(entidad);

    public virtual void EliminarRango(IEnumerable<T> entidades) =>
        _dbSet.RemoveRange(entidades);
}
