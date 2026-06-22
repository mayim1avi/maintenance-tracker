// Central place for all Hebrew UI strings + enum labels.

export const t = {
  appName: "קריאות תחזוקה",
  // auth
  login: "התחברות",
  username: "שם משתמש",
  password: "סיסמה",
  logout: "התנתקות",
  loginError: "שם משתמש או סיסמה שגויים",
  // nav
  navIssues: "קריאות",
  navNew: "קריאה חדשה",
  navAdmin: "ניהול",
  manageUsers: "ניהול משתמשים",
  // issue list
  allIssues: "כל הקריאות",
  myReported: "שדיווחתי",
  myAssigned: "שמשויכות אליי",
  noIssues: "אין קריאות להצגה",
  filters: "סינון",
  clearFilters: "נקה סינון",
  // issue fields
  title: "כותרת",
  description: "תיאור",
  location: "מיקום",
  category: "קטגוריה",
  priority: "עדיפות",
  status: "סטטוס",
  reportedBy: "דיווח/ה",
  assignedTo: "משויך ל",
  unassigned: "לא משויך",
  photo: "תמונה",
  takePhoto: "צילום / העלאת תמונה",
  createdAt: "נפתח",
  resolvedAt: "נסגר",
  comments: "תגובות",
  addComment: "הוספת תגובה",
  noComments: "אין תגובות עדיין",
  send: "שליחה",
  save: "שמירה",
  create: "פתיחת קריאה",
  assign: "שיוך",
  assignToMe: "שייך אליי",
  required: "שדה חובה",
  optional: "רשות",
  choose: "בחר/י…",
  back: "חזרה",
  // admin
  employees: "עובדים",
  locations: "מיקומים",
  categories: "קטגוריות",
  name: "שם",
  role: "תפקיד",
  active: "פעיל",
  inactive: "לא פעיל",
  zone: "אזור",
  add: "הוספה",
  edit: "עריכה",
  newPassword: "סיסמה חדשה",
  // misc
  loading: "טוען…",
  saved: "נשמר",
  error: "שגיאה",
} as const;

export const priorityLabels: Record<string, string> = {
  low: "נמוכה",
  medium: "בינונית",
  urgent: "דחופה",
};

export const statusLabels: Record<string, string> = {
  open: "פתוחה",
  in_progress: "בטיפול",
  done: "טופלה",
  cancelled: "בוטלה",
};

export const roleLabels: Record<string, string> = {
  staff: "עובד/ת",
  maintenance: "תחזוקה",
  admin: "מנהל/ת",
};
