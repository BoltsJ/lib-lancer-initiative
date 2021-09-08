import { LancerInitiativeConfig } from "./index";

declare global {
  interface LenientGlobalVariableTypes {
    game: never; // the type doesn't matter
  }

  interface CONFIG {
    LancerInitiative: LancerInitiativeConfig<string>;
  }
}
