// Countries we ship to, and the regions Shopify asks for ("State", "Province"…).

export interface Country {
  code: string;
  name: string;
  /** Label for the region select; omitted when the country has none. */
  regionLabel?: string;
  regions?: string[];
  zipLabel: string;
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida",
  "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts",
  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico", "Rhode Island",
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];
const CA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
  "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon",
];
const AU_STATES = ["Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"];

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", regionLabel: "State", regions: US_STATES, zipLabel: "ZIP code" },
  { code: "CA", name: "Canada", regionLabel: "Province", regions: CA_PROVINCES, zipLabel: "Postal code" },
  { code: "GB", name: "United Kingdom", zipLabel: "Postcode" },
  { code: "AU", name: "Australia", regionLabel: "State/territory", regions: AU_STATES, zipLabel: "Postcode" },
  { code: "NZ", name: "New Zealand", zipLabel: "Postcode" },
  { code: "IE", name: "Ireland", zipLabel: "Eircode" },
  { code: "DE", name: "Germany", zipLabel: "Postal code" },
  { code: "FR", name: "France", zipLabel: "Postal code" },
  { code: "ES", name: "Spain", zipLabel: "Postal code" },
  { code: "IT", name: "Italy", zipLabel: "Postal code" },
  { code: "NL", name: "Netherlands", zipLabel: "Postal code" },
  { code: "BE", name: "Belgium", zipLabel: "Postal code" },
  { code: "AT", name: "Austria", zipLabel: "Postal code" },
  { code: "PT", name: "Portugal", zipLabel: "Postal code" },
  { code: "PL", name: "Poland", zipLabel: "Postal code" },
  { code: "SE", name: "Sweden", zipLabel: "Postal code" },
  { code: "DK", name: "Denmark", zipLabel: "Postal code" },
  { code: "NO", name: "Norway", zipLabel: "Postal code" },
  { code: "FI", name: "Finland", zipLabel: "Postal code" },
  { code: "CH", name: "Switzerland", zipLabel: "Postal code" },
  { code: "JP", name: "Japan", zipLabel: "Postal code" },
  { code: "KR", name: "South Korea", zipLabel: "Postal code" },
  { code: "SG", name: "Singapore", zipLabel: "Postal code" },
  { code: "HK", name: "Hong Kong SAR", zipLabel: "Postal code" },
  { code: "TW", name: "Taiwan", zipLabel: "Postal code" },
  { code: "MY", name: "Malaysia", zipLabel: "Postcode" },
  { code: "PH", name: "Philippines", zipLabel: "Postal code" },
  { code: "TH", name: "Thailand", zipLabel: "Postal code" },
  { code: "VN", name: "Vietnam", zipLabel: "Postal code" },
  { code: "AE", name: "United Arab Emirates", zipLabel: "Postal code" },
  { code: "MX", name: "Mexico", zipLabel: "Postal code" },
  { code: "BR", name: "Brazil", zipLabel: "Postal code" },
];

export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
