using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SistemasDenuncias.Models;
using SistemasDenuncias.Repositories;

namespace SistemasDenuncias.Data;

/// <summary>
/// Crea el administrador general inicial y los catálogos base del sistema (Persona 2).
/// La contraseña del admin NO está en el código: se lee de la configuración (SeedAdminGeneral:Password).
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        try
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var admins = scope.ServiceProvider.GetRequiredService<IAdministradorRepository>();
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Administrador>>();

            // 1. Semillas de catálogos base (Persona 2)
            await SeedCatalogosAsync(db, logger);

            // 2. Administrador general inicial (Persona 1)
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

    private static async Task SeedCatalogosAsync(ApplicationDbContext db, ILogger logger)
    {
        // Categorías
        if (!await db.Categorias.AnyAsync())
        {
            db.Categorias.AddRange(
                new Categoria { Nombre = "Bacheo", Descripcion = "Reportes de baches, grietas y hundimientos en vías públicas de Soyapango." },
                new Categoria { Nombre = "Desechos sólidos", Descripcion = "Acumulación de basura, botaderos a cielo abierto o fallas en el tren de aseo." },
                new Categoria { Nombre = "Chapoda y Áreas Verdes", Descripcion = "Poda de árboles de riesgo, maleza y mantenimiento de parques comunales." },
                new Categoria { Nombre = "Obstrucción de vía", Descripcion = "Vehículos abandonados, materiales de construcción o ripio bloqueando el paso." },
                new Categoria { Nombre = "Luminaria dañada", Descripcion = "Lámparas de alumbrado público apagadas, parpadeantes o quebradas." },
                new Categoria { Nombre = "Otro", Descripcion = "Otras incidencias municipales no categorizadas previamente." }
            );
            logger.LogInformation("Categorías base sembradas.");
        }

        // Departamentos
        if (!await db.Departamentos.AnyAsync())
        {
            db.Departamentos.AddRange(
                new Departamento { Nombre = "Mantenimiento Vial", CorreoContacto = "mantenimiento.vial@soyapango.gob.sv" },
                new Departamento { Nombre = "Desechos sólidos", CorreoContacto = "desechos.solidos@soyapango.gob.sv" },
                new Departamento { Nombre = "Alumbrado público", CorreoContacto = "alumbrado.publico@soyapango.gob.sv" },
                new Departamento { Nombre = "Chapoda y Áreas Verdes", CorreoContacto = "areas.verdes@soyapango.gob.sv" }
            );
            logger.LogInformation("Departamentos base sembrados.");
        }

        // Estados
        if (!await db.Estados.AnyAsync())
        {
            db.Estados.AddRange(
                new Estado { Nombre = "Recibido", Orden = 1, EsFinal = false, ColorIndicador = "Gris" },
                new Estado { Nombre = "En proceso", Orden = 2, EsFinal = false, ColorIndicador = "Naranja" },
                new Estado { Nombre = "Enviado a Alcaldía", Orden = 3, EsFinal = false, ColorIndicador = "Azul" },
                new Estado { Nombre = "Finalizado", Orden = 4, EsFinal = true, ColorIndicador = "Verde" }
            );
            logger.LogInformation("Estados base sembrados.");
        }

        // Prioridades
        if (!await db.Prioridades.AnyAsync())
        {
            db.Prioridades.AddRange(
                new Prioridad { Nombre = "Común", Nivel = 1, TiempoRespuestaHoras = 72 },
                new Prioridad { Nombre = "Urgente", Nivel = 2, TiempoRespuestaHoras = 48 },
                new Prioridad { Nombre = "Súper urgente", Nivel = 3, TiempoRespuestaHoras = 24 }
            );
            logger.LogInformation("Prioridades base sembradas.");
        }

        await db.SaveChangesAsync();
    }
}
