import { MoneveroStorageError, toStorageError } from "./storage-errors";
import {
  MONEVERO_DATABASE_NAME,
  MONEVERO_DATABASE_VERSION,
  META_STORE,
  PERSISTENCE_SCHEMA_META_KEY,
  WORKSPACES_STORE,
  type PersistenceSchemaMeta,
} from "./types";

export type DatabaseOptions = Readonly<{
  indexedDB?: IDBFactory;
}>;

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed."));
    };
  });
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    };
    transaction.onerror = () => {
      // onabort owns rejection so the transaction's final state is known.
    };
  });
}

export class MoneveroDatabase {
  constructor(readonly database: IDBDatabase) {}

  close(): void {
    this.database.close();
  }

  async read<T>(
    storeNames: string | readonly string[],
    operation: (transaction: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    return this.run(storeNames, "readonly", operation);
  }

  async write<T>(
    storeNames: string | readonly string[],
    operation: (transaction: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    return this.run(storeNames, "readwrite", operation);
  }

  private async run<T>(
    storeNames: string | readonly string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    let transaction: IDBTransaction;
    try {
      transaction = this.database.transaction(storeNames, mode);
    } catch (error) {
      throw toStorageError(
        error,
        "transaction-failed",
        "Could not start local transaction.",
      );
    }
    try {
      const result = await operation(transaction);
      await transactionDone(transaction);
      return result;
    } catch (error) {
      if (transaction.mode === "readwrite") {
        try {
          transaction.abort();
        } catch {
          // It may already have aborted or completed.
        }
      }
      throw toStorageError(
        error,
        "transaction-failed",
        "Local transaction failed.",
      );
    }
  }
}

export async function openMoneveroDatabase(
  options: DatabaseOptions = {},
): Promise<MoneveroDatabase> {
  const globalFactory = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  const factory = options.indexedDB ?? globalFactory;
  if (factory === undefined)
    throw new MoneveroStorageError(
      "indexeddb-unavailable",
      "Browser-local IndexedDB is unavailable.",
    );

  let request: IDBOpenDBRequest;
  try {
    request = factory.open(MONEVERO_DATABASE_NAME, MONEVERO_DATABASE_VERSION);
  } catch (error) {
    throw toStorageError(
      error,
      "database-open-failed",
      "Could not open local database.",
    );
  }

  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(WORKSPACES_STORE))
      database.createObjectStore(WORKSPACES_STORE, { keyPath: "id" });
    if (!database.objectStoreNames.contains(META_STORE))
      database.createObjectStore(META_STORE, { keyPath: "key" });
    const transaction = request.transaction;
    if (transaction !== null) {
      const metadata: PersistenceSchemaMeta = {
        key: PERSISTENCE_SCHEMA_META_KEY,
        databaseVersion: 1,
        workspaceSchemaVersion: 2,
      };
      transaction.objectStore(META_STORE).put(metadata);
    }
  };

  try {
    const database = await requestToPromise(request);
    database.onversionchange = () => {
      database.close();
    };
    return new MoneveroDatabase(database);
  } catch (error) {
    throw toStorageError(
      error,
      "database-open-failed",
      "Could not open local database.",
    );
  }
}
