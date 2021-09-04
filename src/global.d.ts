import { LancerInitiativeConfig } from "./index";

declare global {
namespace LISettings {
  type Appearance = Partial<CONFIG["LancerInitiative"]["def_appearance"]>;
  type ForcedDispositions = "default" | "PLAYER" | "FRIENDLY" | "NEUTRAL" | "HOSTILE" | "OFF";
}

interface LenientGlobalVariableTypes {
  game: never; // the type doesn't matter
}

interface CONFIG {
  LancerInitiative: LancerInitiativeConfig<string>;
}
}
