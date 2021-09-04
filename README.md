# lancer-initiative
NPM module for Lancer Initiative

A module providing Combat, Combatant and CombatTracker classes compatible with foundry 0.8.x that can be used to implement a popcorn style combat tracker in your Foundry VTT system. 

## Instructions

Install with npm
```
$ npm install lancer-initiative
```

Create or copy the necessary handlebars templates. Examples can be found in the main [Lancer Intiative module repository](https://github.com/BoltsJ/lancer-initiative/tree/module-refactor/public/templates).

Add the following css rules:
```css
:root {
  --lancer-initiative-icon-size: 1rem;
  --lancer-initiative-player-color: #000000;
  --lancer-initiative-friendly-color: #000000;
  --lancer-initiative-neutral-color: #000000;
  --lancer-initiative-enemy-color: #000000;
  --lancer-initiative-done-color: #000000;
}

#combat #combat-tracker .combatant .token-initiative i,
#combat #combat-tracker .combatant .token-initiative a {
  font-size: var(--lancer-initiative-icon-size);
}
#combat #combat-tracker .combatant .token-initiative i.done {
  color: var(--lancer-initiative-done-color);
}

#combat #combat-tracker .combatant.player .token-initiative a {
  color: var(--lancer-initiative-player-color);
}

#combat #combat-tracker .combatant.friendly .token-initiative a {
  color: var(--lancer-initiative-friendly-color);
}
#combat #combat-tracker .combatant.neutral .token-initiative a {
  color: var(--lancer-initiative-neutral-color);
}

#combat #combat-tracker .combatant.enemy .token-initiative a {
  color: var(--lancer-initiative-enemy-color);
}
```
Additional reccomended rules can be found in the Lancer Intiative main repository.

Add the translations data from the main repository to your system's translation files.

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
import { LancerCombat, LancerCombatant, getTrackerAppearance, setAppaearance } from "lancer-initiative";

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
  Object.defineProperty(CONFIG.LancerInitiative, "module", { writable: false });
  
  registerSettings();
  
  // Recommended
  Hooks.callAll("LancerIntitiativeInit");
  setAppearance(getTrackerAppearance());
});
```
