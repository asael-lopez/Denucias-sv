using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SistemasDenuncias.Data;
using SistemasDenuncias.Models;
using SistemasDenuncias.Repositories;

namespace SistemasDenuncias.Services;

public class AuthService : IAuthService
{
    public const int MinPassword = 12;
    public const int MaxPassword = 72;
    private const int MaxIntentos = 5;
    private static readonly TimeSpan VentanaBloqueo = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan VidaToken = TimeSpan.FromMinutes(30);
    private static readonly Regex DuiRegex = new(@"^\d{8}-\d$", RegexOptions.Compiled);
    private static readonly Regex CorreoRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

    private const string TipoCiudadano = "ciudadano_login";
    private const string TipoAdmin = "admin_login";

    private readonly ApplicationDbContext _db;
    private readonly ICiudadanoRepository _ciudadanos;
    private readonly IAdministradorRepository _admins;
    private readonly IPasswordHasher<Ciudadano> _hasherCiudadano;
    private readonly IPasswordHasher<Administrador> _hasherAdmin;

    public AuthService(
        ApplicationDbContext db,
        ICiudadanoRepository ciudadanos,
        IAdministradorRepository admins,
        IPasswordHasher<Ciudadano> hasherCiudadano,
        IPasswordHasher<Administrador> hasherAdmin)
    {
        _db = db;
        _ciudadanos = ciudadanos;
        _admins = admins;
        _hasherCiudadano = hasherCiudadano;
        _hasherAdmin = hasherAdmin;
    }

    // ------------------------------------------------------------ Registro
    public async Task<ResultadoAuth> RegistrarCiudadanoAsync(string nombre, string dui, string correo, string password)
    {
        nombre = (nombre ?? "").Trim();
        dui = (dui ?? "").Trim();
        correo = (correo ?? "").Trim().ToLowerInvariant();

        if (nombre.Length < 3 || nombre.Length > 120) return new(false, "Escribe tu nombre completo.");
        if (!DuiRegex.IsMatch(dui)) return new(false, "El DUI debe tener el formato 12345678-9.");
        if (!CorreoRegex.IsMatch(correo) || correo.Length > 254) return new(false, "Escribe un correo válido.");
        var errPass = ValidarPassword(password);
        if (errPass != null) return new(false, errPass);

        if (await _ciudadanos.ExisteDuiAsync(dui) || await _ciudadanos.ExisteCorreoAsync(correo))
            return new(false, "Ya existe una cuenta con ese DUI o correo.");

        var ciudadano = new Ciudadano { NombreCompleto = nombre, Dui = dui, Correo = correo };
        ciudadano.PasswordHash = _hasherCiudadano.HashPassword(ciudadano, password);
        try
        {
            await _ciudadanos.AgregarAsync(ciudadano);
        }
        catch (DbUpdateException)
        {
            // Carrera entre dos registros iguales: el índice único lo detiene.
            return new(false, "Ya existe una cuenta con ese DUI o correo.");
        }
        return new(true);
    }

    // --------------------------------------------------------------- Login
    public async Task<ResultadoLoginCiudadano> LoginCiudadanoAsync(string dui, string password, string ip)
    {
        dui = (dui ?? "").Trim();
        var idHash = Sha256(dui);

        var bloqueo = await MinutosDeBloqueoAsync(TipoCiudadano, idHash);
        if (bloqueo != null) return new(false, MensajeBloqueo(bloqueo.Value), null);

        var ciudadano = DuiRegex.IsMatch(dui) ? await _ciudadanos.ObtenerPorDuiAsync(dui) : null;
        var ok = false;
        if (ciudadano != null)
        {
            var r = _hasherCiudadano.VerifyHashedPassword(ciudadano, ciudadano.PasswordHash, password ?? "");
            ok = r != PasswordVerificationResult.Failed;
            if (r == PasswordVerificationResult.SuccessRehashNeeded)
            {
                ciudadano.PasswordHash = _hasherCiudadano.HashPassword(ciudadano, password!);
                await _ciudadanos.GuardarAsync();
            }
        }
        else
        {
            // Gasta el mismo tiempo que un login real para no revelar si el DUI existe.
            _hasherCiudadano.HashPassword(new Ciudadano(), password ?? "");
        }

        if (!ok)
        {
            await RegistrarIntentoAsync(TipoCiudadano, idHash, ip);
            return new(false, "DUI o contraseña incorrectos.", null);
        }

        await LimpiarIntentosAsync(TipoCiudadano, idHash);
        return new(true, null, ciudadano);
    }

