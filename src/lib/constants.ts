// All monetary values in this app are ETB (Ethiopian Birr)
export const APP_CURRENCY = "ETB";
export const APP_CURRENCY_SYMBOL = "Br";

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'Utensils' },
  { name: 'Transportation', type: 'expense', color: '#3b82f6', icon: 'Car' },
  { name: 'Shopping', type: 'expense', color: '#8b5cf6', icon: 'ShoppingBag' },
  { name: 'Entertainment', type: 'expense', color: '#f59e0b', icon: 'Film' },
  { name: 'Utilities', type: 'expense', color: '#64748b', icon: 'Zap' },
  { name: 'Health', type: 'expense', color: '#ec4899', icon: 'Heart' },
  { name: 'Education', type: 'expense', color: '#06b6d4', icon: 'BookOpen' },
  { name: 'Housing & Rent', type: 'expense', color: '#f97316', icon: 'Home' },
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'Wallet' },
  { name: 'Freelance', type: 'income', color: '#a855f7', icon: 'Briefcase' },
  { name: 'Business', type: 'income', color: '#f97316', icon: 'TrendingUp' },
  { name: 'Other Income', type: 'income', color: '#94a3b8', icon: 'Plus' },
];

export const DEFAULT_ACCOUNTS = [
  { name: 'Cash', type: 'cash', balance: 0 },
  { name: 'Bank Account', type: 'checking', balance: 0 },
];

export const PREDEFINED_ACHIEVEMENTS = [
  {
    id: 'first_transaction',
    name: 'First Step',
    description: 'Add your first transaction',
    icon: '⚡',
  },
  {
    id: 'saver_level_1',
    name: 'Saver',
    description: 'Record ETB 100 or more in income',
    icon: '🐷',
  },
  {
    id: 'budget_master',
    name: 'Budget Master',
    description: 'Stay within all budgets for a whole month',
    icon: '🛡️',
  },
  {
    id: 'wealth_builder',
    name: 'Wealth Builder',
    description: 'Record ETB 1,000 or more in total income',
    icon: '📈',
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Add transactions 7 days in a row',
    icon: '🔥',
  },
];

export const RECURRING_INTERVALS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];
