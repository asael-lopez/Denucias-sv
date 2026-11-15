using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using SistemasDenuncias.Models;
using SistemasDenuncias.Repositories;
using SistemasDenuncias.ViewModels;

namespace SistemasDenuncias.Services;

/// <summary>
/// Implementación de la lógica de negocio para la gestión de catálogos y suministro de datos a formularios.
/// Utiliza IUnitOfWork para la persistencia transaccional (SRP, DIP).
/// </summary>
public class CatalogoService : ICatalogoService
{
    private readonly IUnitOfWork _uow;

    public CatalogoService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    // ========================================================= CATEGORÍAS
    public async Task<IReadOnlyList<Categoria>> ListarCategoriasAsync(bool soloActivas = true)
    {
        if (soloActivas)
            return await _uow.Categorias.BuscarAsync(c => c.Activo);
        return await _uow.Categorias.ObtenerTodosAsync();
    }

    public async Task<Categoria?> ObtenerCategoriaPorIdAsync(int id) =>
        await _uow.Categorias.ObtenerPorIdAsync(id);

    public async Task<ResultadoOperacion> CrearCategoriaAsync(string nombre, string? descripcion)
    {
        nombre = (nombre ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(nombre) || nombre.Length < 3 || nombre.Length > 100)
            return new(false, "El nombre de la categoría debe contener entre 3 y 100 caracteres.");

        var nombreNormalizado = nombre.ToLower();
        var yaExiste = await _uow.Categorias.ExisteAsync(c => c.Nombre.ToLower() == nombreNormalizado);
        if (yaExiste)
            return new(false, $"Ya existe una categoría registrada con el nombre '{nombre}'.");

        var categoria = new Categoria
        {
            Nombre = nombre,
            Descripcion = string.IsNullOrWhiteSpace(descripcion) ? null : descripcion.Trim(),
            Activo = true
        };

        try
        {
            await _uow.Categorias.AgregarAsync(categoria);
            await _uow.CommitAsync();
            return new(true);
        }
        catch (DbUpdateException)
        {
            return new(false, "Error al guardar en base de datos. Verifique que el nombre sea único.");
        }
    }

    public async Task<ResultadoOperacion> EditarCategoriaAsync(int id, string nombre, string? descripcion)
    {
        nombre = (nombre ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(nombre) || nombre.Length < 3 || nombre.Length > 100)
            return new(false, "El nombre de la categoría debe contener entre 3 y 100 caracteres.");

        var categoria = await _uow.Categorias.ObtenerPorIdAsync(id);
        if (categoria == null)
            return new(false, "La categoría solicitada no existe.");

        var nombreNormalizado = nombre.ToLower();
        var yaExiste = await _uow.Categorias.ExisteAsync(c => c.Id != id && c.Nombre.ToLower() == nombreNormalizado);
        if (yaExiste)
            return new(false, $"Ya existe otra categoría registrada con el nombre '{nombre}'.");

        categoria.Nombre = nombre;
        categoria.Descripcion = string.IsNullOrWhiteSpace(descripcion) ? null : descripcion.Trim();

        _uow.Categorias.Actualizar(categoria);
        await _uow.CommitAsync();
        return new(true);
    }

    public async Task<ResultadoOperacion> ToggleActivoCategoriaAsync(int id)
    {
        var categoria = await _uow.Categorias.ObtenerPorIdAsync(id);
        if (categoria == null)
            return new(false, "La categoría no existe.");

        categoria.Activo = !categoria.Activo;
        _uow.Categorias.Actualizar(categoria);
        await _uow.CommitAsync();
        return new(true);
    }

    // ====================================================== DEPARTAMENTOS
    public async Task<IReadOnlyList<Departamento>> ListarDepartamentosAsync(bool soloActivos = true)
    {
        if (soloActivos)
            return await _uow.Departamentos.BuscarAsync(d => d.Activo);
        return await _uow.Departamentos.ObtenerTodosAsync();
    }

    public async Task<Departamento?> ObtenerDepartamentoPorIdAsync(int id) =>
        await _uow.Departamentos.ObtenerPorIdAsync(id);

    public async Task<ResultadoOperacion> CrearDepartamentoAsync(string nombre, string? correoContacto)
    {
        nombre = (nombre ?? string.Empty).Trim();
        correoContacto = (correoContacto ?? string.Empty).Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(nombre) || nombre.Length < 3 || nombre.Length > 120)
            return new(false, "El nombre del departamento debe contener entre 3 y 120 caracteres.");

