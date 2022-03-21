# lancer-initiative

NPM module for Lancer Initiative

A module providing Combat, Combatant and CombatTracker classes compatible with Foundry v9 that can be used to implement a popcorn style combat tracker in your Foundry VTT system.

## Instructions

Install with npm

```
$ npm install lancer-initiative
```

Create or copy the necessary handlebars templates. Examples can be found in the main [Lancer Intiative module repository](https://github.com/BoltsJ/lancer-initiative/tree/default/public/templates).

Css rules for the tracker can be found in the Lancer Intiative main repository, as well as an example configuration form.

Configure your system to use the classes. This exapmle assumes you are using [`@league-of-foundry-developers/foundry-vtt-types`](https://github.com/League-of-Foundry-Developers/foundry-vtt-types).

```typescript
// global.d.ts
import type { LancerInitiativeConfig } from "lancer-initiative";

declare global {
  interface CONFIG {
    LancerInitiative: LancerInitiativeConfig<"system-name">;
  }
}

// entrypoint.ts
import {
  LancerCombat,
  LancerCombatant,
  getTrackerAppearance,
  setAppaearance,
} from "lancer-initiative";

Hooks.on("init", () => {
  CONFIG.LancerInitiative = {
    module: game.system.id,
    templatePath: `path/to/the/combat-tracker-template.hbs`,
    def_appearance: {
      icon: "fas fa-chevron-circle-right",
      icon_size: 1.5,
      player_color: "#44abe0",
      friendly_color: "#44abe0",
      neutral_color: "#146464",
      enemy_color: "#d98f30",
      done_color: "#444444",
    },
  };

  // A config form for this can be found at
  // https://github.com/BoltsJ/lancer-initiative
  game.settings.register(game.system.id, "combat-tracker-appearance", {
    scope: "world",
    config: false,
    type: Object,
    onChange: setAppearance,
  });
  game.settings.register(game.system.id, "combat-tracker-sort", {
    name: game.i18n.localize("LANCERINITIATIVE.SortTracker"),
    hint: game.i18n.localize("LANCERINITIATIVE.SortTrackerDesc"),
    scope: "world",
    config: true,
    type: Boolean,
    onChange: () => game.combats?.render(),
    default: false,
  });

  // Recommended to allow integrations to set up
  Hooks.callAll("LancerIntitiativeInit");
  setAppearance(getTrackerAppearance());
});
```
