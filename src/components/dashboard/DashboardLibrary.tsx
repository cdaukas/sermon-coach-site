"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SermonList } from "@/components/dashboard/SermonList";
import {
  deleteSermon,
  restoreSermon,
  toggleGrowthExclusion,
} from "@/lib/sermons/actions";
import {
  DELETE_RETENTION_DAYS,
  type DashboardSermonRow,
  type DeletedSermonRow,
} from "@/lib/sermons/types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type ToastState = {
  message: string;
  undoSermonId?: string;
};

function daysBetween(fromIso: string, to = new Date()): number {
  const from = new Date(fromIso).getTime();
  const diff = to.getTime() - from;
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function deletedRowMeta(deletedAt: string): string {
  const daysAgo = daysBetween(deletedAt);
  const daysLeft = Math.max(0, DELETE_RETENTION_DAYS - daysAgo);
  const agoLabel =
    daysAgo === 0
      ? "Deleted today"
      : daysAgo === 1
        ? "Deleted 1 day ago"
        : `Deleted ${daysAgo} days ago`;
  const leftLabel = daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
  return `${agoLabel} · ${leftLabel}`;
}

export function DashboardLibrary({
  sermons,
  deleted,
  growthAllowed,
  hideUnevaluatedBand = false,
}: {
  sermons: DashboardSermonRow[];
  deleted: DeletedSermonRow[];
  growthAllowed: boolean;
  hideUnevaluatedBand?: boolean;
}) {
  const router = useRouter();
  const [busySermonId, setBusySermonId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DashboardSermonRow | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current != null) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingDelete) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPendingDelete(null);
        setDeleteError(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [pendingDelete]);

  function showToast(next: ToastState) {
    if (toastTimer.current != null) {
      window.clearTimeout(toastTimer.current);
    }
    setToast(next);
    toastTimer.current = window.setTimeout(() => setToast(null), 6000);
  }

  async function handleToggleExclude(sermonId: string, excluded: boolean) {
    setBusySermonId(sermonId);
    const result = await toggleGrowthExclusion(sermonId, excluded);
    setBusySermonId(null);
    if (!result.ok) {
      showToast({ message: result.error });
      return;
    }
    router.refresh();
    showToast({
      message: excluded
        ? "Excluded from growth tracking. Your evaluation is still here and still readable."
        : "Back in your growth tracking.",
    });
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    const sermon = pendingDelete;
    setBusySermonId(sermon.id);
    setDeleteError(null);
    const result = await deleteSermon(sermon.id);
    setBusySermonId(null);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    setPendingDelete(null);
    router.refresh();
    showToast({
      message:
        "Deleted. You can restore it from Recently deleted for 30 days.",
      undoSermonId: sermon.id,
    });
  }

  async function handleRestore(sermonId: string, fromUndo = false) {
    setBusySermonId(sermonId);
    const result = await restoreSermon(sermonId);
    setBusySermonId(null);
    if (!result.ok) {
      showToast({ message: result.error });
      return;
    }
    router.refresh();
    if (fromUndo) {
      setToast(null);
      return;
    }
    showToast({ message: "Restored." });
  }

  return (
    <div>
      {sermons.length > 0 ? (
        <SermonList
          sermons={sermons}
          busySermonId={busySermonId}
          growthAllowed={growthAllowed}
          hideUnevaluatedBand={hideUnevaluatedBand}
          onToggleExclude={handleToggleExclude}
          onRequestDelete={(sermon) => {
            setDeleteError(null);
            setPendingDelete(sermon);
          }}
        />
      ) : null}

      {deleted.length > 0 ? (
        <details className="dashboard-recently-deleted">
          <summary className="dashboard-recently-deleted-summary">
            Recently deleted
          </summary>
          <p
            className="dashboard-recently-deleted-subhead"
            style={{ ...uiFont }}
          >
            Deleted sermons stay here for 30 days, then are permanently removed.
          </p>
          <ul className="dashboard-recently-deleted-list">
            {deleted.map((row) => (
              <li key={row.id} className="dashboard-recently-deleted-row">
                <div className="dashboard-recently-deleted-copy">
                  <p
                    className="dashboard-recently-deleted-title"
                    style={{ ...serifFont }}
                  >
                    {row.title}
                  </p>
                  <p
                    className="dashboard-recently-deleted-meta"
                    style={{ ...uiFont }}
                  >
                    {deletedRowMeta(row.deleted_at)}
                  </p>
                </div>
                <button
                  type="button"
                  className="dashboard-recently-deleted-restore"
                  disabled={busySermonId === row.id}
                  onClick={() => void handleRestore(row.id)}
                  style={{ ...uiFont }}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {pendingDelete ? (
        <div className="dashboard-dialog-backdrop">
          <div
            className="dashboard-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-sermon-title"
          >
            <h2 id="delete-sermon-title" style={{ ...serifFont }}>
              Delete this sermon?
            </h2>
            <p style={{ ...uiFont }}>
              {growthAllowed
                ? "This removes the sermon and its evaluation from your dashboard and your growth tracking. You can restore it for the next 30 days, after which it is permanently deleted."
                : "This removes the sermon and its evaluation from your dashboard. You can restore it for the next 30 days, after which it is permanently deleted."}
            </p>
            <p style={{ ...uiFont }}>
              Deleting does not return the evaluation credit you used.
            </p>
            {deleteError ? (
              <p className="dashboard-dialog-error" role="alert" style={{ ...uiFont }}>
                {deleteError}
              </p>
            ) : null}
            <div className="dashboard-dialog-actions">
              <button
                type="button"
                className="dashboard-dialog-cancel"
                onClick={() => {
                  setPendingDelete(null);
                  setDeleteError(null);
                }}
                style={{ ...uiFont }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dashboard-dialog-delete"
                disabled={busySermonId === pendingDelete.id}
                onClick={() => void handleConfirmDelete()}
                style={{ ...uiFont }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="dashboard-toast" role="status" style={{ ...uiFont }}>
          <span>{toast.message}</span>
          {toast.undoSermonId ? (
            <button
              type="button"
              className="dashboard-toast-undo"
              onClick={() => void handleRestore(toast.undoSermonId!, true)}
            >
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
