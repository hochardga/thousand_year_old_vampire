export type PromptVersion = "base" | "alternate_appendix_i";

type SkillTextInput = {
  description: string;
  label: string;
};

export type SetupSkillInput = SkillTextInput;

export type PromptCreatedSkillInput = SkillTextInput;

export type SetupResourceInput = {
  description: string;
  isStationary: boolean;
  label: string;
};

export type SetupCharacterInput = {
  description: string;
  kind: "mortal";
  name: string;
};

export type SetupImmortalCharacterInput = {
  description: string;
  kind: "immortal";
  name: string;
};

export type SetupMarkInput = {
  description: string;
  isConcealed: boolean;
  label: string;
};

export type SetupMemoryInput = {
  entryText: string;
  title: string;
};

export type ChronicleSetupPayload = {
  immortalCharacter: SetupImmortalCharacterInput;
  initialCharacters: SetupCharacterInput[];
  initialResources: SetupResourceInput[];
  initialSkills: SetupSkillInput[];
  mark: SetupMarkInput;
  mortalSummary: string;
  setupMemories: SetupMemoryInput[];
};

export type MemoryDecisionMode =
  | "append-existing"
  | "create-new"
  | "forget-existing"
  | "move-to-diary";

export type MemoryDecisionPayload = {
  memoryId?: string;
  mode: MemoryDecisionMode;
  targetMemoryId?: string;
};

export type ActiveDiarySummary = {
  id: string;
  memoryCapacity: number;
  memoryCount: number;
  title: string;
};

export type SkillMutation = {
  action: "check" | "lose";
  id: string;
};

export type ResourceMutation = {
  action: "lose";
  id: string;
};

export type CharacterMutation = {
  action: "age-out" | "lose";
  id: string;
};

export type MarkMutation = {
  action: "update";
  description: string;
  id: string;
  isActive?: boolean;
  isConcealed?: boolean;
};

export type TraitMutationsPayload = {
  characters: CharacterMutation[];
  marks: MarkMutation[];
  resources: ResourceMutation[];
  skills: SkillMutation[];
};

export type PromptResolutionPayload = {
  experienceText: string;
  memoryDecision: MemoryDecisionPayload;
  newSkill?: PromptCreatedSkillInput;
  playerEntry: string;
  sessionId: string;
  traitMutations: TraitMutationsPayload;
};
