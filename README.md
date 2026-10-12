# German Handelsregister API by CompanyData

[![npm](https://img.shields.io/npm/v/@companydata/handelsregister-api.svg)](https://www.npmjs.com/package/@companydata/handelsregister-api)

A small, typed TypeScript wrapper for looking up **German company data from the Handelsregister**: company names, full street addresses, phone, email, website, size and revenue, through one REST call.

This package is a thin convenience layer over the master [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk). It is the same API and the same key, with the country pinned to Germany and a register-specific helper on top, so you can write `client.getByRegistrationNumber("80333B6684")` instead of assembling query parameters by hand.

> One schema, one key. Every CompanyData register wrapper returns records in the same shape, so moving from Handelsregister to another country's register is a one-line change.

## At a glance

| | |
| --- | --- |
| Country | 🇩🇪 Germany (`countryCode: "DE"`) |
| Register | German Handelsregister |
| Businesses in CompanyData | 6.79M |
| With phone number | 4.29M |
| With email address | 3.56M |
| Lookup key | registration number (CompanyData composite, see below) |
| Verified example | Siemens AG, `80333B6684` |
| Live demo and comparison | [companydata.com/handelsregister-api](https://companydata.com/handelsregister-api/) |
| Official register | [handelsregister.de](https://www.handelsregister.de) |

Counts are from the live API on 2026-10-12 and grow over time.

## What is the Handelsregister?

The German **Handelsregister** is the official company register, kept by the local district courts (Amtsgerichte) and published centrally at [handelsregister.de](https://www.handelsregister.de). It is authoritative on legal form, registered office, share capital and filings.

What the official portal does **not** give you: there is no public REST API, the site is built for retrieving single documents, and it returns no phone number, no email address and no way to filter or export a segment.

**CompanyData adds the missing fields.** 6.79M German businesses with full addresses, phone, email, website, directors and firmographics, filterable and exportable in bulk through one live REST API. Comparison and a live lookup: [companydata.com/handelsregister-api](https://companydata.com/handelsregister-api/).

## Installation

```bash
npm install @companydata/handelsregister-api
```

Get an API key at [app.companydata.com/signup-api](https://app.companydata.com/signup-api). Your first calls are free.

## Quickstart

```ts
import { HandelsregisterClient } from "@companydata/handelsregister-api";

const client = new HandelsregisterClient({
  auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! }
});

// Look up one business by its registration number.
const company = await client.getByRegistrationNumber("80333B6684"); // Siemens AG

// Search with filters (country is always DE here).
const page = await client.search({
  cityName: "BERLIN",
  hasEmail: true,
  hasWebsite: true,
  page: 1,
  pageSize: 25
});
console.log(page.totalCount, page.records[0]?.["Company Name"]);
```

> **City and province names are UPPER CASE.** Filter on `cityName: "BERLIN"`, not `"Berlin"` (which returns 0). The same goes for `provinceName: "MÜNCHEN"`. List exact names per country with `GET /api/cities`. Full field and filter reference: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

Run the full example against the live API with your key:

```bash
git clone https://github.com/companydatacom/handelsregister-api && cd handelsregister-api && npm install
COMPANYDATA_API_KEY=... npm run test:live
```

## What a record looks like

Every record is a flat object with human-readable keys. This is Siemens AG as returned by `getByRegistrationNumber`:

```json
{
  "Company Name": "Siemens AG",
  "Trade Name": null,
  "Company Registration Number": "80333B6684",
  "Address 1": "Werner-von-siemens-str. 1",
  "Postal Code": "80333",
  "City": "München",
  "State/Province": "München",
  "Country": "Germany",
  "Phone Number": "+4*****00",
  "Email": "*****@*****",
  "Website": "simulytic.*****",
  "Founding Year": 1847,
  "Employees Total": 316000,
  "Yearly Revenue in U.S. Dollars": 91845400438,
  "Business Category Code 1 - Description": "Electrical Machinery, Equipment, and Supplies, Not Elsewhere",
  "Business Legal Type - Description": "Corporation"
}
```

**Search is a preview, export is the full record.** `search` (and the lookup helper, which uses it) returns about 20 fields with phone, email and website masked as `*****`, and does not spend credits. `export`, `exportWithScroll` and `iterate` return the full record (about 35 fields, unmasked contact details, SIC and national industry codes, legal status, group structure) and spend one credit per company you have not exported before. Which fields are on a record depends on your key's configuration. See the [field reference](https://companydata.com/api-docs/request-company/) and [plans and credits](https://companydata.com/api-docs/authentication/).

## Methods

| Method | Returns | Does |
| --- | --- | --- |
| `client.search(params)` | `HandelsregisterPage` | Search German businesses with filters. |
| `client.getByRegistrationNumber(id, scope?)` | `CompanyRecord \| null` | Fetch one business by registration number. `scope` adds extra filters when a number is not unique. |
| `client.export(params)` | `HandelsregisterPage` | Export one page of results (standard pagination). |
| `client.exportWithScroll(params)` | `HandelsregisterScrollBatch` | One scroll batch (max 50 records). Pass `scrollId` back in for the next. |
| `client.iterate(params, { maxRecords })` | `AsyncGenerator<CompanyRecord>` | Streams every matching record across scroll batches. |
| `client.raw` | `ApiClient` | The underlying master SDK client, for anything not wrapped here. |
| `normalizeHandelsregisterId(id)` | `string` | The registration number normalisation the lookup helper applies. |

```ts
interface HandelsregisterPage {
  records: CompanyRecord[];   // flat objects, keys like "Company Name", "City", "Email"
  totalCount: number;         // matches across all pages
  page: number;
  totalPages: number;
  pageSize: number;
}

interface HandelsregisterScrollBatch {
  records: CompanyRecord[];
  scrollId: string | null;    // pass back in to get the next batch
  hasMoreRecords: boolean;
  pageSize: number;
}
```

`params` is the master SDK's filter set with `countryCode` removed, because it is always `"DE"` here. For cross-border queries, use the master SDK directly.

### Lookup by registration number

`getByRegistrationNumber` takes the registration number as CompanyData stores it. For Germany this is a composite of postal code, register type (`A` or `B`) and the HRA/HRB number, for example `80333B6684` for Siemens AG (80333 München, HRB 6684). Whitespace is stripped and letters are upper-cased. Take the value from a record you already have, or use `search` by name and city.

## Recipes

**Find a company by name, pinned to a city**

```ts
const { records, totalCount } = await client.search({
  search: "Siemens",
  cityName: "MÜNCHEN",
  pageSize: 5
});
```

**Build a segment: companies in a province with 50 or more employees**

```ts
const page = await client.search({
  provinceName: "MÜNCHEN",
  employeesTotal: { min: 50 },
  hasPhone: true,
  pageSize: 100
});
```

**Stream a whole segment with scroll export**

```ts
for await (const company of client.iterate(
  { cityName: "BERLIN", hasEmail: true },
  { maxRecords: 5000 }
)) {
  console.log(company["Company Name"], company["Email"]);
}
```

**Drive the scroll loop yourself**

```ts
let batch = await client.exportWithScroll({ cityName: "BERLIN", hasEmail: true, pageSize: 50 });
while (batch.records.length > 0) {
  process(batch.records);
  if (!batch.hasMoreRecords || !batch.scrollId) break;
  batch = await client.exportWithScroll({ cityName: "BERLIN", hasEmail: true, scrollId: batch.scrollId, pageSize: 50 });
}
```

**Anything else: drop to the master client**

```ts
const res = await client.raw.company.search({ countryCode: "DE", cityName: "BERLIN", pageSize: 10 });
```

### Common filters

| Filter | Example | Notes |
| --- | --- | --- |
| `search` | `"Siemens"` | Free text over company and trade names. |
| `nationalId` | `"80333B6684"` | Registration number. The lookup helper sets this for you. |
| `cityName` | `"BERLIN"` | UPPER CASE. |
| `provinceName` | `"MÜNCHEN"` | Admin-2 name, UPPER CASE (the record's `State/Province`). |
| `postalCode` | `"80333"` | Exact match. |
| `hasEmail`, `hasPhone`, `hasWebsite` | `true` | Contact availability. |
| `employeesTotal`, `annualSales`, `foundingYears` | `{ min: 50, max: 500 }` | Range filters. |
| `sic4Digits` | `"7372"` | 4-digit SIC industry code. |

Full list: [companydata.com/api-docs/request-company](https://companydata.com/api-docs/request-company/).

## Known limitations

- Pure HRB numbers like `HRB 6684` are not unique across Germany, so the lookup helper takes the CompanyData composite number. If you only have an HRB number, use `search` with the company name and `cityName`.

## Four ways to integrate

Pick whichever fits how you build. All four hit the same data behind the same key.

1. **This register SDK** (`@companydata/handelsregister-api`): German lookups with a Handelsregister-specific helper. You are here.
2. **Master SDK** ([`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk)): all 200+ countries in one typed client, keyed by `countryCode`.
3. **MCP server**: connect an AI agent (Claude, Cursor and others) to `https://companydata.com/mcp/` with your key in the `x-api-key` header. See [companydata-mcp-server](https://github.com/companydatacom/companydata-mcp-server).
4. **Raw REST**: call `GET https://app.companydata.com/api/company/search?countryCode=DE&cityName=BERLIN` with an `x-api-key` header. Contract: [companydata.com/openapi.json](https://companydata.com/openapi.json).

```bash
curl -H "x-api-key: $COMPANYDATA_API_KEY" \
  "https://app.companydata.com/api/company/search?countryCode=DE&nationalId=80333B6684&pageSize=1"
```

## Error handling

Failed requests throw `ApiError` with the HTTP status. The client retries transient failures (429 and 5xx) with backoff before giving up.

```ts
import { ApiError } from "@companydata/handelsregister-api";

try {
  await client.search({ cityName: "BERLIN" });
} catch (err) {
  if (err instanceof ApiError) {
    // 401: bad or missing key, 429: rate limited,
    // "Export credit limit exceeded" (code credits_limit_exceeded): export credits used up
    console.error(err.status, err.message);
  }
}
```

A scroll batch that is larger than your remaining credits is rejected as a whole, so keep `pageSize` small when a key is close to its limit.

## All register wrappers

Same pattern, one per official register. Every wrapper returns the same record shape.

| Country | Register | Package | Lookup helper |
| --- | --- | --- | --- |
| 🇳🇱 Netherlands | KVK | [`@companydata/kvk-api`](https://github.com/companydatacom/kvk-api) | `getByKvkNumber` |
| 🇩🇪 Germany | Handelsregister | [`@companydata/handelsregister-api`](https://github.com/companydatacom/handelsregister-api) | `getByRegistrationNumber` |
| 🇬🇧 United Kingdom | Companies House | [`@companydata/companies-house-api`](https://github.com/companydatacom/companies-house-api) | `getByCompanyNumber` |
| 🇫🇷 France | Sirene | [`@companydata/sirene-api`](https://github.com/companydatacom/sirene-api) | `getBySiret` |
| 🇧🇪 Belgium | KBO/BCE | [`@companydata/kbo-api`](https://github.com/companydatacom/kbo-api) | `getByEnterpriseNumber` |
| 🇵🇱 Poland | KRS | [`@companydata/krs-api`](https://github.com/companydatacom/krs-api) | `getByNip` |
| 🇸🇪 Sweden | Bolagsverket | [`@companydata/bolagsverket-api`](https://github.com/companydatacom/bolagsverket-api) | `getByOrgNumber` |
| 🇨🇭 Switzerland | Zefix | [`@companydata/zefix-api`](https://github.com/companydatacom/zefix-api) | `getByUid` |
| 🇨🇿 Czech Republic | ARES | [`@companydata/ares-api`](https://github.com/companydatacom/ares-api) | `getByIco` |
| 🇩🇰 Denmark | CVR | [`@companydata/cvr-api`](https://github.com/companydatacom/cvr-api) | `getByCvr` |
| 🇧🇷 Brazil | CNPJ | [`@companydata/cnpj-api`](https://github.com/companydatacom/cnpj-api) | `getByCnpj` |
| 🇦🇺 Australia | ABR | [`@companydata/abn-lookup-api`](https://github.com/companydatacom/abn-lookup-api) | `getByAbn` |
| 🇺🇸 United States | SEC EDGAR | [`@companydata/sec-edgar-api`](https://github.com/companydatacom/sec-edgar-api) | `getByRegistrationNumber` |

Plus the master SDK for every other country: [`@companydata/companydata-sdk`](https://github.com/companydatacom/companydata-sdk).

## License

MIT. Built and maintained by [CompanyData.com](https://companydata.com).
