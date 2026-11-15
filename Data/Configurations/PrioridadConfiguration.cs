using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data.Configurations;

public class PrioridadConfiguration : IEntityTypeConfiguration<Prioridad>
{
    public void Configure(EntityTypeBuilder<Prioridad> b)
    {
        b.ToTable("Prioridades");
        b.HasKey(x => x.Id);
        b.Property(x => x.Nombre).IsRequired().HasMaxLength(50);
        b.Property(x => x.Nivel).IsRequired();
        b.Property(x => x.TiempoRespuestaHoras).IsRequired();
        b.Property(x => x.Activo).HasDefaultValue(true);
        b.HasIndex(x => x.Nombre).IsUnique();
        b.HasIndex(x => x.Nivel).IsUnique();
    }
}
