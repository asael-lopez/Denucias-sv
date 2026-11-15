using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data.Configurations;

public class AdministradorConfiguration : IEntityTypeConfiguration<Administrador>
{
    public void Configure(EntityTypeBuilder<Administrador> b)
    {
                b.HasKey(x => x.Id);
        b.Property(x => x.NombreCompleto).IsRequired().HasMaxLength(120);
        b.Property(x => x.Dui).IsRequired().HasMaxLength(10).IsUnicode(false);
        b.Property(x => x.PasswordHash).IsRequired().HasMaxLength(255);
        b.Property(x => x.Rol).HasConversion<int>().IsRequired();
        b.Property(x => x.Categoria).HasMaxLength(60);
        b.Property(x => x.FechaCreacion).HasDefaultValueSql("SYSUTCDATETIME()");
        b.HasIndex(x => x.Dui).IsUnique();
        // General => sin categoría; Área => categoría obligatoria.
        b.ToTable("Administradores", t => t.HasCheckConstraint("CK_Administradores_Categoria",
            "([Rol] = 1 AND [Categoria] IS NULL) OR ([Rol] = 2 AND [Categoria] IS NOT NULL)"));
    }
}
