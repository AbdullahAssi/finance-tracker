import { Directory, File } from 'expo-file-system';
import { SYNC_FILE_NAME, type FolderIO } from './folderData';

/** Android's folder picker. Returns null if the user backs out. The permission is kept across app restarts. */
export async function pickFolder(): Promise<{ uri: string; label: string } | null> {
  try {
    const dir = await Directory.pickDirectoryAsync();
    return { uri: dir.uri, label: folderLabel(dir.uri) };
  } catch (e: any) {
    if (/cancel/i.test(`${e?.code ?? ''} ${e?.message ?? ''}`)) return null;
    throw e;
  }
}

/** Readable name for a picked folder, e.g. "Documents/Expenses" instead of a content:// URI. */
export function folderLabel(uri: string) {
  try {
    const tree = decodeURIComponent(uri.split('/tree/')[1] ?? '');
    const path = tree.includes(':') ? tree.slice(tree.indexOf(':') + 1) : tree;
    return path || 'Selected folder';
  } catch {
    return 'Selected folder';
  }
}

/** The data file inside the picked folder, found on every call so a deleted file is noticed. */
export function directoryIO(uri: string): FolderIO {
  const dir = new Directory(uri);
  const find = () => dir.list().find((e): e is File => e instanceof File && e.name === SYNC_FILE_NAME) ?? null;

  return {
    exists: () => !!find(),
    sizeBytes: () => find()?.size ?? 0,
    readText: async () => {
      const file = find();
      if (!file) throw new Error('The sync file is missing.');
      return file.text();
    },
    writeText: (text) => {
      const file = find() ?? dir.createFile(SYNC_FILE_NAME, 'application/json');
      file.write(text);
    },
  };
}

/** Turns low-level Android errors into something a person can act on. */
export function friendlyFolderError(e: any): string {
  const msg = String(e?.message ?? e);
  if (e?.name === 'FolderDataError' || /sync file|Expense Tracker data/i.test(msg)) return msg;
  if (/permission|denied|not exist|no longer|security|SAF|FileNotFound/i.test(msg)) {
    return 'The app lost access to the sync folder. Open Sync & Backup and choose the folder again.';
  }
  return 'Could not reach the sync folder. Check that it still exists and try again.';
}
