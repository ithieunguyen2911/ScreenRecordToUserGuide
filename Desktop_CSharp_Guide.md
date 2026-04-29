# Hướng dẫn xây dựng ScreenRecorder AI với C# WinForms

Để xây dựng ứng dụng tương tự trên Windows Desktop bằng WinForms, bạn cần sử dụng một số thư viện để quay màn hình và gọi API của Gemini.

## 1. Yêu cầu thư viện (NuGet)
- `Google.GenerativeAI`: Thư viện SDK cho Gemini AI.
- `SharpAvi` hoặc `ScreenRecorderLib`: Để thực hiện quay màn hình chuyên nghiệp.
- `Newtonsoft.Json`: Để xử lý dữ liệu.

## 2. Mã nguồn mẫu (C#)

### ScreenRecorder.cs (Logic quay màn hình)
Sử dụng thư viện `ScreenRecorderLib`:

```csharp
using ScreenRecorderLib;

public class Recorder
{
    Recorder _recorder;
    public void Start(string filePath) {
        _recorder = new Recorder(new RecorderOptions {
            OutputOptions = new OutputOptions {
                RecorderMode = RecorderMode.Video,
                OutputFilePath = filePath
            }
        });
        _recorder.Start();
    }
    
    public void Stop() {
        _recorder.Stop();
    }
}
```

### GeminiService.cs (Gọi AI để tạo hướng dẫn)

```csharp
using Google.GenerativeAI;

public class GeminiService 
{
    private string _apiKey = "YOUR_API_KEY";
    
    public async Task<string> GenerateGuideAsync(string videoPath) {
        var client = new GenerativeModel("gemini-1.5-flash", _apiKey);
        
        // Đọc video và chuyển sang Base64
        byte[] videoData = File.ReadAllBytes(videoPath);
        string base64Video = Convert.ToBase64String(videoData);
        
        var response = await client.GenerateContentAsync(
            new List<Part> {
                new TextPart("Dựa vào video này, hãy tạo hướng dẫn sử dụng chi tiết bằng Tiếng Việt dưới dạng Markdown."),
                new InlineDataPart("video/mp4", base64Video)
            }
        );
        
        return response.Text;
    }
}
```

### Form1.cs (Giao diện người dùng)

```csharp
public partial class Form1 : Form {
    Recorder _recorder = new Recorder();
    string _lastFilePath;

    private void btnStart_Click(object sender, EventArgs e) {
        _lastFilePath = Path.Combine(Path.GetTempPath(), "recording.mp4");
        _recorder.Start(_lastFilePath);
        btnStart.Enabled = false;
        btnStop.Enabled = true;
    }

    private async void btnStop_Click(object sender, EventArgs e) {
        _recorder.Stop();
        btnStop.Enabled = false;
        
        // Gọi AI
        var ai = new GeminiService();
        var guide = await ai.GenerateGuideAsync(_lastFilePath);
        
        // Hiển thị kết quả (Sử dụng một control hỗ trợ Markdown)
        txtOutput.Text = guide;
        btnStart.Enabled = true;
    }
}
```

## 3. Chức năng Export PDF (C#)
Bạn có thể sử dụng thư viện `QuestPDF` hoặc `iTextSharp` để chuyển đổi nội dung Markdown/HTML thành PDF.

```csharp
using QuestPDF.Fluent;
// Ví dụ tạo PDF đơn giản
Document.Create(container => {
    container.Page(page => {
        page.Content().Text(txtOutput.Text);
    });
}).GeneratePdf("UserGuide.pdf");
```
