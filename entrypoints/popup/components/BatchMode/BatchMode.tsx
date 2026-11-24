import { useState } from 'react';
import { Actions, SceneStatuses, BatchModes, BatchSites } from '../../../../lib/types';
import type { BatchMode, BatchSite, BatchStatus, SceneInput } from '../../../../lib/types';
import { storeProjectHandle } from '../../utils';
import { ProjectFiles, SUPPORTED_SITES } from '../../../../lib/constants';
import { ActiveBatchView } from './components/ActiveBatchView';
import { ProjectSetupView } from './components/ProjectSetupView';
import { getPreCompleted } from './scenePrompts';
import {
  readCompletedScenes,
  validateSceneRefImages,
  buildImageScenes,
  buildVideoScenes,
} from './projectFiles';
import type { SceneData } from './BatchMode.types';

function detectSite(tabUrl: string | undefined): BatchSite | null {
  if (!tabUrl) return null;

  try {
    const hostname = new URL(tabUrl).hostname.toLowerCase();

    if (hostname === 'vibes.ai' || hostname.endsWith('.vibes.ai')) {
      return BatchSites.Vibes;
    }

    if (
      hostname === 'flow.google.com' ||
      hostname.endsWith('.flow.google.com') ||
      hostname === 'labs.google' ||
      hostname.endsWith('.labs.google')
    ) {
      return BatchSites.Flow;
    }
  } catch {
    return null;
  }

  return null;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForContentScript(tabId: number): Promise<boolean> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const response = await browser.tabs.sendMessage(tabId, {
        action: Actions.PingContentScript,
      });
      if (response?.ready === true) return true;
    } catch {
      // The content script may still be starting, or the page may need refresh.
    }

    if (attempt < 9) await wait(500);
  }

  return false;
}

interface Props {
  batchStatus: BatchStatus | null;
  grantedHandleRef: { current: FileSystemDirectoryHandle | null };
  onBatchStart: () => void;
  onBatchStop: () => void;
}

export default function BatchMode({
  batchStatus,
  grantedHandleRef,
  onBatchStart,
  onBatchStop,
}: Props) {
  const [projectHandle, setProjectHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [projectName, setProjectName] = useState('');
  const [batchScenes, setBatchScenes] = useState<SceneData[]>([]);
  const [completedScenes, setCompletedScenes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [batchType, setBatchType] = useState<BatchMode>(BatchModes.Image);

  const isBatchActive = batchStatus?.active === true;
  const doneCount = batchStatus
    ? Object.values(batchStatus.sceneStatuses).filter((s) => s === SceneStatuses.Done).length
    : 0;
  const pendingScenes = batchScenes.filter((s) => !completedScenes.has(s.scene_number));

  const selectFolder = async () => {
    let handle: FileSystemDirectoryHandle;
    try {
      handle = await showDirectoryPicker({ mode: 'readwrite' });
    } catch (err: unknown) {
      if ((err as DOMException)?.name !== 'AbortError') {
        setStatusMsg('Could not open the folder picker.');
      }
      return;
    }

    setProjectHandle(handle);
    setProjectName(handle.name);
    grantedHandleRef.current = handle;
    setStatusMsg('');

    await storeProjectHandle(handle);

    let rawText: string;
    try {
      const scriptFile = await (await handle.getFileHandle(ProjectFiles.Script)).getFile();
      rawText = await scriptFile.text();
    } catch {
      setStatusMsg(
        `Could not find "${ProjectFiles.Script}" in the selected folder. Check that the file name is correct.`
      );
      return;
    }

    let parsed: { scenes: SceneData[] };
    try {
      const cleaned = rawText.trim().replace(/^```json\s*|^```\s*|```$/g, '');
      parsed = JSON.parse(cleaned) as { scenes: SceneData[] };
    } catch (err: unknown) {
      setStatusMsg(
        `The file ${ProjectFiles.Script} is not valid JSON: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }

    try {
      setBatchScenes(parsed.scenes);
      setCompletedScenes(await readCompletedScenes(handle, batchType));
    } catch (err: unknown) {
      setStatusMsg(
        `Error reading project progress: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const switchBatchType = async (type: BatchMode) => {
    setBatchType(type);
    if (projectHandle) setCompletedScenes(await readCompletedScenes(projectHandle, type));
  };

  const startBatch = async () => {
    if (!projectHandle || pendingScenes.length === 0) return;

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatusMsg(
        `First, open ${SUPPORTED_SITES.map((s) => s.name).join(' or ')} in the active tab.`
      );
      return;
    }

    const site = detectSite(tab.url);
    if (!site) {
      setStatusMsg('Open a Vibes AI or Google Flow tab before starting the batch.');
      return;
    }

    if (batchType === BatchModes.Video) {
      const missing = await validateSceneRefImages(projectHandle, pendingScenes);
      if (missing.length > 0) {
        setStatusMsg(
          `Missing reference images for scenes: ${missing.sort((a, b) => a - b).join(', ')}. Generate the images first.`
        );
        return;
      }
    }

    setLoading(true);
    setStatusMsg('Checking connection to the selected generation tab...');

    try {
      const scenes: SceneInput[] =
        batchType === BatchModes.Image
          ? buildImageScenes(pendingScenes)
          : await buildVideoScenes(projectHandle, pendingScenes);

      const contentReady = await waitForContentScript(tab.id);
      if (!contentReady) {
        setStatusMsg(
          'The extension cannot connect to this tab. Refresh the Vibes AI or Google Flow page, then try again.'
        );
        return;
      }

      onBatchStart();
      await browser.runtime.sendMessage({
        action: Actions.StartBatch,
        projectName,
        scenes,
        tabId: tab.id,
        preCompletedSceneNumbers: getPreCompleted(batchScenes, pendingScenes),
        mode: batchType,
        site,
      });
      setStatusMsg('');
    } catch (err: unknown) {
      setStatusMsg('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const notifyBackground = (message: object) =>
    browser.runtime.sendMessage(message).catch(() => { });

  const stopBatch = () => {
    onBatchStop();
    notifyBackground({ action: Actions.StopBatch });
  };

  if (isBatchActive) {
    return <ActiveBatchView batchStatus={batchStatus} doneCount={doneCount} onStop={stopBatch} />;
  }

  return (
    <ProjectSetupView
      projectHandle={projectHandle}
      projectName={projectName}
      batchType={batchType}
      batchScenes={batchScenes}
      completedScenes={completedScenes}
      pendingScenes={pendingScenes}
      loading={loading}
      statusMsg={statusMsg}
      batchStatus={batchStatus}
      doneCount={doneCount}
      onSelectFolder={selectFolder}
      onSwitchBatchType={switchBatchType}
      onStartBatch={startBatch}
    />
  );
}
