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
        
        // Dynamic import only when needed
        const pdfjsLib = await import('pdfjs-dist')
        
        // Set up PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
        
        const fileArrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise
        
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError("Failed to load PDF preview")
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
        pdfDoc.destroy()
      }
    }
  }, [file, pdfDoc])

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return

      try {
        const page = await pdfDoc.getPage(currentPage)
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        
        if (!context) return

        const viewport = page.getViewport({ scale, rotation })
        
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }

        await page.render(renderContext).promise
      } catch (err) {
        console.error("Error rendering page:", err)
        setError("Failed to render PDF page")
      }
    }

    renderPage()
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
              <p className="text-destructive mb-2">{error}</p>
              <p className="text-muted-foreground text-sm">Preview not available</p>
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
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="border shadow-sm cursor-crosshair"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}