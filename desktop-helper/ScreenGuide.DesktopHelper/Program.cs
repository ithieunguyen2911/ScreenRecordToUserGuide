using ScreenGuide.DesktopHelper;

const string CorsPolicy = "ScreenGuideWebApp";

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:55231");
builder.Services.AddSingleton<ScreenshotCapture>();
builder.Services.AddSingleton<DesktopActionSession>();
builder.Services.AddSingleton<NativeInputHook>();
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();
app.UseCors(CorsPolicy);

app.Lifetime.ApplicationStopping.Register(() =>
{
    app.Services.GetRequiredService<NativeInputHook>().Stop();
});

app.MapGet("/health", (DesktopActionSession session) =>
{
    return Results.Ok(new HelperStatus(true, session.IsRecording, session.GetActions().Count));
});

app.MapPost("/session/start", (DesktopActionSession session, NativeInputHook hook) =>
{
    session.Start();
    hook.Start();
    return Results.Ok(new HelperStatus(true, session.IsRecording, session.GetActions().Count));
});

app.MapPost("/session/stop", (DesktopActionSession session, NativeInputHook hook) =>
{
    hook.Stop();
    var actions = session.Stop();
    return Results.Ok(actions);
});

app.MapGet("/session/actions", (DesktopActionSession session) =>
{
    return Results.Ok(session.GetActions());
});

Console.WriteLine("ScreenGuide Desktop Helper listening on http://127.0.0.1:55231");
Console.WriteLine("Keyboard content is not stored. The helper only records typing events and screenshots.");
app.Run();
