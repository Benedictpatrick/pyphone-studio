// Runs the WebGPU MLCEngine off the main thread so model loading and token
// generation never freeze the page UI, even on slower phones.
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
