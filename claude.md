CLAUDE.md --- Lander Bot AI Design Editor POC

1. Mission

Build a functional POC for Lander Bot, an AI powered design editing
assistant.

The product concept is:

User natural language → AI intent understanding → structured
operations → permission filter → deterministic component engine →
animated canvas

The AI must NOT execute arbitrary React code itself. The AI
proposes structured operations against registered component instances,
and may also propose a gated source_edit when the user asks for a new
shape or structure that props cannot express. The application validates,
compiles through a whitelist, and executes those operations.

For this POC, use one animated Strand component as the initial
component type, but the architecture MUST support an arbitrary number of
instances and arbitrary numbers of operations.

2. POC Scope

Build:

Dark premium design editor UI

Left canvas

Right persistent Lander Bot chat panel

Animated Strand component

Component IDs and centralized state

Component selection

Duplicate one or many instances

Move

Scale

Rotate

Recolor

Delete

Flip

Relative positioning

Batch operations

Per attribute permissions / locking

DeepSeek API integration

Structured AI operation schema

Operation validation

Conversation context

Reference resolution such as "it", "the second one", "the copies"

Operation history

Undo

Local persistence

Source code viewer in the upper/right portion of the left canvas

Do NOT implement yet:

Graph database

RAG

Vector database

500 component ingestion

Payments

Stripe

Multi user collaboration

Authentication

Production database

Arbitrary AI generated code execution

The architecture must leave room for those features later.

3. Technology

Use:

React

TypeScript

Vite

Tailwind CSS

Motion for React

Zustand

Zod

DeepSeek API

localStorage for POC persistence

Install:

npm install motion zustand zod

Use Motion through:

import { motion } from "motion/react";

Use Zod to validate every AI operation before execution.

Use Zustand as the single client side source of truth for canvas state.

4. Visual Design

The application should resemble a premium dark AI design editor.

Overall layout:

┌─────────────────────────────────────────────────────────────────────┐
│                       Lander Bot — POC                              │
├────────────────────────────────────────────┬────────────────────────┤
│                                            │                        │
│                DESIGN CANVAS               │       LANDER BOT        │
│                                            │                        │
│       Original Strand                      │ Chat history            │
│                                            │                        │
│       Duplicate 1                          │ User messages           │
│       Duplicate 2                          │ AI responses             │
│       Duplicate 3                          │ Applied changes          │
│                                            │                        │
│                              ┌───────────┐ │                        │
│                              │ React     │ │                        │
│                              │ Source    │ │                        │
│                              │ Code      │ │                        │
│                              └───────────┘ │                        │
│                                            │                        │
│ [zoom controls]                            │ [chat input]            │
└────────────────────────────────────────────┴────────────────────────┘

The left side is the design canvas.

The right side is the persistent conversation.

The chat must remain connected across every message.

5. Strand Component

Use the provided Strand visual as inspiration.

The component should be a real animated React component, not an image,
GIF, iframe, or screenshot.

It should have:

glowing strand / wave appearance

dark canvas

animated gradient

blur / glow

smooth motion

configurable colors

configurable position

configurable scale

configurable rotation

configurable opacity

configurable dimensions

preserved animation behavior when duplicated

The exact implementation is flexible, but the component must be
controlled through React state.

6. Component State

Create a generic component model.

export interface ComponentState {
  id: string;
  type: "strand";

  x: number;
  y: number;

  scale: number;
  rotation: number;

  opacity: number;

  width: number;
  height: number;

  colors: string[];

  blur: number;

  visible: boolean;
}

Every instance MUST have a unique ID.

Example:

strand_1
strand_2
strand_3
strand_4

Never use array index as a persistent component identity.

7. Component Registry

Create a registry even though the POC has only one component type.

interface DesignComponent {
  id: string;
  type: "strand";
  state: ComponentState;
  permissions: AttributePermissions;
  createdFrom?: string;
  groupId?: string;
}

This registry becomes the foundation for the future 500+ component
architecture.

8. Permissions

Every component has attribute permissions.

interface AttributePermissions {
  position: boolean;
  scale: boolean;
  rotation: boolean;
  colors: boolean;
  opacity: boolean;
  dimensions: boolean;
  duplicate: boolean;
  delete: boolean;
}

Example:

const permissions = {
  position: false,
  scale: true,
  rotation: true,
  colors: true,
  opacity: true,
  dimensions: false,
  duplicate: true,
  delete: true
};

The permission layer is mandatory.

The AI cannot bypass it.

The AI may propose:

{
  "type": "move",
  "targetIds": ["strand_1"],
  "x": -100
}

