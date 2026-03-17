import { z } from "zod";

export const TransactionSchema = z.object({
  $id: z.string().optional(),
  userId: z.string(),
  amount: z.number(),
  date: z.string(), // ISO datetime
  description: z.string().min(1, "Description is required"),
  categoryId: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
  toAccountId: z.string().optional(), // For transfers
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurringRule: z.string().optional(),
  status: z.enum(["pending", "cleared"]).default("cleared"),
  type: z.enum(["income", "expense", "transfer"]),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const AccountSchema = z.object({
  $id: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["checking", "savings", "credit", "cash", "investment", "debt"]),
  balance: z.number(),
  currency: z.string().default("USD"),
  institution: z.string().optional(),
  notes: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type Account = z.infer<typeof AccountSchema>;

export const CategorySchema = z.object({
  $id: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
  color: z.string().default("#10B981"),
  icon: z.string().default("Circle"),
  parentId: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;
