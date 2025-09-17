"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Save, 
  FolderOpen, 
  Download, 
  Upload
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/translations"

export interface ProfileData {
  output_dir: string
  filename_pattern: string
  aliases: Record<string, string>
  defaults: Record<string, string>
  field_organization: Record<string, string[]>
}

interface Category {
  id: string
  name: string
  fields: string[]
  isDefault?: boolean
}

interface ProfileManagerProps {
  currentFields: Record<string, string>
  categories: Category[]
  documentName: string
  onLoadProfile: (profileData: ProfileData) => void
  language?: "en" | "fr"
  className?: string
}

export function ProfileManager({ 
  currentFields, 
  categories, 
  documentName, 
  onLoadProfile, 
  language = "fr",
  className = ""
}: ProfileManagerProps) {
  const [profileName, setProfileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const t = useTranslations(language)

  const convertCategoriesToOrganization = (categories: Category[]): Record<string, string[]> => {
    const organization: Record<string, string[]> = {}
    categories.forEach(category => {
      organization[category.name] = [...category.fields]
    })
    return organization
  }

  const saveProfileAsJSON = () => {
    if (!profileName.trim()) {
      toast({
        title: "Error",
        description: t.enterProfileName,
        variant: "destructive"
      })
      return
    }

    const profileData: ProfileData = {
      output_dir: "",
      filename_pattern: `document_[client_name]_[date].pdf`,
      aliases: {}, // Could be expanded later for field name mapping
      defaults: { ...currentFields },
      field_organization: convertCategoriesToOrganization(categories)
    }

    // Create and download JSON file
    const dataStr = JSON.stringify(profileData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${profileName.trim().replace(/[^a-z0-9\s]/gi, '_')}_profile.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: t.profileSaved,
      description: `JSON: ${profileName.trim()}_profile.json`,
    })
    
    setProfileName("")
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.json')) {
      toast({
        title: "Error",
        description: "Veuillez sélectionner un fichier JSON valide",
        variant: "destructive"
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string
        const profileData: ProfileData = JSON.parse(jsonContent)
        
        // Validate that it has the required structure
        if (!profileData.defaults || typeof profileData.defaults !== 'object') {
          throw new Error('Invalid profile format: missing defaults')
        }

        onLoadProfile(profileData)
        
        toast({
          title: t.profileLoaded,
          description: `JSON: ${file.name}`,
        })
      } catch (error) {
        console.error('Error loading profile:', error)
        toast({
          title: "Erreur",
          description: "Fichier JSON invalide ou corrompu",
          variant: "destructive"
        })
      }
    }
    
    reader.onerror = () => {
      toast({
        title: "Erreur",
        description: "Impossible de lire le fichier",
        variant: "destructive"
      })
    }

    reader.readAsText(file)
    
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileImport = () => {
    fileInputRef.current?.click()
  }

  const filledFieldsCount = Object.values(currentFields).filter(v => v.trim() !== "").length
  const totalFieldsCount = Object.keys(currentFields).length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Profile Manager Section - Like Python App */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <User className="w-4 h-4" />
            <span>{t.profileManager}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Profile Name Input */}
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-sm font-medium">
              {t.profileName}
            </Label>
            <div className="flex space-x-2">
              <Input
                id="profile-name"
                placeholder={`${t.enterProfileName} (ex: FALCK BRYAN ${t.clientProfile})`}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveProfileAsJSON()}
                className="flex-1"
              />
              <Button 
                onClick={saveProfileAsJSON}
                size="sm"
                disabled={!profileName.trim() || totalFieldsCount === 0}
                className="bg-green-600 hover:bg-green-700 text-white px-4"
                title={t.saveProfileTooltip}
              >
                <Save className="w-4 h-4 mr-1" />
                {t.saveProfile}
              </Button>
            </div>
          </div>

          {/* Load Profile Section */}
          <div className="flex space-x-2">
            <Button 
              onClick={triggerFileImport}
              variant="outline" 
              size="sm"
              className="flex-1"
              title={t.loadProfileTooltip}
            >
              <FolderOpen className="w-4 h-4 mr-1" />
              {t.loadProfile}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={triggerFileImport}
              title="Importer un fichier JSON"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>

          {/* Profile Stats */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            JSON Export/Import • {filledFieldsCount}/{totalFieldsCount} {t.fields} {t.filled}
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-gray-600 space-y-2">
          <div>1. Remplissez les champs du formulaire</div>
          <div>2. Entrez un nom de profil et cliquez "Sauvegarder"</div>
          <div>3. Le fichier JSON sera téléchargé</div>
          <div>4. Plus tard, cliquez "Charger" pour importer un profil JSON</div>
        </CardContent>
      </Card>
    </div>
  )
}