but the executor must reject it if position is locked.

The AI must never be able to modify a locked property simply by
generating a different JSON structure.

9. Permission Pipeline

All AI operations MUST pass through:

AI output
   ↓
Zod schema validation
   ↓
Target validation
   ↓
Permission validation
   ↓
Operation normalization
   ↓
Operation execution
   ↓
State update

Never execute raw model output.

Never use:

eval()
new Function()
dangerouslySetInnerHTML

for AI generated executable logic.

10. Original Component Protection

The user may explicitly say:

Don't touch the main component.

This is a hard constraint.

If the user says:

Duplicate the main component and change the copy.

then:

strand_1 = unchanged
strand_2 = modified

The executor must enforce this through target IDs and operation
semantics.

11. Duplication

Duplication is a first class operation.

A duplicate must:

Clone the source state.

Generate a new unique ID.

Preserve the source animation behavior.

Preserve all properties unless overridden.

Apply requested modifications only to the new instance.

Leave the source unchanged.

Example:

{
  "type": "duplicate",
  "sourceId": "strand_1",
  "count": 1,
  "copies": [
    {
      "position": {
        "relation": "below",
        "spacing": 40
      },
      "rotation": 180,
      "colors": ["#FF0000", "#000000", "#00FF00"]
    }
  ]
}

12. Multiple / Batch Duplication

The engine MUST support N duplicates.

Do not hardcode one duplicate.

Example user instruction:

Create 5 copies of the main animation below it. Give each a different
color.

The model should be able to generate:

{
  "type": "batch_duplicate",
  "sourceId": "strand_1",
  "count": 5,
  "copies": [
    {
      "position": { "relation": "below", "spacing": 30 },
      "colors": ["#FF0000"]
    },
    {
      "position": { "relation": "below", "spacing": 60 },
      "colors": ["#00FF00"]
    },
    {
      "position": { "relation": "below", "spacing": 90 },
      "colors": ["#0000FF"]
    },
    {
      "position": { "relation": "below", "spacing": 120 },
      "colors": ["#FFFF00"]
    },
    {
      "position": { "relation": "below", "spacing": 150 },
      "colors": ["#FF00FF"]
    }
  ]
}

The exact positions can instead be calculated deterministically by the
application.

Prefer the application calculating positions when the user gives
relative relationships.

13. Batch Operations

The system must support operations against:

one component

multiple components

a generated group of duplicates

all copies

specific copies

Examples:

Make the third copy smaller.

Resolve to exactly one ID.

Make all five copies black.

Resolve to the five generated IDs.

Move the first and third copies to the left.

Resolve to the corresponding IDs.

Rotate all copies by 20 degrees.

Resolve to the relevant component IDs.

The model should not guess component IDs that do not exist.

14. Groups

When multiple components are created as copies from one source,
optionally create a group.

Example:

group_1
 ├── strand_2
 ├── strand_3
 ├── strand_4
 ├── strand_5
 └── strand_6

Store:

groupId?: string;

This makes commands such as:

Make all five copies black.

easy to resolve.

Groups are logical collections, not a requirement to visually merge the
components.

15. Relative Positioning

Natural language positioning must be supported:

above

below

left

right

beside

next to

centered

top

bottom

upper left

upper right

lower left

lower right

Example:

Put the duplicate below the main component.

The application should calculate the position relative to the source.

Do not rely on the LLM inventing arbitrary pixel coordinates when a
relational instruction is given.

Create:

calculateRelativePosition(
  source,
  targetSize,
  relation,
  spacing
)

Example:

below:
x = source.x
y = source.y + source.height * source.scale + spacing

16. Natural Language Normalization

The AI must normalize language into deterministic values.

Examples:

"half the size"
→ scale = 0.5

"make it 50% of the size"
→ scale = 0.5

"twice as large"
→ scale = 2

"rotate 180 degrees"
→ rotation = 180

"rotate 20 degrees to the right"
→ rotation = 20

"flip horizontally"
→ flipX = true

For the POC, use clear deterministic interpretations.

17. Color Instructions

Support:

make it red
change the colors to red, black and green
use blue instead
replace purple with green
give every copy a different color

The AI should normalize named colors to valid CSS values.

Example:

{
  "colors": [
    "#FF0000",
    "#000000",
    "#00FF00"
  ]
}

If the user asks for creative colors:

Give each copy a different nice color.

The AI may select a coherent palette.

The selected colors MUST be included in the structured operation so the
execution is deterministic.

18. Operation Schema

Use a discriminated union validated with Zod.

Supported operations should include at minimum:

move
scale
rotate
recolor
flip
duplicate
batch_duplicate
delete
set_opacity

