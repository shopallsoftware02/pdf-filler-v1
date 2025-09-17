"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, FileText, Loader2, RotateCcw, Settings, Eye } from "lucide-react"
import type { PDFParseResult } from "@/lib/pdf-parser"
import { fillPDFFields } from "@/lib/pdf-parser"
import { TemplateManager } from "./template-manager"
import { FieldOrganizer } from "./field-organizer"
import { PDFPreview } from "./pdf-preview"
import { ProfileManager, type ProfileData } from "./profile-manager"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/translations"

interface FieldEditorProps {
  pdfData: PDFParseResult
  originalFile: File
  onBack: () => void
  language?: "en" | "fr"
}

export function FieldEditor({ pdfData, originalFile, onBack, language = "fr" }: FieldEditorProps) {
  const { toast } = useToast()
  const t = useTranslations(language)
  
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize field values from localStorage or defaults
  useEffect(() => {
    const storageKey = `pdf-field-values-${originalFile.name}`
    
    const savedValues = localStorage.getItem(storageKey)
    
    const initial: Record<string, string> = {}
    
    if (savedValues) {
      try {
        const parsed = JSON.parse(savedValues)
        
        // Initialize with saved values where available, defaults otherwise
        pdfData.fields.forEach((field) => {
          initial[field.name] = parsed[field.name] || field.value || ""
        })
      } catch (e) {
        console.error('Error loading saved values:', e)
        // Fallback to default values
        pdfData.fields.forEach((field) => {
          initial[field.name] = field.value || ""
        })
      }
    } else {
      // No saved values, use defaults
      pdfData.fields.forEach((field) => {
        initial[field.name] = field.value || ""
      })
    }
    
    setFieldValues(initial)
    setIsInitialized(true)
  }, [pdfData.fields, originalFile.name])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Save field values to localStorage whenever they change (but only after initialization)
  useEffect(() => {
    if (!isInitialized) return
    
    const storageKey = `pdf-field-values-${originalFile.name}`
    localStorage.setItem(storageKey, JSON.stringify(fieldValues))
  }, [fieldValues, originalFile.name, isInitialized])

  const [categories, setCategories] = useState<any[]>(() => {
    // Try to load saved categories from localStorage
    const savedCategories = localStorage.getItem(`pdf-categories-${originalFile.name}`)
    if (savedCategories) {
      try {
        return JSON.parse(savedCategories)
      } catch (e) {
        console.error('Error loading saved categories:', e)
      }
    }
    return []
  })
  const [showFieldOrganizer, setShowFieldOrganizer] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Handle organization changes from the organizer
  const handleApplyOrganization = (newCategories: any[]) => {
    setCategories(newCategories)
    // Save categories to localStorage
    localStorage.setItem(`pdf-categories-${originalFile.name}`, JSON.stringify(newCategories))
  }
  const [originalValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    pdfData.fields.forEach((field) => {
      initial[field.name] = field.value || ""
    })
    return initial
  })

  const updateFieldValue = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const resetFields = () => {
    setFieldValues({ ...originalValues })
  }

  const clearAllFields = () => {
    const clearedValues: Record<string, string> = {}
    Object.keys(fieldValues).forEach((key) => {
      clearedValues[key] = ""
    })
    setFieldValues(clearedValues)
  }

  // Handle profile loading
  const handleLoadProfile = (profileData: ProfileData) => {
    // Load field values
    const updatedValues = { ...fieldValues }
    Object.entries(profileData.defaults).forEach(([fieldName, value]) => {
      if (fieldName in updatedValues) {
        updatedValues[fieldName] = value
      }
    })
    setFieldValues(updatedValues)

    // Load field organization if available
    if (profileData.field_organization) {
      const newCategories = Object.entries(profileData.field_organization).map(([categoryName, fields], index) => ({
        id: `category-${index + 1}`,
        name: categoryName,
        fields: fields.filter(fieldName => pdfData.fields.some(f => f.name === fieldName))
      }))
      setCategories(newCategories)
      localStorage.setItem(`pdf-categories-${originalFile.name}`, JSON.stringify(newCategories))
    }
  }

  // Render fields grouped by categories
  const renderFieldsByCategory = () => {
    if (categories.length === 0) {
      // No organization, show all fields
      return pdfData.fields.map(renderField)
    }

    // Group fields by categories
    return categories.map((category, index) => {
      if (category.fields.length === 0) return null
      
      return (
        <div key={category.id} className="mb-6 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
          <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded-md transition-colors-smooth hover:bg-gray-100 group">
            <FileText className="w-4 h-4 text-gray-600 group-hover:text-gray-800 transition-colors-smooth" />
            <h3 className="font-medium text-gray-800 group-hover:text-gray-900 transition-colors-smooth">{category.name}</h3>
            <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors-smooth">({category.fields.length} {t.fields})</span>
          </div>
          <div className="space-y-3 pl-6">
            {category.fields.map((fieldName: string, fieldIndex: number) => {
              const field = pdfData.fields.find(f => f.name === fieldName)
              return field ? (
                <div key={fieldName} className="animate-slide-up" style={{animationDelay: `${(index * 100) + (fieldIndex * 50)}ms`}}>
                  {renderField(field)}
                </div>
              ) : null
            })}
          </div>
        </div>
      )
    })
  }

  const loadTemplate = (templateFields: Record<string, string>) => {
    // Only load fields that exist in the current PDF
    const updatedValues = { ...fieldValues }
    Object.entries(templateFields).forEach(([fieldName, value]) => {
      if (fieldName in updatedValues) {
        updatedValues[fieldName] = value
      }
    })
    setFieldValues(updatedValues)
  }

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      const filledPDFBytes = await fillPDFFields(originalFile, fieldValues)

      // Create download link
      const blob = new Blob([new Uint8Array(filledPDFBytes)], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `filled_${originalFile.name}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Show success message
      toast({
        title: "PDF Generated Successfully",
        description: "Your filled PDF has been downloaded.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      
      let errorMessage = "Failed to generate PDF. Please try again."
      if (error instanceof Error) {
        if (error.message.includes("field")) {
          errorMessage = "Failed to fill some fields. Please check your input values and try again."
        } else if (error.message.includes("memory")) {
          errorMessage = "The PDF file is too large to process. Please try with a smaller file."
        }
      }
      
      toast({
        title: "Error Generating PDF",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const renderField = (field: any) => {
    const value = fieldValues[field.name] || ""

    switch (field.type) {
      case "text":
        return (
          <div key={field.name} className="space-y-2 animate-fade-in">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => updateFieldValue(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              className="transition-colors-smooth focus:ring-2 focus:ring-primary focus:border-primary bg-white hover:border-gray-400"
            />
          </div>
        )

      case "checkbox":
        return (
          <div key={field.name} className="flex items-center space-x-2 animate-fade-in">
            <Checkbox
              id={field.name}
              checked={value === "true"}
              onCheckedChange={(checked) => updateFieldValue(field.name, checked ? "true" : "false")}
              className="transition-colors-smooth"
            />
            <Label htmlFor={field.name} className="text-sm font-medium cursor-pointer">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        )

      case "select":
        return (
          <div key={field.name} className="space-y-2 animate-fade-in">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(newValue) => updateFieldValue(field.name, newValue)}>
              <SelectTrigger className="bg-white transition-colors-smooth hover:border-gray-400 focus:ring-2 focus:ring-primary">
                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "radio":
        return (
          <div key={field.name} className="space-y-2 animate-fade-in">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2 group">
                  <input
                    type="radio"
                    id={`${field.name}-${option}`}
                    name={field.name}
                    value={option}
                    checked={value === option}
                    onChange={(e) => updateFieldValue(field.name, e.target.value)}
                    className="text-primary focus:ring-primary transition-colors-smooth"
                  />
                  <Label htmlFor={`${field.name}-${option}`} className="text-sm cursor-pointer group-hover:text-primary transition-colors-smooth">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2 animate-fade-in">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name} ({field.type}){field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => updateFieldValue(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              className="bg-white transition-colors-smooth hover:border-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        )
    }
  }

  const filledFieldsCount = Object.values(fieldValues).filter((v) => v.trim() !== "").length

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading form data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="p-2 transition-transform-smooth hover:scale-110 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-balance">Fill PDF Form</h2>
            <p className="text-muted-foreground">
              {pdfData.title} • {pdfData.fields.length} fields detected • {filledFieldsCount} filled
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)} 
            size="sm" 
            className="bg-transparent transition-smooth hover:scale-105 hover:shadow-md"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? t.hidePreview : t.showPreview}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFieldOrganizer(true)} 
            size="sm" 
            className="bg-transparent transition-smooth hover:scale-105 hover:shadow-md"
          >
            <Settings className="w-4 h-4 mr-2" />
            {t.organize}
          </Button>
          <Button 
            variant="outline" 
            onClick={resetFields} 
            size="sm"
            className="transition-smooth hover:scale-105 hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t.reset}
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-smooth hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
          >
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isGenerating ? t.generating : t.generatePdf}
            <Download className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Fields Grid */}
      <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'} animate-fade-in`}>
        {/* Form Fields */}
        <div className={showPreview ? 'space-y-6' : 'lg:col-span-2 space-y-6'}>
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{t.formFields}</span>
                </CardTitle>
                <Button 
                  variant="outline" 
                  onClick={clearAllFields} 
                  size="sm" 
                  className="text-xs bg-transparent transition-smooth hover:scale-105 hover:shadow-md"
                >
                  {t.clearAll}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">{renderFieldsByCategory()}</CardContent>
          </Card>
        </div>

        {/* PDF Preview or Sidebar */}
        {showPreview ? (
          <div className="space-y-6 animate-slide-up">
            <PDFPreview 
              file={originalFile} 
              className="w-full"
              onFieldClick={(x, y, page) => {
                console.log(`Clicked at position (${x}, ${y}) on page ${page}`)
                // Future: highlight corresponding field
              }}
            />
            
            {/* Compact Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.documentSummary}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{pdfData.pageCount}</div>
                    <div className="text-xs text-muted-foreground">{t.pages}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{pdfData.fields.length}</div>
                    <div className="text-xs text-muted-foreground">{t.fields}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{Math.round((filledFieldsCount / pdfData.fields.length) * 100)}%</div>
                    <div className="text-xs text-muted-foreground">{t.progress}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Sidebar - Profile Manager, Templates and Summary */
          <div className="space-y-6">
            {/* Profile Manager - New section at top like Python app */}
            <ProfileManager
              currentFields={fieldValues}
              categories={categories}
              documentName={pdfData.title || originalFile.name}
              onLoadProfile={handleLoadProfile}
              language={language}
            />

            <TemplateManager
              currentFields={fieldValues}
              documentName={pdfData.title || originalFile.name}
              onLoadTemplate={loadTemplate}
              language={language}
            />

            <Card>
              <CardHeader>
                <CardTitle>Document Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Document:</span>
                    <p className="font-medium truncate">{pdfData.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">{t.pages}:</span>
                      <p className="font-medium">{pdfData.pageCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t.fields}:</span>
                      <p className="font-medium">{pdfData.fields.length}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.progress}:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all"
                          style={{ width: `${(filledFieldsCount / pdfData.fields.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {Math.round((filledFieldsCount / pdfData.fields.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Field Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(pdfData.fields.map((f) => f.type))).map((type) => (
                      <span key={type} className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Field Organizer Dialog */}
      {showFieldOrganizer && (
        <FieldOrganizer 
          fields={pdfData.fields} 
          language={language} 
          onClose={() => setShowFieldOrganizer(false)} 
          pdfName={originalFile.name}
          onApplyOrganization={handleApplyOrganization}
        />
      )}
    </div>
  )
}
