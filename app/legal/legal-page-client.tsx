"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MDXRenderer } from "@/components/ui/mdx-renderer"
import { TableOfContents } from "@/components/ui/table-of-contents"
import { Shield, Eye, Scale, FileText, ChevronRight, Menu, X } from "lucide-react"
import Link from "next/link"
import type { LegalDocument } from "@/lib/mdx-utils"
import type { MDXRemoteSerializeResult } from "next-mdx-remote"

export type SerializedLegalDocument = Omit<LegalDocument, "content"> & {
  content: MDXRemoteSerializeResult
}

const tabIcons = {
  "community-guidelines": Shield,
  "privacy-policy": Eye,
  "terms-of-service": Scale,
  "safety-center": FileText,
}

interface LegalPageClientProps {
  legalDocuments: SerializedLegalDocument[]
}

export function LegalPageClient({ legalDocuments }: LegalPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("community-guidelines")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && legalDocuments.find((doc) => doc.slug === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams, legalDocuments])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", value)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const currentDocument = legalDocuments.find((doc) => doc.slug === activeTab)

  return (
    <div className="bg-gradient">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 ">
        {/* <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Legal Documents</h1>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div> */}
      </div>

      <div className="flex  pt-12">
        {/* Mobile Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Legal Documents</p>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {legalDocuments.map((doc) => {
                  const Icon = tabIcons[doc.slug as keyof typeof tabIcons]
                  const isActive = activeTab === doc.slug
                  return (
                    <Button
                      key={doc.slug}
                      variant="ghost"
                      onClick={() => {
                        handleTabChange(doc.slug)
                        setSidebarOpen(false)
                      }}
                      className={`w-full justify-start h-auto p-4 ${
                        isActive ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : ""
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{doc.description}</div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <Link href="/" className="hover:text-gray-900 dark:hover:text-gray-100">
                  Home
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span>Legal</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">Legal Documents</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Important information about using watch.fun safely and legally
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 ">
              {/* Content Area */}
              <div className="xl:col-span-3 ">
                <Tabs value={activeTab} onValueChange={handleTabChange} >
                  {/* Desktop Tab List */}
                  <div className="hidden md:block ">
                    <TabsList className="grid w-full grid-cols-4 mb-8">
                      {legalDocuments.map((doc) => {
                        const Icon = tabIcons[doc.slug as keyof typeof tabIcons]
                        return (
                          <TabsTrigger key={doc.slug} value={doc.slug} className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{doc.title}</span>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>
                  </div>

                  {/* Mobile Tab List */}
                  <div className="flex md:hidden ">
                    {/* 1. Add `flex` to make the Tabs component a flex container */}
                    <Tabs 
                      value={activeTab} 
                      onValueChange={setActiveTab} 
                      orientation="vertical" 
                      className="w-full"
                    >
                      {/* 2. Change to `flex-col` and remove conflicting classes */}
                      <TabsList className="flex flex-col h-auto mx-auto w-full">
                        {legalDocuments.map((doc) => {
                          const Icon = tabIcons[doc.slug as keyof typeof tabIcons];
                          return (
                            <TabsTrigger
                              key={doc.slug}
                              value={doc.slug}
                              // Add justify-start to align content to the left
                              className="flex items-center gap-2 whitespace-nowrap justify-start m-1"
                            >
                              <Icon className="h-4 w-4" />
                              {doc.title}
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>

                      {/* Your <TabsContent> components would go here, next to the list */}

                    </Tabs>
                  </div>

                  {/* Tab Content */}
                  {legalDocuments.map((doc) => (
                    <TabsContent key={doc.slug} value={doc.slug} className="mt-0">
                      <MDXRenderer source={doc.content} lastUpdated={doc.lastUpdated} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Table of Contents - Desktop Only */}
              <div className="hidden xl:block">
                {currentDocument && <TableOfContents headings={currentDocument.headings} />}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">
                  Questions about our policies?{" "}
                  <a href="mailto:legal@watch.fun" className="text-blue-600 hover:underline">
                    Contact us at legal@watch.fun
                  </a>
                </p>
                <p>Last updated: January 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
