"use client"

import { PDFUploader } from "@/components/pdf-uploader"
import { Header } from "@/components/ui/header"
import { PDFFooter } from "@/components/pdf-footer"
import { useState } from "react"
import { useTranslations } from "@/lib/translations"

export default function Home() {
  const [language, setLanguage] = useState<"en" | "fr">("fr")
  const t = useTranslations(language)

  return (
    <>
      <Header onLanguageChange={setLanguage} currentLanguage={language} />
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4 animate-slide-up">
              {t.mainTitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty animate-slide-up" style={{animationDelay: '200ms'}}>
              {t.mainDescription}
            </p>
          </div>

          <div className="animate-fade-in" style={{animationDelay: '400ms'}}>
            <PDFUploader language={language} />
          </div>
        </div>
      </main>
      <PDFFooter language={language} />
    </>
  )
}
