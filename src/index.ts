export * from "./modules/lancer-combat";
export * from "./modules/lancer-combat-tracker";
/**
 * Interface for the CONFIG object
 * @example
 * ```typescript
 * // global.d.ts
 * import { LancerInitiativeConfig } from "lancer-initiative";
 *
 * declare global {
 *   interface CONFIG {
 *     LancerInitiative: LancerInitiativeConfig<Game["system"]["id"]>;
 *   }
 * }
 *
 * // entrypoint.ts
 * Hooks.on("init", () => {
 *   CONFIG.LancerInitiative = {
 *     module: game.system.id,
 *     templatePath: `path/to/the/combat-tracker-template.hbs`,
 *     def_appearance: {
 *       icon: "fas fa-chevron-circle-right",
 *       icon_size: 1.5,
 *       player_color: "#44abe0",
 *       friendly_color: "#44abe0",
 *       neutral_color: "#146464",
 *       enemy_color: "#d98f30",
 *       done_color: "#444444",
 *     },
 *     activation_path: "attributes.activations", // set to the path in getRollData for the number of activation per round
 *   };
 * ```
 */
export interface LancerInitiativeConfig<T extends string = string> {
  module: T;
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
  activation_path?: string;
}

export function setAppearance(val: Partial<LancerInitiativeConfig["def_appearance"]>): void {
  const defaults = CONFIG.LancerInitiative.def_appearance;
  document.documentElement.style.setProperty(
    "--lancer-initiative-icon-size",
    `${val?.icon_size ?? defaults.icon_size}rem`
  );
  document.documentElement.style.setProperty(
    "--lancer-initiative-player-color",
    val?.player_color ?? defaults.player_color
  );
  document.documentElement.style.setProperty(
    "--lancer-initiative-friendly-color",
    val?.friendly_color ?? defaults.friendly_color
  );
  document.documentElement.style.setProperty(
    "--lancer-initiative-neutral-color",
    val?.neutral_color ?? defaults.neutral_color
  );
  document.documentElement.style.setProperty(
    "--lancer-initiative-enemy-color",
    val?.enemy_color ?? defaults.enemy_color
  );
  document.documentElement.style.setProperty(
    "--lancer-initiative-done-color",
    val?.done_color ?? defaults.done_color
  );
  game.combats?.render();
}

