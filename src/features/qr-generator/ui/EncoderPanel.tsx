import type { Encoder } from "@/application/qr/getEncoders";
import type { EncoderField } from "@/domain/qr/encoderDefinition";

import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { RadioGroup } from "@/components/retroui/Radio";
import { Switch } from "@/components/retroui/Switch";
import { Tabs } from "@/components/retroui/Tabs";
import { Text } from "@/components/retroui/Text";
import { Textarea } from "@/components/retroui/Textarea";

type EncoderPanelProps = {
  encoder: Encoder;
  value: Record<string, unknown>;
  onChange(next: Record<string, unknown>): void;
  fieldErrors?: Record<string, string>;
};

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function EncoderFieldControl({
  encoderId,
  field,
  value,
  onChange,
  disabled = false,
  error,
}: {
  encoderId: string;
  field: EncoderField;
  value: Record<string, unknown>;
  onChange(next: Record<string, unknown>): void;
  disabled?: boolean;
  error?: string;
}) {
  const id = `${encoderId}-${field.name}`;
  const errorId = `${id}-error`;

  const setFieldValue = (nextValue: unknown) => {
    onChange({ ...value, [field.name]: nextValue });
  };

  if (field.kind === "textarea") {
    return (
      <div className="grid gap-2 h-fit">
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          rows={4}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          value={getString(value[field.name])}
          onChange={(e) => setFieldValue(e.target.value)}
        />
        {error ? (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (
    field.kind === "text" ||
    field.kind === "url" ||
    field.kind === "email" ||
    field.kind === "tel" ||
    field.kind === "password"
  ) {
    return (
      <div className="grid gap-2 h-fit">
        <Label htmlFor={id}>{field.label}</Label>
        <Input
          id={id}
          type={field.kind}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          value={getString(value[field.name])}
          onChange={(e) => setFieldValue(e.target.value)}
        />
        {error ? (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.kind === "checkbox") {
    return (
      <div className="grid gap-2 h-fit">
        <div className="flex gap-2 items-center">
          <Switch
            id={id}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            checked={getBoolean(value[field.name])}
            onCheckedChange={(checked) => setFieldValue(checked)}
          />
          <Label htmlFor={id}>{field.checkboxLabel ?? field.label}</Label>
        </div>
        {error ? (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <div className="grid gap-2 h-fit">
        <Label>{field.label}</Label>
        <RadioGroup
          aria-label={field.label}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          value={getString(value[field.name])}
          onValueChange={(next) => setFieldValue(next)}
        >
          {field.options.map((opt) => {
            const optionId = `${id}-${opt.value}`;
            return (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroup.Item id={optionId} value={opt.value} />
                <Label htmlFor={optionId}>{opt.label}</Label>
              </div>
            );
          })}
        </RadioGroup>
        {error ? (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return null;
}

export function EncoderPanel({
  encoder,
  value,
  onChange,
  fieldErrors = {},
}: EncoderPanelProps) {
  if (encoder.id === "wifi") {
    const ssidField = encoder.fields.find((f) => f.name === "ssid");
    const hiddenField = encoder.fields.find((f) => f.name === "hidden");
    const passwordField = encoder.fields.find((f) => f.name === "password");
    const encryptionField = encoder.fields.find((f) => f.name === "encryption");

    const passwordDisabled = getString(value.encryption) === "none";

    return (
      <Tabs.Content value={encoder.id} className="border-0 grid w-full gap-4">
        <Text className="font-bold">Enter your wifi network information</Text>

        <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-4">
          {ssidField ? (
            <EncoderFieldControl
              encoderId={encoder.id}
              field={ssidField}
              value={value}
              onChange={onChange}
              error={fieldErrors[ssidField.name]}
            />
          ) : null}

          {hiddenField ? (
            <EncoderFieldControl
              encoderId={encoder.id}
              field={hiddenField}
              value={value}
              onChange={onChange}
              error={fieldErrors[hiddenField.name]}
            />
          ) : null}
        </div>

        {passwordField ? (
          <EncoderFieldControl
            encoderId={encoder.id}
            field={passwordField}
            value={value}
            onChange={onChange}
            disabled={passwordDisabled}
            error={fieldErrors[passwordField.name]}
          />
        ) : null}

        {encryptionField ? (
          <EncoderFieldControl
            encoderId={encoder.id}
            field={encryptionField}
            value={value}
            onChange={onChange}
            error={fieldErrors[encryptionField.name]}
          />
        ) : null}
      </Tabs.Content>
    );
  }

  if (encoder.id === "vcard") {
    const fullNameField = encoder.fields.find((f) => f.name === "fullName");
    const restFields = encoder.fields.filter((f) => f.name !== "fullName");

    return (
      <Tabs.Content value={encoder.id} className="border-0 grid w-full gap-4">
        <Text className="font-bold">Digital business card information</Text>

        {fullNameField ? (
          <EncoderFieldControl
            encoderId={encoder.id}
            field={fullNameField}
            value={value}
            onChange={onChange}
            error={fieldErrors[fullNameField.name]}
          />
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {restFields.map((field) => (
            <EncoderFieldControl
              key={field.name}
              encoderId={encoder.id}
              field={field}
              value={value}
              onChange={onChange}
              error={fieldErrors[field.name]}
            />
          ))}
        </div>
      </Tabs.Content>
    );
  }

  return (
    <Tabs.Content value={encoder.id} className="border-0 grid w-full gap-4">
      {encoder.fields.map((field) => (
        <EncoderFieldControl
          key={field.name}
          encoderId={encoder.id}
          field={field}
          value={value}
          onChange={onChange}
          error={fieldErrors[field.name]}
        />
      ))}
    </Tabs.Content>
  );
}
