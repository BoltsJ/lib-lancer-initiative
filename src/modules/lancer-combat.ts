/**
 * Overrides and extends the Combat class to use an activation model instead of
 * the standard ordered list of turns. {@link LancerCombat#activateCombatant}
 * is added to the interface.
 */
export class LancerCombat extends Combat {
  /** @override */
  protected _sortCombatants(a: LancerCombatant, b: LancerCombatant): number {
    const module = CONFIG.LancerInitiative.module;
    if (a.getFlag(module, "dummy") ?? false) return -1;
    if (b.getFlag(module, "dummy") ?? false) return 1;
    // Sort by Players then Neutrals then Hostiles
    const dc = b.disposition - a.disposition;
    if (dc !== 0) return dc;
    return super._sortCombatants(a, b);
  }

  /** @override */
  protected async _preCreate(
    data: Parameters<Combat["_preCreate"]>[0],
    options: Parameters<Combat["_preCreate"]>[1],
    user: foundry.documents.BaseUser
  ): Promise<void> {
    const module = CONFIG.LancerInitiative.module;
    const dummy = new CONFIG.Combatant.documentClass(
      {
        flags: { [module]: { dummy: true, activations: { max: 0 } } },
        hidden: true,
      },
      { parent: this }
    );
    const combatants = this.combatants.map(c => c.toObject());
    combatants.push(dummy.toObject());
    this.data.update({ combatants });
    return super._preCreate(data, options, user);
  }

  /**
   * Set all combatants to their max activations
   */
  async resetActivations(): Promise<LancerCombatant[]> {
    const module = CONFIG.LancerInitiative.module;
    const updates = this.combatants.map(c => {
      return {
        _id: c.id,
        [`flags.${module}.activations.value`]:
          this.settings.skipDefeated &&
          (c.data.defeated ||
            !!c.actor?.effects.find(
              e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId
            ))
            ? 0
            : (<LancerCombatant>c).activations.max ?? 0,
      };
    });
    return <Promise<LancerCombatant[]>>this.updateEmbeddedDocuments("Combatant", updates);
  }

  /** @override */
  async startCombat(): Promise<this | undefined> {
    await this.resetActivations();
    return super.startCombat();
  }

  /** @override */
  async nextRound(): Promise<this | undefined> {
    await this.resetActivations();
    return super.nextRound();
  }

  /**
   * Ends the current turn without starting a new one
   * @override
   */
  async nextTurn(): Promise<this | undefined> {
    return this.update({ turn: 0 });
  }

  /** @override */
  async previousRound(): Promise<this | undefined> {
    await this.resetActivations();
    const round = Math.max(this.round - 1, 0);
    let advanceTime = 0;
    if (round > 0) advanceTime -= CONFIG.time.roundTime;
    // @ts-ignore jtfc advanceTime is fucking used in foundry.js
    return this.update({ round, turn: 0 }, { advanceTime });
  }

  /** @override */
  async resetAll(): Promise<this | undefined> {
    await this.resetActivations();
    return super.resetAll();
  }

  /**
   * Sets the active turn to the combatant passed by id or calls
   * {@link LancerCombat#requestActivation()} if the user does not have
   * permission to modify the combat
   */
  async activateCombatant(id: string): Promise<this | undefined> {
    if (!game.user?.isGM) return this.requestActivation(id);
    const combatant: LancerCombatant | undefined = <LancerCombatant | undefined>(
      this.getEmbeddedDocument("Combatant", id)
    );
    if (!combatant?.activations.value) return this;
    await combatant?.modifyCurrentActivations(-1);
    const turn = this.turns.findIndex(t => t.id === id);
    return this.update({ turn });
  }

  /**
   * Sets the active turn back to 0 (no active unit) if the passed id
   * corresponds to the current turn and the user has ownership of the
   * combatant.
   */
  async deactivateCombatant(id: string) {
    const turn = this.turns.findIndex(t => t.id === id);
    if (turn !== this.turn) return this;
    if (!this.turns[turn].testUserPermission(game.user!, "OWNER") && !game.user?.isGM) return this;
    return this.nextTurn();
  }

