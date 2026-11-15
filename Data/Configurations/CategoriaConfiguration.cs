using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data.Configurations;

public class CategoriaConfiguration : IEntityTypeConfiguration<Categoria>
{
    public void Configure(EntityTypeBuilder<Categoria> b)
    {
        b.ToTable("Categorias");
        b.HasKey(x => x.Id);
        b.Property(x => x.Nombre).IsRequired().HasMaxLength(100);
        b.Property(x => x.Descripcion).HasMaxLength(300);
        b.Property(x => x.Activo).HasDefaultValue(true);
        b.Property(x => x.FechaCreacion).HasDefaultValueSql("SYSUTCDATETIME()");
        b.HasIndex(x => x.Nombre).IsUnique();
    }
}
