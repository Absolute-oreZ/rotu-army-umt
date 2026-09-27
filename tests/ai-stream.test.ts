import assert from "node:assert/strict";
import test from "node:test";
import { readAssistantEventStream } from "../components/ai-assistant/read-event-stream";

function responseFromChunks(chunks: string[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
  );
}

test("assistant SSE parser handles chunked events and completion metadata", async () => {
  const received: string[] = [];
  await readAssistantEventStream(
    responseFromChunks([
      'data: {"type":"start"}\r\n\r\n',
      'data: {"type":"delta","text":"ROTU "}\n\n',
      'data: {"type":"delta","text":"Army"}\n\n',
      'data: {"type":"done"}\n\n',
    ]),
    (event) => {
      if (event.type === "delta") received.push(event.text);
    },
  );
  assert.deepEqual(received, ["ROTU ", "Army"]);
});

test("assistant SSE parser rejects provider failure and incomplete streams", async () => {
  await assert.rejects(
    readAssistantEventStream(
      responseFromChunks([
        'data: {"type":"error","message":"Unavailable"}\n\n',
      ]),
      () => undefined,
    ),
    /Unavailable/u,
  );
  await assert.rejects(
    readAssistantEventStream(
      responseFromChunks(['data: {"type":"start"}\n\n']),
      () => undefined,
    ),
    /ended before completion/u,
  );
});
