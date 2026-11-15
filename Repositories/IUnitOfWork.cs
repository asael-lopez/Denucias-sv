using SistemasDenuncias.Models;

namespace SistemasDenuncias.Repositories;

/// <summary>
/// Contrato para el patrón Unidad de Trabajo (Unit of Work).
/// Garantiza la atomicidad y coherencia transaccional de las operaciones entre múltiples repositorios.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    // Catálogos (Persona 2)
    IRepository<Categoria> Categorias { get; }
    IRepository<Departamento> Departamentos { get; }
    IRepository<Estado> Estados { get; }
    IRepository<Prioridad> Prioridades { get; }

    // Usuarios y Autenticación (Persona 1)
    ICiudadanoRepository Ciudadanos { get; }
    IAdministradorRepository Administradores { get; }
    IRepository<TokenRecuperacion> TokensRecuperacion { get; }
    IRepository<IntentoAutenticacion> IntentosAutenticacion { get; }

    // Acceso genérico parametrizable para cualquier entidad (útil para Persona 3: Denuncias, etc.)
    IRepository<T> Repository<T>() where T : class;

    /// <summary>Guarda todos los cambios pendientes en una única transacción de base de datos.</summary>
    Task<int> CommitAsync();

    /// <summary>Manejo explícito de transacciones ACID en SQL Server.</summary>
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
