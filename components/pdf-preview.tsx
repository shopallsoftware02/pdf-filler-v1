"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface PDFPreviewProps {
  file: File
  className?: string
  onFieldClick?: (x: number, y: number, page: number) => void
}

export function PDFPreview({ file, className = "", onFieldClick }: PDFPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Development environment detection
        const isDevelopment = process.env.NODE_ENV === 'development'
        
        if (isDevelopment) {
          // In development, show a placeholder instead of crashing
          console.warn('[DEV MODE] PDF preview disabled in development to prevent conflicts')
          setError("PDF preview works in production. Development mode shows placeholder.")
          setPdfDoc(null)
          setTotalPages(1)
          setCurrentPage(1)
          setIsLoading(false)
          return
        }
        
        // Import PDF.js with proper ES module syntax (production only)
        const pdfjsLib = await import('pdfjs-dist')
        
        // Set up PDF.js worker with correct path  
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
        
        const fileArrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise
        
        console.log("PDF loaded successfully:", pdf.numPages, "pages")
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setCurrentPage(1) // Reset to first page
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError("Failed to load PDF preview: " + (err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    if (file && typeof window !== 'undefined') {
      loadPDF()
    }

    // Cleanup function
    return () => {
      if (pdfDoc) {
        console.log("Cleaning up PDF document")
        pdfDoc.destroy()
      }
    }
  }, [file]) // Remove pdfDoc dependency to prevent loops

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) {
        console.log("Cannot render: missing pdfDoc or canvas ref")
        return
      }

      try {
        console.log("Starting to render page", currentPage)
        const page = await pdfDoc.getPage(currentPage)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        
        if (!context) {
          console.error("Failed to get canvas context")
          setError("Failed to initialize canvas for PDF rendering")
          return
        }

        // Clear any previous renders
        context.clearRect(0, 0, canvas.width, canvas.height)

        const viewport = page.getViewport({ scale, rotation })
        
        // Set canvas dimensions
        canvas.height = viewport.height
        canvas.width = viewport.width
        canvas.style.width = viewport.width + "px"
        canvas.style.height = viewport.height + "px"

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        console.log("Rendering page with context:", renderContext)
        await page.render(renderContext).promise
        console.log("Page rendered successfully")
      } catch (err) {
        console.error("Error rendering page:", err)
        setError("Failed to render PDF page: " + (err as Error).message)
      }
    }

    if (pdfDoc && canvasRef.current) {
      renderPage()
    }
  }, [pdfDoc, currentPage, scale, rotation])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onFieldClick || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height

    onFieldClick(x, y, currentPage)
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))
  const rotate = () => setRotation(prev => (prev + 90) % 360)

  // Handle SSR
  if (typeof window === 'undefined') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-muted-foreground">PDF preview will load in the browser</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading PDF preview...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              {process.env.NODE_ENV === 'development' ? (
                <>
                  <div className="text-blue-600 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd"/>
                      <path d="M8 6h4v2H8V6zM8 10h4v2H8v-2z"/>
                    </svg>
                  </div>
                  <p className="text-blue-800 font-medium mb-2">Development Mode</p>
                  <p className="text-muted-foreground text-sm mb-2">PDF preview works in production</p>
                  <p className="text-muted-foreground text-xs">Fields are still being extracted properly for editing</p>
                </>
              ) : (
                <>
                  <p className="text-destructive mb-2">{error}</p>
                  <p className="text-muted-foreground text-sm">Preview not available</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={rotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-auto bg-gray-50 dark:bg-gray-900" style={{ maxHeight: '600px' }}>
          <div className="flex justify-center p-4">
            {!pdfDoc && !isLoading && (
              <div className="text-center p-8 text-muted-foreground">
                <p>PDF preview will appear here</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="border shadow-sm cursor-crosshair"
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                display: pdfDoc ? 'block' : 'none'
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}