export const fr = {
  // Header Navigation
  home: "Accueil",
  pdfFormFiller: "Remplisseur de Formulaires PDF",
  getStarted: "Commencer",

  // Main Page
  mainTitle: "Remplisseur de Formulaires PDF",
  mainDescription: "Téléchargez vos documents PDF, détectez automatiquement les champs de formulaire, remplissez-les facilement et générez des PDF complétés instantanément.",

  // PDF Uploader
  uploadPdfDocument: "Télécharger un Document PDF",
  dropYourPdfHere: "Déposez votre PDF ici",
  dragAndDropYourPdf: "Glissez-déposez votre fichier PDF ici, ou cliquez pour parcourir",
  chooseFile: "Choisir un Fichier",
  supportsPdfFiles: "Supporte les fichiers PDF jusqu'à 10 Mo",
  detectFields: "Détecter les Champs",
  uploadDifferentFile: "Télécharger un Fichier Différent",
  detectingFormFields: "Détection des champs de formulaire...",

  // Field Editor
  fillPdfForm: "Remplir le Formulaire PDF",
  fieldsDetected: "champs détectés",
  filled: "remplis",
  showPreview: "Afficher l'Aperçu",
  hidePreview: "Masquer l'Aperçu",
  organize: "Organiser",
  reset: "Réinitialiser",
  generating: "Génération...",
  generatePdf: "Générer le PDF",
  formFields: "Champs de Formulaire",
  clearAll: "Tout Effacer",
  templateManager: "Gestionnaire de Modèles",

  // Form Fields
  enterFieldName: (fieldName: string) => `Entrer ${fieldName.toLowerCase()}`,
  selectFieldName: (fieldName: string) => `Sélectionner ${fieldName.toLowerCase()}`,
  required: "requis",

  // Field Organizer
  organizeFields: "Organiser les Champs",
  organizationModel: "Modèle d'Organisation",
  importModel: "Importer un Modèle",
  exportModel: "Exporter le Modèle",
  newModel: "Nouveau Modèle",
  createCategory: "Créer une Catégorie",
  categoryName: "Nom de la Catégorie",
  enterCategoryName: "Entrer le nom de la catégorie",
  create: "Créer",
  cancel: "Annuler",
  renameCategory: "Renommer la Catégorie",
  rename: "Renommer",
  deleteCategory: "Supprimer la Catégorie",
  confirmDelete: "Êtes-vous sûr de vouloir supprimer cette catégorie ? Les champs seront déplacés vers 'Non Assignés'.",
  notAssigned: "Non Assignés",
  allFields: "Tous les Champs",
  dragDrop: "Glissez les champs entre les catégories ou utilisez les boutons ci-dessous",
  moveToCategory: "Déplacer vers la Catégorie",
  moveUp: "Monter",
  moveDown: "Descendre",
  apply: "Appliquer",
  confirmOrganization: "Appliquer l'Organisation",
  organizationApplied: "Organisation Appliquée",
  organizationAppliedMessage: "L'organisation des champs a été appliquée avec succès !",

  // Template Manager
  templates: "Modèles",
  saveTemplate: "Sauvegarder le Modèle",
  loadTemplate: "Charger le Modèle",
  templateName: "Nom du Modèle",
  enterTemplateName: "Entrer le nom du modèle",
  saveTemplateDescription: "Cela sauvegardera {filledFields} champs remplis sur {totalFields} pour \"{documentName}\".",
  save: "Sauvegarder",
  load: "Charger",
  deleteTemplate: "Supprimer le Modèle",
  confirmDeleteTemplate: "Êtes-vous sûr de vouloir supprimer ce modèle ?",
  templateSaved: "Modèle Sauvegardé",
  templateLoaded: "Modèle Chargé",
  templateDeleted: "Modèle Supprimé",
  noTemplatesSaved: "Aucun modèle sauvegardé encore",
  noTemplatesSavedDescription: "Sauvegardez les valeurs actuelles de vos champs comme modèle pour une utilisation future",

  // Document Summary
  documentSummary: "Résumé du Document",
  document: "Document",
  pages: "Pages",
  fields: "Champs",
  progress: "Progrès",
  fieldTypes: "Types de Champs",
  text: "Texte",
  checkbox: "Case à cocher",
  radio: "Bouton radio",
  select: "Sélection",
  signature: "Signature",
  date: "Date",

  // Error Messages
  errorUploadingFile: "Erreur lors du téléchargement du fichier",
  errorProcessingPdf: "Erreur lors du traitement du PDF",
  errorGeneratingPdf: "Erreur lors de la génération du PDF",
  errorSavingTemplate: "Erreur lors de la sauvegarde du modèle",
  errorLoadingTemplate: "Erreur lors du chargement du modèle",
  pleaseSelectPdfFile: "Veuillez sélectionner un fichier PDF",
  fileTooLarge: "Le fichier est trop volumineux. La taille maximale est de 10 Mo.",
  invalidFileType: "Type de fichier invalide. Veuillez sélectionner un fichier PDF.",
  noFieldsDetected: "Aucun champ de formulaire détecté dans ce PDF",
  failedToFillFields: "Échec du remplissage de certains champs. Veuillez vérifier vos valeurs d'entrée et réessayer.",

  // Success Messages
  pdfGeneratedSuccessfully: "PDF généré avec succès !",
  fieldsDetectedSuccessfully: (count: number) => `${count} champs de formulaire détectés avec succès`,
  
  // Loading States
  loadingFormData: "Chargement des données de formulaire...",
  processingPdf: "Traitement du PDF...",
  savingData: "Sauvegarde des données...",

  // Footer
  allRightsReserved: "Tous droits réservés",
  poweredBy: "Propulsé par",

  // Accessibility
  closeDialog: "Fermer la boîte de dialogue",
  openMenu: "Ouvrir le menu",
  closeMenu: "Fermer le menu",
  loading: "Chargement",

  // Language
  switchLanguage: "Passer à l'anglais",
  currentLanguage: "Français",
} as const