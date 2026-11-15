using Microsoft.EntityFrameworkCore;
using SistemasDenuncias.Data;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Repositories;

public class AdministradorRepository : IAdministradorRepository
{
    private readonly ApplicationDbContext _db;
    public AdministradorRepository(ApplicationDbContext db) => _db = db;

    public Task<Administrador?> ObtenerPorIdAsync(int id) =>
        _db.Administradores.FirstOrDefaultAsync(a => a.Id == id);

    public Task<Administrador?> ObtenerPorDuiAsync(string dui) =>
        _db.Administradores.FirstOrDefaultAsync(a => a.Dui == dui);

    public Task<bool> ExisteDuiAsync(string dui) =>
        _db.Administradores.AnyAsync(a => a.Dui == dui);

    public Task<bool> ExisteGeneralAsync() =>
        _db.Administradores.AnyAsync(a => a.Rol == RolAdministrador.General);

    public Task<List<Administrador>> ListarAreaAsync() =>
        _db.Administradores
            .Where(a => a.Rol == RolAdministrador.Area)
            .OrderBy(a => a.NombreCompleto)
            .ToListAsync();

    public async Task AgregarAsync(Administrador administrador)
    {
        _db.Administradores.Add(administrador);
        await _db.SaveChangesAsync();
    }

    public async Task EliminarAsync(Administrador administrador)
    {
        _db.Administradores.Remove(administrador);
        await _db.SaveChangesAsync();
    }

    public Task GuardarAsync() => _db.SaveChangesAsync();
}
