using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data.Configurations;

public class IntentoAutenticacionConfiguration : IEntityTypeConfiguration<IntentoAutenticacion>
{
    public void Configure(EntityTypeBuilder<IntentoAutenticacion> b)
    {
        b.ToTable("IntentosAutenticacion");
        b.HasKey(x => x.Id);
        b.Property(x => x.Tipo).IsRequired().HasMaxLength(32).IsUnicode(false);
        b.Property(x => x.IdentidadHash).IsRequired().HasMaxLength(64).IsUnicode(false);
        b.Property(x => x.IpHash).IsRequired().HasMaxLength(64).IsUnicode(false);
        b.Property(x => x.FechaIntento).HasDefaultValueSql("SYSUTCDATETIME()");
        b.HasIndex(x => new { x.Tipo, x.IdentidadHash, x.FechaIntento });
    }
}
