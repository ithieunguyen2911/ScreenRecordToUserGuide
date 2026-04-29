using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Windows.Forms;

namespace ScreenGuide.DesktopHelper;

public sealed class ScreenshotCapture
{
    public Rectangle GetVirtualScreenBounds()
    {
        return SystemInformation.VirtualScreen;
    }

    public string CaptureDesktopAsDataUrl()
    {
        return $"data:image/jpeg;base64,{Convert.ToBase64String(CaptureDesktopJpegBytes())}";
    }

    public byte[] CaptureDesktopJpegBytes()
    {
        var bounds = GetVirtualScreenBounds();
        using var bitmap = new Bitmap(bounds.Width, bounds.Height);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.CopyFromScreen(bounds.Left, bounds.Top, 0, 0, bounds.Size);

        using var stream = new MemoryStream();
        bitmap.Save(stream, ImageFormat.Jpeg);
        return stream.ToArray();
    }
}
