# Appwrite Database Schema: WealthTracker

This document outlines the complete database schema for the Personal Finance Tracker. You can use this guide to set up your Appwrite Cloud or self-hosted instance.

## Database
**Name:** `finance_db`
**ID:** `finance_db` (or auto-generated)

---

## Security & Permissions (CRITICAL)

To ensure user data is strictly private and secure, you **MUST** configure permissions as follows for **EVERY** collection:

1. **Collection Level Permissions:**
   - Go to Collection -> Settings -> Permissions.
   - Add Role: `Users` (All authenticated users).
   - Grant: `Create`, `Read`, `Update`, `Delete`.
2. **Document Security:**
   - In the same Settings tab, toggle **Document Security** to **ON**.
   - *Why?* This ensures that even though "Users" can read/write to the collection, they can ONLY access documents where they are explicitly listed in the document's `$permissions` array.
3. **Client-Side Creation:**
   - When creating a document via the frontend SDK, you must pass the permissions array:
     `[Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))]`

---

## 1. Collection: `users` (Profiles)
Stores user preferences and profile data. (Authentication is handled by Appwrite Auth, this is for app-specific settings).

**Attributes:**
| Key | Type | Size | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | String | 36 | Yes | - | Links to Appwrite Auth User ID |
| `name` | String | 128 | Yes | - | User's display name |
| `email` | String | 128 | Yes | - | User's email address |
| `currency` | String | 3 | No | `USD` | Preferred currency code |
| `theme` | String | 10 | No | `dark` | UI theme preference |
| `monthlyIncomeGoal` | Double | - | No | `0` | Target monthly income |
| `netWorthTarget` | Double | - | No | `0` | Target net worth |

**Indexes:**
| Name | Type | Attributes | Order |
| :--- | :--- | :--- | :--- |
| `idx_userId` | Unique | `userId` | ASC |

---

## 2. Collection: `accounts`
Stores financial accounts (checking, savings, credit cards).

**Attributes:**
| Key | Type | Size | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | String | 36 | Yes | - | Owner ID |
| `name` | String | 128 | Yes | - | Account name (e.g., "Chase Checking") |
| `type` | String | 32 | Yes | - | Enum: `checking`, `savings`, `credit`, `cash`, `investment`, `debt` |
| `balance` | Double | - | Yes | - | Current balance |
| `currency` | String | 3 | No | `USD` | Account currency |
| `institution` | String | 128 | No | - | Bank name |
| `isDefault` | Boolean| - | No | `false` | Is primary account? |

**Indexes:**
| Name | Type | Attributes | Order |
| :--- | :--- | :--- | :--- |
| `idx_userId` | Key | `userId` | ASC |

---

## 3. Collection: `transactions`
Stores all income, expenses, and transfers.

**Attributes:**
| Key | Type | Size | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | String | 36 | Yes | - | Owner ID |
| `accountId` | String | 36 | Yes | - | Associated account |
| `categoryId` | String | 36 | Yes | - | Associated category |
| `amount` | Double | - | Yes | - | Transaction amount (negative for expense) |
| `date` | Datetime| - | Yes | - | ISO 8601 Date of transaction |
| `description`| String | 256 | Yes | - | Memo/Description |
| `type` | String | 16 | Yes | - | Enum: `income`, `expense`, `transfer` |
| `status` | String | 16 | No | `cleared` | Enum: `pending`, `cleared` |
| `tags` | String[]| - | No | `[]` | Array of string tags |

**Indexes:**
| Name | Type | Attributes | Order |
| :--- | :--- | :--- | :--- |
| `idx_userId` | Key | `userId` | ASC |
| `idx_accountId` | Key | `accountId` | ASC |
| `idx_date` | Key | `date` | DESC |
| `idx_user_date`| Key | `userId`, `date` | ASC, DESC |

---

## 4. Collection: `categories`
Stores custom categories for transactions.

**Attributes:**
| Key | Type | Size | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | String | 36 | Yes | - | Owner ID |
| `name` | String | 64 | Yes | - | Category name (e.g., "Groceries") |
| `type` | String | 16 | Yes | - | Enum: `income`, `expense` |
| `color` | String | 16 | No | `#10B981` | Hex color code for UI |
| `icon` | String | 32 | No | `Circle` | Lucide icon name |

**Indexes:**
| Name | Type | Attributes | Order |
| :--- | :--- | :--- | :--- |
| `idx_userId` | Key | `userId` | ASC |

---

## 5. Collection: `budgets`
Stores spending limits per category.

**Attributes:**
| Key | Type | Size | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | String | 36 | Yes | - | Owner ID |
| `categoryId` | String | 36 | Yes | - | Category being budgeted |
| `amount` | Double | - | Yes | - | Spending limit |
| `period` | String | 16 | No | `monthly` | Enum: `weekly`, `monthly`, `yearly` |
| `startDate` | Datetime| - | No | - | When the budget takes effect |

**Indexes:**
| Name | Type | Attributes | Order |
| :--- | :--- | :--- | :--- |
| `idx_user_cat` | Key | `userId`, `categoryId` | ASC, ASC |

---

## 6. Collection: `goals`
Stores financial savings targets.

**Attributes:**
| Key | Type | Size | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `userId` | String | 36 | Yes | - | Owner ID |
| `name` | String | 128 | Yes | - | Goal name (e.g., "New Car") |
| `targetAmount`| Double | - | Yes | - | Amount needed |
| `currentAmount`| Double| - | No | `0` | Amount saved so far |
| `targetDate` | Datetime| - | No | - | Target completion date |
| `color` | String | 16 | No | `#10B981` | Hex color code for UI |
| `icon` | String | 32 | No | `Target` | Lucide icon name |

**Indexes:**
| Name | Type | Attributes | Order |
| :--- | :--- | :--- | :--- |
| `idx_userId` | Key | `userId` | ASC |
