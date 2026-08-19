import { facilitator, createFacilitatorConfig } from "@coinbase/x402";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { x402ResourceServer } from "@x402/next";

export const network = (process.env.NETWORK || "eip155:84532") as Network;

// Use CDP keys if provided, otherwise fall back to env vars
const facilitatorConfig = (process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET)
  ? createFacilitatorConfig(process.env.CDP_API_KEY_ID, process.env.CDP_API_KEY_SECRET)
  : facilitator; // Falls back to CDP_API_KEY_ID/CDP_API_KEY_SECRET env vars automatically

const facilitatorClient = new HTTPFacilitatorClient(facilitatorConfig);

export const resourceServer = new x402ResourceServer(facilitatorClient).register(
  network,
  new ExactEvmScheme()
);

export const payTo = process.env.PAYMENT_ADDRESS as `0x${string}`;
