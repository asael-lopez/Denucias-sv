# SistemasDenuncias (P1: base, acceso y administradores)

ASP.NET Core MVC (.NET 10) + EF Core 10 (SQL Server LocalDB). Esta parte cubre los pasos 1 a 11 del plan de P1.

## Primeros pasos (en tu computadora)

1. Abre `SistemasDenuncias.csproj` en Visual Studio (necesitas el SDK de .NET 10).
2. Restaura paquetes (Visual Studio lo hace solo).
3. Contraseña del administrador general (NO va en el código). En la terminal, dentro de la carpeta del proyecto:
   ```
   dotnet user-secrets set "SeedAdminGeneral:Password" "TuContraseñaSegura123!"
   ```
   El DUI y nombre del admin general están en `appsettings.json` (sección `SeedAdminGeneral`).
4. Git (sube esto a `dev` el primer día para que P2 y P3 empiecen):
   ```
   git init
   git add .
   git commit -m "Base del proyecto: MVC, EF Core, DbContext, auth"
   git branch -M main
   git branch dev
   git branch feature/usuarios
   git checkout dev
   git remote add origin <URL-del-repo>
   git push -u origin main dev feature/usuarios
   ```
5. Migraciones (solo P1 las crea). La migración `InicialDenuncias` ya existe e incluye las 4 tablas de P1
   (Ciudadanos, Administradores, TokensRecuperacion, IntentosAutenticacion). Cuando P2 y P3 suban sus entidades
   a `dev` (haz pull primero), hay que decidir si se regenera `InicialDenuncias` o se crea una migración nueva.
   En la Consola del Administrador de paquetes:
   ```
   Update-Database
   ```
   Al correr la app después de `Update-Database`, el seeder crea el AdminGeneral.

## Dónde está cada cosa

| Paso | Dónde |
|---|---|
| 1 | `Views/Shared/_Layout.cshtml` (ciudadano), `_AdminLayout.cshtml`, `wwwroot/` |
| 2-3 | `SistemasDenuncias.csproj`, `appsettings.json`, `Program.cs`, `Data/ApplicationDbContext.cs` |
| 4 | `Models/` + `Data/Configurations/` |
| 6 | `Repositories/`, `Services/IAuthService.cs`, `Services/AuthService.cs` |
| 7 | `Controllers/AccountController.cs`, `Views/Account/` |
| 8 | `[Authorize]` en `CiudadanoController` y `AdminController`; roles en `Models/Roles.cs` |
| 9 | `Data/DbSeeder.cs`, `AdminController.Usuarios`, `Views/Admin/Usuarios.cshtml` |
| 10 | `Mi cuenta` (CiudadanoController), recuperación y bloqueo (AuthService) |

## Para P2 y P3

- Agreguen su entidad como `DbSet` en `ApplicationDbContext` y su clase `IEntityTypeConfiguration` en `Data/Configurations`.
- Las vistas `Views/Ciudadano/{CrearDenuncia,MisDenuncias,Estado,Ticket}` y `Views/Admin/*` son el prototipo HTML ya
  convertido a Razor y protegido. Todavía usan `js/local-complaints.js` (datos en `localStorage`): hay que
  reemplazarlo por controladores + base de datos.
- Usuario actual: `User.UsuarioId()`, `User.FindFirst("dui")`, `User.FindFirst("categoria")` (admin de área).

## Seguridad
- Contraseñas con `PasswordHasher`; sesión por cookie, 30 min de inactividad.
- Bloqueo temporal: 5 intentos fallidos en 15 minutos (por DUI).
- Recuperación: token de un solo uso que vence a los 30 min. No hay envío de correo: en Development el enlace se
  muestra en pantalla y se escribe en el log; en producción hay que conectar un servicio SMTP (ver `AccountController.Recuperar`).