Example conceptual type:

type Operation =
  | MoveOperation
  | ScaleOperation
  | RotateOperation
  | RecolorOperation
  | FlipOperation
  | DuplicateOperation
  | BatchDuplicateOperation
  | DeleteOperation
  | OpacityOperation;

Every operation must contain enough information to execute
deterministically.

19. AI Response Contract

DeepSeek should return structured JSON only.

Example:

{
  "message": "I duplicated the main Strand and placed the copy below it.",
  "operations": [
    {
      "type": "duplicate",
      "sourceId": "strand_1",
      "count": 1,
      "copies": [
        {
          "position": {
            "relation": "below",
            "spacing": 40
          }
        }
      ]
    }
  ]
}

Do not allow markdown code fences inside the actual machine response.

Validate the response using Zod.

If validation fails, do not execute anything.

20. Atomic Batch Execution

Batch operations should be handled carefully.

For a request such as:

Create 5 copies, each with different colors.

The executor should either:

successfully create the intended batch, or

safely fail without leaving a partially corrupted state.

Prefer transactional state updates.

Do not create 3 copies and then fail silently on copy 4.

If a batch partially fails, roll back the batch and explain the failure.

21. Operation History

Every successful operation should create a history record.

interface OperationHistoryEntry {
  id: string;
  timestamp: number;
  operation: Operation;

  previousState: Record<string, ComponentState>;
  nextState: Record<string, ComponentState>;
}

For batch operations, store all affected component states.

This is required for reliable undo.

22. Undo

Provide:

Undo Last Change

in the chat panel.

Undo must work for:

single changes

duplication

batch duplication

recoloring

rotation

scale

movement

deletion

Undo a batch as one user action.

Example:

Create 5 copies.

One undo should remove all 5 copies.

It should NOT require five undo clicks.

23. Conversation State

The conversation is stateful.

Never treat each user message as an isolated request.

Maintain:

interface ConversationState {
  messages: ChatMessage[];

  activeComponentId: string | null;

  selectedComponentIds: string[];

  lastCreatedComponentIds: string[];

  lastModifiedComponentIds: string[];

  operationHistory: OperationHistoryEntry[];
}

24. Reference Resolution

The system must understand references such as:

this

it

that

the main component

the original

the copy

the second one

the third copy

all copies

the five copies

the last one

the previous component

Example:

User:

Duplicate this below the original.

AI creates:

strand_2

User:

Make the second one smaller.

Resolve:

strand_2

User:

Rotate it 180 degrees.

Resolve:

strand_2

User:

Make all the copies green.

Resolve the copy group.

Do NOT rely only on raw conversation text for this.

Use structured state.

25. Context Sent to DeepSeek

Every AI request should include:

System instructions
+
Current canvas state
+
Current component registry
+
Current permissions
+
Selected component IDs
+
Last created IDs
+
Last modified IDs
+
Relevant operation history
+
Conversation history
+
Current user message

Do not send unnecessary historical state indefinitely.

Keep a bounded context window when appropriate, but never discard
structured state that is needed for reference resolution.

26. Current State Is the Source of Truth

The LLM is NOT the source of truth.

The source of truth is:

Zustand component state
+
conversation metadata
+
operation history

The LLM receives context and proposes operations.

The application decides whether operations are valid.

27. Component Selection

Clicking a component should select it.

Show a subtle selection border.

Store:

selectedComponentIds

If the user clicks a duplicate and then says:

Make this green.

the target should be the selected duplicate.

The chat panel should have access to the active selection.

28. Code Viewer

The left canvas must include a "Show Code" control.

When enabled, display the underlying React/TypeScript source for the
Strand component in a code viewer positioned in the upper/right portion
of the left canvas.

The source should demonstrate that this is a real programmable
component.

Example:

import { motion } from "motion/react";

export function Strand({
  x,
  y,
  scale,
  rotation,
  colors
}: StrandProps) {
  return (
    <motion.div
      animate={{
        x,
        y,
        scale,
        rotate: rotation
      }}
    >
      ...
    </motion.div>
  );
}

Important:

Do NOT rewrite the source file after every AI action.

The source defines the component.

The state defines the current instance configuration.

AI operations modify state.

29. Chat UI

Right panel:

Header:

Lander Bot
Your AI design assistant

Messages should show:

You
Lander Bot

AI responses should show concise applied changes.

Example:

Understood. I'll duplicate the main component and modify the copies.

✓ Created 5 independent copies
✓ Placed copies below the original
✓ Applied unique colors
✓ Preserved the original animation

For batch changes, show a compact summary rather than dumping huge JSON
into the conversation.

