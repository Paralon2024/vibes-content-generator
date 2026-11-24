import { BatchModes } from '../../../../../../lib/types';
import type { BatchMode, BatchStatus } from '../../../../../../lib/types';
import { pad4 } from '../../../../../../lib/constants';
import { StatusSceneGrid } from '../StatusSceneGrid';
import type { SceneData } from '../../BatchMode.types';

interface ProjectSetupViewProps {
  projectHandle: FileSystemDirectoryHandle | null;
  projectName: string;
  batchType: BatchMode;
  batchScenes: SceneData[];
  completedScenes: Set<number>;
  pendingScenes: SceneData[];
  loading: boolean;
  statusMsg: string;
  batchStatus: BatchStatus | null;
  doneCount: number;
  onSelectFolder: () => void;
  onSwitchBatchType: (type: BatchMode) => void;
  onStartBatch: () => void;
}

// Rendered when no batch is running — pick a project folder, switch
// image/video mode, review pending scenes, and kick off a batch.
export function ProjectSetupView({
  projectHandle,
  projectName,
  batchType,
  batchScenes,
  completedScenes,
  pendingScenes,
  loading,
  statusMsg,
  batchStatus,
  doneCount,
  onSelectFolder,
  onSwitchBatchType,
  onStartBatch,
}: ProjectSetupViewProps) {
  return (
    <div className="main">
      <button className="folder-select-btn" onClick={onSelectFolder} disabled={loading}>
        {projectHandle ? `📁 ${projectName}` : '📂 Select project folder'}
      </button>

      {projectHandle && (
        <div className="mode-tabs">
          <button
            className={batchType === BatchModes.Image ? 'active' : ''}
            onClick={() => onSwitchBatchType(BatchModes.Image)}
          >
            🖼 Images
          </button>
          <button
            className={batchType === BatchModes.Video ? 'active' : ''}
            onClick={() => onSwitchBatchType(BatchModes.Video)}
          >
            🎬 Videos
          </button>
        </div>
      )}

      {batchScenes.length > 0 && (
        <>
          <p className="scenes-count">
            {pendingScenes.length} pending · {completedScenes.size} already generated
          </p>
          <div className="scene-grid">
            {batchScenes.map((s) => (
              <div
                key={s.scene_number}
                className={`scene-cell ${completedScenes.has(s.scene_number) ? 'scene-cell--done' : ''}`}
                title={`Scene ${pad4(s.scene_number)}`}
              >
                {completedScenes.has(s.scene_number) ? '✓' : '·'}
              </div>
            ))}
          </div>
          {pendingScenes.length > 0 ? (
            <button className="generate-btn" onClick={onStartBatch} disabled={loading}>
              {loading
                ? batchType === BatchModes.Image
                  ? 'Starting...'
                  : 'Loading images...'
                : `Generate ${batchType === BatchModes.Image ? 'images' : 'videos'} (${pendingScenes.length} pending)`}
            </button>
          ) : (
            <p className="status status-success">All scenes have already been generated ✓</p>
          )}
        </>
      )}

      {batchStatus && !batchStatus.active && batchStatus.totalScenes > 0 && (
        <div className="last-batch">
          <p className="last-batch__label">
            {batchStatus.mode === BatchModes.Image ? '🖼' : '🎬'} Last run: {batchStatus.projectName} ·{' '}
            {doneCount}/{batchStatus.totalScenes} completed
          </p>
          <StatusSceneGrid
            sceneNumbers={batchStatus.sceneNumbers}
            sceneStatuses={batchStatus.sceneStatuses}
          />
        </div>
      )}

      {statusMsg && <p className="status status-error">{statusMsg}</p>}
    </div>
  );
}
