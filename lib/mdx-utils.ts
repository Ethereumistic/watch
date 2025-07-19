import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface Heading {
  id: string
  text: string
  level: number
}

export interface LegalDocument {
  slug: string
  title: string
  description: string
  content: string
  headings: Heading[]
  lastUpdated: string
}

const contentDirectory = path.join(process.cwd(), "content")

export function getAllLegalDocuments(): LegalDocument[] {
  const documents = [
    {
      slug: "community-guidelines",
      title: "Community Guidelines",
      description: "Rules and guidelines for using watch.fun safely",
      filename: "community-guidelines.mdx",
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      description: "How we collect, use, and protect your data",
      filename: "privacy-policy.mdx",
    },
    {
      slug: "terms-of-service",
      title: "Terms of Service",
      description: "Legal agreement for using our service",
      filename: "terms-of-service.mdx",
    },
    {
      slug: "safety-center",
      title: "Safety Center",
      description: "Safety tools, resources, and support",
      filename: "safety-center.mdx",
    },
  ]

  return documents.map((doc) => {
    const fullPath = path.join(contentDirectory, doc.filename)
    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { content } = matter(fileContents)

    // Extract headings from markdown content
    const headings = extractHeadings(content)

    return {
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      content,
      headings,
      lastUpdated: "January 2024",
    }
  })
}

function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Heading[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()

    headings.push({
      id,
      text,
      level,
    })
  }

  return headings
}

export function getLegalDocument(slug: string): LegalDocument | null {
  const documents = getAllLegalDocuments()
  return documents.find((doc) => doc.slug === slug) || null
}
