/**
 * @companydata/handelsregister-api
 *
 * A thin, typed convenience wrapper around the CompanyData API for German Handelsregister.
 * It is not a separate API: it is the same `@companydata/companydata-sdk`
 * client with the country pinned to DE and a register-specific helper on
 * top, so you can write `client.getByRegistrationNumber("...")` instead of assembling
 * query parameters by hand.
 *
 * One schema, one key across every CompanyData register.
 */
import {
  ApiClient,
  type ApiClientConfig,
  type CompanyExportParams,
  type CompanyExportScrollResponse,
  type CompanyExportStandardResponse,
  type CompanySearchParams,
  type CompanySearchResponse,
  type RequestOptions
} from "@companydata/companydata-sdk";

export const COUNTRY_CODE = "DE" as const;

export type HandelsregisterSearchParams = Omit<CompanySearchParams, "countryCode">;
export type HandelsregisterExportParams = Omit<CompanyExportParams, "countryCode">;
export interface HandelsregisterClientConfig extends ApiClientConfig {}

/** Client for German Handelsregister data. */
export class HandelsregisterClient {
  private readonly api: ApiClient;

  constructor(config: HandelsregisterClientConfig) {
    this.api = new ApiClient(config);
  }

  /** Search businesses. `countryCode` is fixed to "DE". */
  search(params: HandelsregisterSearchParams = {}, options?: RequestOptions): Promise<CompanySearchResponse> {
    return this.api.company.search({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Look up one business by its registration number. Returns the first match, or null. */
  async getByRegistrationNumber(id: string, options?: RequestOptions): Promise<Record<string, unknown> | null> {
    const clean = id.replace(/\s+/g, "");
    const response = await this.api.company.search(
      { nationalId: clean, countryCode: COUNTRY_CODE, pageSize: 1 },
      options
    );
    const records = Array.isArray(response.data) ? response.data : (response.data?.records ?? []);
    return records[0] ?? null;
  }

  /** Export a page of results (standard pagination). */
  export(params: HandelsregisterExportParams = {}, options?: RequestOptions): Promise<CompanyExportStandardResponse> {
    return this.api.company.export({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Export large sets page by page in scroll mode. */
  exportWithScroll(params: Omit<HandelsregisterExportParams, "useScroll"> = {}, options?: RequestOptions): Promise<CompanyExportScrollResponse> {
    return this.api.company.exportWithScroll({ ...params, countryCode: COUNTRY_CODE }, options);
  }

  /** Escape hatch: the underlying master SDK client. */
  get raw(): ApiClient {
    return this.api;
  }
}

export function createHandelsregisterClient(config: HandelsregisterClientConfig): HandelsregisterClient {
  return new HandelsregisterClient(config);
}

export { ApiError } from "@companydata/companydata-sdk";
export type {
  ApiClientConfig,
  CompanyExportScrollResponse,
  CompanyExportStandardResponse,
  CompanyRecord,
  CompanySearchResponse,
  RequestOptions
} from "@companydata/companydata-sdk";
