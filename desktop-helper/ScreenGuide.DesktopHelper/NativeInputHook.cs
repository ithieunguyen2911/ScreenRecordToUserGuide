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
    private const int WM_QUIT = 0x0012;

    private readonly DesktopActionSession session;
    private readonly LowLevelProc keyboardProc;
    private readonly LowLevelProc mouseProc;
    private readonly object sync = new();
    private readonly ManualResetEventSlim started = new(false);
    private Thread? hookThread;
    private IntPtr keyboardHook = IntPtr.Zero;
    private IntPtr mouseHook = IntPtr.Zero;
    private uint hookThreadId;

    public NativeInputHook(DesktopActionSession session)
    {
        this.session = session;
        keyboardProc = KeyboardCallback;
        mouseProc = MouseCallback;
    }

    public bool IsInstalled
    {
        get
        {
            lock (sync)
            {
                return keyboardHook != IntPtr.Zero && mouseHook != IntPtr.Zero;
            }
        }
    }

    public DateTimeOffset? LastEventAt { get; private set; }

    public string HookThreadState => hookThread?.ThreadState.ToString() ?? "Stopped";

    public void Start()
    {
        lock (sync)
        {
            if (hookThread is { IsAlive: true }) return;
            started.Reset();
            hookThread = new Thread(HookThreadMain)
            {
                IsBackground = true,
                Name = "ScreenGuide.NativeInputHook",
            };
            hookThread.SetApartmentState(ApartmentState.STA);
            hookThread.Start();
        }

        started.Wait(TimeSpan.FromSeconds(3));
    }

    public void Stop()
    {
        Thread? threadToJoin;
        uint threadId;
        lock (sync)
        {
            threadToJoin = hookThread;
            threadId = hookThreadId;
        }

        if (threadId != 0)
        {
            PostThreadMessage(threadId, WM_QUIT, IntPtr.Zero, IntPtr.Zero);
        }

        threadToJoin?.Join(TimeSpan.FromSeconds(2));
        CleanupHooks();
    }

    public void Dispose()
    {
        Stop();
        started.Dispose();
    }

    private void HookThreadMain()
    {
        lock (sync)
        {
            hookThreadId = GetCurrentThreadId();
            keyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, keyboardProc, GetModuleHandle(null), 0);
            mouseHook = SetWindowsHookEx(WH_MOUSE_LL, mouseProc, GetModuleHandle(null), 0);
        }

        started.Set();

        while (GetMessage(out var message, IntPtr.Zero, 0, 0) > 0)
        {
            TranslateMessage(ref message);
            DispatchMessage(ref message);
        }

        CleanupHooks();
    }

    private void CleanupHooks()
    {
        lock (sync)
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

            hookThread = null;
            hookThreadId = 0;
        }
    }

    private IntPtr MouseCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            var hookStruct = Marshal.PtrToStructure<MSLLHOOKSTRUCT>(lParam);
            var message = wParam.ToInt32();
            if (message is WM_LBUTTONDOWN or WM_RBUTTONDOWN)
            {
                LastEventAt = DateTimeOffset.UtcNow;
                session.RecordPointerAction("click", hookStruct.pt.x, hookStruct.pt.y);
            }
            else if (message == WM_MOUSEWHEEL)
            {
                LastEventAt = DateTimeOffset.UtcNow;
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
                LastEventAt = DateTimeOffset.UtcNow;
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
    private readonly struct MSG
    {
        public readonly IntPtr hwnd;
        public readonly uint message;
        public readonly IntPtr wParam;
        public readonly IntPtr lParam;
        public readonly uint time;
        public readonly POINT pt;
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

    [DllImport("kernel32.dll")]
    private static extern uint GetCurrentThreadId();

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool PostThreadMessage(uint idThread, int msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern int GetMessage(out MSG lpMsg, IntPtr hWnd, uint wMsgFilterMin, uint wMsgFilterMax);

    [DllImport("user32.dll")]
    private static extern bool TranslateMessage(ref MSG lpMsg);

    [DllImport("user32.dll")]
    private static extern IntPtr DispatchMessage(ref MSG lpMsg);
}
