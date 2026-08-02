import { pipeline, env } from '@huggingface/transformers';

// Skip local model checks, fetch directly from HuggingFace Hub
env.allowLocalModels = false;

// We use the singleton pattern to ensure the pipeline is only loaded once.
class PipelineSingleton {
  static task = 'text-generation';
  static model = 'Xenova/Qwen1.5-0.5B-Chat';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback,
        device: 'webgpu' // Prefer WebGPU, fall back to wasm/cpu handled by library
      }).catch(err => {
        // Fallback to WASM if WebGPU is not supported
        console.warn("WebGPU initialization failed, falling back to WASM", err);
        return pipeline(this.task, this.model, {
          progress_callback,
          device: 'wasm'
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
      const generator = await PipelineSingleton.getInstance(x => {
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
    const { prompt, max_new_tokens = 256, temperature = 0.7 } = payload;
    try {
      const generator = await PipelineSingleton.getInstance();
      
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
      });

      // Extract only the new generated text
      const fullText = output[0].generated_text;
      const generated = fullText.slice(text.length);

      self.postMessage({
        type: 'complete',
        payload: { text: generated }
      });
    } catch (err) {
      self.postMessage({ type: 'error', payload: err.message });
    }
  }
});
