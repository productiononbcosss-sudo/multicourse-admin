# Language Switching Feature - Instructor Dashboard

## Overview

Instructors can now switch between English and French languages in their dashboard. The language preference is saved in the browser's localStorage and persists across sessions.

---

## Features Implemented

### 1. ✅ Language Selector
- **Location:** Top of Instructor Dashboard
- **Languages:** English (EN) and French (FR)
- **Persistence:** Saved in localStorage
- **Icon:** Globe icon for easy identification

### 2. ✅ Translated Elements

All instructor-facing text is now translatable:

#### Dashboard Elements:
- Statistics labels
- Tab names
- Button text
- Loading messages
- Empty state messages

#### Question Card Elements:
- Status badges (Pending, Approved, Answered)
- Question/Answer labels
- Placeholder text
- Button text
- Error messages

#### Confirmation Dialogs:
- Publish confirmation title and message
- Button text (Yes/No)

#### Success/Error Messages:
- Success notifications
- Error notifications
- Authentication errors

---

## Usage

### For Instructors:

1. **Change Language:**
   - Look for the language selector at the top of the dashboard
   - Click "English" or "French" button
   - The interface updates immediately
   - Your preference is saved automatically

2. **Language Persists:**
   - Your language choice is remembered
   - Works across browser sessions
   - Stored in browser localStorage

---

## Translations

### English (EN)

| Key | Translation |
|-----|-------------|
| Dashboard Title | Instructor Dashboard |
| Awaiting Answer | Awaiting My Answer |
| Total Answered | Total Answered |
| My Answers | My Answers |
| Questions Awaiting Answer | Questions Awaiting Answer |
| Answered Questions | Answered Questions |
| Refresh | Refresh |
| Loading | Loading questions... |
| No Questions | No approved questions waiting for your answer |
| No Answered Questions | No answered questions yet |
| Unanswered Tab | Unanswered |
| Answered Tab | Answered |
| Question | Question |
| Answer | Answer |
| Posted | Posted |
| Pending | Pending |
| Approved | Approved |
| Answered | Answered |
| Publish | Publish to Telegram |
| Publishing | Publishing... |
| Confirm Title | Confirm Publish to Telegram |
| Confirm Message | ⚠️ This action is irreversible... |
| Yes | Yes, Publish |
| No | No, Cancel |

### French (FR)

| Key | Translation |
|-----|-------------|
| Dashboard Title | Tableau de bord instructeur |
| Awaiting Answer | En attente de ma réponse |
| Total Answered | Total répondu |
| My Answers | Mes réponses |
| Questions Awaiting Answer | Questions en attente de réponse |
| Answered Questions | Questions répondues |
| Refresh | Actualiser |
| Loading | Chargement des questions... |
| No Questions | Aucune question approuvée en attente de votre réponse |
| No Answered Questions | Aucune question répondue pour le moment |
| Unanswered Tab | Non répondues |
| Answered Tab | Répondues |
| Question | Question |
| Answer | Réponse |
| Posted | Publié |
| Pending | En attente |
| Approved | Approuvé |
| Answered | Répondu |
| Publish | Publier sur Telegram |
| Publishing | Publication... |
| Confirm Title | Confirmer la publication sur Telegram |
| Confirm Message | ⚠️ Cette action est irréversible... |
| Yes | Oui, publier |
| No | Non, annuler |

---

## Technical Implementation

### Files Created:
1. **`src/contexts/LanguageContext.tsx`**
   - Language context provider
   - Translation function
   - localStorage integration

### Files Modified:
1. **`src/App.tsx`**
   - Wrapped with LanguageProvider

2. **`src/components/dashboard/InstructorDashboard.tsx`**
   - Added language selector UI
   - Integrated translation function
   - All text uses translations

3. **`src/components/questions/QuestionCard.tsx`**
   - Added translation support
   - Graceful fallback for client_support users

### Context Structure:

```typescript
interface LanguageContextType {
  language: Language; // 'en' | 'fr'
  setLanguage: (lang: Language) => void;
  t: (key: string) => string; // Translation function
}
```

### Usage Example:

