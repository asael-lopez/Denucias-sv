namespace SistemasDenuncias.ViewModels;

public class RestablecerViewModel
{
    public string Token { get; set; } = string.Empty;
    public bool TokenValido { get; set; }
    public string? Error { get; set; }
}
