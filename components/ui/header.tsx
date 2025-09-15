"use client"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Menu, MoveRight, X, Languages, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "@/lib/translations"

interface HeaderProps {
  onLanguageChange?: (language: "en" | "fr") => void
  currentLanguage?: "en" | "fr"
}

function Header({ onLanguageChange, currentLanguage }: HeaderProps = {}) {
  const [isOpen, setOpen] = useState(false)
  const [language, setLanguage] = useState<"en" | "fr">(currentLanguage || "fr")
  const { setTheme, theme } = useTheme()
  const t = useTranslations(language)

  const handleLanguageChange = (newLanguage: "en" | "fr") => {
    setLanguage(newLanguage)
    onLanguageChange?.(newLanguage)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  // Handle home navigation - clears any session data and redirects to main page
  const handleHomeClick = () => {
    // Clear any current PDF session if user wants to go back to home
    // This will reset the app to the upload state
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  const navigationItems = [
    {
      title: t.home,
      href: "/",
      description: "",
      onClick: handleHomeClick,
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
                  <NavigationMenuLink asChild>
                    <Button 
                      variant="ghost" 
                      onClick={item.onClick}
                      className="transition-smooth hover:scale-105"
                    >
                      {item.title}
                    </Button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex lg:justify-center">
          <Button 
            variant="ghost" 
            onClick={handleHomeClick}
            className="font-semibold text-lg transition-smooth hover:scale-105 p-2"
          >
            {t.pdfFormFiller}
          </Button>
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
                  <Button 
                    variant="ghost" 
                    onClick={item.onClick}
                    className="flex justify-between items-center w-full transition-smooth hover:scale-105"
                  >
                    <span className="text-lg">{item.title}</span>
                    <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                  </Button>
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