```typescript
const { language, setLanguage, t } = useLanguage();

// Use translation
<h1>{t('dashboard.title')}</h1>

// Change language
<button onClick={() => setLanguage('fr')}>French</button>
```

---

## Answered Questions Tab

### New Feature: View Previously Answered Questions

Instructors can now see all questions they have answered in a separate tab.

#### Features:
- **Tab Navigation:** Switch between "Unanswered" and "Answered" tabs
- **Filtering:** Shows only questions answered by the current instructor
- **Sorting:** Newest answers first
- **Course Filter:** Works with course selection
- **Read-Only:** Answered questions are displayed without edit capability

#### Tab Counts:
- Unanswered tab shows count of pending questions
- Answered tab shows count of instructor's answered questions

#### Display:
- Question text
- Answer text
- Posted date/time
- Chapter and lesson information
- Status badge (Answered)

---

## Screenshots Description

### Language Selector:
```
┌─────────────────────────────────────────┐
│ 🌐 Language:  [English] [French]       │
└─────────────────────────────────────────┘
```

### Tabs:
```
┌─────────────────────────────────────────┐
│ [Unanswered (5)] [Answered (12)]       │
└─────────────────────────────────────────┘
```

### English View:
```
Statistics:
- Awaiting My Answer: 5
- Total Answered: 12
- My Answers: 12

Tabs:
- Unanswered (5)
- Answered (12)
```

### French View:
```
Statistiques:
- En attente de ma réponse: 5
- Total répondu: 12
- Mes réponses: 12

Onglets:
- Non répondues (5)
- Répondues (12)
```

---

## Browser Compatibility

- ✅ Chrome/Edge (localStorage supported)
- ✅ Firefox (localStorage supported)
- ✅ Safari (localStorage supported)
- ✅ Mobile browsers (localStorage supported)

---

## Adding New Translations

To add a new translation:

1. Open `src/contexts/LanguageContext.tsx`
2. Add the key to both `en` and `fr` objects:

```typescript
const translations = {
  en: {
    'new.key': 'English text',
    // ... other translations
  },
  fr: {
    'new.key': 'Texte français',
    // ... other translations
  }
};
```

3. Use in component:
```typescript
{t('new.key')}
```

---

## Adding New Languages

To add a new language (e.g., Spanish):

1. Update `Language` type in `src/types/index.ts`:
```typescript
export type Language = 'en' | 'fr' | 'es';
```

2. Add translations in `LanguageContext.tsx`:
```typescript
const translations = {
  en: { /* ... */ },
  fr: { /* ... */ },
  es: {
    'dashboard.title': 'Panel de instructor',
    // ... all translations
  }
};
```

3. Add button in InstructorDashboard:
```typescript
<button onClick={() => setLanguage('es')}>
  Español
</button>
```

---

## Testing Checklist

- [x] Language selector appears on instructor dashboard
- [x] Clicking English changes all text to English
- [x] Clicking French changes all text to French
- [x] Language preference persists after page refresh
- [x] Language preference persists after logout/login
- [x] All dashboard elements are translated
- [x] All question card elements are translated
- [x] All modal popups are translated
- [x] Answered questions tab shows correctly
- [x] Answered questions are sorted by date
- [x] Course filter works with answered questions
- [x] Client support users not affected (no language selector)

---

## Known Limitations

1. **Client Support:** Language switching is only available for instructors
2. **Course Names:** Course names remain in their original language
3. **Chapter/Lesson Titles:** Remain in their original language from course structure
4. **Question/Answer Content:** User-generated content is not translated
5. **Dates:** Date format remains in browser's default locale

---

## Future Enhancements

Consider these improvements:
1. Add more languages (Arabic, Spanish, German, etc.)
2. Translate course names
3. Translate chapter/lesson titles
4. Add date format localization
5. Add number format localization
6. Add RTL support for Arabic
7. Add language selector for client support
8. Add language preference to user profile

---

## Support

For questions or issues:
1. Check this documentation
2. Verify localStorage is enabled in browser
3. Clear browser cache if translations don't update
4. Contact development team

---

**Status: IMPLEMENTED ✅**
**Languages: English, French ✅**
**Persistence: localStorage ✅**
**Answered Questions Tab: IMPLEMENTED ✅**
