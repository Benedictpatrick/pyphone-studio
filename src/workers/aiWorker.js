import { pipeline, env } from '@huggingface/transformers';

// Skip local model checks, fetch directly from HuggingFace Hub
env.allowLocalModels = false;

// We use the singleton pattern to ensure the pipeline is only loaded once.
class PipelineSingleton {
  static task = 'text-generation';
  static model = null;
  static instance = null;

  static async getInstance(modelId, progress_callback = null) {
    if (this.model !== modelId || this.instance === null) {
      this.model = modelId;
      this.instance = pipeline(this.task, modelId, {
        progress_callback,
        device: 'webgpu', // Prefer WebGPU, fall back to wasm/cpu handled by library
        dtype: 'q4'
      }).catch(err => {
        // Fallback to WASM if WebGPU is not supported
        console.warn("WebGPU initialization failed, falling back to WASM", err);
        return pipeline(this.task, modelId, {
          progress_callback,
          device: 'wasm',
          dtype: 'q4'
        });
      });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  
  if (type === 'init') {
    // Initiate the download and loading of the model
    try {
      const generator = await PipelineSingleton.getInstance(payload.model, x => {
        // Send progress updates back to the UI
        self.postMessage({
          type: 'progress',
          payload: x
        });
      });
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', payload: err.message });
    }
  }

  if (type === 'generate') {
    const { prompt, model, max_new_tokens = 256, temperature = 0.7 } = payload;
    try {
      const generator = await PipelineSingleton.getInstance(model);
      
      const messages = [
        { role: 'system', content: 'You are Pyxi, an expert Python coding assistant. Write clean, complete Python code. Do not include markdown explanations unless asked, just the code block.' },
        { role: 'user', content: prompt }
      ];

      // Format messages into chat template
      const text = generator.tokenizer.apply_chat_template(messages, {
        tokenize: false,
        add_generation_prompt: true,
      });

      // Generate response
      const output = await generator(text, {
        max_new_tokens,
        temperature,
        do_sample: temperature > 0.0,
        callback_function: (x) => {
          self.postMessage({ type: 'update' });
        }
      });

      // Extract only the new generated text
      let generated = "";
      if (Array.isArray(output) && output[0]) {
        if (typeof output[0].generated_text === 'string') {
          const fullText = output[0].generated_text;
          generated = fullText.startsWith(text) ? fullText.slice(text.length).trim() : fullText.trim();
        } else if (Array.isArray(output[0].generated_text)) {
          const lastMsg = output[0].generated_text[output[0].generated_text.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            generated = lastMsg.content;
          }
        } else if (typeof output[0] === 'string') {
          generated = output[0];
        }
      } else if (typeof output === 'string') {
        generated = output;
      }
      
      if (!generated) {
        generated = "Sorry, I could not generate a response. Please try a different prompt.";
      }

      self.postMessage({
        type: 'complete',
        payload: { text: generated }
      });
    } catch (err) {
      self.postMessage({ type: 'error', payload: err.message || String(err) || "Unknown error during generation" });
    }
  }
});
