// Dynamic imports for PDF libraries to prevent SSR issues
// import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from "pdf-lib"

export interface PDFField {
  name: string
  type: "text" | "checkbox" | "radio" | "select" | "signature"
  value: string
  required: boolean
  options?: string[] // For select/radio fields
  page: number
  rect: [number, number, number, number] // [x, y, width, height]
  // Field usage tracking
  usageCount?: number // How many times this field appears in the PDF
  pages?: number[] // All pages where this field appears
}

export interface PDFParseResult {
  fields: PDFField[]
  pageCount: number
  title?: string
}

export async function parsePDFFields(file: File): Promise<PDFParseResult> {
  try {
    console.log("[v0] Starting PDF parsing for file:", file.name)

    const fileBuffer = await file.arrayBuffer()
    console.log("[v0] File loaded, size:", fileBuffer.byteLength, "bytes")

    console.log("[v0] Loading PDF with pdf-lib...")
    
    // Dynamic import to prevent SSR issues
    const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } = await import("pdf-lib")
    
    const pdfDoc = await PDFDocument.load(fileBuffer)
    const form = pdfDoc.getForm()
    const formFields = form.getFields()

    console.log("[v0] Found", formFields.length, "form fields")

    const fields: PDFField[] = []

    // Extract field information
    for (const field of formFields) {
      const fieldName = field.getName()
      console.log("[v0] Processing field:", fieldName, "Type:", field.constructor.name)

      let fieldType: PDFField["type"] = "text"
      let options: string[] | undefined

      // Determine field type using instanceof checks
      if (field instanceof PDFTextField) {
        fieldType = "text"
      } else if (field instanceof PDFCheckBox) {
        fieldType = "checkbox"
      } else if (field instanceof PDFRadioGroup) {
        fieldType = "radio"
        // Get radio button options
        try {
          const radioGroup = field as any
          options = radioGroup.getOptions?.() || []
        } catch (e) {
          console.warn("[v0] Could not get radio options:", e)
        }
      } else if (field instanceof PDFDropdown) {
        fieldType = "select"
        try {
          const dropdown = field as any
          options = dropdown.getOptions?.() || []
        } catch (e) {
          console.warn("[v0] Could not get dropdown options:", e)
        }
      } else if (field.constructor.name.includes("PDFSignature")) {
        fieldType = "signature"
      }

      // Get field value
      let value = ""
      try {
        if (fieldType === "checkbox") {
          const checkbox = field as any
          value = checkbox.isChecked?.() ? "true" : "false"
        } else if (fieldType === "text") {
          const textField = field as any
          value = textField.getText?.() || ""
        } else if (fieldType === "select" || fieldType === "radio") {
          const selectField = field as any
          value = selectField.getSelected?.() || ""
        }
      } catch (e) {
        console.warn(`[v0] Could not get value for field ${fieldName}:`, e)
      }

      // Get field position and page information
      let rect: [number, number, number, number] = [0, 0, 200, 30]
      let pages: number[] = []

      try {
        const widgets = (field as any).acroField?.getWidgets?.() || []
        console.log(`[v0] Field "${fieldName}" has ${widgets.length} widget(s)`)
        
        if (widgets.length > 0) {
          const allPages = pdfDoc.getPages()
          console.log(`[v0] Document has ${allPages.length} pages`)
          
          // Process ALL widgets to find all pages where this field appears
          for (let widgetIndex = 0; widgetIndex < widgets.length; widgetIndex++) {
            const widget = widgets[widgetIndex]
            
            // Get rectangle from first widget only (for positioning)
            if (widgetIndex === 0) {
              const widgetRect = widget.getRectangle?.()
              if (widgetRect) {
                rect = [widgetRect.x, widgetRect.y, widgetRect.width, widgetRect.height]
              }
            }
            
            // Try to get the page reference from the widget using the P() method
            const pageRef = (widget as any).P?.()
            console.log(`[v0] Widget ${widgetIndex + 1}/${widgets.length} for "${fieldName}": pageRef =`, pageRef)
            
            if (pageRef) {
              // Find which page this reference corresponds to
              let pageFound = false
              for (let pageIndex = 0; pageIndex < allPages.length; pageIndex++) {
                const page = allPages[pageIndex]
                if (page.ref === pageRef) {
                  const pageNum = pageIndex + 1
                  if (!pages.includes(pageNum)) {
                    pages.push(pageNum)
                    console.log(`[v0] ✓ Field "${fieldName}" widget ${widgetIndex + 1} found on page ${pageNum}`)
                  }
                  pageFound = true
                  break
                }
              }
              
              if (!pageFound) {
                console.log(`[v0] ⚠️ Widget pageRef ${pageRef} not found in document pages for "${fieldName}"`)
              }
            } else {
              console.log(`[v0] ⚠️ Widget has no page reference for "${fieldName}"`)
              
              // Fallback: for widgets without page refs, try to find which page they're on
              // by searching through all pages' annotations
              let annotationFound = false
              for (let pageIndex = 0; pageIndex < allPages.length; pageIndex++) {
                const page = allPages[pageIndex]
                
                // Try to find this widget in the page's annotations
                try {
                  const pageAnnots = (page as any).node?.Annots?.()
                  if (pageAnnots) {
                    for (let annotIndex = 0; annotIndex < pageAnnots.size(); annotIndex++) {
                      const annotDict = pageAnnots.lookup(annotIndex)
                      if (annotDict === widget.dict) {
                        const pageNum = pageIndex + 1
                        if (!pages.includes(pageNum)) {
                          pages.push(pageNum)
                          console.log(`[v0] ✓ Field "${fieldName}" widget ${widgetIndex + 1} found on page ${pageNum} via annotation search`)
                        }
                        annotationFound = true
                        break
                      }
                    }
                  }
                  if (annotationFound) break
                } catch (e) {
                  console.log(`[v0] Error searching annotations on page ${pageIndex + 1}:`, e)
                }
              }
              
              if (!annotationFound) {
                console.log(`[v0] ⚠️ Could not find page for widget ${widgetIndex + 1} of "${fieldName}"`)
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[v0] Could not get position for field ${fieldName}:`, e)
      }

      // If no pages detected, default to page 1
      if (pages.length === 0) {
        pages = [1]
        console.log(`[v0] No pages detected for "${fieldName}", defaulting to page 1`)
      }

      // Determine if field is required (this is a best-effort check)
      let isRequired = false
      try {
        const flags = (field as any).acroField?.getFieldFlags?.()
        if (flags) {
          // Check for required flag (bit 1)
          isRequired = (flags & 2) !== 0
        }
      } catch (e) {
        // Fallback: check field name for common required indicators
        isRequired = /(\*|required|mandatory)/i.test(fieldName)
      }

      // Create separate field entries for each page where this field appears
      for (const pageNum of pages) {
        fields.push({
          name: fieldName,
          type: fieldType,
          value,
          required: isRequired,
          options,
          page: pageNum,
          rect,
        })
        
        console.log(`[v0] Added field: "${fieldName}" on page ${pageNum}`)
      }
    }

    console.log("[v0] Successfully parsed", fields.length, "raw fields")
    console.log("[v0] Raw fields summary:")
    fields.forEach((field, index) => {
      console.log(`  ${index + 1}. "${field.name}" (page ${field.page}) - ${field.type}`)
    })

    // Process field usage tracking and deduplication
    const fieldUsageMap = new Map<string, { 
      field: PDFField, 
      pages: Set<number>, 
      count: number 
    }>()

    // Track field usage across pages
    for (const field of fields) {
      console.log(`[v0] Processing for deduplication: "${field.name}" on page ${field.page}`)
      
      if (fieldUsageMap.has(field.name)) {
        const existing = fieldUsageMap.get(field.name)!
        existing.pages.add(field.page)
        existing.count++
        console.log(`[v0] Found duplicate: "${field.name}" - now appears ${existing.count} times on pages [${Array.from(existing.pages).join(', ')}]`)
      } else {
        fieldUsageMap.set(field.name, {
          field: { ...field },
          pages: new Set([field.page]),
          count: 1
        })
        console.log(`[v0] First occurrence: "${field.name}" on page ${field.page}`)
      }
    }

    // Create deduplicated fields with usage metadata
    const processedFields: PDFField[] = []
    for (const [fieldName, usage] of fieldUsageMap) {
      const field = usage.field
      field.usageCount = usage.count
      field.pages = Array.from(usage.pages).sort((a, b) => a - b)
      processedFields.push(field)
    }

    console.log(`[v0] Deduplicated to ${processedFields.length} unique fields`)
    console.log("[v0] Field usage summary:")
    processedFields.forEach(field => {
      console.log(`  - ${field.name}: ${field.usageCount} times on pages [${field.pages?.join(', ')}]`)
    })

    const title = file.name.replace(".pdf", "")
    const pageCount = pdfDoc.getPageCount()

    if (processedFields.length === 0) {
      throw new Error("No form fields detected in this PDF. Please ensure the PDF contains fillable form fields.")
    }

    return {
      fields: processedFields,
      pageCount,
      title,
    }
  } catch (error) {
    console.error("[v0] Error parsing PDF:", error)

    if (error instanceof Error) {
      if (error.message.includes("No form fields detected")) {
        throw error // Re-throw specific error
      } else if (error.message.includes("Invalid PDF")) {
        throw new Error("The uploaded file is not a valid PDF document.")
      }
    }

    throw new Error("Failed to parse PDF. Please ensure the file is a valid PDF with form fields.")
  }
}

export async function fillPDFFields(originalFile: File, fieldValues: Record<string, string>): Promise<Uint8Array> {
  try {
    console.log("[v0] Starting PDF field filling...")
    console.log("[v0] Field values to fill:", fieldValues)

    const fileBuffer = await originalFile.arrayBuffer()
    const pdfLibBuffer = fileBuffer.slice()
    
    // Dynamic import to prevent SSR issues
    const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } = await import("pdf-lib")
    
    const pdfDoc = await PDFDocument.load(pdfLibBuffer)
    const form = pdfDoc.getForm()

    const formFields = form.getFields()
    console.log(
      "[v0] Available form fields:",
      formFields.map((f: any) => f.getName()),
    )

    // Fill each field with provided values
    let filledCount = 0
    for (const [fieldName, value] of Object.entries(fieldValues)) {
      if (!value || value.trim() === "") {
        console.log(`[v0] Skipping empty field: ${fieldName}`)
        continue
      }

      try {
        console.log(`[v0] Attempting to fill field: ${fieldName} with value: ${value}`)
        const field = form.getField(fieldName)

        if (field instanceof PDFTextField) {
          field.setText(value)
          console.log(`[v0] Successfully filled text field: ${fieldName}`)
          filledCount++
        } else if (field instanceof PDFCheckBox) {
          if (value === "true" || value === "1" || value.toLowerCase() === "yes") {
            field.check()
            console.log(`[v0] Successfully checked checkbox: ${fieldName}`)
          } else {
            field.uncheck()
            console.log(`[v0] Successfully unchecked checkbox: ${fieldName}`)
          }
          filledCount++
        } else if (field instanceof PDFRadioGroup) {
          field.select(value)
          console.log(`[v0] Successfully selected radio option: ${fieldName} = ${value}`)
          filledCount++
        } else if (field instanceof PDFDropdown) {
          field.select(value)
          console.log(`[v0] Successfully selected dropdown option: ${fieldName} = ${value}`)
          filledCount++
        } else {
          console.log(`[v0] Unknown field type for ${fieldName}, trying generic setText`)
          try {
            ;(field as any).setText(value)
            console.log(`[v0] Successfully filled field with generic method: ${fieldName}`)
            filledCount++
          } catch (genericError) {
            console.warn(`[v0] Generic setText failed for ${fieldName}:`, genericError)
          }
        }
      } catch (error) {
        console.warn(`[v0] Could not fill field ${fieldName}:`, error)
      }
    }

    console.log(`[v0] Successfully filled ${filledCount} fields`)

    if (filledCount > 0) {
      form.flatten()
      console.log("[v0] Form flattened to preserve field values")
    } else {
      console.log("[v0] No fields were filled, skipping flattening")
    }

    // Return the filled PDF as bytes
    const pdfBytes = await pdfDoc.save()
    console.log("[v0] PDF generation complete, size:", pdfBytes.length, "bytes")
    return pdfBytes
  } catch (error) {
    console.error("[v0] Error filling PDF:", error)
    throw new Error("Failed to fill PDF fields.")
  }
}