    public async Task<ResultadoLoginAdmin> LoginAdministradorAsync(string dui, string password, string ip)
    {
        dui = (dui ?? "").Trim();
        var idHash = Sha256(dui);

        var bloqueo = await MinutosDeBloqueoAsync(TipoAdmin, idHash);
        if (bloqueo != null) return new(false, MensajeBloqueo(bloqueo.Value), null);

        var admin = DuiRegex.IsMatch(dui) ? await _admins.ObtenerPorDuiAsync(dui) : null;
        var ok = false;
        if (admin != null)
        {
            var r = _hasherAdmin.VerifyHashedPassword(admin, admin.PasswordHash, password ?? "");
            ok = r != PasswordVerificationResult.Failed;
            if (r == PasswordVerificationResult.SuccessRehashNeeded)
            {
                admin.PasswordHash = _hasherAdmin.HashPassword(admin, password!);
                await _admins.GuardarAsync();
            }
        }
        else
        {
            _hasherAdmin.HashPassword(new Administrador(), password ?? "");
        }

        if (!ok)
        {
            await RegistrarIntentoAsync(TipoAdmin, idHash, ip);
            return new(false, "DUI o contraseña incorrectos.", null);
        }

        await LimpiarIntentosAsync(TipoAdmin, idHash);
        return new(true, null, admin);
    }

    // ------------------------------------------------------ Administradores
    public async Task<ResultadoAuth> CrearAdministradorAreaAsync(string nombre, string dui, string password, string categoria)
    {
        nombre = (nombre ?? "").Trim();
        dui = (dui ?? "").Trim();

        if (nombre.Length < 3 || nombre.Length > 120) return new(false, "Escribe el nombre completo.");
        if (!DuiRegex.IsMatch(dui)) return new(false, "El DUI debe tener el formato 12345678-9.");
        if (!CategoriasDenuncia.Todas.Contains(categoria)) return new(false, "Selecciona un área válida.");
        var errPass = ValidarPassword(password);
        if (errPass != null) return new(false, errPass);
        if (await _admins.ExisteDuiAsync(dui)) return new(false, "Ya existe un administrador con ese DUI.");

        var admin = new Administrador
        {
            NombreCompleto = nombre,
            Dui = dui,
            Rol = RolAdministrador.Area,
            Categoria = categoria
        };
        admin.PasswordHash = _hasherAdmin.HashPassword(admin, password);
        try
        {
            await _admins.AgregarAsync(admin);
        }
        catch (DbUpdateException)
        {
            return new(false, "Ya existe un administrador con ese DUI.");
        }
        return new(true);
    }

    // ------------------------------------------------------- Recuperación
    public async Task<string?> SolicitarRecuperacionAsync(string correo)
    {
        correo = (correo ?? "").Trim().ToLowerInvariant();
        var ciudadano = await _ciudadanos.ObtenerPorCorreoAsync(correo);
        if (ciudadano == null) return null;

        // Máximo 3 solicitudes por hora por cuenta.
        var desde = DateTime.UtcNow.AddHours(-1);
        var recientes = await _db.TokensRecuperacion
            .CountAsync(t => t.CiudadanoId == ciudadano.Id && t.FechaCreacion >= desde);
        if (recientes >= 3) return null;

        // Invalida los tokens anteriores sin usar.
        var anteriores = await _db.TokensRecuperacion
            .Where(t => t.CiudadanoId == ciudadano.Id && !t.Usado)
            .ToListAsync();
        foreach (var t in anteriores) t.Usado = true;

        var token = ToBase64Url(RandomNumberGenerator.GetBytes(32));
        _db.TokensRecuperacion.Add(new TokenRecuperacion
        {
            CiudadanoId = ciudadano.Id,
            TokenHash = Sha256(token, normalizar: false),
            Expira = DateTime.UtcNow.Add(VidaToken)
        });
        await _db.SaveChangesAsync();
        return token;
    }

    public async Task<bool> TokenRecuperacionValidoAsync(string token) =>
        await BuscarTokenValidoAsync(token) != null;

    public async Task<ResultadoAuth> RestablecerPasswordAsync(string token, string nuevaPassword)
    {
        var errPass = ValidarPassword(nuevaPassword);
        if (errPass != null) return new(false, errPass);

        var registro = await BuscarTokenValidoAsync(token);
        if (registro == null) return new(false, "El enlace no es válido o ya venció. Solicita uno nuevo.");

        var ciudadano = await _ciudadanos.ObtenerPorIdAsync(registro.CiudadanoId);
        if (ciudadano == null) return new(false, "El enlace no es válido o ya venció. Solicita uno nuevo.");

        ciudadano.PasswordHash = _hasherCiudadano.HashPassword(ciudadano, nuevaPassword);
        registro.Usado = true;
        await _db.SaveChangesAsync();

        // Si estaba bloqueado por intentos fallidos, se libera.
        await LimpiarIntentosAsync(TipoCiudadano, Sha256(ciudadano.Dui));
        return new(true);
    }

