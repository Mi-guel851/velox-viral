/**
 * Authentication validation schemas.
 *
 * Shared by the client (for instant feedback) and the server actions (which
 * re-validate, because client-side checks are a convenience and never a
 * security boundary).
 */
import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;

/**
 * Password rules, expressed once so the signup form can render them as a live
 * checklist and the schema can enforce them.
 */
export const PASSWORD_RULES = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value: string) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value: string) => /[0-9]/.test(value),
  },
] as const;

export function passwordRuleResults(value: string) {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(value),
  }));
}

/** 0–4, for the strength meter. */
export function passwordStrength(value: string): number {
  return PASSWORD_RULES.filter((rule) => rule.test(value)).length;
}

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

const emailSchema = z
  .string()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .transform((value) => value.trim().toLowerCase());

export const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please enter your name.")
    .max(80, "Name is too long.")
    .transform((value) => value.trim()),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  // Deliberately not the strict schema: an existing account may predate a
  // policy change, and rejecting it here would lock the user out of their own
  // account with a confusing validation error instead of an auth error.
  password: z.string().min(1, "Password is required."),
  // Constrained to a relative path so it cannot be abused as an open redirect.
  next: z
    .string()
    .optional()
    .transform((value) =>
      value && value.startsWith("/") && !value.startsWith("//") ? value : undefined
    ),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const securityPhraseSchema = z.object({
  securityPhrase: z
    .string()
    .min(3, "Your security phrase must be at least 3 characters.")
    .max(120, "Security phrase is too long.")
    .transform((value) => value.trim()),
});

export const verifySecurityPhraseSchema = z.object({
  email: emailSchema,
  securityPhrase: z
    .string()
    .min(1, "Enter your security phrase.")
    .transform((value) => value.trim()),
});

export type SecurityPhraseInput = z.infer<typeof securityPhraseSchema>;
export type VerifySecurityPhraseInput = z.infer<typeof verifySecurityPhraseSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Please enter your name.")
    .max(80, "Name is too long.")
    .transform((value) => value.trim()),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be 30 characters or fewer.")
    .regex(
      /^[a-z0-9_]+$/,
      "Username may only contain lowercase letters, numbers and underscores."
    ),
  timezone: z.string().min(1, "Select a timezone."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
