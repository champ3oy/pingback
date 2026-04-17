"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  lang?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, lang = "json", showLineNumbers = true }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    codeToHtml(code, {
      lang,
      theme: "github-dark",
    }).then(setHtml);
  }, [code, lang]);

  if (!html) {
    // Fallback while shiki loads
    return (
      <pre className="text-xs font-mono p-3 overflow-auto">
        <code className="text-muted-foreground">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="shiki-wrapper text-xs overflow-auto [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_code]:!text-xs [&_code]:!leading-[1.4] [&_.line]:flex [&_span]:!leading-[1.4]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
