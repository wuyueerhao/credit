"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/common/docs/code-block";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  const components: Partial<Components> = {
    code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : undefined;
      const isInline = !match && !String(children).includes("\n");

      if (isInline) {
        return (
          <code
            className={cn(
              "rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
              className
            )}
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <CodeBlock
          language={language}
          raw={String(children).replace(/\n$/, "")}
          className={className}
          {...props}
        >
          {children}
        </CodeBlock>
      );
    },
    blockquote: ({ className, children, ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => {

      return (
        <blockquote
          className={cn(
            "mt-6 border-l-4 pl-6 italic text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 py-3 pr-4 rounded-r-lg",
            className
          )}
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    table: ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
      <div className="my-6 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
      </div>
    ),
    thead: ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className={cn("[&_tr]:border-b bg-zinc-100/50 dark:bg-zinc-800/50", className)} {...props} />
    ),
    tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr
        className={cn(
          "border-b transition-colors hover:bg-zinc-50/50 data-[state=selected]:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:data-[state=selected]:bg-zinc-800 even:bg-zinc-50/30 dark:even:bg-zinc-900/30",
          className
        )}
        {...props}
      />
    ),
    th: ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
      <th
        className={cn(
          "h-12 px-4 text-left align-middle font-semibold text-zinc-900 dark:text-zinc-100 [&:has([role=checkbox])]:pr-0",
          className
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
      <td
        className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0 text-zinc-700 dark:text-zinc-300", className)}
        {...props}
      />
    ),
    h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className={cn("scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl mb-8", className)} {...props} />
    ),
    h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight mt-12 mb-6 border-b pb-2 border-zinc-200 dark:border-zinc-800", className)} {...props} />
    ),
    h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className={cn("scroll-m-20 text-xl font-semibold tracking-tight mt-8 mb-4", className)} {...props} />
    ),
    h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className={cn("scroll-m-20 text-base font-semibold tracking-tight mt-6 mb-2", className)} {...props} />
    ),
    p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className={cn("leading-7 [&:not(:first-child)]:mt-6 text-zinc-700 dark:text-zinc-300", className)} {...props} />
    ),
    ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2 marker:text-zinc-400 dark:marker:text-zinc-500", className)} {...props} />
    ),
    ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2 marker:text-zinc-600 dark:marker:text-zinc-400", className)} {...props} />
    ),
    li: ({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
      <li className={cn("text-zinc-700 dark:text-zinc-300", className)} {...props} />
    ),
    hr: ({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className={cn("my-8 border-t border-zinc-200 dark:border-zinc-800", className)} {...props} />
    ),
  };

  return (
    <article className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
};
