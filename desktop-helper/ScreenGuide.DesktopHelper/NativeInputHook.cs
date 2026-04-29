using System.Runtime.InteropServices;

namespace ScreenGuide.DesktopHelper;

public sealed class NativeInputHook : IDisposable
{
    private const int WH_KEYBOARD_LL = 13;
    private const int WH_MOUSE_LL = 14;
    private const int WM_KEYDOWN = 0x0100;
    private const int WM_SYSKEYDOWN = 0x0104;
    private const int WM_LBUTTONDOWN = 0x0201;
    private const int WM_RBUTTONDOWN = 0x0204;
    private const int WM_MOUSEWHEEL = 0x020A;

    private readonly DesktopActionSession session;
    private readonly LowLevelProc keyboardProc;
    private readonly LowLevelProc mouseProc;
    private IntPtr keyboardHook = IntPtr.Zero;
    private IntPtr mouseHook = IntPtr.Zero;

    public NativeInputHook(DesktopActionSession session)
    {
        this.session = session;
        keyboardProc = KeyboardCallback;
        mouseProc = MouseCallback;
    }

    public void Start()
    {
        if (keyboardHook != IntPtr.Zero || mouseHook != IntPtr.Zero) return;
        keyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, keyboardProc, GetModuleHandle(null), 0);
        mouseHook = SetWindowsHookEx(WH_MOUSE_LL, mouseProc, GetModuleHandle(null), 0);
    }

    public void Stop()
    {
        if (keyboardHook != IntPtr.Zero)
        {
            UnhookWindowsHookEx(keyboardHook);
            keyboardHook = IntPtr.Zero;
        }

        if (mouseHook != IntPtr.Zero)
        {
            UnhookWindowsHookEx(mouseHook);
            mouseHook = IntPtr.Zero;
        }
    }

    public void Dispose()
    {
        Stop();
    }

    private IntPtr MouseCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            var hookStruct = Marshal.PtrToStructure<MSLLHOOKSTRUCT>(lParam);
            var message = wParam.ToInt32();
            if (message is WM_LBUTTONDOWN or WM_RBUTTONDOWN)
            {
                session.RecordPointerAction("click", hookStruct.pt.x, hookStruct.pt.y);
            }
            else if (message == WM_MOUSEWHEEL)
            {
                session.RecordPointerAction("scroll", hookStruct.pt.x, hookStruct.pt.y);
            }
        }

        return CallNextHookEx(mouseHook, nCode, wParam, lParam);
    }

    private IntPtr KeyboardCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0 && wParam.ToInt32() is WM_KEYDOWN or WM_SYSKEYDOWN)
        {
            if (GetCursorPos(out var point))
            {
                session.RecordTypingAction(point.x, point.y);
            }
        }

        return CallNextHookEx(keyboardHook, nCode, wParam, lParam);
    }

    private delegate IntPtr LowLevelProc(int nCode, IntPtr wParam, IntPtr lParam);

    [StructLayout(LayoutKind.Sequential)]
    private readonly struct POINT
    {
        public readonly int x;
        public readonly int y;
    }

    [StructLayout(LayoutKind.Sequential)]
    private readonly struct MSLLHOOKSTRUCT
    {
        public readonly POINT pt;
        public readonly uint mouseData;
        public readonly uint flags;
        public readonly uint time;
        public readonly IntPtr dwExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string? lpModuleName);

    [DllImport("user32.dll")]
    private static extern bool GetCursorPos(out POINT lpPoint);
}
