"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { parsePDFFields, type PDFParseResult } from "@/lib/pdf-parser"
import { FieldEditor } from "./field-editor"

interface UploadedFile {
  file: File
  preview: string
}

interface PDFSession {
  fileName: string
  fileSize: number
  fileType: string
  pdfData: PDFParseResult
  uploadTime: number
}

interface PDFUploaderProps {
  language?: "en" | "fr"
}

export function PDFUploader({ language = "en" }: PDFUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pdfData, setPdfData] = useState<PDFParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRestoringSession, setIsRestoringSession] = useState(true)

  // Restore session on component mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const sessionData = localStorage.getItem('pdf-session')
        if (sessionData) {
          const session: PDFSession = JSON.parse(sessionData)
          
          // Check if session is still valid (less than 24 hours old)
          const sessionAge = Date.now() - session.uploadTime
          const maxAge = 24 * 60 * 60 * 1000 // 24 hours
          
          if (sessionAge < maxAge) {
            console.log('Restoring PDF session:', session.fileName)
            
            // Try to restore the file from localStorage
            const fileData = localStorage.getItem(`pdf-file-${session.fileName}`)
            if (fileData) {
              // Convert base64 back to File
              const byteCharacters = atob(fileData)
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              const restoredFile = new File([byteArray], session.fileName, { type: session.fileType })
              
              setUploadedFile({
                file: restoredFile,
                preview: URL.createObjectURL(restoredFile)
              })
              setPdfData(session.pdfData)
              console.log('Session restored successfully')
            }
          } else {
            // Session expired, clear it
            localStorage.removeItem('pdf-session')
            localStorage.removeItem(`pdf-file-${session.fileName}`)
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error)
        localStorage.removeItem('pdf-session')
      } finally {
        setIsRestoringSession(false)
      }
    }
    
    restoreSession()
  }, [])

  // Save session when PDF is successfully processed
  const saveSession = async (file: File, pdfData: PDFParseResult) => {
    try {
      // Convert file to base64 for storage
      const fileReader = new FileReader()
      fileReader.onloadend = () => {
        const base64Data = btoa(fileReader.result as string)
        
        const session: PDFSession = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          pdfData: pdfData,
          uploadTime: Date.now()
        }
        
        localStorage.setItem('pdf-session', JSON.stringify(session))
        localStorage.setItem(`pdf-file-${file.name}`, base64Data)
        console.log('Session saved successfully')
      }
      fileReader.readAsBinaryString(file)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.")
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size exceeds 10MB limit. Please upload a smaller file.")
      return
    }

    setUploadedFile({
      file,
      preview: URL.createObjectURL(file),
    })
    setError(null)
    setPdfData(null)

    setIsProcessing(true)

    try {
      const result = await parsePDFFields(file)
      setPdfData(result)

      if (result.fields.length === 0) {
        setError("No form fields detected in this PDF. Please ensure the PDF contains fillable form fields.")
      } else {
        // Save session after successful processing
        await saveSession(file, result)
      }
    } catch (err) {
      console.error("PDF processing error:", err)
      let errorMessage = "Failed to process PDF"
      
      if (err instanceof Error) {
        if (err.message.includes("No form fields detected")) {
          errorMessage = err.message
        } else if (err.message.includes("Invalid PDF") || err.message.includes("corrupted")) {
          errorMessage = "The uploaded file appears to be corrupted or is not a valid PDF document."
        } else if (err.message.includes("password") || err.message.includes("encrypted")) {
          errorMessage = "This PDF is password-protected. Please upload an unprotected PDF file."
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  })

  // Clear session when going back
  const clearSession = () => {
    try {
      const sessionData = localStorage.getItem('pdf-session')
      if (sessionData) {
        const session: PDFSession = JSON.parse(sessionData)
        localStorage.removeItem('pdf-session')
        localStorage.removeItem(`pdf-file-${session.fileName}`)
      }
    } catch (error) {
      console.error('Error clearing session:', error)
    }
    setPdfData(null)
  }

  const removeFile = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview)
      setUploadedFile(null)
      setPdfData(null)
      setError(null)
    }
  }

  const processFile = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await parsePDFFields(uploadedFile.file)
      setPdfData(result)

      if (result.fields.length === 0) {
        setError("No form fields detected in this PDF. Please ensure the PDF contains fillable form fields.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process PDF")
    } finally {
      setIsProcessing(false)
    }
  }

  // Show loading while restoring session
  if (isRestoringSession) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Restoring your session...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show field editor if we have PDF data
  if (pdfData && uploadedFile) {
    return (
      <div className="max-w-6xl mx-auto">
        <FieldEditor
          pdfData={pdfData}
          originalFile={uploadedFile.file}
          onBack={clearSession}
          language={language}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!uploadedFile ? (
        <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-8">
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center space-y-4 cursor-pointer rounded-lg p-8 transition-all",
                "bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10",
                isDragActive && "from-primary/10 to-secondary/10 scale-[1.02]",
              )}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  {isDragActive ? "Drop your PDF here" : "Upload PDF Document"}
                </h3>
                <p className="text-muted-foreground mb-4">Drag and drop your PDF file here, or click to browse</p>
                <Button variant="outline" className="border-primary/20 hover:bg-primary/5 bg-transparent">
                  Choose File
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Supports PDF files up to 10MB</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{uploadedFile.file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-lg">Detecting form fields...</span>
                </div>
              </div>
            )}

            {!isProcessing && !pdfData && (
              <div className="flex gap-3">
                <Button
                  onClick={processFile}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  Detect Fields
                </Button>
                <Button variant="outline" onClick={removeFile}>
                  Upload Different File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
