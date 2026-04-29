using System.Windows;
using System.Windows.Automation;

namespace ScreenGuide.DesktopHelper;

public sealed class ElementInspector
{
    public ElementSnapshot? FromPoint(int screenX, int screenY)
    {
        try
        {
            var element = AutomationElement.FromPoint(new System.Windows.Point(screenX, screenY));
            if (element is null) return null;

            var rectangle = element.Current.BoundingRectangle;
            if (rectangle.IsEmpty || rectangle.Width < 2 || rectangle.Height < 2) return null;

            return new ElementSnapshot(
                X: Convert.ToInt32(Math.Round(rectangle.X)),
                Y: Convert.ToInt32(Math.Round(rectangle.Y)),
                Width: Convert.ToInt32(Math.Round(rectangle.Width)),
                Height: Convert.ToInt32(Math.Round(rectangle.Height)),
                Name: Clean(element.Current.Name),
                ControlType: Clean(element.Current.ControlType?.ProgrammaticName?.Replace("ControlType.", string.Empty))
            );
        }
        catch
        {
            return null;
        }
    }

    private static string? Clean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return value.Trim().ReplaceLineEndings(" ");
    }
}
