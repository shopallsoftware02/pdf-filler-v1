export const en = {
  // Header Navigation
  home: "Home",
  pdfFormFiller: "PDF Form Filler",
  getStarted: "Get Started",

  // Main Page
  mainTitle: "PDF Form Filler",
  mainDescription: "Upload your PDF documents, automatically detect form fields, fill them out with ease, and generate completed PDFs instantly.",

  // PDF Uploader
  uploadPdfDocument: "Upload PDF Document",
  dropYourPdfHere: "Drop your PDF here",
  dragAndDropYourPdf: "Drag and drop your PDF file here, or click to browse",
  chooseFile: "Choose File",
  supportsPdfFiles: "Supports PDF files up to 10MB",
  detectFields: "Detect Fields",
  uploadDifferentFile: "Upload Different File",
  detectingFormFields: "Detecting form fields...",

  // Field Editor
  fillPdfForm: "Fill PDF Form",
  fieldsDetected: "fields detected",
  filled: "filled",
  showPreview: "Show Preview",
  hidePreview: "Hide Preview",
  organize: "Organize",
  reset: "Reset",
  generating: "Generating...",
  generatePdf: "Generate PDF",
  formFields: "Form Fields",
  clearAll: "Clear All",
  templateManager: "Template Manager",

  // Form Fields
  enterFieldName: (fieldName: string) => `Enter ${fieldName.toLowerCase()}`,
  selectFieldName: (fieldName: string) => `Select ${fieldName.toLowerCase()}`,
  required: "required",
  
  // Field Usage
  appearsOnce: "Appears once",
  appearsTimes: (count: number) => `Appears ${count} times`,
  onPage: "on page",
  onPages: "on pages",
  fieldUsageTooltip: (count: number, pages: number[]) => {
    if (count === 1) {
      return `Appears once on page ${pages[0]}`
    }
    return `Appears ${count} times on pages ${pages.join(', ')}`
  },

  // Field Organizer
  organizeFields: "Organize Fields",
  organizationModel: "Organization Model",
  importModel: "Import Model",
  exportModel: "Export Model",
  newModel: "New Model",
  createCategory: "Create Category",
  categoryName: "Category Name",
  enterCategoryName: "Enter category name",
  create: "Create",
  cancel: "Cancel",
  renameCategory: "Rename Category",
  rename: "Rename",
  deleteCategory: "Delete Category",
  confirmDelete: "Are you sure you want to delete this category? Fields will be moved to 'Not Assigned'.",
  notAssigned: "Not Assigned",
  allFields: "All Fields",
  dragDrop: "Drag fields between categories or use the buttons below",
  moveToCategory: "Move to Category",
  moveUp: "Move Up",
  moveDown: "Move Down",
  apply: "Apply",
  confirmOrganization: "Apply Organization",
  organizationApplied: "Organization Applied",
  organizationAppliedMessage: "Field organization has been applied successfully!",

  // Template Manager
  templates: "Templates",
  saveTemplate: "Save Template",
  loadTemplate: "Load Template",
  templateName: "Template Name",
  enterTemplateName: "Enter template name",
  saveTemplateDescription: "This will save {filledFields} of {totalFields} filled fields for \"{documentName}\".",
  save: "Save",
  load: "Load",
  deleteTemplate: "Delete Template",
  confirmDeleteTemplate: "Are you sure you want to delete this template?",
  templateSaved: "Template Saved",
  templateLoaded: "Template Loaded",
  templateDeleted: "Template Deleted",
  noTemplatesSaved: "No templates saved yet",
  noTemplatesSavedDescription: "Save your current field values as a template for future use",

  // Document Summary
  documentSummary: "Document Summary",
  document: "Document",
  pages: "Pages",
  fields: "Fields",
  progress: "Progress",
  fieldTypes: "Field Types",
  text: "Text",
  checkbox: "Checkbox",
  radio: "Radio",
  select: "Select",
  signature: "Signature",
  date: "Date",

  // Error Messages
  errorUploadingFile: "Error uploading file",
  errorProcessingPdf: "Error processing PDF",
  errorGeneratingPdf: "Error generating PDF",
  errorSavingTemplate: "Error saving template",
  errorLoadingTemplate: "Error loading template",
  pleaseSelectPdfFile: "Please select a PDF file",
  fileTooLarge: "File is too large. Maximum size is 10MB.",
  invalidFileType: "Invalid file type. Please select a PDF file.",
  noFieldsDetected: "No form fields detected in this PDF",
  failedToFillFields: "Failed to fill some fields. Please check your input values and try again.",

  // Success Messages
  pdfGeneratedSuccessfully: "PDF generated successfully!",
  fieldsDetectedSuccessfully: (count: number) => `Successfully detected ${count} form fields`,
  
  // Loading States
  loadingFormData: "Loading form data...",
  processingPdf: "Processing PDF...",
  savingData: "Saving data...",

  // Footer
  allRightsReserved: "All rights reserved",
  poweredBy: "Powered by",

  // Profile Management
  profiles: "Profiles",
  profileName: "Profile Name",
  enterProfileName: "Enter profile name",
  loadProfile: "Load",
  saveProfile: "Save",
  loadProfileTooltip: "Load an existing profile",
  saveProfileTooltip: "Save current profile",
  profileSaved: "Profile saved successfully",
  profileLoaded: "Profile loaded successfully",
  profileNotFound: "Profile not found",
  selectProfile: "Select a profile",
  deleteProfile: "Delete profile",
  exportProfile: "Export profile",
  importProfile: "Import profile",
  profileManager: "Profile Manager",
  clientProfile: "client profile",
  recentProfiles: "Recent Profiles",

  // Accessibility
  closeDialog: "Close dialog",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  loading: "Loading",

  // Language
  switchLanguage: "Switch to French",
  currentLanguage: "English",
} as const