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
import { useToast } from "@/hooks/use-toast"

interface FieldEditorProps {
  pdfData: PDFParseResult
  originalFile: File
  onBack: () => void
  language?: "en" | "fr"
}

export function FieldEditor({ pdfData, originalFile, onBack, language = "en" }: FieldEditorProps) {
  const { toast } = useToast()
  
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

  // Render fields grouped by categories
  const renderFieldsByCategory = () => {
    if (categories.length === 0) {
      // No organization, show all fields
      return pdfData.fields.map(renderField)
    }

    // Group fields by categories
    return categories.map((category) => {
      if (category.fields.length === 0) return null
      
      return (
        <div key={category.id} className="mb-6">
          <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded-md">
            <FileText className="w-4 h-4 text-gray-600" />
            <h3 className="font-medium text-gray-800">{category.name}</h3>
            <span className="text-sm text-gray-500">({category.fields.length} fields)</span>
          </div>
          <div className="space-y-3 pl-6">
            {category.fields.map((fieldName: string) => {
              const field = pdfData.fields.find(f => f.name === fieldName)
              return field ? renderField(field) : null
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
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => updateFieldValue(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              className="focus:ring-primary focus:border-primary bg-white"
            />
          </div>
        )

      case "checkbox":
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value === "true"}
              onCheckedChange={(checked) => updateFieldValue(field.name, checked ? "true" : "false")}
            />
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        )

      case "select":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value} onValueChange={(newValue) => updateFieldValue(field.name, newValue)}>
              <SelectTrigger className="bg-white">
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
          <div key={field.name} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${field.name}-${option}`}
                    name={field.name}
                    value={option}
                    checked={value === option}
                    onChange={(e) => updateFieldValue(field.name, e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <Label htmlFor={`${field.name}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.name} ({field.type}){field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => updateFieldValue(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              className="bg-white"
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
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
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} size="sm" className="bg-transparent">
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button variant="outline" onClick={() => setShowFieldOrganizer(true)} size="sm" className="bg-transparent">
            <Settings className="w-4 h-4 mr-2" />
            {language === "fr" ? "Organiser" : "Organize"}
          </Button>
          <Button variant="outline" onClick={resetFields} size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isGenerating}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isGenerating ? "Generating..." : "Generate PDF"}
            <Download className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Fields Grid */}
      <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Form Fields */}
        <div className={showPreview ? 'space-y-6' : 'lg:col-span-2 space-y-6'}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Form Fields</span>
                </CardTitle>
                <Button variant="outline" onClick={clearAllFields} size="sm" className="text-xs bg-transparent">
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">{renderFieldsByCategory()}</CardContent>
          </Card>
        </div>

        {/* PDF Preview or Sidebar */}
        {showPreview ? (
          <div className="space-y-6">
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
                <CardTitle className="text-lg">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{pdfData.pageCount}</div>
                    <div className="text-xs text-muted-foreground">Pages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{pdfData.fields.length}</div>
                    <div className="text-xs text-muted-foreground">Fields</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{Math.round((filledFieldsCount / pdfData.fields.length) * 100)}%</div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Sidebar - Templates and Summary */
          <div className="space-y-6">
            <TemplateManager
              currentFields={fieldValues}
              documentName={pdfData.title || originalFile.name}
              onLoadTemplate={loadTemplate}
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
                      <span className="text-muted-foreground">Pages:</span>
                      <p className="font-medium">{pdfData.pageCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fields:</span>
                      <p className="font-medium">{pdfData.fields.length}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Progress:</span>
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
