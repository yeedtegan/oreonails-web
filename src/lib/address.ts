"use client";

/**
 * Shipping address of the cart's "Delivery" step — the same rules as oreonails-api/src/account/address.ts
 * (the store checks it again). Kept in this browser so a returning customer doesn't type it again.
 */

export const SHIP_COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia"] as const;
export const US_STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

export type Address = {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export const EMPTY_ADDRESS: Address = {
  email: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  phone: "",
};

const KEY = "oreo-address";

export function loadAddress(): Address {
  try {
    return { ...EMPTY_ADDRESS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Address>) };
  } catch {
    return EMPTY_ADDRESS;
  }
}

export function saveAddress(a: Address) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {}
}

export const isUS = (a: Pick<Address, "country">) => a.country === "United States";

/** enough of the address to show shipping methods (mockup: an address + a postal code) */
export const hasShippingBasics = (a: Address) => !!a.address1.trim() && (isUS(a) ? /^\d{5}(-\d{4})?$/.test(a.zip.trim()) : a.zip.trim().length >= 3);

/** fields still wrong, in form order (empty = ready) */
export function addressProblems(a: Address): (keyof Address)[] {
  const bad: (keyof Address)[] = [];
  if (a.email.trim() && !/^\S+@\S+\.\S+$/.test(a.email.trim())) bad.push("email");
  if (!a.lastName.trim()) bad.push("lastName");
  if (!a.address1.trim()) bad.push("address1");
  if (!a.city.trim()) bad.push("city");
  if (isUS(a) ? !US_STATES.includes(a.state) : false) bad.push("state");
  if (isUS(a) ? !/^\d{5}(-\d{4})?$/.test(a.zip.trim()) : a.zip.trim().length < 3) bad.push("zip");
  if (a.phone.trim() && !/^[+()\d\s.-]{6,30}$/.test(a.phone.trim())) bad.push("phone");
  return bad;
}
