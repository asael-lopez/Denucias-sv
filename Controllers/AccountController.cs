using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemasDenuncias.Models;
using SistemasDenuncias.Services;
using SistemasDenuncias.ViewModels;

namespace SistemasDenuncias.Controllers;

public class AccountController : Controller
{
    private readonly IAuthService _auth;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<AccountController> _logger;

    public AccountController(IAuthService auth, IWebHostEnvironment env, ILogger<AccountController> logger)
    {
        _auth = auth;
        _env = env;
        _logger = logger;
    }

    // ===================================================== Ciudadano: login
    [AllowAnonymous]
    [HttpGet("login")]
    public IActionResult Login(string? panel = null, string? returnUrl = null)
    {
        if (User.IsInRole(Roles.Ciudadano)) return Redirect("/home");
        var vm = new LoginPageViewModel
        {
            Panel = panel is "register" or "forgot" ? panel : "login",
            ReturnUrl = returnUrl,
            ExitoLogin = TempData["ExitoLogin"] as string
        };
        return View(vm);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(string? dui, string? password, string? returnUrl)
    {
        var res = await _auth.LoginCiudadanoAsync(dui ?? "", password ?? "", IpCliente());
        if (!res.Exito || res.Usuario == null)
        {
            return View(new LoginPageViewModel
            {
                Panel = "login",
                ReturnUrl = returnUrl,
                Dui = dui,
                ErrorLogin = res.Error
            });
        }

        await IniciarSesionAsync(res.Usuario.Id, res.Usuario.NombreCompleto, res.Usuario.Dui, Roles.Ciudadano);
        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl)) return LocalRedirect(returnUrl);
        return Redirect("/home");
    }

    // ================================================== Ciudadano: registro
    [AllowAnonymous]
    [HttpPost("registro")]
    public async Task<IActionResult> Registro(string? nombreCompleto, string? dui, string? correo, string? newPassword, bool aceptaTerminos)
    {
        var vm = new LoginPageViewModel
        {
            Panel = "register",
            NombreCompleto = nombreCompleto,
            Dui = dui,
            Correo = correo
        };

        if (!aceptaTerminos)
        {
            vm.ErrorRegistro = "Debes aceptar los términos y condiciones.";
            return View("Login", vm);
        }

        var res = await _auth.RegistrarCiudadanoAsync(nombreCompleto ?? "", dui ?? "", correo ?? "", newPassword ?? "");
        if (!res.Exito)
        {
            vm.ErrorRegistro = res.Error;
            return View("Login", vm);
        }

        TempData["ExitoLogin"] = "Cuenta creada. Ya puedes iniciar sesión con tu DUI y contraseña.";
        return RedirectToAction(nameof(Login));
    }

    // ===================================================== Recuperación
    [AllowAnonymous]
    [HttpPost("recuperar")]
    public async Task<IActionResult> Recuperar(string? correo)
    {
        var token = await _auth.SolicitarRecuperacionAsync(correo ?? "");
        var vm = new LoginPageViewModel
        {
            Panel = "forgot",
            // Mensaje genérico: no revela si el correo existe.
            ExitoRecuperar = "Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña."
        };

        if (token != null)
        {
            var enlace = Url.Action(nameof(Restablecer), "Account", new { token }, Request.Scheme);
            // TODO (producción): enviar este enlace por correo. Aquí aún no hay transporte SMTP.
            if (_env.IsDevelopment())
            {
                // En Development se registra y se muestra el enlace en pantalla para poder probar.
                _logger.LogInformation("Enlace de recuperación para {Correo}: {Enlace}", correo, enlace);
                vm.EnlaceDesarrollo = enlace;
            }
            else
            {
                // Fuera de Development no se registran datos personales ni el enlace del token.
                _logger.LogInformation("Solicitud de recuperación procesada");
            }
        }
        return View("Login", vm);
    }

    [AllowAnonymous]
    [HttpGet("restablecer")]
    public async Task<IActionResult> Restablecer(string? token)
    {
        var vm = new RestablecerViewModel
        {
            Token = token ?? "",
            TokenValido = !string.IsNullOrEmpty(token) && await _auth.TokenRecuperacionValidoAsync(token)
        };
        return View(vm);
    }

    [AllowAnonymous]
    [HttpPost("restablecer")]
    public async Task<IActionResult> Restablecer(string? token, string? newPassword, string? confirmPassword)
    {
        var vm = new RestablecerViewModel { Token = token ?? "", TokenValido = true };

        if (newPassword != confirmPassword)
        {
            vm.Error = "Las contraseñas no coinciden.";
            return View(vm);
        }

        var res = await _auth.RestablecerPasswordAsync(token ?? "", newPassword ?? "");
        if (!res.Exito)
        {
            vm.Error = res.Error;
            vm.TokenValido = await _auth.TokenRecuperacionValidoAsync(token ?? "");
            return View(vm);
        }

        TempData["ExitoLogin"] = "Contraseña actualizada. Inicia sesión con tu nueva contraseña.";
        return RedirectToAction(nameof(Login));
    }

    // ============================================== Administrador: login
    [AllowAnonymous]
    [HttpGet("admin-login")]
    public IActionResult AdminLogin()
    {
        if (User.IsInRole(Roles.AdminGeneral) || User.IsInRole(Roles.AdminArea)) return Redirect("/admin-dashboard");
        return View(new AdminLoginViewModel());
    }

    [AllowAnonymous]
    [HttpPost("admin-login")]
    public async Task<IActionResult> AdminLogin(string? dui, string? password)
    {
        var res = await _auth.LoginAdministradorAsync(dui ?? "", password ?? "", IpCliente());
        if (!res.Exito || res.Usuario == null)
            return View(new AdminLoginViewModel { Dui = dui, Error = res.Error });

        var admin = res.Usuario;
        var rol = admin.Rol == RolAdministrador.General ? Roles.AdminGeneral : Roles.AdminArea;
        await IniciarSesionAsync(admin.Id, admin.NombreCompleto, admin.Dui, rol, admin.Categoria);
        return Redirect("/admin-dashboard");
    }

    // ================================================================ Salir
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Redirect("/login");
    }

    [Authorize]
    [HttpPost("admin-logout")]
    public async Task<IActionResult> AdminLogout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Redirect("/admin-login");
    }

    [AllowAnonymous]
    [HttpGet("acceso-denegado")]
    public IActionResult AccesoDenegado()
    {
        Response.StatusCode = StatusCodes.Status403Forbidden;
        return View();
    }

    // ============================================================== Helpers
    private async Task IniciarSesionAsync(int id, string nombre, string dui, string rol, string? categoria = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, id.ToString()),
            new(ClaimTypes.Name, nombre),
            new("dui", dui),
            new(ClaimTypes.Role, rol)
        };
        if (!string.IsNullOrEmpty(categoria)) claims.Add(new Claim("categoria", categoria));

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = false });
    }

    private string IpCliente() => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "desconocida";
}
