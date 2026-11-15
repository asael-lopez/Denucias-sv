using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemasDenuncias.Models;

namespace SistemasDenuncias.Controllers;

public class HomeController : Controller
{
    [AllowAnonymous]
    [HttpGet("/")]
    public IActionResult Index()
    {
        if (User.IsInRole(Roles.Ciudadano)) return Redirect("/home");
        if (User.IsInRole(Roles.AdminGeneral) || User.IsInRole(Roles.AdminArea)) return Redirect("/admin-dashboard");
        return Redirect("/login");
    }

    [AllowAnonymous]
    [HttpGet("/Home/Error")]
    public IActionResult Error() => Content("Ocurrió un error inesperado.");
}
