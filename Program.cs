using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemasDenuncias.Data;
using SistemasDenuncias.Models;
using SistemasDenuncias.Repositories;
using SistemasDenuncias.Services;

var builder = WebApplication.CreateBuilder(args);

// MVC (con antiforgery automático en todos los POST)
builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute());
});

// Base de datos (SQL Server LocalDB)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositorios y servicios
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ICiudadanoRepository, CiudadanoRepository>();
builder.Services.AddScoped<IAdministradorRepository, AdministradorRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICatalogoService, CatalogoService>();
builder.Services.AddScoped<IPasswordHasher<Ciudadano>, PasswordHasher<Ciudadano>>();
builder.Services.AddScoped<IPasswordHasher<Administrador>, PasswordHasher<Administrador>>();

// Sesión por cookies: vence a los 30 minutos de inactividad
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "SistemasDenuncias.Auth";
        options.Cookie.HttpOnly = true;
        // La cookie viaja solo por HTTPS en producción; en Development se relaja para poder probar en HTTP.
        options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
        options.SlidingExpiration = true;
        options.LoginPath = "/login";
        options.AccessDeniedPath = "/acceso-denegado";

        // Las rutas /admin-* mandan al login administrativo; las demás, al ciudadano.
        options.Events.OnRedirectToLogin = ctx =>
        {
            var esAdmin = ctx.Request.Path.Value!.StartsWith("/admin-", StringComparison.OrdinalIgnoreCase);
            ctx.Response.Redirect(esAdmin ? "/admin-login" : "/login");
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Administrador general inicial (contraseña desde configuración / user-secrets)
await DbSeeder.SeedAsync(app.Services);

app.Run();
