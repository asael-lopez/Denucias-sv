using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Data.Configurations;

public class TokenRecuperacionConfiguration : IEntityTypeConfiguration<TokenRecuperacion>
{
    public void Configure(EntityTypeBuilder<TokenRecuperacion> b)
    {
        b.ToTable("TokensRecuperacion");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).IsRequired().HasMaxLength(64).IsUnicode(false);
        b.Property(x => x.FechaCreacion).HasDefaultValueSql("SYSUTCDATETIME()");
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => x.Expira);
        b.HasOne(x => x.Ciudadano)
            .WithMany(c => c.Tokens)
            .HasForeignKey(x => x.CiudadanoId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
