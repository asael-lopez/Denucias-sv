using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data.Configurations;

public class EstadoConfiguration : IEntityTypeConfiguration<Estado>
{
    public void Configure(EntityTypeBuilder<Estado> b)
    {
        b.ToTable("Estados");
        b.HasKey(x => x.Id);
        b.Property(x => x.Nombre).IsRequired().HasMaxLength(60);
        b.Property(x => x.Orden).IsRequired();
        b.Property(x => x.EsFinal).IsRequired().HasDefaultValue(false);
        b.Property(x => x.ColorIndicador).IsRequired().HasMaxLength(30);
        b.Property(x => x.Activo).HasDefaultValue(true);
        b.HasIndex(x => x.Nombre).IsUnique();
        b.HasIndex(x => x.Orden);
    }
}
