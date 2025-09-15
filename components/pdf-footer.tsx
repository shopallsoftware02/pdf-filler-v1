"use client"

import { Footer } from "@/components/ui/footer"
import { FileText, Github, Twitter } from "lucide-react"

interface Translation {
  about: string
  blog: string
  contact: string
  privacy: string
  terms: string
  copyright: string
  allRightsReserved: string
}

const footerTranslations: Record<string, Translation> = {
  en: {
    about: "About",
    blog: "Blog",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
    copyright: "© 2025 PDF Form Filler",
    allRightsReserved: "All rights reserved",
  },
  fr: {
    about: "À Propos",
    blog: "Blog",
    contact: "Contact",
    privacy: "Confidentialité",
    terms: "Conditions",
    copyright: "© 2025 Remplisseur de Formulaires PDF",
    allRightsReserved: "Tous droits réservés",
  },
}

interface PDFFooterProps {
  language: "en" | "fr"
}

export function PDFFooter({ language }: PDFFooterProps) {
  const t = footerTranslations[language]

  return (
    <Footer
      logo={<FileText className="h-10 w-10" />}
      brandName="PDF Form Filler"
      socialLinks={[
        {
          icon: <Twitter className="h-5 w-5" />,
          href: "https://twitter.com",
          label: "Twitter",
        },
        {
          icon: <Github className="h-5 w-5" />,
          href: "https://github.com",
          label: "GitHub",
        },
      ]}
      mainLinks={[
        { href: "/", label: t.about },
        { href: "/", label: t.blog },
        { href: "/", label: t.contact },
      ]}
      legalLinks={[
        { href: "/", label: t.privacy },
        { href: "/", label: t.terms },
      ]}
      copyright={{
        text: t.copyright,
        license: t.allRightsReserved,
      }}
    />
  )
}