        var nombreNormalizado = nombre.ToLower();
        var yaExiste = await _uow.Departamentos.ExisteAsync(d => d.Nombre.ToLower() == nombreNormalizado);
        if (yaExiste)
            return new(false, $"Ya existe un departamento registrado con el nombre '{nombre}'.");

        var depto = new Departamento
        {
            Nombre = nombre,
            CorreoContacto = string.IsNullOrWhiteSpace(correoContacto) ? null : correoContacto,
            Activo = true
        };

        try
        {
            await _uow.Departamentos.AgregarAsync(depto);
            await _uow.CommitAsync();
            return new(true);
        }
        catch (DbUpdateException)
        {
            return new(false, "Error al guardar el departamento. El nombre debe ser único.");
        }
    }

    public async Task<ResultadoOperacion> EditarDepartamentoAsync(int id, string nombre, string? correoContacto)
    {
        nombre = (nombre ?? string.Empty).Trim();
        correoContacto = (correoContacto ?? string.Empty).Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(nombre) || nombre.Length < 3 || nombre.Length > 120)
            return new(false, "El nombre del departamento debe contener entre 3 y 120 caracteres.");

        var depto = await _uow.Departamentos.ObtenerPorIdAsync(id);
        if (depto == null)
            return new(false, "El departamento solicitado no existe.");

        var nombreNormalizado = nombre.ToLower();
        var yaExiste = await _uow.Departamentos.ExisteAsync(d => d.Id != id && d.Nombre.ToLower() == nombreNormalizado);
        if (yaExiste)
            return new(false, $"Ya existe otro departamento con el nombre '{nombre}'.");

        depto.Nombre = nombre;
        depto.CorreoContacto = string.IsNullOrWhiteSpace(correoContacto) ? null : correoContacto;

        _uow.Departamentos.Actualizar(depto);
        await _uow.CommitAsync();
        return new(true);
    }

    public async Task<ResultadoOperacion> ToggleActivoDepartamentoAsync(int id)
    {
        var depto = await _uow.Departamentos.ObtenerPorIdAsync(id);
        if (depto == null)
            return new(false, "El departamento no existe.");

        depto.Activo = !depto.Activo;
        _uow.Departamentos.Actualizar(depto);
        await _uow.CommitAsync();
        return new(true);
    }

    // =============================================== ESTADOS Y PRIORIDADES
    public async Task<IReadOnlyList<Estado>> ListarEstadosAsync(bool soloActivos = true)
    {
        var items = soloActivos
            ? await _uow.Estados.BuscarAsync(e => e.Activo)
            : await _uow.Estados.ObtenerTodosAsync();

        return items.OrderBy(e => e.Orden).ToList();
    }

    public async Task<Estado?> ObtenerEstadoPorIdAsync(int id) =>
        await _uow.Estados.ObtenerPorIdAsync(id);

    public async Task<IReadOnlyList<Prioridad>> ListarPrioridadesAsync(bool soloActivas = true)
    {
        var items = soloActivas
            ? await _uow.Prioridades.BuscarAsync(p => p.Activo)
            : await _uow.Prioridades.ObtenerTodosAsync();

        return items.OrderBy(p => p.Nivel).ToList();
    }

    public async Task<Prioridad?> ObtenerPrioridadPorIdAsync(int id) =>
        await _uow.Prioridades.ObtenerPorIdAsync(id);

    // ============================= LISTAS DESPLEGABLES PARA FORMULARIOS (PASO 5)
    public async Task<OpcionesFormulariosViewModel> ObtenerOpcionesParaFormulariosAsync()
    {
        var categorias = await ListarCategoriasAsync(soloActivas: true);
        var deptos = await ListarDepartamentosAsync(soloActivos: true);
        var estados = await ListarEstadosAsync(soloActivos: true);
        var prioridades = await ListarPrioridadesAsync(soloActivas: true);

        return new OpcionesFormulariosViewModel
        {
            Categorias = categorias.Select(c => new SelectListItem(c.Nombre, c.Id.ToString())).ToList(),
            Departamentos = deptos.Select(d => new SelectListItem(d.Nombre, d.Id.ToString())).ToList(),
            Estados = estados.Select(e => new SelectListItem(e.Nombre, e.Id.ToString())).ToList(),
            Prioridades = prioridades.Select(p => new SelectListItem(p.Nombre, p.Id.ToString())).ToList()
        };
    }
}