Optionally provide an expandable "Applied Changes" panel.

30. Chat Input

Bottom of chat:

Type your command...

Support:

Enter = send

Shift + Enter = newline

loading state

disabled state while submitting

retry on API failure

31. DeepSeek

Use the DeepSeek API through a server side API route.

Environment:

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com

Never expose the API key to the browser.

Never hardcode the key.

Never commit .env.

Create .env.example.

The frontend should call the local server endpoint.

Each successful DeepSeek response forwards the official `usage` object
(`prompt_tokens`, `completion_tokens`, `prompt_cache_hit_tokens`,
`prompt_cache_miss_tokens`). The canvas Usage panel next to Show code
estimates USD from the published deepseek-v4-flash / `deepseek-chat`
rates, including peak vs off-peak and cache hit vs miss. Local fallbacks
that never hit the API do not add spend.

Example architecture:

Browser
  ↓
POST /api/lander
  ↓
Server
  ↓
DeepSeek

32. AI System Rules

Use a strong system prompt along these lines:

You are Lander Bot, an AI design editing assistant.

You interpret natural language design instructions and return validated structured operations.

You do not execute code.
You do not write arbitrary React code.
You do not bypass permissions.
You do not invent component IDs.

Every operation must target a valid component.

Respect explicit constraints such as:
"don't touch the original"
"only modify the copy"
"leave the main component unchanged"

When duplicating:
- preserve the original
- create independent IDs
- preserve animation behavior
- apply requested changes only to the copies

When the user asks for multiple copies:
- create exactly the requested number
- give every copy a unique ID
- preserve independent state
- apply per-copy changes correctly

Resolve references using the supplied structured state.

If a requested attribute is locked:
- do not execute the operation
- clearly tell the user what is locked
- continue with other allowed operations if the request is safely separable

Never claim success for rejected operations.

Return JSON matching the operation schema.

33. Multiple Independent Changes

The user may issue many changes in one message.

Example:

Duplicate the Strand 5 times below the original, make each copy
smaller, rotate them by 20 degree increments, and give each one a
different color.

This is one user request containing many operations.

The system must handle it as one logical transaction.

Expected conceptual result:

Original
  |
  +-- Copy 1 → scale 0.9 → rotate 20° → red
  +-- Copy 2 → scale 0.8 → rotate 40° → green
  +-- Copy 3 → scale 0.7 → rotate 60° → blue
  +-- Copy 4 → scale 0.6 → rotate 80° → yellow
  +-- Copy 5 → scale 0.5 → rotate 100° → purple

The exact interpretation of unspecified values should be deterministic
and explained briefly by the AI.

34. Don't Overuse LLM Calls

Prefer one planning call for a complete user request.

For example:

User:
Create 5 copies, put them below the original, rotate them progressively,
and give them different colors.

        ↓

ONE DeepSeek request

        ↓

ONE structured batch operation

        ↓

ONE deterministic execution

Do not make one LLM call per duplicate.

This reduces cost and latency.

35. Deterministic Execution

The executor should be pure and predictable.

Example:

executeOperation(
  operation,
  currentState,
  permissions
)

It should return:

{
  nextState,
  historyEntry,
  affectedIds
}

Do not let the executor make design decisions.

Design interpretation belongs to the AI.

State mutation belongs to the deterministic engine.

36. Local Persistence

Persist in localStorage:

component registry

component states

conversation messages

active selection

operation history

permissions

generated groups

After refresh, restore the session.

Do not add a database for the POC.

37. File Structure

Use a clean structure such as:

src/
  components/
    canvas/
      DesignCanvas.tsx
      Strand.tsx
      ComponentWrapper.tsx
      CodeViewer.tsx

    chat/
      ChatPanel.tsx
      ChatMessage.tsx
      ChatInput.tsx
      AppliedChanges.tsx

    ui/

  ai/
    deepseek.ts
    systemPrompt.ts
    operationSchema.ts
    operationParser.ts
    contextBuilder.ts
    referenceResolver.ts

  engine/
    operationExecutor.ts
    permissionFilter.ts
    batchExecutor.ts
    positioning.ts
    componentRegistry.ts
    history.ts

  store/
    canvasStore.ts
    chatStore.ts

  types/
    component.ts
    operation.ts
    conversation.ts

  utils/
    ids.ts
    colors.ts

38. Error Handling

Never crash the canvas.

DeepSeek failure:

I couldn't process that request. Please try again.

Invalid AI JSON:

I couldn't safely apply that change.

Unknown component:

I couldn't find the requested component.

Locked attribute:

