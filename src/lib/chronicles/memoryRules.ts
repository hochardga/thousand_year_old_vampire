export const MEMORY_RULE_MESSAGES = {
  diaryFull: "The diary is already full.",
  duplicateMark: "A mark with this name already exists.",
  duplicateResource: "A resource with this name already exists.",
  duplicateSkill: "A skill with this name already exists.",
  invalidMindTarget: "Choose a memory still held in mind.",
  memoryFull: "That memory is already full.",
  noOpenMindSlot: "No in-mind memory slot is available.",
  onlyMindMemoriesAcceptEntries:
    "Only memories still held in mind can accept new entries.",
  overflowDecisionRequired:
    "A memory decision is required when the mind is full.",
} as const;

const MEMORY_RULE_COPY: Record<string, string> = {
  [MEMORY_RULE_MESSAGES.diaryFull]:
    "The diary is full. Choose a memory to forget, or wait until the diary can hold more.",
  [MEMORY_RULE_MESSAGES.duplicateMark]:
    "That mark name is already in the chronicle. Choose different wording.",
  [MEMORY_RULE_MESSAGES.duplicateResource]:
    "That resource name is already in the chronicle. Choose different wording.",
  [MEMORY_RULE_MESSAGES.duplicateSkill]:
    "That skill name is already in the chronicle. Choose different wording.",
  [MEMORY_RULE_MESSAGES.invalidMindTarget]:
    "Choose a memory still held in mind.",
  [MEMORY_RULE_MESSAGES.memoryFull]: "That memory is already full.",
  [MEMORY_RULE_MESSAGES.noOpenMindSlot]:
    "There is no open space in mind for a new memory yet.",
  [MEMORY_RULE_MESSAGES.onlyMindMemoriesAcceptEntries]:
    "Only memories still held in mind can accept new entries.",
  [MEMORY_RULE_MESSAGES.overflowDecisionRequired]:
    "Choose a memory to forget or move into the diary before adding a new one.",
};

export function toMemoryRuleMessage(message: string) {
  return MEMORY_RULE_COPY[message] ?? message;
}
