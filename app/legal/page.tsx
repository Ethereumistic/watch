import { Suspense } from "react"
import { getAllLegalDocuments } from "@/lib/mdx-utils"
import { LegalPageClient } from "./legal-page-client"
import { serialize } from "next-mdx-remote/serialize"

export default async function LegalPage() {
  const docs = getAllLegalDocuments()

  const serializedDocs = await Promise.all(
    docs.map(async (doc) => {
      const serializedContent = await serialize(doc.content)
      return {
        ...doc,
        content: serializedContent,
      }
    }),
  )

  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <LegalPageClient legalDocuments={serializedDocs} />
    </Suspense>
  )
}