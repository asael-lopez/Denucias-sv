using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemasDenuncias.Migrations
{
    /// <inheritdoc />
    public partial class InicialDenuncias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Administradores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreCompleto = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Dui = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Rol = table.Column<int>(type: "int", nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Administradores", x => x.Id);
                    table.CheckConstraint("CK_Administradores_Categoria", "([Rol] = 1 AND [Categoria] IS NULL) OR ([Rol] = 2 AND [Categoria] IS NOT NULL)");
                });

            migrationBuilder.CreateTable(
                name: "Ciudadanos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreCompleto = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Dui = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    Correo = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ciudadanos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "IntentosAutenticacion",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tipo = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false),
                    IdentidadHash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    IpHash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    FechaIntento = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntentosAutenticacion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TokensRecuperacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CiudadanoId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    Expira = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Usado = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokensRecuperacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TokensRecuperacion_Ciudadanos_CiudadanoId",
                        column: x => x.CiudadanoId,
                        principalTable: "Ciudadanos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Administradores_Dui",
                table: "Administradores",
                column: "Dui",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ciudadanos_Correo",
                table: "Ciudadanos",
                column: "Correo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ciudadanos_Dui",
                table: "Ciudadanos",
                column: "Dui",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_IntentosAutenticacion_Tipo_IdentidadHash_FechaIntento",
                table: "IntentosAutenticacion",
                columns: new[] { "Tipo", "IdentidadHash", "FechaIntento" });

            migrationBuilder.CreateIndex(
                name: "IX_TokensRecuperacion_CiudadanoId",
                table: "TokensRecuperacion",
                column: "CiudadanoId");

            migrationBuilder.CreateIndex(
                name: "IX_TokensRecuperacion_Expira",
                table: "TokensRecuperacion",
                column: "Expira");

            migrationBuilder.CreateIndex(
                name: "IX_TokensRecuperacion_TokenHash",
                table: "TokensRecuperacion",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Administradores");

            migrationBuilder.DropTable(
                name: "IntentosAutenticacion");

            migrationBuilder.DropTable(
                name: "TokensRecuperacion");

            migrationBuilder.DropTable(
                name: "Ciudadanos");
        }
    }
}
