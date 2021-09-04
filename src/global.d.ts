namespace LISettings {
  type Appearance = Partial<CONFIG["LancerInitiative"]["def_appearance"]>;
  type ForcedDispositions = "default" | "PLAYER" | "FRIENDLY" | "NEUTRAL" | "HOSTILE" | "OFF";
}

interface LenientGlobalVariableTypes {
  game: never; // the type doesn't matter
}

interface CONFIG {
  LancerInitiative: {
    module: string;
    templatePath: string;
    def_appearance: {
      icon: string;
      icon_size: number;
      player_color: string;
      friendly_color: string;
      neutral_color: string;
      enemy_color: string;
      done_color: string;
    };
    activation_path: string;
  };
}
