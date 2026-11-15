# SistemasDenuncias (P1: base y acceso | P2: catálogos, capa base y documentación)

ASP.NET Core MVC (.NET 10) + EF Core 10 (SQL Server LocalDB).
Esta solución integra los requerimientos de **Persona 1** y **Persona 2**, dejando la base lista y desacoplada para la integración de **Persona 3**.

---

## Estado de Avance por Integrante

### Persona 1: Proyecto, usuarios y seguridad (Pasos 1 - 11) - COMPLETADO
* Entidades: `Ciudadano`, `Administrador`, `TokenRecuperacion`, `IntentoAutenticacion`.
* Fluent API con índices únicos en DUI/Correo y restricción SQL Check para administradores de área.
* Autenticación por cookies (30 min sliding expiration), roles (`Ciudadano`, `AdminGeneral`, `AdminArea`).
* `PasswordHasher<T>`, protección de fuerza bruta (5 intentos / 15 min), seeder de AdminGeneral.

### Persona 2: Catálogos, capa base y documentación (Pasos 1 - 8) - COMPLETADO
* Entidades: `Categoria`, `Departamento`, `Estado` (con `Orden` y `EsFinal`), `Prioridad` (con `Nivel` y `TiempoRespuestaHoras`).
* Configuraciones Fluent API en `Data/Configurations/` con nombres únicos e índices.
* Capa base genérica y transaccional: `IRepository<T>`, `Repository<T>`, `IUnitOfWork` y `UnitOfWork` registrados en DI.
* Servicio `ICatalogoService` y `CatalogoService` con validación de nombre único y manejo de errores.
* Semillas de datos automáticas en `DbSeeder.cs` para categorías, departamentos, estados y prioridades.
* Pantalla administrativa `/admin-catalogos` con gestión por pestañas, altas, edición y activación/desactivación.
* Entrega dinámica de catálogos en vistas (`CrearDenuncia.cshtml`, `Detalle.cshtml`, `Dashboard.cshtml`, `Mapa.cshtml`).
* **Documento Técnico Formal:** Ubicado en `docs/Documento_Arquitectura_y_Base_de_Datos_Etapa3.md` con MER de las 12 tablas, justificación 3FN, diccionario de datos exhaustivo, explicación SOLID y guión de video.

---

## Primeros pasos (en tu computadora)

1. Abre `SistemasDenuncias.csproj` en Visual Studio (requiere SDK de .NET 10 o compatible).
2. Restaura paquetes NuGet (`dotnet restore`).
3. Contraseña del administrador general (en terminal o Administrador de Paquetes):
   ```bash
   dotnet user-secrets set "SeedAdminGeneral:Password" "TuContraseñaSegura123!"
   ```
4. Migraciones y Base de Datos (SQL Server LocalDB):
   Para aplicar las tablas de P1 y P2 a la base de datos:
   * Si se va a generar una migración adicional de catálogos:
     ```powershell
     Add-Migration AgregarCatalogosYCapaBase
     Update-Database
     ```
   * O bien, si P1 regenera la migración inicial completa:
     ```powershell
     Update-Database
     ```
   Al correr la aplicación, `DbSeeder.cs` sembrará automáticamente tanto el Administrador General como todos los catálogos base.

---

## Estructura de Capas y Dónde está cada cosa

| Componente | Ubicación en el Proyecto |
|---|---|
| **Modelos de Dominio** | `Models/` (`Ciudadano`, `Administrador`, `Categoria`, `Departamento`, `Estado`, `Prioridad`, etc.) |
| **Mapeo Fluent API** | `Data/Configurations/` (cada entidad tiene su clase desacoplada) |
| **Capa de Persistencia** | `Data/ApplicationDbContext.cs`, `Data/DbSeeder.cs` |
| **Patrón Repositorio y UoW** | `Repositories/` (`IRepository<T>`, `Repository<T>`, `IUnitOfWork`, `UnitOfWork`) |
| **Servicios de Negocio** | `Services/` (`IAuthService`, `AuthService`, `ICatalogoService`, `CatalogoService`) |
| **Controladores MVC** | `Controllers/` (`AccountController`, `CiudadanoController`, `AdminController`, `CatalogosController`) |
| **Vistas y Layouts** | `Views/` (`Views/Catalogos/`, `Views/Admin/`, `Views/Ciudadano/`, `Views/Shared/`) |
| **Documentación Técnica** | `docs/Documento_Arquitectura_y_Base_de_Datos_Etapa3.md` |

---

## Instrucciones Clave para Persona 3

1. **Entidades:** Crear `Denuncia`, `HistorialDenuncia`, `EvidenciaDenuncia` y `DenunciaDuplicada` en `Models/` con sus configuraciones en `Data/Configurations/`.
2. **DeleteBehavior:** En `DenunciaDuplicadaConfiguration`, aplicar `.OnDelete(DeleteBehavior.Restrict)` en las relaciones hacia `Denuncia`.
3. **Uso de Capa Base:** Utilicen `IUnitOfWork` inyectado en sus servicios (`_uow.Repository<Denuncia>()` o creen un `IDenunciaRepository` específico que herede de `IRepository<Denuncia>`).
4. **Catálogos:** Pueden consumir `ICatalogoService` o el endpoint `/api/catalogos/opciones` para cualquier requerimiento de listas desplegables.
