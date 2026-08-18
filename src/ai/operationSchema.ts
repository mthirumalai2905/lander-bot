import { z } from "zod";

export const relationSchema = z.enum([
  "above",
  "below",
  "left",
  "right",
  "beside",
  "next_to",
  "centered",
  "top",
  "bottom",
  "upper_left",
  "upper_right",
  "lower_left",
  "lower_right",
]);

export const relativePositionSchema = z.object({
  relation: relationSchema,
  spacing: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export const copySpecSchema = z.object({
  position: relativePositionSchema.optional(),
  rotation: z.number().optional(),
  scale: z.number().positive().optional(),
  colors: z.array(z.string()).optional(),
  opacity: z.number().min(0).max(1).optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  ribbonSpeeds: z.array(z.number().positive()).optional(),
  text: z.string().min(1).max(48).optional(),
});

export const moveOperationSchema = z.object({
  type: z.literal("move"),
  targetIds: z.array(z.string()).min(1),
  x: z.number().optional(),
  y: z.number().optional(),
  dx: z.number().optional(),
  dy: z.number().optional(),
  position: relativePositionSchema.optional(),
  relativeToId: z.string().optional(),
});

export const scaleOperationSchema = z.object({
  type: z.literal("scale"),
  targetIds: z.array(z.string()).min(1),
  scale: z.number().positive(),
});

export const rotateOperationSchema = z.object({
  type: z.literal("rotate"),
  targetIds: z.array(z.string()).min(1),
  rotation: z.number(),
  relative: z.boolean().optional(),
});

export const recolorOperationSchema = z.object({
  type: z.literal("recolor"),
  targetIds: z.array(z.string()).min(1),
  colors: z.array(z.string()).default([]),
  replace: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
});

export const flipOperationSchema = z.object({
  type: z.literal("flip"),
  targetIds: z.array(z.string()).min(1),
  axis: z.enum(["x", "y", "both"]),
});

export const duplicateOperationSchema = z.object({
  type: z.literal("duplicate"),
  sourceId: z.string(),
  count: z.number().int().positive().default(1),
  copies: z.array(copySpecSchema).optional(),
  group: z.boolean().optional(),
});

export const batchDuplicateOperationSchema = z.object({
  type: z.literal("batch_duplicate"),
  sourceId: z.string(),
  count: z.number().int().positive(),
  copies: z.array(copySpecSchema).optional(),
  group: z.boolean().optional(),
});

export const deleteOperationSchema = z.object({
  type: z.literal("delete"),
  targetIds: z.array(z.string()).min(1),
});

export const opacityOperationSchema = z.object({
  type: z.literal("set_opacity"),
  targetIds: z.array(z.string()).min(1),
  opacity: z.number().min(0).max(1),
});

export const protectOperationSchema = z.object({
  type: z.literal("protect"),
  targetIds: z.array(z.string()).min(1),
  protected: z.boolean(),
});

export const addRibbonOperationSchema = z.object({
  type: z.literal("add_ribbon"),
  targetIds: z.array(z.string()).min(1),
  color: z.string(),
  placement: z.enum(["start", "end"]).optional(),
});

export const removeRibbonOperationSchema = z.object({
  type: z.literal("remove_ribbon"),
  targetIds: z.array(z.string()).min(1),
  placement: z.enum(["start", "end"]).optional(),
  index: z.number().int().min(0).optional(),
});

export const setSpeedOperationSchema = z.object({
  type: z.literal("set_speed"),
  targetIds: z.array(z.string()).min(1),
  speed: z.number().positive().optional(),
  ribbonIndex: z.number().int().positive().optional(),
  ribbons: z
    .array(
      z.object({
        index: z.number().int().positive(),
        speed: z.number().positive(),
      }),
    )
    .optional(),
  relative: z.boolean().optional(),
});

export const setTextOperationSchema = z.object({
  type: z.literal("set_text"),
  targetIds: z.array(z.string()).min(1),
  text: z.string().min(1).max(48),
});

export const operationSchema = z.discriminatedUnion("type", [
  moveOperationSchema,
  scaleOperationSchema,
  rotateOperationSchema,
  recolorOperationSchema,
  flipOperationSchema,
  duplicateOperationSchema,
  batchDuplicateOperationSchema,
  deleteOperationSchema,
  opacityOperationSchema,
  protectOperationSchema,
  addRibbonOperationSchema,
  removeRibbonOperationSchema,
  setSpeedOperationSchema,
  setTextOperationSchema,
]);

export const aiResponseSchema = z.object({
  message: z.string(),
  operations: z.array(operationSchema).default([]),
  protectIds: z.array(z.string()).optional(),
  appliedChanges: z.array(z.string()).optional(),
});
