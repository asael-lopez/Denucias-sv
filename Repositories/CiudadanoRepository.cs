using Microsoft.EntityFrameworkCore;
using SistemasDenuncias.Data;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Repositories;

public class CiudadanoRepository : ICiudadanoRepository
{
    private readonly ApplicationDbContext _db;
    public CiudadanoRepository(ApplicationDbContext db) => _db = db;

    public Task<Ciudadano?> ObtenerPorIdAsync(int id) =>
        _db.Ciudadanos.FirstOrDefaultAsync(c => c.Id == id);

    public Task<Ciudadano?> ObtenerPorDuiAsync(string dui) =>
        _db.Ciudadanos.FirstOrDefaultAsync(c => c.Dui == dui);

    public Task<Ciudadano?> ObtenerPorCorreoAsync(string correo) =>
        _db.Ciudadanos.FirstOrDefaultAsync(c => c.Correo == correo);

    public Task<bool> ExisteDuiAsync(string dui) =>
        _db.Ciudadanos.AnyAsync(c => c.Dui == dui);

    public Task<bool> ExisteCorreoAsync(string correo, int? exceptoId = null) =>
        _db.Ciudadanos.AnyAsync(c => c.Correo == correo && (exceptoId == null || c.Id != exceptoId));

    public async Task AgregarAsync(Ciudadano ciudadano)
    {
        _db.Ciudadanos.Add(ciudadano);
        await _db.SaveChangesAsync();
    }

    public Task GuardarAsync() => _db.SaveChangesAsync();
}
