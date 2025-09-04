import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Test Interface
    'test.title': 'Test',
    'test.pause': 'Pause',
    'test.resume': 'Resume',
    'test.paused': 'Test Paused',
    'test.pausedDesc': 'Take your time! Click resume when you\'re ready to continue.',
    'test.resumeTest': 'Resume Test',
    'test.questions': 'Questions',
    'test.timeRemaining': 'Time Remaining',
    'test.selectAnswer': 'Please select an answer',
    'test.previous': 'Previous',
    'test.next': 'Next',
    'test.skip': 'Skip',
    'test.submit': 'Submit Test',
    'test.completed': 'Test Completed!',
    'test.results': 'Test Results',
    'test.score': 'You scored',
    'test.outOf': 'out of',
    'test.questionsCorrectly': 'questions correctly',
    'test.explanation': 'Explanation:',
    'test.backToTests': 'Back to Tests',
    'test.correct': 'Correct',
    'test.incorrect': 'Incorrect',
    'test.unanswered': 'Unanswered',
    'test.start': 'Start Test',
    
    // Navigation
    'nav.signIn': 'Sign In',
    'nav.goBack': 'Go Back',
    'nav.signInRequired': 'Sign In Required',
    'nav.signInDesc': 'Please sign in to take the test and track your performance.',
    
    // Loading
    'loading.test': 'Loading test...',
    'loading.questions': 'Loading test questions...',
    
    // Errors
    'error.noQuestions': 'No Questions Available',
    'error.noQuestionsDesc': 'Unable to load test questions. Please try again later.',
    'error.testNotAvailable': 'Test Not Available',
    'error.testNotAvailableDesc': 'Unable to load test questions. Please try again later.',
    
    // Language
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.switch': 'Switch Language'
  },
  hi: {
    // Test Interface
    'test.title': 'परीक्षा',
    'test.pause': 'रोकें',
    'test.resume': 'जारी रखें',
    'test.paused': 'परीक्षा रोकी गई',
    'test.pausedDesc': 'अपना समय लें! जब आप जारी रखने के लिए तैयार हों तो जारी रखें पर क्लिक करें।',
    'test.resumeTest': 'परीक्षा जारी रखें',
    'test.questions': 'प्रश्न',
    'test.timeRemaining': 'शेष समय',
    'test.selectAnswer': 'कृपया एक उत्तर चुनें',
    'test.previous': 'पिछला',
    'test.next': 'अगला',
    'test.skip': 'छोड़ें',
    'test.submit': 'परीक्षा जमा करें',
    'test.completed': 'परीक्षा पूर्ण!',
    'test.results': 'परीक्षा परिणाम',
    'test.score': 'आपका स्कोर',
    'test.outOf': 'में से',
    'test.questionsCorrectly': 'प्रश्न सही हैं',
    'test.explanation': 'व्याख्या:',
    'test.backToTests': 'परीक्षाओं पर वापस जाएं',
    'test.correct': 'सही',
    'test.incorrect': 'गलत',
    'test.unanswered': 'अनुत्तरित',
    'test.start': 'परीक्षा शुरू करें',
    
    // Navigation
    'nav.signIn': 'साइन इन करें',
    'nav.goBack': 'वापस जाएं',
    'nav.signInRequired': 'साइन इन आवश्यक',
    'nav.signInDesc': 'कृपया परीक्षा लेने और अपने प्रदर्शन को ट्रैक करने के लिए साइन इन करें।',
    
    // Loading
    'loading.test': 'परीक्षा लोड हो रही है...',
    'loading.questions': 'परीक्षा प्रश्न लोड हो रहे हैं...',
    
    // Errors
    'error.noQuestions': 'कोई प्रश्न उपलब्ध नहीं',
    'error.noQuestionsDesc': 'परीक्षा प्रश्न लोड करने में असमर्थ। कृपया बाद में पुनः प्रयास करें।',
    'error.testNotAvailable': 'परीक्षा उपलब्ध नहीं',
    'error.testNotAvailableDesc': 'परीक्षा प्रश्न लोड करने में असमर्थ। कृपया बाद में पुनः प्रयास करें।',
    
    // Language
    'language.english': 'English',
    'language.hindi': 'हिंदी',
    'language.switch': 'भाषा बदलें'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};