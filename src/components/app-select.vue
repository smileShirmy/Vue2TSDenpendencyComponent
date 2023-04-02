<template>
  <div>
    <div>select component</div>
    <div>prop: {{ config.prop }}</div>
    <div>placeholder: {{ config.placeholder }}</div>
    <button @click="change">change</button>
  </div>
</template>

<script lang="ts">
import { Vue, Prop } from "vue-property-decorator";
import { AppSelectOptions } from "@/types/app-select";
import {
  createConfig,
  AppCreateConfig,
  DependencyComponent,
  DependencyVue,
} from "./create-config";

export type AppSelectConfig = AppCreateConfig<AppSelectOptions, AppSelect>;

export function createAppSelectConfig(
  options: AppSelectOptions
): AppSelectConfig {
  return createConfig<AppSelectOptions, AppSelect>(options);
}

@DependencyComponent()
export default class AppSelect
  extends Vue
  implements DependencyVue<AppSelectConfig>
{
  @Prop({ required: true })
  readonly config!: AppSelectConfig;

  change() {
    console.log(`${this.config.options.prop} change`);
    this.config.updateChildren();
  }

  changeFromParent() {
    this.change();
  }
}
</script>
