export interface ReplayRecord { readonly observationId: string; readonly fingerprint: string; readonly evidenceId: string; }
export interface ReplayStore {
  findByObservationId(observationId: string): ReplayRecord | undefined;
  findByFingerprint(fingerprint: string): ReplayRecord | undefined;
  record(record: ReplayRecord): void;
}
export class InMemoryReplayStore implements ReplayStore {
  readonly #byObservation = new Map<string, ReplayRecord>();
  readonly #byFingerprint = new Map<string, ReplayRecord>();
  findByObservationId(observationId: string): ReplayRecord | undefined { return this.#byObservation.get(observationId); }
  findByFingerprint(fingerprint: string): ReplayRecord | undefined { return this.#byFingerprint.get(fingerprint); }
  record(record: ReplayRecord): void { this.#byObservation.set(record.observationId, record); this.#byFingerprint.set(record.fingerprint, record); }
}
