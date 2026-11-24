import { Actions, SceneStatuses, BatchModes, LogKinds, LogLevels } from '../../lib/types';
import { Alarms } from '../../lib/constants';
import type { SceneInput, SendPromptMessage, LogUpdate } from '../../lib/types';
import { batchStore } from './batchStore';

function log(update: LogUpdate) {
  browser.runtime.sendMessage({ action: Actions.Log, ...update }).catch(() => {});
  void batchStore.pushLog(update);
}

function buildSendPromptMessage(scene: SceneInput): SendPromptMessage {
  if (scene.kind === BatchModes.Image) {
    return {
      action: Actions.SendPrompt,
      prompt: scene.imagePrompt,
      mediaType: BatchModes.Image,
      imageBase64: null,
      imageName: null,
      sceneNumber: scene.sceneNumber,
    };
  }
  return {
    action: Actions.SendPrompt,
    prompt: scene.videoPrompt,
    mediaType: BatchModes.Video,
    imageBase64: scene.imageBase64,
    imageName: scene.imageName,
    sceneNumber: scene.sceneNumber,
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForContentScript(tabId: number): Promise<boolean> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const response = await browser.tabs.sendMessage(tabId, {
        action: Actions.PingContentScript,
      });
      if (response?.ready === true) return true;
    } catch {
      // Retry briefly in case the tab is navigating or its content script is restarting.
    }

    if (attempt < 5) await wait(500);
  }

  return false;
}

export async function resetSceneTimeout(delayInMinutes: number) {
  await browser.alarms.clear(Alarms.SceneTimeout);
  browser.alarms.create(Alarms.SceneTimeout, { delayInMinutes });
}

export async function runBatchSceneFrom(index: number) {
  const { batch } = batchStore;
  if (!batch || !batch.active) return;
  if (index >= batch.scenes.length) {
    await batchStore.stop();
    batchStore.broadcastStatus();
    return;
  }

  await batchStore.advanceTo(index);
  const scene = batch.scenes[index];
  await batchStore.setSceneStatus(scene.sceneNumber, SceneStatuses.Processing);
  batchStore.broadcastStatus();

  log({
    sceneNumber: scene.sceneNumber,
    step: `Sending prompt (scene ${index + 1}/${batch.scenes.length})`,
    kind: LogKinds.Info,
    level: LogLevels.Scene,
  });

  await resetSceneTimeout(5);

  try {
    const contentReady = await waitForContentScript(batch.tabId);
    if (!contentReady) {
      throw new Error(
        'The content script disconnected. Refresh the generation page and restart the batch.'
      );
    }

    await browser.tabs.sendMessage(batch.tabId, buildSendPromptMessage(scene));
  } catch (err) {
    await browser.alarms.clear(Alarms.SceneTimeout);
    if (!batchStore.batch?.active) return;

    await batchStore.setSceneStatus(scene.sceneNumber, SceneStatuses.Error);
    await batchStore.stop();

    log({
      sceneNumber: scene.sceneNumber,
      step: err instanceof Error
        ? err.message
        : 'Could not connect to the generation tab. Refresh the page and restart the batch.',
      kind: LogKinds.Error,
      level: LogLevels.Scene,
    });

    batchStore.broadcastStatus();
  }
}

export async function advanceAfterPendingWrite(sceneNumber: number) {
  const { batch } = batchStore;
  if (!batch) return;
  await batchStore.clearPendingWrite();
  await batchStore.setSceneStatus(sceneNumber, SceneStatuses.Done);
  batchStore.broadcastStatus();

  const nextIdx = batch.currentIndex + 1;
  const isLastScene = nextIdx >= batch.scenes.length;

  if (isLastScene) {
    const errorCount = Object.values(batch.sceneStatuses).filter(
      (s) => s === SceneStatuses.Error
    ).length;
    const step =
      errorCount > 0
        ? `Batch complete, ${errorCount} scene(s) failed`
        : 'Batch complete, no errors';
    log({
      sceneNumber,
      step,
      kind: errorCount > 0 ? LogKinds.Error : LogKinds.Success,
      level: LogLevels.Scene,
    });
    await runBatchSceneFrom(nextIdx);
    return;
  }

  const nextDelayMs = batch.mode === BatchModes.Video ? 12000 : 4000;
  log({
    sceneNumber,
    step: 'Scene completed, next one starting shortly',
    kind: LogKinds.Success,
    level: LogLevels.Scene,
    cooldownMs: nextDelayMs,
  });
  setTimeout(() => {
    if (batchStore.batch?.active) runBatchSceneFrom(nextIdx);
  }, nextDelayMs);
}

export async function markSceneErrorAndAdvance(
  sceneNumber: number,
  reason?: string,
  retryAfterMs?: number
) {
  const { batch } = batchStore;
  if (!batch) return;
  log({
    sceneNumber,
    step: reason ?? 'Scene marked as failed, moving on',
    kind: LogKinds.Error,
    level: LogLevels.Scene,
  });
  await batchStore.setSceneStatus(sceneNumber, SceneStatuses.Error);
  await batchStore.clearPendingWrite();
  batchStore.broadcastStatus();
  await browser.alarms.clear(Alarms.SceneTimeout);
  const nextIdx = batch.currentIndex + 1;
  setTimeout(() => {
    if (batchStore.batch?.active) runBatchSceneFrom(nextIdx);
  }, retryAfterMs ?? 1000);
}
