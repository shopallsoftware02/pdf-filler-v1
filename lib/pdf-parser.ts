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
      let page = 1

      try {
        const widgets = (field as any).acroField?.getWidgets?.() || []
        if (widgets.length > 0) {
          const widget = widgets[0]
          const widgetRect = widget.getRectangle?.()
          if (widgetRect) {
            rect = [widgetRect.x, widgetRect.y, widgetRect.width, widgetRect.height]
          }
          
          // Try to determine which page the field is on
          const widgetPageRef = widget.getPageRef?.()
          if (widgetPageRef) {
            const pages = pdfDoc.getPages()
            for (let i = 0; i < pages.length; i++) {
              if (pages[i].ref === widgetPageRef) {
                page = i + 1
                break
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[v0] Could not get position for field ${fieldName}:`, e)
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

      fields.push({
        name: fieldName,
        type: fieldType,
        value,
        required: isRequired,
        options,
        page,
        rect,
      })
    }

    console.log("[v0] Successfully parsed", fields.length, "fields")

    const title = file.name.replace(".pdf", "")
    const pageCount = pdfDoc.getPageCount()

    if (fields.length === 0) {
      throw new Error("No form fields detected in this PDF. Please ensure the PDF contains fillable form fields.")
    }

    return {
      fields,
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
