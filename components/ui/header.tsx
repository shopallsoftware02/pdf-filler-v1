"use client"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Menu, MoveRight, X, Languages, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"

interface Translation {
  home: string
  features: string
  contactUs: string
  pdfFormFiller: string
  getStarted: string
  featuresDescription: string
  contactDescription: string
}

const translations: Record<string, Translation> = {
  en: {
    home: "Home",
    features: "Features",
    contactUs: "Contact Us",
    pdfFormFiller: "PDF Form Filler",
    getStarted: "Get Started",
    featuresDescription: "Discover powerful PDF form filling capabilities",
    contactDescription: "Get in touch with our team for support",
  },
  fr: {
    home: "Accueil",
    features: "Fonctionnalités",
    contactUs: "Nous Contacter",
    pdfFormFiller: "Remplisseur de Formulaires PDF",
    getStarted: "Commencer",
    featuresDescription: "Découvrez les puissantes capacités de remplissage de formulaires PDF",
    contactDescription: "Contactez notre équipe pour obtenir de l'aide",
  },
}

interface HeaderProps {
  onLanguageChange?: (language: "en" | "fr") => void
  currentLanguage?: "en" | "fr"
}

function Header({ onLanguageChange, currentLanguage }: HeaderProps = {}) {
  const [isOpen, setOpen] = useState(false)
  const [language, setLanguage] = useState<"en" | "fr">(currentLanguage || "en")
  const { setTheme, theme } = useTheme()
  const t = translations[language]

  const handleLanguageChange = (newLanguage: "en" | "fr") => {
    setLanguage(newLanguage)
    onLanguageChange?.(newLanguage)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const navigationItems = [
    {
      title: t.home,
      href: "/",
      description: "",
    },
    {
      title: t.features,
      description: t.featuresDescription,
      items: [
        {
          title: "Auto Detection",
          href: "/features#auto-detection",
        },
        {
          title: "Field Filling",
          href: "/features#field-filling",
        },
        {
          title: "PDF Generation",
          href: "/features#pdf-generation",
        },
        {
          title: "Batch Processing",
          href: "/features#batch-processing",
        },
      ],
    },
    {
      title: t.contactUs,
      description: t.contactDescription,
      items: [
        {
          title: "Support",
          href: "/contact#support",
        },
        {
          title: "Sales",
          href: "/contact#sales",
        },
        {
          title: "Partnership",
          href: "/contact#partnership",
        },
      ],
    },
  ]

  return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container relative mx-auto min-h-16 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center">
        <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
          <NavigationMenu className="flex justify-start items-start">
            <NavigationMenuList className="flex justify-start gap-4 flex-row">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <>
                      <NavigationMenuLink asChild>
                        <Link href={item.href}>
                          <Button variant="ghost">{item.title}</Button>
                        </Link>
                      </NavigationMenuLink>
                    </>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="font-medium text-sm">{item.title}</NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[450px] p-4">
                        <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                          <div className="flex flex-col h-full justify-between">
                            <div className="flex flex-col">
                              <p className="text-base">{item.title}</p>
                              <p className="text-muted-foreground text-sm">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col text-sm h-full justify-end">
                            {item.items?.map((subItem) => (
                              <NavigationMenuLink asChild key={subItem.title}>
                                <Link
                                  href={subItem.href}
                                  className="flex flex-row justify-between items-center hover:bg-muted py-2 px-4 rounded"
                                >
                                  <span>{subItem.title}</span>
                                  <MoveRight className="w-4 h-4 text-muted-foreground" />
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex lg:justify-center">
          <Link href="/" className="font-semibold text-lg">
            {t.pdfFormFiller}
          </Link>
        </div>
        <div className="flex justify-end w-full gap-4 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hidden md:inline-flex"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLanguageChange(language === "en" ? "fr" : "en")}
            className="hidden md:inline-flex"
          >
            <Languages className="w-4 h-4 mr-2" />
            {language === "en" ? "FR" : "EN"}
          </Button>
          <Button>{t.getStarted}</Button>
        </div>
        <div className="flex w-12 shrink lg:hidden items-end justify-end">
          <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          {isOpen && (
            <div className="absolute top-16 border-t flex flex-col w-full right-0 bg-background shadow-lg py-4 container gap-8">
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="flex items-center"
                >
                  {theme === "light" ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                  {theme === "light" ? "Dark" : "Light"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLanguageChange(language === "en" ? "fr" : "en")}
                  className="flex items-center"
                >
                  <Languages className="w-4 h-4 mr-2" />
                  {language === "en" ? "Français" : "English"}
                </Button>
              </div>
              {navigationItems.map((item) => (
                <div key={item.title}>
                  <div className="flex flex-col gap-2">
                    {item.href ? (
                      <Link href={item.href} className="flex justify-between items-center">
                        <span className="text-lg">{item.title}</span>
                        <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                      </Link>
                    ) : (
                      <p className="text-lg">{item.title}</p>
                    )}
                    {item.items &&
                      item.items.map((subItem) => (
                        <Link key={subItem.title} href={subItem.href} className="flex justify-between items-center">
                          <span className="text-muted-foreground">{subItem.title}</span>
                          <MoveRight className="w-4 h-4 stroke-1" />
                        </Link>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export { Header }
