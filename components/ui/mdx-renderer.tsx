"use client"

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface MDXRendererProps {
  source: MDXRemoteSerializeResult
  lastUpdated?: string
}

const components = {
  h1: ({ children, ...props }: any) => (
    <h1
      id={children
        ?.toString()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")}
      className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6 scroll-mt-24"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2
      id={children
        ?.toString()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")}
      className="text-2xl font-bold text-gray-900 dark:text-white mb-4 mt-8 scroll-mt-24"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3
      id={children
        ?.toString()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")}
      className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6 scroll-mt-24"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-gray-900 dark:text-white" {...props}>
      {children}
    </strong>
  ),
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 mb-4" {...props}>
      {children}
    </blockquote>
  ),
}

export function MDXRenderer({ source, lastUpdated }: MDXRendererProps) {
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 lg:p-8">
        {lastUpdated && (
          <div className="mb-6">
            <Badge variant="outline" className="mb-4">
              Last Updated: {lastUpdated}
            </Badge>
            <Separator />
          </div>
        )}
        <div className="mdx-content">
          <MDXRemote {...source} components={components} />
        </div>
      </div>
    </div>
  )
}