"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  language?: string;
  raw?: string;
}

export function CodeBlock({
  children,
  className,
  language = "text",
  raw,
  ...props
}: CodeBlockProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const copyToClipboard = React.useCallback(() => {
    if (!raw) return;
    navigator.clipboard.writeText(raw);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  }, [raw]);

  return (
    <div className="relative my-6 overflow-hidden rounded-lg border bg-zinc-950 ring-1 ring-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900/50 px-4 py-2.5">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={copyToClipboard}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            hasCopied ? "text-green-500" : "text-zinc-400"
          )}
        >
          {hasCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="sr-only">Copy code</span>
        </button>
      </div>
      <div className={cn("overflow-x-auto p-4", className)} {...props}>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: 0,
            background: "transparent",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
          codeTagProps={{
            style: {
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }
          }}
          PreTag="div"
          CodeTag="code"
          wrapLines={true}
          wrapLongLines={false} // Disable JS wrapping, rely on CSS
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
