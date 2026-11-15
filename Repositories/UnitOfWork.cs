using Microsoft.EntityFrameworkCore.Storage;
using SistemasDenuncias.Data;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Repositories;

/// <summary>
/// Implementación del patrón Unidad de Trabajo (Unit of Work) para Entity Framework Core.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _db;
    private readonly Dictionary<Type, object> _repositories = new();
    private IDbContextTransaction? _currentTransaction;

    private IRepository<Categoria>? _categorias;
    private IRepository<Departamento>? _departamentos;
    private IRepository<Estado>? _estados;
    private IRepository<Prioridad>? _prioridades;
    private ICiudadanoRepository? _ciudadanos;
    private IAdministradorRepository? _administradores;
    private IRepository<TokenRecuperacion>? _tokens;
    private IRepository<IntentoAutenticacion>? _intentos;

    public UnitOfWork(
        ApplicationDbContext db,
        ICiudadanoRepository ciudadanos,
        IAdministradorRepository administradores)
    {
        _db = db;
        _ciudadanos = ciudadanos;
        _administradores = administradores;
    }

    public IRepository<Categoria> Categorias =>
        _categorias ??= new Repository<Categoria>(_db);

    public IRepository<Departamento> Departamentos =>
        _departamentos ??= new Repository<Departamento>(_db);

    public IRepository<Estado> Estados =>
        _estados ??= new Repository<Estado>(_db);

    public IRepository<Prioridad> Prioridades =>
        _prioridades ??= new Repository<Prioridad>(_db);

    public ICiudadanoRepository Ciudadanos => _ciudadanos!;
    public IAdministradorRepository Administradores => _administradores!;

    public IRepository<TokenRecuperacion> TokensRecuperacion =>
        _tokens ??= new Repository<TokenRecuperacion>(_db);

    public IRepository<IntentoAutenticacion> IntentosAutenticacion =>
        _intentos ??= new Repository<IntentoAutenticacion>(_db);

    public IRepository<T> Repository<T>() where T : class
    {
        var type = typeof(T);
        if (!_repositories.ContainsKey(type))
        {
            _repositories[type] = new Repository<T>(_db);
        }
        return (IRepository<T>)_repositories[type];
    }

    public async Task<int> CommitAsync() =>
        await _db.SaveChangesAsync();

    public async Task BeginTransactionAsync()
    {
        _currentTransaction ??= await _db.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_currentTransaction != null)
        {
            await _currentTransaction.CommitAsync();
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_currentTransaction != null)
        {
            await _currentTransaction.RollbackAsync();
            await _currentTransaction.DisposeAsync();
            _currentTransaction = null;
        }
    }

    public void Dispose()
    {
        _currentTransaction?.Dispose();
        _db.Dispose();
    }
}