Position editing is currently locked for this component, so I left its position unchanged.

Partial batch failure:

I couldn't safely apply the full batch, so no copies were created.

39. Security

Never:

expose API keys

execute arbitrary model code

eval model output

use new Function

dynamically import model generated modules

modify files based on raw model output

bypass permission checks

Only execute validated operations.

40. Testing Requirements

Add tests for the operation engine.

At minimum test:

Duplicate

1 original
→ 1 duplicate
→ 2 components

Five duplicates

1 original
→ 5 copies
→ 6 components

Ten duplicates

1 original
→ 10 copies
→ 11 components

Original protection

duplicate + modify copy
→ original unchanged

Rotation

rotation 0
→ 180

Scaling

scale 1
→ 0.5

Colors

purple
→ red / black / green

Locked position

move request
+
position locked
→ state unchanged

Batch undo

create 5 copies
→ undo
→ all 5 removed
→ original remains

Conversation reference

create copy
→ "make the second one green"
→ correct ID modified

41. Required Demo Conversation

The finished POC must support this conversation:

Message 1

Don't touch the main animation component. Duplicate it and get the
copy below the main one.

Expected:

strand_1 = original
strand_2 = copy below

Message 2

Rotate the second one by 180 degrees.

Expected:

strand_1 = unchanged
strand_2 = rotation 180

Message 3

Change the second one to red, black and green.

Expected:

strand_2 = red / black / green

Message 4

Make the second one half the size.

Expected:

strand_2 = scale 0.5

Message 5

Now create 5 copies of the original below it and make each one a
different color.

Expected:

strand_1 = unchanged

strand_3
strand_4
strand_5
strand_6
strand_7

all independent
all unique IDs
different colors

Message 6

Make the third copy 50% smaller and rotate it 30 degrees.

Only that copy changes.

Message 7

Make all five new copies black.

All five new copies change.

The original does not change.

Message 8

Move the main component to the left.

If position is locked:

Position editing is currently locked.
No position change is made.

42. Definition of Done

The POC is complete when:

The Strand is a real animated React component.

The original component renders correctly.

The component state is centralized.

Every component has a unique ID.

Components can be selected.

Components can be duplicated.

N duplicates are supported.

Each duplicate has independent state.

Batch operations work.

Relative positioning works.

Scale works.

Rotation works.

Recoloring works.

Delete works.

Locked attributes cannot be changed.

Original components can be explicitly protected.

DeepSeek understands natural language commands.

DeepSeek returns structured operations.

Zod validates model output.

The permission filter runs before execution.

Conversation context persists.

"it", "this", "second one", "copy", and "all copies" can be
resolved.

Batch operations are atomic.

Undo treats a batch as one logical action.

Canvas state persists after refresh.

API keys stay server side.

No arbitrary AI code executes.

The code viewer shows the underlying component source.

The UI resembles a real premium AI design editor.

43. Future Scale Architecture

Do not implement this now.

When scaling to 500+ components, introduce:

Component Registry
       ↓
Component IDs
       ↓
Structured Metadata
       ↓
Hybrid Search
    /        \
Vector      Graph
Search      Relations
    \        /
     Context Retrieval
          ↓
       Lander
          ↓
Structured Operations
          ↓
Permission / Policy Layer
          ↓
Component Engine

Future component metadata can contain:

component ID
component type
design principles
animation capabilities
editable properties
constraints
technologies
source reference
compatible components
related components
design relationships

Graph DB should be used for meaningful relationships, not simply because
there are many components.

RAG / vector search should retrieve semantic design knowledge.

Component IDs should provide deterministic targeting.

44. Core Product Principle

The most important architectural rule:

Lander Bot is not the design renderer.

Lander Bot is the intent interpreter.

The deterministic component engine is the design renderer.

Therefore:

Natural language
      ↓
Lander Bot
      ↓
Intent
      ↓
Structured operation
      ↓
Schema validation
      ↓
Permission filter
      ↓
Deterministic executor
      ↓
Component state
      ↓
Motion
      ↓
Canvas

This separation makes the system safer, testable, scalable, and suitable
for future subscription based permissions.

45. Final Implementation Instruction

Build the POC as a working application, not a scaffold.

Prioritize:

Correct component state

Reliable duplication

N-copy batch operations

Independent component IDs

Permission enforcement

Conversation context

Deterministic execution

DeepSeek integration

Undo

Visual polish

Do not overengineer the future 500 component architecture yet.

But do NOT hardcode the engine around one component or one duplicate.

The POC must prove that:

one component can become many independent components, and Lander can
continuously understand and modify those components through natural
language while respecting permissions and conversation context.