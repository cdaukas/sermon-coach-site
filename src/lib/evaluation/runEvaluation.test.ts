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
    usage: { input_tokens: 10, output_tokens: 20 },
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
        return messageWithToolInput({ invalid: "schema" });
      }
      return messageWithToolInput(EVALUATION_FIXTURE);
    };

    const { result, model } = await runEvaluation(evaluationInput, {
      createMessage,
    });

    assert.equal(createCalls, 2);
    assert.equal(model, "claude-test-model");
    assert.equal(result.meta.sermon_title, EVALUATION_FIXTURE.meta.sermon_title);
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
});
