import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Dashboard
    'dashboard.title': 'Instructor Dashboard',
    'dashboard.awaitingAnswer': 'Awaiting My Answer',
    'dashboard.totalAnswered': 'Total Answered',
    'dashboard.myAnswers': 'My Answers',
    'dashboard.questionsAwaitingAnswer': 'Questions Awaiting Answer',
    'dashboard.answeredQuestions': 'Answered Questions',
    'dashboard.refresh': 'Refresh',
    'dashboard.noQuestions': 'No approved questions waiting for your answer',
    'dashboard.noAnsweredQuestions': 'No answered questions yet',
    'dashboard.loading': 'Loading questions...',
    
    // Question Card
    'question.pending': 'Pending',
    'question.approved': 'Approved',
    'question.answered': 'Answered',
    'question.question': 'Question',
    'question.answer': 'Answer',
    'question.posted': 'Posted',
    'question.writePlaceholder': 'Write your answer here... It will be posted to Telegram channel',
    'question.publish': 'Publish to Telegram',
    'question.publishing': 'Publishing...',
    'question.telegramNotConfigured': 'Please configure Telegram settings above',
    
    // Confirmation
    'confirm.publishTitle': 'Confirm Publish to Telegram',
    'confirm.publishMessage': '⚠️ This action is irreversible and cannot be undone.\n\nAre you sure you want to publish this answer to the Telegram channel?',
    'confirm.yes': 'Yes, Publish',
    'confirm.no': 'No, Cancel',
    
    // Success/Error
    'success.published': 'Answer published to Telegram successfully!',
    'success.saved': 'Answer saved successfully!',
    'error.authFailed': 'Not authenticated. Please refresh the page and try again.',
    'error.answerFailed': 'Failed to answer question',
    
    // Tabs
    'tabs.unanswered': 'Unanswered',
    'tabs.answered': 'Answered',
    
    // Language
    'language.english': 'English',
    'language.french': 'French',
  },
  fr: {
    // Dashboard
    'dashboard.title': 'Tableau de bord instructeur',
    'dashboard.awaitingAnswer': 'En attente de ma réponse',
    'dashboard.totalAnswered': 'Total répondu',
    'dashboard.myAnswers': 'Mes réponses',
    'dashboard.questionsAwaitingAnswer': 'Questions en attente de réponse',
    'dashboard.answeredQuestions': 'Questions répondues',
    'dashboard.refresh': 'Actualiser',
    'dashboard.noQuestions': 'Aucune question approuvée en attente de votre réponse',
    'dashboard.noAnsweredQuestions': 'Aucune question répondue pour le moment',
    'dashboard.loading': 'Chargement des questions...',
    
    // Question Card
    'question.pending': 'En attente',
    'question.approved': 'Approuvé',
    'question.answered': 'Répondu',
    'question.question': 'Question',
    'question.answer': 'Réponse',
    'question.posted': 'Publié',
    'question.writePlaceholder': 'Écrivez votre réponse ici... Elle sera publiée sur le canal Telegram',
    'question.publish': 'Publier sur Telegram',
    'question.publishing': 'Publication...',
    'question.telegramNotConfigured': 'Veuillez configurer les paramètres Telegram ci-dessus',
    
    // Confirmation
    'confirm.publishTitle': 'Confirmer la publication sur Telegram',
    'confirm.publishMessage': '⚠️ Cette action est irréversible et ne peut pas être annulée.\n\nÊtes-vous sûr de vouloir publier cette réponse sur le canal Telegram?',
    'confirm.yes': 'Oui, publier',
    'confirm.no': 'Non, annuler',
    
    // Success/Error
    'success.published': 'Réponse publiée sur Telegram avec succès!',
    'success.saved': 'Réponse enregistrée avec succès!',
    'error.authFailed': 'Non authentifié. Veuillez actualiser la page et réessayer.',
    'error.answerFailed': 'Échec de la réponse à la question',
    
    // Tabs
    'tabs.unanswered': 'Non répondues',
    'tabs.answered': 'Répondues',
    
    // Language
    'language.english': 'Anglais',
    'language.french': 'Français',
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Get saved language from localStorage or default to 'en'
    const saved = localStorage.getItem('instructorLanguage');
    return (saved === 'en' || saved === 'fr') ? saved : 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('instructorLanguage', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
