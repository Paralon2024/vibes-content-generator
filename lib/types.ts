export const Actions = {
  SendPrompt: 'send_prompt',
  PingContentScript: 'ping_content_script',
  StartBatch: 'start_batch',
  StopBatch: 'stop_batch',
  GetBatchStatus: 'get_batch_status',
  DownloadMediaDirect: 'download_media_direct',
  WriteDone: 'write_done',
  SceneFailed: 'scene_failed',
  BatchStatus: 'batch_status',
  Log: 'log',
  NativeClick: 'native_click',
  NativeType: 'native_type',
  NativeHover: 'native_hover',
} as const;

export const BatchModes = {
  Video: 'video',
  Image: 'image',
} as const;

export type BatchMode = (typeof BatchModes)[keyof typeof BatchModes];

export const SceneStatuses = {
  Processing: 'processing',
  Done: 'done',
  Error: 'error',
} as const;

export type SceneStatus = (typeof SceneStatuses)[keyof typeof SceneStatuses];

export const BatchSites = {
  Vibes: 'vibes',
  Flow: 'flow',
} as const;

export type BatchSite = (typeof BatchSites)[keyof typeof BatchSites];

export type SceneInput =
  | { kind: typeof BatchModes.Image; sceneNumber: number; imagePrompt: string }
  | {
      kind: typeof BatchModes.Video;
      sceneNumber: number;
      imageBase64: string;
      imageName: string;
      videoPrompt: string;
    };

export interface PendingWrite {
  mode: BatchMode;
  site: BatchSite;
  sceneNumber: number;
  urls: string[];
}

export interface BatchStatus {
  active: boolean;
  mode: BatchMode;
  projectName: string;
  currentIndex: number;
  totalScenes: number;
  sceneNumbers: number[];
  sceneStatuses: Record<number, SceneStatus>;
  pendingWrite: PendingWrite | null;
  logStack: LogEntry[];
}

// ── Message contracts ─────────────────────────────────────────────────────────

export interface SendPromptMessage {
  action: typeof Actions.SendPrompt;
  prompt: string;
  mediaType: BatchMode;
  imageBase64: string | null;
  imageName: string | null;
  sceneNumber: number;
}

export interface PingContentScriptMessage {
  action: typeof Actions.PingContentScript;
}

export interface StartBatchMessage {
  action: typeof Actions.StartBatch;
  projectName: string;
  scenes: SceneInput[];
  tabId: number;
  preCompletedSceneNumbers: number[];
  mode: BatchMode;
  site: BatchSite;
}

export interface StopBatchMessage {
  action: typeof Actions.StopBatch;
}

export interface GetBatchStatusMessage {
  action: typeof Actions.GetBatchStatus;
}

export interface DownloadMediaDirectMessage {
  action: typeof Actions.DownloadMediaDirect;
  urls: string[];
  sceneNumber: number;
}

export interface WriteDoneMessage {
  action: typeof Actions.WriteDone;
  sceneNumber: number;
}

export interface SceneFailedMessage {
  action: typeof Actions.SceneFailed;
  sceneNumber: number;
  reason?: string;
  retryAfterMs?: number;
}

export interface BatchStatusMessage {
  action: typeof Actions.BatchStatus;
  status: BatchStatus | null;
}

export const LogKinds = {
  Info: 'info',
  Retry: 'retry',
  Success: 'success',
  Error: 'error',
} as const;

export type LogKind = (typeof LogKinds)[keyof typeof LogKinds];

export const LogLevels = {
  Scene: 0,
  Mode: 1,
  Step: 2,
  Detail: 3,
} as const;

export type LogLevel = (typeof LogLevels)[keyof typeof LogLevels];

export interface LogMessage {
  action: typeof Actions.Log;
  sceneNumber: number;
  step: string;
  kind: LogKind;
  level: LogLevel;
  attempt?: { current: number; max: number };
  cooldownMs?: number;
}

export type LogUpdate = Omit<LogMessage, 'action'>;
export type LogEntry = LogUpdate & { receivedAt: number };

export interface NativeClickMessage {
  action: typeof Actions.NativeClick;
  x: number;
  y: number;
}

export interface NativeTypeMessage {
  action: typeof Actions.NativeType;
  text: string;
}

export interface NativeHoverMessage {
  action: typeof Actions.NativeHover;
  x: number;
  y: number;
}

export type ExtensionMessage =
  | SendPromptMessage
  | PingContentScriptMessage
  | StartBatchMessage
  | StopBatchMessage
  | GetBatchStatusMessage
  | DownloadMediaDirectMessage
  | WriteDoneMessage
  | SceneFailedMessage
  | BatchStatusMessage
  | LogMessage
  | NativeClickMessage
  | NativeTypeMessage
  | NativeHoverMessage;
