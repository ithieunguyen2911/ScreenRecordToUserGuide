import { GoogleGenAI } from "@google/genai";

import { UserGuide } from "../types";

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    throw new Error("Vui lòng cấu hình GEMINI_API_KEY trong mục Secrets để sử dụng tính năng AI.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateUserGuide(videoBase64: string, mimeType: string): Promise<UserGuide> {
  try {
    const genAI = getGenAI();
    const normalizedMimeType = mimeType.split(';')[0] || "video/webm";

    const prompt = `Bạn là một chuyên gia viết tài liệu hướng dẫn sử dụng (User Guide) chuyên nghiệp.
Dựa vào video quay màn hình này, hãy phân tích các hành động người dùng (click, gõ phím, cuộn chuột) và tạo một bản hướng dẫn chi tiết.

Hãy trả về JSON gồm: title, introduction, steps (timestamp, title, description, action, focus), importantNotes.
Mỗi step nên có focus: { x, y, width, height, label } theo phần trăm frame video để highlight vùng click/gõ/cuộn.
Văn phong chuyên nghiệp, Tiếng Việt.`;

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
  } catch (error) {
    console.error("Error generating guide:", error);
    throw error;
  }
}

export async function summarizeNotes(notes: string) {
  try {
    const genAI = getGenAI();
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Hãy giúp tôi tóm tắt và làm đẹp các ghi chú sau đây thành một bản hướng dẫn sử dụng chuyên nghiệp bằng Markdown:\n\n${notes}`,
    });
    return response.text ?? "";
  } catch (error) {
    console.error("Error summarizing notes:", error);
    throw error;
  }
}
