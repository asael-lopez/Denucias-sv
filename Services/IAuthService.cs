using SistemasDenuncias.Models;

namespace SistemasDenuncias.Services;

public record ResultadoAuth(bool Exito, string? Error = null);
public record ResultadoLoginCiudadano(bool Exito, string? Error, Ciudadano? Usuario);
public record ResultadoLoginAdmin(bool Exito, string? Error, Administrador? Usuario);

public interface IAuthService
{
    Task<ResultadoAuth> RegistrarCiudadanoAsync(string nombre, string dui, string correo, string password);
    Task<ResultadoLoginCiudadano> LoginCiudadanoAsync(string dui, string password, string ip);
    Task<ResultadoLoginAdmin> LoginAdministradorAsync(string dui, string password, string ip);

    Task<ResultadoAuth> CrearAdministradorAreaAsync(string nombre, string dui, string password, string categoria);

    /// <summary>Devuelve el token en claro (para armar el enlace) o null si el correo no existe / se superó el límite.</summary>
    Task<string?> SolicitarRecuperacionAsync(string correo);
    Task<bool> TokenRecuperacionValidoAsync(string token);
    Task<ResultadoAuth> RestablecerPasswordAsync(string token, string nuevaPassword);

    Task<ResultadoAuth> ActualizarPerfilAsync(int ciudadanoId, string nombre, string correo);
    Task<ResultadoAuth> CambiarPasswordAsync(int ciudadanoId, string actual, string nueva);
}
