import type { HmrContext, Plugin } from 'vite';

/**
 * This is a trememndous oversimplification of hot-reloading. However, this allows us to properly update callbacks functions 
 * whenever an imported or importing file is changed. This may prevent weird behavior where a hot-reload happens
 * elsewhere and the callbacks functions are not updated.
 *
 * Unfortunately, this is triggered every time a file is saved, even if there are no changes.
 */
function handleContext(ctx: HmrContext) {
  if (!ctx.file.endsWith(".ts")) {
    return false
  }
  // Delay sending the event to ensure file changes are applied. This is REALLY scuffed.
  setTimeout(() => {
    ctx.server.ws.send({
      type: 'custom',
      event: 'reload-callbacks',
      data: {}
    });
  }, 10); // 10ms is probably enough
}

export default function PWReloadCallbacksPlugin(): Plugin {
  return {
    name: 'reload-callbacks',
    enforce: 'post', // this isnt too important, but it gives us more time to allow the file to be written.
    handleHotUpdate(ctx) {
      handleContext(ctx)
    }
  };
}