"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Upload, 
  FolderOpen,
  Save,
  X,
  Settings,
  GripVertical,
  MoveRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { PDFField } from "@/lib/pdf-parser"

interface Category {
  id: string
  name: string
  fields: string[]
  isDefault?: boolean
  isReadonly?: boolean
}

interface OrganizationModel {
  pdf_name: string
  pdf_path: string
  organization: Record<string, string[]>
  created_at: string
  model_name: string
}

interface FieldOrganizerProps {
  fields: PDFField[]
  language: "en" | "fr"
  onClose: () => void
  pdfName: string
  onApplyOrganization?: (categories: Category[]) => void
}

const translations = {
  en: {
    organizeFields: "Organize Fields",
    categoryManagement: "Category Management",
    newCategory: "New Category",
    deleteCategory: "Delete Category",
    renameCategory: "Rename Category",
    allFields: "All Fields",
    notAssigned: "Not Assigned",
    fieldsInCategory: "Fields in",
    selectCategory: "Select a category on the left, then fields below",
    moveUp: "Move Up",
    moveDown: "Move Down",
    moveTo: "Move to...",
    createCategory: "Create Category",
    categoryName: "Category Name",
    cancel: "Cancel",
    create: "Create",
    rename: "Rename",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this category?",
    enterCategoryName: "Enter category name",
    close: "Close",
    fields: "fields",
    selected: "selected",
    saveModel: "Save Model",
    loadModel: "Load Model",
    exportModel: "Export Model",
    importModel: "Import Model",
    modelName: "Model Name",
    organizationModels: "Organization Models",
    chooseModel: "Choose an organization model:",
    modelNameCol: "Model Name",
    originalPdf: "Original PDF",
    categories: "Categories", 
    fieldsCount: "Fields",
    apply: "Apply",
    reset: "Reset",
    overview: "Overview Mode",
    dragDrop: "Drag fields between categories or use the buttons below",
    noModels: "No saved models found",
    modelSaved: "Organization model saved successfully",
    modelLoaded: "Organization model loaded successfully",
    modelError: "Error with organization model",
    pdfMismatch: "This model was created for a different PDF",
    organizationModel: "Organization Model",
    selectFields: "Select fields to organize",
    moveSelectedFields: "Move Selected Fields",
    confirmOrganization: "Apply Organization",
    organizationApplied: "Organization applied successfully",
  },
  fr: {
    organizeFields: "Organiser les champs",
    categoryManagement: "Gestion des catégories",
    newCategory: "Nouvelle catégorie",
    deleteCategory: "Supprimer catégorie", 
    renameCategory: "Renommer catégorie",
    allFields: "Tous les champs",
    notAssigned: "Non assigné",
    fieldsInCategory: "Champs dans",
    selectCategory: "Sélectionnez une catégorie à gauche, puis des champs ci-dessous",
    moveUp: "Monter",
    moveDown: "Descendre",
    moveTo: "Déplacer vers...",
    createCategory: "Créer catégorie",
    categoryName: "Nom de la catégorie",
    cancel: "Annuler",
    create: "Créer",
    rename: "Renommer",
    delete: "Supprimer",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cette catégorie ?",
    enterCategoryName: "Entrez le nom de la catégorie",
    close: "Fermer",
    fields: "champs",
    selected: "sélectionnés",
    saveModel: "Sauver modèle",
    loadModel: "Charger modèle",
    exportModel: "Exporter modèle",
    importModel: "Importer modèle",
    modelName: "Nom du modèle",
    organizationModels: "Modèles d'organisation",
    chooseModel: "Choisir un modèle d'organisation:",
    modelNameCol: "Nom du modèle",
    originalPdf: "PDF d'origine",
    categories: "Catégories",
    fieldsCount: "Champs", 
    apply: "Appliquer",
    reset: "Réinitialiser",
    overview: "Mode aperçu",
    dragDrop: "Glissez les champs entre catégories ou utilisez les boutons ci-dessous",
    noModels: "Aucun modèle sauvegardé trouvé",
    modelSaved: "Modèle d'organisation sauvegardé avec succès",
    modelLoaded: "Modèle d'organisation chargé avec succès",
    modelError: "Erreur avec le modèle d'organisation",
    pdfMismatch: "Ce modèle a été créé pour un PDF différent",
    organizationModel: "Modèle d'Organisation",
    selectFields: "Sélectionnez des champs à organiser",
    moveSelectedFields: "Déplacer les champs sélectionnés",
    confirmOrganization: "Appliquer l'organisation",
    organizationApplied: "Organisation appliquée avec succès",
  },
}

