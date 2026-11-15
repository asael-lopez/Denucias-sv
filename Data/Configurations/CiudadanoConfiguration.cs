using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data.Configurations;

public class CiudadanoConfiguration : IEntityTypeConfiguration<Ciudadano>
{
    public void Configure(EntityTypeBuilder<Ciudadano> b)
    {
        b.ToTable("Ciudadanos");
        b.HasKey(x => x.Id);
        b.Property(x => x.NombreCompleto).IsRequired().HasMaxLength(120);
        b.Property(x => x.Dui).IsRequired().HasMaxLength(10).IsUnicode(false);
        b.Property(x => x.Correo).IsRequired().HasMaxLength(254);
        b.Property(x => x.PasswordHash).IsRequired().HasMaxLength(255);
        b.Property(x => x.FechaCreacion).HasDefaultValueSql("SYSUTCDATETIME()");
        b.HasIndex(x => x.Dui).IsUnique();
        b.HasIndex(x => x.Correo).IsUnique();
    }
}
