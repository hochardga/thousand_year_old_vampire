import type { ChronicleSetupPayload } from "@/types/chronicle";

const setupDraftPrefix = "tyov.setup.";
const promptDraftPrefix = "tyov.prompt.";

export type PromptDraft = {
  experienceText: string;
  newResourceDescription: string;
  newResourceIsStationary: boolean;
  newResourceLabel: string;
  newSkillDescription: string;
  newSkillLabel: string;
  playerEntry: string;
  shouldCreateResource: boolean;
  shouldCreateSkill: boolean;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string) {
  if (!canUseStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadSetupDraft(chronicleId: string) {
  return readJson<ChronicleSetupPayload>(`${setupDraftPrefix}${chronicleId}`);
}

export function saveSetupDraft(
  chronicleId: string,
  draft: ChronicleSetupPayload,
) {
  writeJson(`${setupDraftPrefix}${chronicleId}`, draft);
}

export function clearSetupDraft(chronicleId: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(`${setupDraftPrefix}${chronicleId}`);
}

export function loadPromptDraft(chronicleId: string) {
  return readJson<PromptDraft>(`${promptDraftPrefix}${chronicleId}`);
}

export function savePromptDraft(chronicleId: string, draft: PromptDraft) {
  writeJson(`${promptDraftPrefix}${chronicleId}`, draft);
}

export function clearPromptDraft(chronicleId: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(`${promptDraftPrefix}${chronicleId}`);
}
