import { Actions, BatchModes } from '../../lib/types';
import type { ExtensionMessage } from '../../lib/types';
import { setAborted } from './abortState';
import { handleImageMode, handleVideoMode } from './modeHandlers';

export default defineContentScript({
  matches: [
    '*://labs.google/*',
    '*://*.labs.google/*',
    '*://flow.google.com/*',
    '*://*.flow.google.com/*',
  ],
  main() {
    browser.runtime.onMessage.addListener(
      (message: ExtensionMessage, _sender, sendResponse) => {
      switch (message.action) {
        case Actions.PingContentScript:
            sendResponse({ ready: true, site: 'flow' });
            return;

        case Actions.StopBatch:
          setAborted(true);
          return;

        case Actions.SendPrompt: {
          setAborted(false);
          const { prompt, mediaType, imageBase64, imageName, sceneNumber } = message;
          if (mediaType === BatchModes.Image) {
            handleImageMode(prompt, sceneNumber);
          } else {
            handleVideoMode(prompt, imageBase64, imageName, sceneNumber);
          }
          return;
        }

        default:
          return;
      }
      }
    );
  },
});