    // ------------------------------------------------------------ Mi cuenta
    public async Task<ResultadoAuth> ActualizarPerfilAsync(int ciudadanoId, string nombre, string correo)
    {
        nombre = (nombre ?? "").Trim();
        correo = (correo ?? "").Trim().ToLowerInvariant();
        if (nombre.Length < 3 || nombre.Length > 120) return new(false, "Escribe tu nombre completo.");
        if (!CorreoRegex.IsMatch(correo) || correo.Length > 254) return new(false, "Escribe un correo válido.");

        var ciudadano = await _ciudadanos.ObtenerPorIdAsync(ciudadanoId);
        if (ciudadano == null) return new(false, "No se encontró tu cuenta.");
        if (await _ciudadanos.ExisteCorreoAsync(correo, ciudadanoId))
            return new(false, "Ese correo ya está en uso por otra cuenta.");

        ciudadano.NombreCompleto = nombre;
        ciudadano.Correo = correo;
        try
        {
            await _ciudadanos.GuardarAsync();
        }
        catch (DbUpdateException)
        {
            return new(false, "Ese correo ya está en uso por otra cuenta.");
        }
        return new(true);
    }

    public async Task<ResultadoAuth> CambiarPasswordAsync(int ciudadanoId, string actual, string nueva)
    {
        var errPass = ValidarPassword(nueva);
        if (errPass != null) return new(false, errPass);

        var ciudadano = await _ciudadanos.ObtenerPorIdAsync(ciudadanoId);
        if (ciudadano == null) return new(false, "No se encontró tu cuenta.");

        var r = _hasherCiudadano.VerifyHashedPassword(ciudadano, ciudadano.PasswordHash, actual ?? "");
        if (r == PasswordVerificationResult.Failed) return new(false, "La contraseña actual no es correcta.");

        ciudadano.PasswordHash = _hasherCiudadano.HashPassword(ciudadano, nueva);
        await _ciudadanos.GuardarAsync();
        return new(true);
    }

    // ------------------------------------------------------------ Helpers
    private static string? ValidarPassword(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < MinPassword || password.Length > MaxPassword)
            return $"La contraseña debe tener entre {MinPassword} y {MaxPassword} caracteres.";
        return null;
    }

    private async Task<TokenRecuperacion?> BuscarTokenValidoAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var hash = Sha256(token, normalizar: false);
        var ahora = DateTime.UtcNow;
        return await _db.TokensRecuperacion
            .FirstOrDefaultAsync(t => t.TokenHash == hash && !t.Usado && t.Expira > ahora);
    }

    private async Task<int?> MinutosDeBloqueoAsync(string tipo, string idHash)
    {
        var desde = DateTime.UtcNow - VentanaBloqueo;
        var fechas = await _db.IntentosAutenticacion
            .Where(i => i.Tipo == tipo && i.IdentidadHash == idHash && i.FechaIntento >= desde)
            .OrderBy(i => i.FechaIntento)
            .Select(i => i.FechaIntento)
            .ToListAsync();

        if (fechas.Count < MaxIntentos) return null;

        // El bloqueo termina cuando el intento (n - 5) sale de la ventana de 15 minutos.
        var desbloqueo = fechas[fechas.Count - MaxIntentos] + VentanaBloqueo;
        var minutos = (int)Math.Ceiling((desbloqueo - DateTime.UtcNow).TotalMinutes);
        return Math.Max(minutos, 1);
    }

    private static string MensajeBloqueo(int minutos) =>
        $"Demasiados intentos fallidos. Intenta de nuevo en {minutos} minuto(s).";

    private async Task RegistrarIntentoAsync(string tipo, string idHash, string ip)
    {
        _db.IntentosAutenticacion.Add(new IntentoAutenticacion
        {
            Tipo = tipo,
            IdentidadHash = idHash,
            IpHash = Sha256(ip ?? "")
        });

        // Limpieza oportunista de intentos viejos.
        var limite = DateTime.UtcNow.AddDays(-1);
        var viejos = await _db.IntentosAutenticacion.Where(i => i.FechaIntento < limite).ToListAsync();
        if (viejos.Count > 0) _db.IntentosAutenticacion.RemoveRange(viejos);

        await _db.SaveChangesAsync();
    }

    private async Task LimpiarIntentosAsync(string tipo, string idHash)
    {
        var intentos = await _db.IntentosAutenticacion
            .Where(i => i.Tipo == tipo && i.IdentidadHash == idHash)
            .ToListAsync();
        if (intentos.Count == 0) return;
        _db.IntentosAutenticacion.RemoveRange(intentos);
        await _db.SaveChangesAsync();
    }

    private static string Sha256(string valor, bool normalizar = true)
    {
        if (normalizar) valor = valor.Trim().ToLowerInvariant();
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(valor))).ToLowerInvariant();
    }

    private static string ToBase64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
