"use client";

import { useState } from "react";

type ContentBlock = {
  platform: "公众号" | "微博" | "小红书";
  icon: string;
  label: string;
  badge: string;
  content: string;
  copied: boolean;
};

export default function Home() {
  const [topic, setTopic] = useState("");
  const [contents, setContents] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [maxTrials] = useState(3);
  const [exhausted, setExhausted] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setContents([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "生成失败，请重试");
      }

      const data = await res.json();

      if (data.remaining !== undefined) {
        setRemaining(data.remaining);
        if (data.remaining <= 0) {
          setExhausted(true);
        }
      }

      const blocks: ContentBlock[] = [
        {
          platform: "公众号",
          icon: "📝",
          label: "公众号长文",
          badge: "1500-2000字",
          content: data.wechat,
          copied: false,
        },
        {
          platform: "微博",
          icon: "🌐",
          label: "微博文案",
          badge: "200字以内",
          content: data.weibo,
          copied: false,
        },
        {
          platform: "小红书",
          icon: "📕",
          label: "小红书笔记",
          badge: "emoji风格",
          content: data.xiaohongshu,
          copied: false,
        },
      ];

      setContents(blocks);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const copyContent = async (index: number) => {
    const text = contents[index].content;
    try {
      await navigator.clipboard.writeText(text);
      setContents((prev) =>
        prev.map((c, i) => (i === index ? { ...c, copied: true } : c))
      );
      setTimeout(() => {
        setContents((prev) =>
          prev.map((c, i) => (i === index ? { ...c, copied: false } : c))
        );
      }, 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setContents((prev) =>
        prev.map((c, i) => (i === index ? { ...c, copied: true } : c))
      );
      setTimeout(() => {
        setContents((prev) =>
          prev.map((c, i) => (i === index ? { ...c, copied: false } : c))
        );
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-600 tracking-tight">
              🚀 创秒
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">一键内容工坊</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">剩余次数</div>
            <div className={`text-lg font-semibold ${remaining === null ? "text-gray-400" : remaining <= 0 ? "text-red-500" : "text-orange-500"}`}>
              {remaining === null ? "3" : remaining}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            一个主题，三种内容
          </h2>
          <p className="text-gray-500 text-sm">
            输入你想写的主题，AI 同时生成三个平台的内容，一键复制使用
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📌 输入你的内容主题
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
              placeholder="例如：AI时代如何提升职场竞争力"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button
              onClick={generate}
              disabled={loading || !topic.trim() || exhausted}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {exhausted ? (
                "试用已结束 🔒"
              ) : loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  生成中...
                </span>
              ) : (
                "🚀 开始生成"
              )}
            </button>
          </div>

          {/* Example topics */}
          <div className="mt-3 flex flex-wrap gap-2">
            {["AI副业赚钱", "职场沟通技巧", "读书心得", "产品测评"].map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-500 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {t}
                </button>
              )
            )}
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Results */}
        {contents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-400">✨ 生成完成</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {contents.map((block, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{block.icon}</span>
                    <span className="font-semibold text-gray-800 text-sm">
                      {block.label}
                    </span>
                    <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {block.badge}
                    </span>
                  </div>
                  <button
                    onClick={() => copyContent(i)}
                    className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all ${
                      block.copied
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {block.copied ? "✅ 已复制" : "📋 一键复制"}
                  </button>
                </div>

                {/* Content */}
                <div className="px-5 py-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                    {block.content}
                  </pre>
                </div>
              </div>
            ))}

            {/* Bottom tip */}
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">
                💡 复制内容后可以直接粘贴到对应平台发布
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {contents.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-300">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-sm">输入主题，开始创作吧</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-300">
        创秒 · 内容创作效率工具
      </footer>
    </div>
  );
}
