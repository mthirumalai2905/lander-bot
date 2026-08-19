import type { ComponentState, DesignComponent } from "./component";
import type { Operation } from "./operation";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  appliedChanges?: string[];
  error?: boolean;
  retryable?: boolean;
  timestamp: number;
}

export interface OperationHistoryEntry {
  id: string;
  timestamp: number;
  operations: Operation[];
  previousState: Record<string, ComponentState | null>;
  nextState: Record<string, ComponentState | null>;
  createdIds: string[];
  deletedIds: string[];
  previousProtected: Record<string, boolean>;
  nextProtected: Record<string, boolean>;
  previousGroups: Record<string, string[]>;
  nextGroups: Record<string, string[]>;
  previousSource?: string;
  nextSource?: string;
}

export interface ConversationState {
  messages: ChatMessage[];
  activeComponentId: string | null;
  selectedComponentIds: string[];
  lastCreatedComponentIds: string[];
  lastModifiedComponentIds: string[];
  lastCreatedGroupId: string | null;
  operationHistory: OperationHistoryEntry[];
}

export interface PersistedSession {
  components: DesignComponent[];
  groups: Record<string, string[]>;
  conversation: ConversationState;
}
