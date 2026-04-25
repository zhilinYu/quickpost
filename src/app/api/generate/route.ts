import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.OPENAI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const MODEL = process.env.OPENAI_MODEL || "qwen-turbo";

const SYSTEM_PROMPT = `你是一位专业的内容创作助手，擅长为不同平台创作优质内容。
用户会给你一个主题，你需要同时生成三部分内容：

1. **公众号长文**（1500-2000字）：结构完整、语言生动，适合公众号发布
2. **微博文案**（200字以内）：简洁有力，带话题标签，适合微博传播
3. **小红书笔记**：emoji风格，亲切有趣，适合小红书社区

请严格按照以下格式输出，不要添加任何额外说明：

【公众号】
[这里是公众号长文内容]

【微博】
[这里是微博文案]

【小红书】
[这里是小红书笔记]`;

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "未配置 API Key 环境变量。请在 .env.local 文件中设置 OPENAI_API_KEY"
    );
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("API error:", response.status, errText);
    throw new Error(`AI API 调用失败: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function parseContent(raw: string): {
  wechat: string;
  weibo: string;
  xiaohongshu: string;
} {
  const wechatMatch = raw.match(/【公众号】([\s\S]*?)(?=【微博】|$)/);
  const weiboMatch = raw.match(/【微博】([\s\S]*?)(?=【小红书】|$)/);
  const xhsMatch = raw.match(/【小红书】([\s\S]*?)$/);

  return {
    wechat: (wechatMatch?.[1] ?? "").trim(),
    weibo: (weiboMatch?.[1] ?? "").trim(),
    xiaohongshu: (xhsMatch?.[1] ?? "").trim(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "请输入有效的主题" },
        { status: 400 }
      );
    }

    const prompt = `请为以下主题创作三部分内容：${topic.trim()}`;
    const raw = await callAI(prompt);

    if (!raw) {
      return NextResponse.json(
        { error: "AI 返回内容为空，请重试" },
        { status: 500 }
      );
    }

    const parsed = parseContent(raw);

    // Fallback if parsing failed
    if (!parsed.wechat && !parsed.weibo && !parsed.xiaohongshu) {
      const lines = raw.split("\n\n");
      if (lines.length >= 3) {
        parsed.wechat = lines.slice(0, -2).join("\n\n");
        parsed.weibo = lines[lines.length - 2] ?? "";
        parsed.xiaohongshu = lines[lines.length - 1] ?? "";
      } else {
        parsed.wechat = raw;
        parsed.weibo = "查看完整内容";
        parsed.xiaohongshu = "查看完整内容";
      }
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("Generate error:", err);
    const message = err instanceof Error ? err.message : "服务器内部错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
