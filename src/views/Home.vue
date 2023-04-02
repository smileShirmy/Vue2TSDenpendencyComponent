<template>
  <div class="home">
    <button @click="hideCategory = !hideCategory">toggle show category</button>
    <hr />
    <AppSelect :config="periodSelectConfig" />
    <hr />
    <AppSelect :config="gradeSelectConfig" />
    <hr />
    <AppSelect v-if="hideCategory" :config="categorySelectConfig" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import AppSelect, {
  AppSelectConfig,
  createAppSelectConfig,
} from "../components/app-select.vue";

@Component({
  components: {
    AppSelect,
  },
})
export default class Home extends Vue {
  periodSelectConfig?: AppSelectConfig;

  gradeSelectConfig?: AppSelectConfig;

  categorySelectConfig?: AppSelectConfig;

  hideCategory = true;

  created() {
    this.periodSelectConfig = createAppSelectConfig({
      prop: "period",
    });

    this.gradeSelectConfig = createAppSelectConfig({
      prop: "grade",
    });

    this.categorySelectConfig = createAppSelectConfig({
      prop: "category",
    });

    this.periodSelectConfig.addChild(
      this.gradeSelectConfig.beforeUpdateFromParent((config) => {
        console.log(config);
      })
    );
    this.gradeSelectConfig.addChild(this.categorySelectConfig);
  }
}
</script>
