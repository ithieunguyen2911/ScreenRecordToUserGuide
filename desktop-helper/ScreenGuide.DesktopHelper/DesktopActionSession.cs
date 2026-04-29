using System.Diagnostics;
using System.IO;

namespace ScreenGuide.DesktopHelper;

public sealed class DesktopActionSession
{
    private readonly List<RecordedDesktopAction> actions = [];
    private readonly ScreenshotCapture screenshotCapture;
    private readonly ElementInspector elementInspector;
    private readonly object sync = new();
    private readonly Stopwatch stopwatch = new();
    private DateTimeOffset lastTypingAction = DateTimeOffset.MinValue;
    private string recordName = "Record";
    private int actionSequence;

    public DesktopActionSession(ScreenshotCapture screenshotCapture, ElementInspector elementInspector)
    {
        this.screenshotCapture = screenshotCapture;
        this.elementInspector = elementInspector;
    }

    public bool IsRecording { get; private set; }
    public string? SessionFolder { get; private set; }

    public void Start(string? storageRoot, string? requestedRecordName)
    {
        lock (sync)
        {
            actions.Clear();
            lastTypingAction = DateTimeOffset.MinValue;
            actionSequence = 0;
            recordName = SanitizeFileName(string.IsNullOrWhiteSpace(requestedRecordName)
                ? $"Record_{DateTime.Now:MM_dd_yyyy_HH_mm_ss}"
                : requestedRecordName);
            SessionFolder = CreateSessionFolder(storageRoot, recordName);
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

    public async Task<string?> SaveVideoAsync(IFormFile? file)
    {
        if (file is null || file.Length == 0 || string.IsNullOrWhiteSpace(SessionFolder)) return null;

        Directory.CreateDirectory(SessionFolder);
        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension)) extension = ".webm";
        var path = Path.Combine(SessionFolder, $"{recordName}{extension}");

        await using var stream = File.Create(path);
        await file.CopyToAsync(stream);
        return path;
    }

    public void RecordPointerAction(string type, int screenX, int screenY)
    {
        if (!IsRecording) return;

        var label = type == "scroll" ? "Scroll" : "Click here";

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
        var element = elementInspector.FromPoint(screenX, screenY);
        var normalizedType = NormalizeActionType(type, element);
        var focusX = element?.X ?? screenX - width / 2;
        var focusY = element?.Y ?? screenY - height / 2;
        var focusWidth = element?.Width ?? width;
        var focusHeight = element?.Height ?? height;
        var elementName = element?.Name;
        var controlType = element?.ControlType;
        var actionLabel = BuildLabel(normalizedType, label, element);
        var screenshotBytes = screenshotCapture.CaptureDesktopJpegBytes();
        var screenshot = $"data:image/jpeg;base64,{Convert.ToBase64String(screenshotBytes)}";
        var screenshotPath = SaveScreenshot(screenshotBytes, normalizedType);
        var action = new RecordedDesktopAction(
            Timestamp: Math.Round(stopwatch.Elapsed.TotalSeconds, 1),
            Type: normalizedType,
            ScreenX: focusX,
            ScreenY: focusY,
            Width: focusWidth,
            Height: focusHeight,
            ScreenLeft: bounds.Left,
            ScreenTop: bounds.Top,
            ScreenWidth: bounds.Width,
            ScreenHeight: bounds.Height,
            Label: actionLabel,
            ElementName: elementName,
            ControlType: controlType,
            Screenshot: screenshot,
            ScreenshotPath: screenshotPath,
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

    private static string BuildLabel(string type, string fallback, ElementSnapshot? element)
    {
        if (element is null) return fallback;
        var name = string.IsNullOrWhiteSpace(element.Name) ? element.ControlType : element.Name;
        if (string.IsNullOrWhiteSpace(name)) return fallback;

        return type switch
        {
            "type" => $"Type in {name}",
            "scroll" => $"Scroll {name}",
            "select" => $"Select {name}",
            _ => $"Click {name}",
        };
    }

    private static string NormalizeActionType(string type, ElementSnapshot? element)
    {
        if (type != "click") return type;
        var controlType = element?.ControlType ?? string.Empty;
        return controlType is "ComboBox" or "List" or "ListItem" or "MenuItem" ? "select" : "click";
    }

    private string? SaveScreenshot(byte[] screenshotBytes, string actionType)
    {
        if (string.IsNullOrWhiteSpace(SessionFolder)) return null;
        Directory.CreateDirectory(SessionFolder);
        var index = Interlocked.Increment(ref actionSequence);
        var path = Path.Combine(SessionFolder, $"Image_{recordName}_{index:000}_{actionType}.jpg");
        File.WriteAllBytes(path, screenshotBytes);
        return path;
    }

    private static string CreateSessionFolder(string? storageRoot, string recordName)
    {
        var root = string.IsNullOrWhiteSpace(storageRoot)
            ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads", "Temp")
            : storageRoot;

        var folder = Path.Combine(root, recordName);
        Directory.CreateDirectory(folder);
        return folder;
    }

    private static string SanitizeFileName(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var clean = new string(value.Select(character => invalid.Contains(character) ? '_' : character).ToArray());
        return string.IsNullOrWhiteSpace(clean) ? $"Record_{DateTime.Now:MM_dd_yyyy_HH_mm_ss}" : clean;
    }
}
