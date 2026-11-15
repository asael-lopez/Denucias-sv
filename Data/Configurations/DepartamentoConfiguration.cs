using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data.Configurations;

public class DepartamentoConfiguration : IEntityTypeConfiguration<Departamento>
{
    public void Configure(EntityTypeBuilder<Departamento> b)
    {
        b.ToTable("Departamentos");
        b.HasKey(x => x.Id);
        b.Property(x => x.Nombre).IsRequired().HasMaxLength(120);
        b.Property(x => x.CorreoContacto).HasMaxLength(254);
        b.Property(x => x.Activo).HasDefaultValue(true);
        b.Property(x => x.FechaCreacion).HasDefaultValueSql("SYSUTCDATETIME()");
        b.HasIndex(x => x.Nombre).IsUnique();
    }
}
