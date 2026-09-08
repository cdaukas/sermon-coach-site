/**
 * Fully-shaped fixtures for third-party SDK objects used in tests.
 *
 * These exist so a test can build a valid `Anthropic.Messages.Message` or
 * `Stripe.Customer` without a cast. A cast past a required field silences the
 * compiler and swallows the next real mismatch, which is the failure mode that
 * left `tsc --noEmit` reporting thirteen errors for weeks. Every default below
 * is a real value of its declared type, so when an SDK adds a required field
 * the build breaks here, once, instead of everywhere.
 *
 * Test-only. No production module imports this file.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type Stripe from "stripe";

/** Token usage with every field the SDK requires. Cache and server-tool fields
 *  default to null, which `usageFromResponse` coalesces to 0 exactly as an
 *  absent field did. */
export function anthropicUsage(
  overrides: Partial<Anthropic.Messages.Usage> = {},
): Anthropic.Messages.Usage {
  return {
    cache_creation: null,
    cache_creation_input_tokens: null,
    cache_read_input_tokens: null,
    inference_geo: null,
    input_tokens: 10,
    output_tokens: 20,
    server_tool_use: null,
    service_tier: null,
    ...overrides,
  };
}

/** A tool_use block. `caller` is `{ type: "direct" }`: these fixtures stand in
 *  for a tool the model invoked itself, not a server-tool call. */
export function anthropicToolUseBlock(
  overrides: Partial<Anthropic.Messages.ToolUseBlock> = {},
): Anthropic.Messages.ToolUseBlock {
  return {
    type: "tool_use",
    id: "toolu_test",
    name: "tool",
    caller: { type: "direct" },
    input: {},
    ...overrides,
  };
}

/** An assistant message. `container` and `stop_details` are null: no container
 *  was used, and `stop_details` is populated only when `stop_reason` is
 *  "refusal". */
export function anthropicMessage(
  overrides: Partial<Anthropic.Messages.Message> = {},
): Anthropic.Messages.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-test-model",
    content: [],
    container: null,
    stop_reason: "end_turn",
    stop_details: null,
    stop_sequence: null,
    usage: anthropicUsage(),
    ...overrides,
  };
}

/** A live Stripe customer.
 *
 *  Deliberately carries no `deleted` key. Stripe types it `deleted?: void` on
 *  `Customer` and models a removed customer as the separate `DeletedCustomer`
 *  with `deleted: true`, so a live customer having no `deleted` field is the
 *  accurate shape. Call sites that previously wrote `deleted: false` read
 *  identically: every production check is a falsy test (`if (x.deleted)` /
 *  `!x.deleted`), which `undefined` and `false` both fail. */
export function stripeCustomer(
  overrides: Partial<Stripe.Customer> = {},
): Stripe.Customer {
  return {
    id: "cus_test",
    object: "customer",
    balance: 0,
    created: 0,
    default_source: null,
    description: null,
    email: null,
    invoice_settings: {
      custom_fields: null,
      default_payment_method: null,
      footer: null,
      rendering_options: null,
    },
    livemode: false,
    metadata: {},
    shipping: null,
    ...overrides,
  };
}
