"use client"

import { PDFUploader } from "@/components/pdf-uploader"
import { Header } from "@/components/ui/header"
import { PDFFooter } from "@/components/pdf-footer"
import { useState } from "react"

export default function Home() {
  const [language, setLanguage] = useState<"en" | "fr">("en")

  return (
    <>
      <Header onLanguageChange={setLanguage} currentLanguage={language} />
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              PDF Form Filler
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              Upload your PDF documents, automatically detect form fields, fill them out with ease, and generate
              completed PDFs instantly.
            </p>
          </div>

          <PDFUploader language={language} />
        </div>
      </main>
      <PDFFooter language={language} />
    </>
  )
}
