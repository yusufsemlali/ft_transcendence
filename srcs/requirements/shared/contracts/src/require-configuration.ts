export type SimpleConfiguration = Record<string, boolean>;

export type RequireConfiguration = {
  key: keyof SimpleConfiguration;
  invalidMessage?: string;
};
