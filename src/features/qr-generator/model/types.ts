export type WifiEncryption = "none" | "wpa" | "wep";

export type VCardFormValue = {
  fullName: string;
  phone: string;
  email: string;
  company: string;
  title: string;
  workPhone: string;
  fax: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  website: string;
};

export type WifiFormValue = {
  ssid: string;
  hidden: boolean;
  password: string;
  encryption: WifiEncryption;
};