  /**
   * Calls any Hooks registered for "LancerCombatRequestActivate".
   */
  protected async requestActivation(id: string): Promise<this> {
    Hooks.callAll("LancerCombatRequestActivate", this, id);
    return this;
  }
}

export class LancerCombatant extends Combatant {
  /**
   * This just fixes a bug in foundry 0.8.x that prevents Combatants with no
   * associated token or actor from being modified, even by the GM
   * @override
   */
  testUserPermission(
    user: User,
    permission: keyof typeof foundry.CONST.ENTITY_PERMISSIONS | foundry.CONST.EntityPermission,
    options?: { exact?: boolean }
  ): boolean {
    return this.actor?.testUserPermission(user, permission, options) ?? user.isGM;
  }

  /** @override */
  prepareBaseData(): void {
    super.prepareBaseData();
    const module = CONFIG.LancerInitiative.module;
    // @ts-expect-error
    if (this.data.flags?.[module]?.activations?.max === undefined && canvas?.ready) {
      this.data.update({
        [`flags.${module}.activations`]: {
          max:
            (CONFIG.LancerInitiative.activation_path
              ? foundry.utils.getProperty(
                  this.actor?.getRollData() ?? {},
                  CONFIG.LancerInitiative.activation_path
                )
              : undefined) ?? 1,
        },
      });
    }
  }

  /** @override */
  get isVisible(): boolean {
    const module = CONFIG.LancerInitiative.module;
    if (this.getFlag(module, "dummy") ?? false) return false;
    return super.isVisible;
  }

  /**
   * The current activation data for the combatant.
   */
  get activations(): Activations {
    const module = CONFIG.LancerInitiative.module;
    return <Activations>this.getFlag(module, "activations") ?? {};
  }

  /**
   * The disposition for this combatant. In order, manually specified for this
   * combatant, token dispostion, token disposition for the associated actor,
   * -2.
   */
  get disposition(): number {
    const module = CONFIG.LancerInitiative.module;
    return (
      <number>this.getFlag(module, "disposition") ??
      (this.actor?.hasPlayerOwner ?? false
        ? 2
        : this.token?.data.disposition ?? this.actor?.data.token.disposition ?? -2)
    );
  }

  /**
   * Adjusts the number of activations that a combatant can take
   * @param num - The number of maximum activations to add (can be negative)
   */
  async addActivations(num: number): Promise<this | undefined> {
    const module = CONFIG.LancerInitiative.module;
    if (num === 0) return this;
    return this.update({
      [`flags.${module}.activations`]: {
        max: Math.max((this.activations.max ?? 1) + num, 1),
        value: Math.max((this.activations.value ?? 0) + num, 0),
      },
    });
  }

  /**
   * Adjusts the number of current activations that a combatant has
   * @param num - The number of current activations to add (can be negative)
   */
  async modifyCurrentActivations(num: number): Promise<this | undefined> {
    const module = CONFIG.LancerInitiative.module;
    if (num === 0) return this;
    return this.update({
      [`flags.${module}.activations`]: {
        value: Math.clamped((this.activations?.value ?? 0) + num, 0, this.activations?.max ?? 1),
      },
    });
  }
}

/**
 * Hook this on ready to migrate existing combats
 */
export function addMissingDummy(): void {
  if (!game.user?.isGM) return;
  game.combats!.forEach(combat => {
    if (
      !combat.combatants.find(
        combatant => !!combatant.getFlag(CONFIG.LancerInitiative.module, "dummy")
      )
    ) {
      console.log(`${module} | Adding missing dummy combatant to combat with id ${combat.id}`);
      combat.createEmbeddedDocuments("Combatant", [
        {
          flags: { [CONFIG.LancerInitiative.module]: { dummy: true, activations: { max: 0 } } },
          hidden: true,
        },
      ]);
    }
  });
}

/**
 * Interface for the activations object
 */
interface Activations {
  max?: number;
  value?: number;
}
