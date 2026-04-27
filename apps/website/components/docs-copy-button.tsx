"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

const MAX_CLAUDE_URL_CONTENT_LENGTH = 6000;

function getArticleText(): string {
  const article = document.querySelector("article");
  if (!article) return "";
  return article.innerText ?? "";
}

function getGitHubUrl(pathname: string): string {
  return `https://github.com/runpingback/pingback/blob/main/apps/website/app${pathname}/page.mdx`;
}

function ClipboardIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function DocsCopyButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleCopyPage() {
    const text = getArticleText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setOpen(false);
  }

  function handleViewMarkdown() {
    const url = getGitHubUrl(pathname);
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function handleOpenInClaude() {
    let content = getArticleText();
    if (content.length > MAX_CLAUDE_URL_CONTENT_LENGTH) {
      content = content.slice(0, MAX_CLAUDE_URL_CONTENT_LENGTH);
    }
    const query = `I have a question about this Pingback docs page:\n\n${content}`;
    const url = `https://claude.ai/new?q=${encodeURIComponent(query)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      {/* Main button + chevron split */}
      <div className="inline-flex items-stretch rounded border border-white/10 bg-white/5 text-xs text-white/50 hover:text-white/80 transition-colors overflow-hidden">
        {/* Main action: copy */}
        <button
          onClick={handleCopyPage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 transition-colors"
          title="Copy page as markdown"
        >
          {copied ? <CheckIcon /> : <ClipboardIcon />}
          <span>{copied ? "Copied!" : "Copy page"}</span>
        </button>

        {/* Divider */}
        <div className="w-px bg-white/10" />

        {/* Chevron toggle */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center px-1.5 hover:bg-white/5 transition-colors"
          title="More options"
          aria-expanded={open}
        >
          <ChevronDownIcon />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-md border border-white/10 shadow-xl overflow-hidden"
          style={{ background: "#181818" }}
        >
          <button
            onClick={handleCopyPage}
            className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors group"
          >
            <span className="mt-0.5 text-white/40 group-hover:text-white/70 transition-colors">
              <ClipboardIcon />
            </span>
            <span>
              <span className="block text-xs font-medium text-white/80">
                Copy page
              </span>
              <span className="block text-xs text-white/40 mt-0.5">
                Copy content as markdown
              </span>
            </span>
          </button>

          <div className="border-t border-white/5" />

          <button
            onClick={handleViewMarkdown}
            className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors group"
          >
            <span className="mt-0.5 text-white/40 group-hover:text-white/70 transition-colors">
              <ExternalLinkIcon />
            </span>
            <span>
              <span className="block text-xs font-medium text-white/80">
                View as Markdown
              </span>
              <span className="block text-xs text-white/40 mt-0.5">
                Open raw MDX source on GitHub
              </span>
            </span>
          </button>

          <div className="border-t border-white/5" />

          <button
            onClick={handleOpenInClaude}
            className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors group"
          >
            <span className="mt-0.5 text-white/40 group-hover:text-white/70 transition-colors">
              <SparkleIcon />
            </span>
            <span>
              <span className="block text-xs font-medium text-white/80">
                Open in Claude
              </span>
              <span className="block text-xs text-white/40 mt-0.5">
                Ask Claude about this page
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
