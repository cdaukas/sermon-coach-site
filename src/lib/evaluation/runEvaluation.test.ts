import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type Anthropic from "@anthropic-ai/sdk";
import { EVALUATION_FIXTURE } from "./fixture";
import {
  EvaluationRunError,
  runEvaluation,
  type CreateEvaluationMessage,
} from "./runEvaluation";
import { submitSermonEvaluationTool } from "./tool-schema";

const evaluationInput = {
  sermonTitle: "Test Sermon",
  manuscript: "Opening line.\n\nBody paragraph.",
};

function messageWithToolInput(
  toolInput: unknown,
  model = "claude-test-model",
  usage: Anthropic.Messages.Usage = { input_tokens: 10, output_tokens: 20 },
): Anthropic.Messages.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model,
    content: [
      {
        type: "tool_use",
        id: "toolu_test",
        name: submitSermonEvaluationTool.name,
        input: toolInput,
      },
    ],
    stop_reason: "tool_use",
    stop_sequence: null,
    usage,
  };
}

function createMessageFromResponses(
  responses: Anthropic.Messages.Message[],
): CreateEvaluationMessage {
  let callIndex = 0;
  return async () => {
    const response = responses[callIndex];
    callIndex += 1;
    if (!response) {
      throw new Error(`Unexpected createMessage call #${callIndex}`);
    }
    return response;
  };
}

describe("runEvaluation schema retry", () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
  });

  it("retries once with a fresh generate after schema failure, then succeeds", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    let createCalls = 0;
    const createMessage: CreateEvaluationMessage = async () => {
      createCalls += 1;
      if (createCalls === 1) {
        return messageWithToolInput({ invalid: "schema" }, "claude-test-model", {
          input_tokens: 10,
          output_tokens: 20,
        });
      }
      return messageWithToolInput(EVALUATION_FIXTURE, "claude-test-model", {
        input_tokens: 30,
        output_tokens: 40,
      });
    };

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (message?: unknown) => {
      if (typeof message === "string") {
        logs.push(message);
      }
    };

    try {
      const { result, model, inputTokens, outputTokens } = await runEvaluation(
        evaluationInput,
        { createMessage },
      );

      assert.equal(createCalls, 2);
      assert.equal(model, "claude-test-model");
      assert.equal(
        result.meta.sermon_title,
        EVALUATION_FIXTURE.meta.sermon_title,
      );
      assert.equal(inputTokens, 40);
      assert.equal(outputTokens, 60);

      const evalCostLine = logs.find((line) => line.includes('"eval_cost"'));
      assert.ok(evalCostLine);
      const payload = JSON.parse(evalCostLine!) as {
        tag: string;
        input_tokens: number;
        output_tokens: number;
        api_attempts: number;
        cost_usd: number | null;
      };
      assert.equal(payload.tag, "eval_cost");
      assert.equal(payload.input_tokens, 40);
      assert.equal(payload.output_tokens, 60);
      assert.equal(payload.api_attempts, 2);
      assert.equal(payload.cost_usd, null);
      assert.equal(evalCostLine!.includes("Opening line"), false);
    } finally {
      console.log = originalLog;
    }
  });

  it("surfaces schema error after two failed generates", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const createMessage = createMessageFromResponses([
      messageWithToolInput({ bad: 1 }),
      messageWithToolInput({ bad: 2 }),
    ]);

    await assert.rejects(
      () => runEvaluation(evaluationInput, { createMessage }),
      (error: unknown) => {
        assert.ok(error instanceof EvaluationRunError);
        assert.equal(error.code, "schema");
        return true;
      },
    );
  });

  it("does not retry when the API call fails", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    let createCalls = 0;
    const createMessage: CreateEvaluationMessage = async () => {
      createCalls += 1;
      throw new Error("rate_limit");
    };

    await assert.rejects(
      () => runEvaluation(evaluationInput, { createMessage }),
      (error: unknown) => {
        assert.ok(error instanceof EvaluationRunError);
        assert.equal(error.code, "api");
        return true;
      },
    );

    assert.equal(createCalls, 1);
  });

  it("does not retry when the model omits the evaluation tool", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    let createCalls = 0;
    const createMessage: CreateEvaluationMessage = async () => {
      createCalls += 1;
      return {
        id: "msg_test",
        type: "message",
        role: "assistant",
        model: "claude-test-model",
        content: [{ type: "text", text: "No tool output." }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 5, output_tokens: 5 },
      };
    };

    await assert.rejects(
      () => runEvaluation(evaluationInput, { createMessage }),
      (error: unknown) => {
        assert.ok(error instanceof EvaluationRunError);
        assert.equal(error.code, "tool");
        return true;
      },
    );

    assert.equal(createCalls, 1);
  });

  it("marks the static system prompt cacheable and leaves the user message uncached", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const seen: Anthropic.Messages.MessageCreateParamsNonStreaming[] = [];
    const createMessage: CreateEvaluationMessage = async (received) => {
      seen.push(received);
      return seen.length === 1
        ? messageWithToolInput({ invalid: "schema" })
        : messageWithToolInput(EVALUATION_FIXTURE);
    };

    const originalError = console.error;
    console.error = () => {};
    try {
      await runEvaluation(evaluationInput, { createMessage });
    } finally {
      console.error = originalError;
    }

    // Both the first attempt and the schema retry must carry the breakpoint.
    assert.equal(seen.length, 2);
    for (const params of seen) {
      assert.ok(Array.isArray(params.system));
      const system = params.system as Anthropic.Messages.TextBlockParam[];
      assert.equal(system.length, 1);
      assert.equal(system[0]!.type, "text");
      assert.deepEqual(system[0]!.cache_control, { type: "ephemeral" });
      assert.ok(system[0]!.text.length > 1000);
      assert.equal(system[0]!.text.includes(evaluationInput.manuscript), false);
      assert.equal(typeof params.messages[0]!.content, "string");
    }
    // Byte-identical across attempts, which is what makes the retry a cache read.
    assert.equal(
      (seen[0]!.system as Anthropic.Messages.TextBlockParam[])[0]!.text,
      (seen[1]!.system as Anthropic.Messages.TextBlockParam[])[0]!.text,
    );
  });

  it("counts cache writes and reads toward the billed input total", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";

    const createMessage: CreateEvaluationMessage = async () =>
      messageWithToolInput(EVALUATION_FIXTURE, "claude-test-model", {
        input_tokens: 700,
        output_tokens: 40,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 24_000,
      } as Anthropic.Messages.Usage);

    const { inputTokens, outputTokens } = await runEvaluation(evaluationInput, {
      createMessage,
    });

    assert.equal(inputTokens, 24_700);
    assert.equal(outputTokens, 40);
  });

  it("passes an explicit model override into the API call", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const originalModel = process.env.EVALUATION_MODEL;
    process.env.EVALUATION_MODEL = "claude-sonnet-4-6";

    const models: string[] = [];
    const createMessage: CreateEvaluationMessage = async (params) => {
      models.push(params.model);
      return messageWithToolInput(EVALUATION_FIXTURE);
    };

    try {
      await runEvaluation(evaluationInput, {
        createMessage,
        model: "claude-opus-4-8",
      });
      assert.deepEqual(models, ["claude-opus-4-8"]);
    } finally {
      if (originalModel === undefined) {
        delete process.env.EVALUATION_MODEL;
      } else {
        process.env.EVALUATION_MODEL = originalModel;
      }
    }
  });
});
