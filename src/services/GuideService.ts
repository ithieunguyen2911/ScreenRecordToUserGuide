import { GoogleGenAI } from "@google/genai";
import { UserGuide } from '../models';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    throw new Error("Vui lòng cấu hình GEMINI_API_KEY trong mục 'Secrets' để sử dụng tính năng AI.");
  }
  return new GoogleGenAI(apiKey);
}

export class GuideService {
  async generateUserGuide(videoBase64: string, mimeType: string): Promise<UserGuide> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

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
      "action": "click" | "type" | "scroll" | "wait" | "navigate"
    }
  ],
  "importantNotes": ["Lưu ý 1", "Lưu ý 2"]
}

Yêu cầu:
- Phân tích kỹ các hành động trong video.
- Timestamp phải chính xác thời điểm hành động xảy ra.
- Văn phong chuyên nghiệp, Tiếng Việt.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: videoBase64,
          mimeType: normalizedMimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as UserGuide;
  }

  async summarizeNotes(notes: string): Promise<string> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(
      `Hãy giúp tôi tóm tắt và làm đẹp các ghi chú sau đây thành một bản hướng dẫn sử dụng chuyên nghiệp bằng Markdown:\n\n${notes}`
    );
    const response = await result.response;
    return response.text();
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
}

export const guideService = new GuideService();