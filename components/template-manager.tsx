"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, FolderOpen, Trash2, Download } from "lucide-react"

interface FieldTemplate {
  id: string
  name: string
  fields: Record<string, string>
  createdAt: string
  documentName: string
}

interface TemplateManagerProps {
  currentFields: Record<string, string>
  documentName: string
  onLoadTemplate: (fields: Record<string, string>) => void
}

export function TemplateManager({ currentFields, documentName, onLoadTemplate }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<FieldTemplate[]>([])
  const [templateName, setTemplateName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem("pdf-form-templates")
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates))
      } catch (error) {
        console.error("Error loading templates:", error)
      }
    }
  }, [])

  // Save templates to localStorage whenever templates change
  useEffect(() => {
    localStorage.setItem("pdf-form-templates", JSON.stringify(templates))
  }, [templates])

  const saveTemplate = () => {
    if (!templateName.trim()) return

    const newTemplate: FieldTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      fields: { ...currentFields },
      createdAt: new Date().toISOString(),
      documentName,
    }

    setTemplates((prev) => [newTemplate, ...prev])
    setTemplateName("")
    setIsDialogOpen(false)
  }

  const loadTemplate = (template: FieldTemplate) => {
    onLoadTemplate(template.fields)
  }

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId))
  }

  const exportTemplate = (template: FieldTemplate) => {
    const dataStr = JSON.stringify(template, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${template.name.replace(/[^a-z0-9]/gi, "_")}_template.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filledFieldsCount = Object.values(currentFields).filter((v) => v.trim() !== "").length
  const totalFieldsCount = Object.keys(currentFields).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5" />
            <span>Templates</span>
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs bg-transparent">
                <Save className="w-3 h-3 mr-1" />
                Save Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Field Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  This will save {filledFieldsCount} of {totalFieldsCount} filled fields for "{documentName}".
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveTemplate} disabled={!templateName.trim()}>
                    Save Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No templates saved yet</p>
            <p className="text-sm">Save your current field values as a template for future use</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{template.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {template.documentName} • {Object.values(template.fields).filter((v) => v.trim()).length} fields •{" "}
                    {new Date(template.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => loadTemplate(template)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => exportTemplate(template)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTemplate(template.id)}
                    className="text-xs px-2 py-1 h-auto text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
