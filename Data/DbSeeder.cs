using Microsoft.AspNetCore.Identity;
using SistemasDenuncias.Models;
using SistemasDenuncias.Repositories;

namespace SistemasDenuncias.Data;

/// <summary>
/// Crea el administrador general inicial. La contraseña NO está en el código:
/// se lee de la configuración (SeedAdminGeneral:Password), idealmente desde user-secrets.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        try
        {
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var admins = scope.ServiceProvider.GetRequiredService<IAdministradorRepository>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Administrador>>();

            if (await admins.ExisteGeneralAsync()) return;

            var dui = config["SeedAdminGeneral:Dui"];
            var nombre = config["SeedAdminGeneral:NombreCompleto"] ?? "Administrador General";
            var password = config["SeedAdminGeneral:Password"];

            if (string.IsNullOrWhiteSpace(dui) || string.IsNullOrWhiteSpace(password))
            {
                logger.LogWarning(
                    "No se creó el administrador general: falta SeedAdminGeneral:Password. " +
                    "Defínela con: dotnet user-secrets set \"SeedAdminGeneral:Password\" \"<contraseña>\"");
                return;
            }

            var admin = new Administrador
            {
                NombreCompleto = nombre,
                Dui = dui,
                Rol = RolAdministrador.General,
                Categoria = null
            };
            admin.PasswordHash = hasher.HashPassword(admin, password);
            await admins.AgregarAsync(admin);
            logger.LogInformation("Administrador general creado (DUI {Dui}).", dui);
        }
        catch (Exception ex)
        {
            // Normal antes de correr Update-Database: las tablas todavía no existen.
            logger.LogWarning(ex, "No se pudo ejecutar el seeder (¿ya corriste Update-Database?).");
        }
    }
}
