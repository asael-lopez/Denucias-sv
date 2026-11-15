using Microsoft.EntityFrameworkCore;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Ciudadano> Ciudadanos => Set<Ciudadano>();
    public DbSet<Administrador> Administradores => Set<Administrador>();
    public DbSet<TokenRecuperacion> TokensRecuperacion => Set<TokenRecuperacion>();
    public DbSet<IntentoAutenticacion> IntentosAutenticacion => Set<IntentoAutenticacion>();

    // Catálogos (Persona 2)
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Departamento> Departamentos => Set<Departamento>();
    public DbSet<Estado> Estados => Set<Estado>();
    public DbSet<Prioridad> Prioridades => Set<Prioridad>();

    // P3: agreguen aquí sus DbSet (Denuncia, HistorialDenuncia, EvidenciaDenuncia, DenunciaDuplicada)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
