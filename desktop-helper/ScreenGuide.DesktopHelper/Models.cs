namespace ScreenGuide.DesktopHelper;

public sealed record HelperStatus(bool Ok, bool IsRecording, int ActionCount);

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
    string Screenshot,
    DateTimeOffset CapturedAt
);
