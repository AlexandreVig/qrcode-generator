export type EncoderId = string;

export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "tel"
  | "password"
  | "select"
  | "checkbox";

export type SelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export type EncoderFieldBase = {
  name: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  helpText?: string;
};

export type TextLikeField = EncoderFieldBase & {
  kind: "text" | "textarea" | "url" | "email" | "tel" | "password";
};

export type SelectField<TValue extends string = string> = EncoderFieldBase & {
  kind: "select";
  options: ReadonlyArray<SelectOption<TValue>>;
};

export type CheckboxField = EncoderFieldBase & {
  kind: "checkbox";
  /** Optional label to show next to the checkbox, if different from `label`. */
  checkboxLabel?: string;
};

export type EncoderField = TextLikeField | SelectField | CheckboxField;

/**
 * Minimal schema interface so the domain layer can depend on validation
 * without coupling directly to a specific library.
 *
 * This is compatible with Zod's `safeParse` shape.
 */
export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };

export interface EncoderSchema<TInput> {
  safeParse(input: unknown): SafeParseResult<TInput>;
}

export type EncoderDefinition<TInput extends object> = {
  id: EncoderId;
  title: string;
  description?: string;

  /** Validation schema for `TInput` (e.g., Zod schema). */
  schema: EncoderSchema<TInput>;

  /**
   * UI metadata to render a "templated" form.
   * The UI should treat `name` as a key into the input object.
   */
  fields: ReadonlyArray<EncoderField>;

  /** Provide initial form value (must satisfy the schema). */
  getInitialValue(): TInput;

  /** Encode structured input to a QR payload string. */
  encode(input: TInput): string;
};

export type InferEncoderInput<
  T extends EncoderDefinition<Record<string, unknown>>,
> = T extends EncoderDefinition<infer TInput> ? TInput : never;
