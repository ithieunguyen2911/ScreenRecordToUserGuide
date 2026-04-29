namespace ScreenGuide.DesktopHelper;

public sealed record HelperStatus(bool Ok, bool IsRecording, int ActionCount);

public sealed record HelperDebugStatus(
    bool IsHookInstalled,
    DateTimeOffset? LastEventAt,
    int ActionCount,
    string HookThreadState,
    string? SessionFolder
);

public sealed record StartSessionRequest(string? StorageRoot, string? RecordName);

public sealed record UploadVideoResponse(bool Saved, string? VideoPath);

public sealed record ElementSnapshot(
    int X,
    int Y,
    int Width,
    int Height,
    string? Name,
    string? ControlType
);

public sealed record RecordedDesktopAction(
    double Timestamp,
    string Type,
    int ScreenX,
    int ScreenY,
    int Width,
    int Height,
    int ScreenLeft,
    int ScreenTop,
    int ScreenWidth,
    int ScreenHeight,
    string Label,
    string? ElementName,
    string? ControlType,
    string Screenshot,
    string? ScreenshotPath,
    DateTimeOffset CapturedAt
);
