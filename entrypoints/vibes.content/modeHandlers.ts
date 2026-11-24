import { BatchModes, LogKinds, LogLevels } from '../../lib/types';
import { GenerateButtonSelectors } from '../../lib/selectors/vibes';
import {
  IMAGE_SCENE_RETRY_DELAY_MS,
  VIDEO_SCENE_RETRY_DELAY_MS,
  IMAGE_BATCH_SETTLE_TIMEOUT_MS,
  VIDEO_BATCH_SETTLE_TIMEOUT_MS,
} from './constants';
import { log } from './log';
import { ensureMode, createGenerateAttempt } from './modeSwitch';
import { attachStartFrame, removeStartFrame } from './startFrame';
import { generateWithRetries, reportSceneFailed } from './mediaPolling';

// ── Mode handlers ─────────────────────────────────────────────────────────────

export async function handleImageMode(prompt: string, sceneNumber: number) {
  log({ sceneNumber, step: 'Generating image', kind: LogKinds.Info, level: LogLevels.Mode });

  const switched = await ensureMode(BatchModes.Image);
  if (!switched) {
    await reportSceneFailed(
      sceneNumber,
      'Could not switch to image mode.',
      IMAGE_SCENE_RETRY_DELAY_MS
    );
    return;
  }

  const generateAttempt = createGenerateAttempt(prompt, GenerateButtonSelectors.Image);

  generateWithRetries(
    sceneNumber,
    BatchModes.Image,
    generateAttempt,
    IMAGE_SCENE_RETRY_DELAY_MS,
    IMAGE_BATCH_SETTLE_TIMEOUT_MS
  );
}

export async function handleVideoMode(
  prompt: string,
  imageBase64: string | null,
  imageName: string | null,
  sceneNumber: number
) {
  if (!imageBase64 || !imageName) {
    await reportSceneFailed(
      sceneNumber,
      'A reference image is required for video generation.',
      VIDEO_SCENE_RETRY_DELAY_MS
    );
    return;
  }

  log({ sceneNumber, step: 'Generating video', kind: LogKinds.Info, level: LogLevels.Mode });

  const switched = await ensureMode(BatchModes.Video);
  if (!switched) {
    await reportSceneFailed(
      sceneNumber,
      'Could not switch to video mode.',
      VIDEO_SCENE_RETRY_DELAY_MS
    );
    return;
  }

  const attached = await attachStartFrame(imageBase64, imageName, sceneNumber);
  if (!attached) {
    await reportSceneFailed(
      sceneNumber,
      'Could not attach the start frame.',
      VIDEO_SCENE_RETRY_DELAY_MS
    );
    return;
  }

  const generateAttempt = createGenerateAttempt(prompt, GenerateButtonSelectors.Video);

  await generateWithRetries(
    sceneNumber,
    BatchModes.Video,
    generateAttempt,
    VIDEO_SCENE_RETRY_DELAY_MS,
    VIDEO_BATCH_SETTLE_TIMEOUT_MS
  );

  await removeStartFrame();
}