export function FieldOrganizer({ fields, language, onClose, pdfName, onApplyOrganization }: FieldOrganizerProps) {
  const t = translations[language]
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize with default categories
  const [categories, setCategories] = useState<Category[]>(() => {
    // Load existing categories from localStorage
    const savedCategories = localStorage.getItem(`pdf-categories-${pdfName}`)
    if (savedCategories) {
      try {
        const parsed = JSON.parse(savedCategories) as Category[]
        return parsed
      } catch (e) {
        console.error('Error loading categories:', e)
      }
    }
    
    // Default categories if none exist
    return [
      {
        id: "not-assigned", 
        name: t.notAssigned,
        fields: fields.map(f => f.name),
        isDefault: true,
        isReadonly: false
      }
    ]
  })

  const [selectedCategory, setSelectedCategory] = useState<string>("not-assigned")
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [draggedField, setDraggedField] = useState<string | null>(null)
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [isSaveModelDialogOpen, setIsSaveModelDialogOpen] = useState(false)
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState("")
  const [categoryToRename, setCategoryToRename] = useState<string>("")
  const [modelName, setModelName] = useState("")
  const [savedModels, setSavedModels] = useState<OrganizationModel[]>([])

  // Save categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`pdf-categories-${pdfName}`, JSON.stringify(categories))
  }, [categories, pdfName])

  // Apply organization and close
  const applyOrganization = () => {
    if (onApplyOrganization) {
      onApplyOrganization(categories)
    }
    toast({
      title: t.organizationApplied,
      description: "Categories have been applied to your form fields.",
    })
    onClose()
  }

  // Load saved models from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pdf-organization-models')
    if (saved) {
      try {
        setSavedModels(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading models:', error)
      }
    }
  }, [])

  // Update category names when language changes
  useEffect(() => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === "not-assigned") {
        return { ...cat, name: t.notAssigned }
      }
      return cat
    }))
  }, [language, t.notAssigned])

  // Helper function to get field's current category
  const getFieldCategory = (fieldName: string): string => {
    for (const category of categories) {
      if (category.id !== "all-fields" && category.fields.includes(fieldName)) {
        return category.name
      }
    }
    return t.notAssigned
  }

  // Create new category
  const createCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: newCategoryName.trim(),
      fields: [],
      isDefault: false,
      isReadonly: false
    }

    setCategories(prev => [...prev, newCategory])
    setNewCategoryName("")
    setIsCreateDialogOpen(false)
    
    toast({
      title: "Category Created",
      description: `Category "${newCategoryName}" has been created.`,
    })
  }

  // Delete category
  const deleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category || category.isDefault) return

    if (confirm(t.confirmDelete)) {
      // Move fields back to "not assigned"
      const notAssignedCategory = categories.find(c => c.id === "not-assigned")
      if (notAssignedCategory) {
        setCategories(prev => prev
          .map(cat => {
            if (cat.id === "not-assigned") {
              return { ...cat, fields: [...cat.fields, ...category.fields] }
            }
            return cat
          })
          .filter(cat => cat.id !== categoryId)
        )
      }

      if (selectedCategory === categoryId) {
        setSelectedCategory("not-assigned")
      }

      toast({
        title: "Category Deleted",
        description: `Category "${category.name}" has been deleted and its fields moved to "Not Assigned".`,
      })
    }
  }

  // Rename category
  const renameCategory = () => {
    if (!newCategoryName.trim() || !categoryToRename) return

    setCategories(prev => prev.map(cat => 
      cat.id === categoryToRename 
        ? { ...cat, name: newCategoryName.trim() }
        : cat
    ))

    setNewCategoryName("")
    setCategoryToRename("")
    setIsRenameDialogOpen(false)

    toast({
      title: "Category Renamed",
      description: `Category has been renamed to "${newCategoryName}".`,
    })
  }

  // Move fields between categories
  const moveFieldsToCategory = (fieldNames: string[], targetCategoryId: string) => {
    if (targetCategoryId === "all-fields") return // Cannot move to all-fields

    setCategories(prev => prev.map(cat => {
      if (cat.id === targetCategoryId) {
        // Add fields to target category
        const newFields = [...cat.fields, ...fieldNames.filter(f => !cat.fields.includes(f))]
        return { ...cat, fields: newFields }
      } else if (cat.id !== "all-fields") {
        // Remove fields from other categories (except all-fields)
        return { ...cat, fields: cat.fields.filter(f => !fieldNames.includes(f)) }
      }
      return cat
    }))

    setSelectedFields([])
  }

  // Field ordering functions
  const moveFieldUp = (fieldName: string) => {
    if (selectedCategory === "all-fields") return
    
    setCategories(prev => prev.map(cat => {
      if (cat.id === selectedCategory) {
        const fieldIndex = cat.fields.indexOf(fieldName)
        if (fieldIndex > 0) {
          const newFields = [...cat.fields]
          const temp = newFields[fieldIndex]
          newFields[fieldIndex] = newFields[fieldIndex - 1]
          newFields[fieldIndex - 1] = temp
          return { ...cat, fields: newFields }
        }
      }
      return cat
    }))
  }

  const moveFieldDown = (fieldName: string) => {
    if (selectedCategory === "all-fields") return
    
    setCategories(prev => prev.map(cat => {
      if (cat.id === selectedCategory) {
        const fieldIndex = cat.fields.indexOf(fieldName)
        if (fieldIndex >= 0 && fieldIndex < cat.fields.length - 1) {
          const newFields = [...cat.fields]
          const temp = newFields[fieldIndex]
          newFields[fieldIndex] = newFields[fieldIndex + 1]
          newFields[fieldIndex + 1] = temp
          return { ...cat, fields: newFields }
        }
      }
      return cat
    }))
  }

  // Drag and drop handlers
  const handleDragStart = (fieldName: string) => {
    setDraggedField(fieldName)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault()
    if (draggedField && targetCategoryId !== "all-fields") {
      moveFieldsToCategory([draggedField], targetCategoryId)
      setDraggedField(null)
    }
  }

  // Save organization model
  const saveModel = () => {
    if (!modelName.trim()) return

    const organization: Record<string, string[]> = {}
    categories.forEach(cat => {
      if (cat.id !== "all-fields") {
        organization[cat.name] = [...cat.fields]
      }
    })

    const model: OrganizationModel = {
      pdf_name: pdfName,
      pdf_path: "", // We don't have the full path in the web app
      organization,
      created_at: new Date().toISOString(),
      model_name: modelName.trim()
    }

    const updatedModels = [...savedModels, model]
    setSavedModels(updatedModels)
    localStorage.setItem('pdf-organization-models', JSON.stringify(updatedModels))

    setModelName("")
    setIsSaveModelDialogOpen(false)

    toast({
      title: t.modelSaved,
      description: `Model "${modelName}" has been saved.`,
    })
  }

  // Load organization model
  const loadModel = (model: OrganizationModel) => {
    if (model.pdf_name !== pdfName) {
      toast({
        title: t.modelError,
        description: t.pdfMismatch,
        variant: "destructive",
      })
      return
    }

    // Reset to default categories
    const newCategories: Category[] = [
      {
        id: "all-fields",
        name: t.allFields,
        fields: fields.map(f => f.name),
        isDefault: true,
        isReadonly: true
      },
      {
        id: "not-assigned",
        name: t.notAssigned,
        fields: [],
        isDefault: true,
        isReadonly: false
      }
    ]

    // Add custom categories from model
    Object.entries(model.organization).forEach(([categoryName, fieldNames]) => {
      if (categoryName !== t.notAssigned && categoryName !== "Non assigné") {
        newCategories.push({
          id: `category-${Date.now()}-${categoryName}`,
          name: categoryName,
          fields: fieldNames.filter(name => fields.some(f => f.name === name)),
          isDefault: false,
          isReadonly: false
        })
      } else {
        // Update not-assigned with model data
        const notAssignedCategory = newCategories.find(c => c.id === "not-assigned")
        if (notAssignedCategory) {
          notAssignedCategory.fields = fieldNames.filter(name => fields.some(f => f.name === name))
        }
      }
    })

    setCategories(newCategories)
    setIsModelDialogOpen(false)
    setSelectedCategory("not-assigned")

    toast({
      title: t.modelLoaded,
      description: `Model "${model.model_name}" has been loaded.`,
    })
  }

  // Export model to JSON file
  const exportModel = () => {
    const organization: Record<string, string[]> = {}
    categories.forEach(cat => {
      if (cat.id !== "all-fields") {
        organization[cat.name] = [...cat.fields]
      }
    })

    const model: OrganizationModel = {
      pdf_name: pdfName,
      pdf_path: "",
      organization,
      created_at: new Date().toISOString(),
      model_name: `${pdfName}_organization_${new Date().toISOString().split('T')[0]}`
    }

    const dataStr = JSON.stringify(model, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${pdfName}_organization.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast({
      title: "Model Exported",
      description: "Organization model has been exported successfully.",
    })
  }

  // Import model from JSON file
  const importModel = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const model: OrganizationModel = JSON.parse(e.target?.result as string)
        loadModel(model)
      } catch (error) {
        toast({
          title: t.modelError,
          description: "Invalid JSON file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    event.target.value = ""
  }

  const selectedCategoryData = categories.find(c => c.id === selectedCategory)
  const availableTargetCategories = categories.filter(c => c.id !== selectedCategory && c.id !== "all-fields")

  return (
    <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center animate-fade-in">
      <div className="w-full h-full bg-white flex flex-col animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-white shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center space-x-3 text-xl font-semibold">
              <Settings className="w-6 h-6" />
              <span>{t.organizeFields}</span>
            </h1>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 hover:scale-110 rounded-lg transition-transform-smooth cursor-pointer group"
            >
              <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors-smooth" />
            </button>
          </div>
        </div>

        {/* Organization Model Management */}
        <div className="px-6 py-3 border-b bg-gray-50 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">{t.organizationModel}</h2>
            <div className="flex space-x-2">
              <input
                type="file"
                accept=".json"
                onChange={importModel}
                className="hidden"
                id="import-model"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('import-model')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.importModel}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportModel}
                disabled={categories.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                {t.exportModel}
              </Button>
            </div>
          </div>
        </div>

        {/* Category Management */}
        <div className="px-6 py-3 border-b bg-white shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">{t.categoryManagement}</h2>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.newCategory}
              </Button>

              {selectedCategory !== "not-assigned" && selectedCategory !== "all-fields" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCategoryToRename(selectedCategory)
                      setNewCategoryName(selectedCategoryData?.name || "")
                      setIsRenameDialogOpen(true)
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t.renameCategory}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteCategory(selectedCategory)}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.deleteCategory}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* Left Panel - Categories */}
          <div className="w-80 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b bg-white">
              <h3 className="font-medium">{t.categories}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("all-fields")}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between text-sm",
                    selectedCategory === "all-fields"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <span>{t.allFields}</span>
                  <Badge variant="secondary" className="text-xs">
                    {fields.length}
                  </Badge>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between text-sm",
                      selectedCategory === category.id
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.fields.length}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Fields */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {selectedCategory === "all-fields" 
                    ? `${t.fieldsInCategory} '${t.allFields}'`
                    : `${t.fieldsInCategory} '${selectedCategoryData?.name || t.allFields}'`
                  }
                </h3>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="px-2 py-1">
                    {selectedCategory === "all-fields" ? fields.length : selectedCategoryData?.fields.length || 0} {t.fields}
                  </Badge>
                  {selectedFields.length > 0 && (
                    <Badge variant="secondary" className="px-2 py-1">
                      {selectedFields.length} {t.selected}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              {/* Fields List */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedCategory === "all-fields" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {fields.map((field) => {
                      const fieldCategory = categories.find((cat) => cat.fields.includes(field.name))
                      return (
                        <div
                          key={field.name}
                          className="p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col space-y-2">
                            <span className="font-medium text-sm truncate">{field.name}</span>
                            <div className="flex flex-col space-y-1">
                              <Badge variant="outline" className="text-xs w-fit">
                                {field.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs w-fit">
                                {fieldCategory?.name || t.notAssigned}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCategoryData?.fields.map((fieldName, index) => {
                      const field = fields.find((f) => f.name === fieldName)
                      if (!field) return null

                      return (
                        <div
                          key={fieldName}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200",
                            selectedFields.includes(fieldName)
                              ? "bg-blue-50 border-blue-300"
                              : "bg-white hover:bg-gray-50 border-gray-200",
                          )}
                          onClick={() => {
                            setSelectedFields((prev) =>
                              prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName],
                            )
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-sm">{fieldName}</span>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            {selectedCategory !== "not-assigned" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    moveFieldUp(fieldName)
                                  }}
                                  disabled={index === 0}
                                  className="h-7 w-7 p-0 hover:bg-gray-200 hover:scale-110 transition-all duration-150 cursor-pointer"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    moveFieldDown(fieldName)
                                  }}
                                  disabled={index === (selectedCategoryData?.fields.length || 0) - 1}
                                  className="h-7 w-7 p-0 hover:bg-gray-200 hover:scale-110 transition-all duration-150 cursor-pointer"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Actions Panel */}
              {selectedCategory !== "all-fields" && (
                <div className="w-64 border-l bg-gray-50 p-4">
                  <h4 className="font-medium text-sm mb-3">{t.moveSelectedFields}</h4>
                  {selectedFields.length > 0 ? (
                    <div className="space-y-2">
                      {availableTargetCategories.map((category) => (
                        <Button
                          key={category.id}
                          size="sm"
                          variant="outline"
                          onClick={() => moveFieldsToCategory(selectedFields, category.id)}
                          className="w-full justify-start h-9 text-left"
                        >
                          <MoveRight className="w-3 h-3 mr-2" />
                          <span className="text-sm truncate">{category.name}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">{t.selectFields}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="px-6 py-4 border-t bg-gray-50 shrink-0">
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="transition-transform-smooth hover:scale-105 hover:shadow-md"
            >
              {t.cancel}
            </Button>
            <Button 
              onClick={applyOrganization} 
              className="bg-blue-600 hover:bg-blue-700 text-white transition-smooth hover:scale-105 hover:shadow-lg"
            >
              {t.confirmOrganization}
            </Button>
          </div>
        </div>

        {/* Simple Modal Dialogs */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-white rounded-lg p-6 w-96 animate-scale-in">
              <h3 className="text-lg font-semibold mb-4">{t.createCategory}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.categoryName}</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={t.enterCategoryName}
                    onKeyDown={(e) => e.key === "Enter" && createCategory()}
                    className="w-full px-3 py-2 border rounded-md transition-colors-smooth focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="transition-transform-smooth hover:scale-105"
                  >
                    {t.cancel}
                  </Button>
                  <Button 
                    onClick={createCategory} 
                    disabled={!newCategoryName.trim()}
                    className="transition-transform-smooth hover:scale-105 disabled:hover:scale-100"
                  >
                    {t.create}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isRenameDialogOpen && (
          <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center animate-fade-in">
            <div className="bg-white rounded-lg p-6 w-96 animate-scale-in">
              <h3 className="text-lg font-semibold mb-4">{t.renameCategory}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.categoryName}</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={t.enterCategoryName}
                    onKeyDown={(e) => e.key === "Enter" && renameCategory()}
                    className="w-full px-3 py-2 border rounded-md transition-colors-smooth focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRenameDialogOpen(false)}
                    className="transition-transform-smooth hover:scale-105"
                  >
                    {t.cancel}
                  </Button>
                  <Button 
                    onClick={renameCategory} 
                    disabled={!newCategoryName.trim()}
                    className="transition-transform-smooth hover:scale-105 disabled:hover:scale-100"
                  >
                    {t.rename}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}