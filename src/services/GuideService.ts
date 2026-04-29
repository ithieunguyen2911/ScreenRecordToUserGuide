import { GoogleGenAI } from "@google/genai";
import { UserGuide } from '../models';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    throw new Error("Vui lòng cấu hình GEMINI_API_KEY trong mục Secrets để sử dụng tính năng AI.");
  }
  return new GoogleGenAI({ apiKey });
}

export class GuideService {
  hasConfiguredApiKey(): boolean {
    const apiKey = process.env.GEMINI_API_KEY;
    return Boolean(apiKey && apiKey !== "MY_GEMINI_API_KEY");
  }

  async generateUserGuide(videoBase64: string, mimeType: string): Promise<UserGuide> {
    const genAI = getGenAI();
    const normalizedMimeType = mimeType.split(';')[0] || "video/webm";

    const prompt = `Bạn là một chuyên gia viết tài liệu hướng dẫn sử dụng (User Guide) chuyên nghiệp.
Dựa vào video quay màn hình này, hãy phân tích các hành động người dùng (click, gõ phím, cuộn chuột) và tạo một bản hướng dẫn chi tiết.

Hãy trả về kết quả theo định dạng JSON với cấu trúc sau:
{
  "title": "Tiêu đề hướng dẫn",
  "introduction": "Giới thiệu ngắn gọn",
  "steps": [
    {
      "timestamp": số giây (ví dụ: 5.5),
      "title": "Tên bước thực hiện",
      "description": "Mô tả chi tiết hành động",
      "action": "click" | "type" | "scroll" | "wait" | "navigate",
      "focus": {
        "x": phần trăm từ mép trái ảnh 0-100,
        "y": phần trăm từ mép trên ảnh 0-100,
        "width": chiều rộng vùng cần highlight theo phần trăm,
        "height": chiều cao vùng cần highlight theo phần trăm,
        "label": "Click here" | "Type here" | "Scroll" | mô tả ngắn
      }
    }
  ],
  "importantNotes": ["Lưu ý 1", "Lưu ý 2"]
}

Yêu cầu:
- Phân tích kỹ các hành động trong video.
- Timestamp phải chính xác thời điểm hành động xảy ra.
- Với mỗi bước click/gõ/cuộn, ước lượng vùng UI cần focus trong frame tại timestamp bằng tọa độ phần trăm.
- Văn phong chuyên nghiệp, Tiếng Việt.`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: videoBase64,
            mimeType: normalizedMimeType,
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("AI không trả về nội dung hướng dẫn.");
    }
    return JSON.parse(text) as UserGuide;
  }

  async summarizeNotes(notes: string): Promise<string> {
    const genAI = getGenAI();
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Hãy giúp tôi tóm tắt và làm đẹp các ghi chú sau đây thành một bản hướng dẫn sử dụng chuyên nghiệp bằng Markdown:\n\n${notes}`,
    });
    return response.text ?? "";
  }

  async addScreenshotsToGuide(videoBlob: Blob, guide: UserGuide): Promise<UserGuide> {
    const steps = [];
    for (const step of guide.steps) {
      steps.push({
        ...step,
        screenshot: step.screenshot ?? await this.captureFrame(videoBlob, step.timestamp),
      });
    }

    return {
      ...guide,
      steps,
    };
  }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private captureFrame(videoBlob: Blob, timestamp: number): Promise<string | undefined> {
    return new Promise(resolve => {
      if (typeof document === 'undefined') {
        resolve(undefined);
        return;
      }

      const url = URL.createObjectURL(videoBlob);
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'metadata';

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.remove();
      };

      video.onerror = () => {
        cleanup();
        resolve(undefined);
      };

      video.onloadedmetadata = () => {
        const safeTimestamp = Number.isFinite(timestamp)
          ? Math.min(Math.max(timestamp, 0), Math.max(video.duration - 0.1, 0))
          : 0;
        video.currentTime = safeTimestamp;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const context = canvas.getContext('2d');
          if (!context) {
            cleanup();
            resolve(undefined);
            return;
          }
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const screenshot = canvas.toDataURL('image/jpeg', 0.85);
          cleanup();
          resolve(screenshot);
        } catch {
          cleanup();
          resolve(undefined);
        }
      };

      video.src = url;
    });
  }
}

export const guideService = new GuideService();
