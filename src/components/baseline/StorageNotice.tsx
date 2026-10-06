import type { StorageNotice as StorageNoticeValue } from "../../hooks/useLocalBaseline";

export function StorageNotice({
  notice,
  onDismiss,
}: Readonly<{ notice: StorageNoticeValue; onDismiss: () => void }>) {
  return (
    <div className="notice" role="status">
      <p>{notice.message}</p>
      <button className="text-button" type="button" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
