/** Run: COMPANYDATA_API_KEY=... npx tsx examples/quickstart.ts */
import { HandelsregisterClient } from "../src/index";

const client = new HandelsregisterClient({ auth: { type: "apiKey", apiKey: process.env.COMPANYDATA_API_KEY! } });

const company = await client.getByRegistrationNumber("HRB 123456");
console.log("By registration number:", company);

const page = await client.search({ cityName: "Berlin", hasEmail: true, pageSize: 25 });
console.log("Search:", page.data);
