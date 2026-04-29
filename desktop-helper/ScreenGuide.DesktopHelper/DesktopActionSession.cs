using System.Diagnostics;

namespace ScreenGuide.DesktopHelper;

public sealed class DesktopActionSession
{
    private readonly List<RecordedDesktopAction> actions = [];
    private readonly ScreenshotCapture screenshotCapture;
    private readonly object sync = new();
    private readonly Stopwatch stopwatch = new();
    private DateTimeOffset lastTypingAction = DateTimeOffset.MinValue;

    public DesktopActionSession(ScreenshotCapture screenshotCapture)
    {
        this.screenshotCapture = screenshotCapture;
    }

    public bool IsRecording { get; private set; }

    public void Start()
    {
        lock (sync)
        {
            actions.Clear();
            lastTypingAction = DateTimeOffset.MinValue;
            stopwatch.Restart();
            IsRecording = true;
        }
    }

    public IReadOnlyList<RecordedDesktopAction> Stop()
    {
        lock (sync)
        {
            IsRecording = false;
            stopwatch.Stop();
            return actions.ToArray();
        }
    }

    public IReadOnlyList<RecordedDesktopAction> GetActions()
    {
        lock (sync)
        {
            return actions.ToArray();
        }
    }

    public void RecordPointerAction(string type, int screenX, int screenY)
    {
        if (!IsRecording) return;

        var label = type switch
        {
            "scroll" => "Scroll",
            _ => "Click here",
        };

        AddAction(type, screenX, screenY, 90, 70, label);
    }

    public void RecordTypingAction(int screenX, int screenY)
    {
        if (!IsRecording) return;

        var now = DateTimeOffset.UtcNow;
        if ((now - lastTypingAction).TotalMilliseconds < 800) return;
        lastTypingAction = now;

        AddAction("type", screenX, screenY, 240, 64, "Type here");
    }

    private void AddAction(string type, int screenX, int screenY, int width, int height, string label)
    {
        var bounds = screenshotCapture.GetVirtualScreenBounds();
        var screenshot = screenshotCapture.CaptureDesktopAsDataUrl();
        var action = new RecordedDesktopAction(
            Timestamp: Math.Round(stopwatch.Elapsed.TotalSeconds, 1),
            Type: type,
            ScreenX: screenX,
            ScreenY: screenY,
            Width: width,
            Height: height,
            ScreenLeft: bounds.Left,
            ScreenTop: bounds.Top,
            ScreenWidth: bounds.Width,
            ScreenHeight: bounds.Height,
            Label: label,
            Screenshot: screenshot,
            CapturedAt: DateTimeOffset.UtcNow
        );

        lock (sync)
        {
            if (IsRecording)
            {
                actions.Add(action);
            }
        }
    }
}
