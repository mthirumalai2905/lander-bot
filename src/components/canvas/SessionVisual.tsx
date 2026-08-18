import type { ComponentState } from "../../types/component";
import { AnimatedContent } from "../bits/AnimatedContent";
import { Antigravity } from "../bits/Antigravity";
import { AsciiText } from "../bits/AsciiText";
import { Aurora } from "../bits/Aurora";
import { Beams } from "../bits/Beams";
import { EvilEye } from "../bits/EvilEye";
import { Particles } from "../bits/Particles";
import { Plasma } from "../bits/Plasma";
import { WebThreads } from "../bits/WebThreads";
import { Strand } from "./Strand";

export function SessionVisual({ state }: { state: ComponentState }) {
  switch (state.type) {
    case "evileye":
      return <EvilEye state={state} />;
    case "aurora":
      return <Aurora state={state} />;
    case "particles":
      return <Particles state={state} />;
    case "beams":
      return <Beams state={state} />;
    case "plasma":
      return <Plasma state={state} />;
    case "threads":
      return <WebThreads state={state} />;
    case "animated":
      return <AnimatedContent state={state} />;
    case "antigravity":
      return <Antigravity state={state} />;
    case "ascii":
      return <AsciiText state={state} />;
    default:
      return <Strand state={state} />;
  }
}
