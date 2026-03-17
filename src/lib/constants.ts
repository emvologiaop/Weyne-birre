export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'Utensils' },
  { name: 'Transportation', type: 'expense', color: '#3b82f6', icon: 'Car' },
  { name: 'Shopping', type: 'expense', color: '#8b5cf6', icon: 'ShoppingBag' },
  { name: 'Entertainment', type: 'expense', color: '#f59e0b', icon: 'Film' },
  { name: 'Utilities', type: 'expense', color: '#64748b', icon: 'Zap' },
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'Wallet' },
  { name: 'Freelance', type: 'income', color: '#ec4899', icon: 'Briefcase' },
  { name: 'Investment', type: 'income', color: '#f97316', icon: 'TrendingUp' },
];

export const DEFAULT_ACCOUNTS = [
  { name: 'Cash', type: 'cash', balance: 0, color: '#10b981' },
  { name: 'Bank Account', type: 'bank', balance: 0, color: '#3b82f6' },
];

export const PREDEFINED_ACHIEVEMENTS = [
  {
    id: 'first_transaction',
    name: 'First Step',
    description: 'Add your first transaction',
    icon: 'Zap',
    criteria: 'transactions_count >= 1'
  },
  {
    id: 'saver_level_1',
    name: 'Penny Pincher',
    description: 'Save your first $100',
    icon: 'PiggyBank',
    criteria: 'total_savings >= 100'
  },
  {
    id: 'budget_master',
    name: 'Budget Master',
    description: 'Stay within budget for a whole month',
    icon: 'ShieldCheck',
    criteria: 'budgets_kept >= 1'
  },
  {
    id: 'wealth_builder',
    name: 'Wealth Builder',
    description: 'Reach a net worth of $1,000',
    icon: 'TrendingUp',
    criteria: 'net_worth >= 1000'
  }
];
