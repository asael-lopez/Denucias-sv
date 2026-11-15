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

    // P2 y P3: agreguen aquí sus DbSet (Denuncia, etc.) y su clase de configuración
    // en Data/Configurations; ApplyConfigurationsFromAssembly la detecta sola.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
