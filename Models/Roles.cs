namespace SistemasDenuncias.Models;

public static class Roles
{
    public const string Ciudadano = "Ciudadano";
    public const string AdminGeneral = "AdminGeneral";
    public const string AdminArea = "AdminArea";
    public const string CualquierAdmin = AdminGeneral + "," + AdminArea;
}
