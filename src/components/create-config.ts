import { defineReadonlyProperty, isFunction, isPromise, warn } from "./helper";
import { ComponentOptions } from "vue";
import { Component, Vue } from "vue-property-decorator";

export interface DependencyVue<T> extends Vue {
  readonly config: T;
  changeFromParent?: () => void;
}

type BeforeUpdateFromParentUpdate<T, U extends DependencyVue<unknown>> = (
  config: AppCreateConfig<T, U>
) => void | Promise<unknown>;

const _BEFORE_UPDATE_FROM_PARENT_METHOD = "_beforeUpdateFromParentMethod";

export interface AppCreateConfig<T, U extends DependencyVue<unknown>> {
  options: T;
  instance: U | null;
  children: AppCreateConfig<T, U>[];
  addChild: (child: AppCreateConfig<T, U> | AppCreateConfig<T, U>[]) => void;
  beforeUpdateFromParent: (
    update: BeforeUpdateFromParentUpdate<T, U>
  ) => AppCreateConfig<T, U>;
  updateChildren: () => void;

  readonly _beforeUpdateFromParentMethod?: BeforeUpdateFromParentUpdate<T, U>;
}

export const DependencyComponent = (
  options?: ComponentOptions<Vue> & ThisType<Vue>
) => {
  if (options) {
    return Component<Vue>(options);
  }
  return Component<
    DependencyVue<AppCreateConfig<unknown, DependencyVue<unknown>>>
  >({
    created() {
      this.config.instance = this;
    },
    beforeDestroy() {
      this.config.instance = null;
    },
  });
};

export function createConfig<T, U extends DependencyVue<unknown>>(
  options: T
): AppCreateConfig<T, U> {
  const children: AppCreateConfig<T, U>[] = [];

  /**
   * 添加下级依赖
   *
   * @param config
   */
  const addChild = (
    config: AppCreateConfig<T, U> | AppCreateConfig<T, U>[]
  ) => {
    if (Array.isArray(config)) {
      children.push(...config);
    } else {
      children.push(config);
    }
  };

  /**
   * 注册被父级依赖控制更新前执行的钩子函数，可以返回一个 Promise
   *
   * @param config
   * @param update
   */
  const beforeUpdateFromParent = (
    update: BeforeUpdateFromParentUpdate<T, U>
  ): AppCreateConfig<T, U> => {
    // TODO: 优化为可以定义多个
    defineReadonlyProperty(config, _BEFORE_UPDATE_FROM_PARENT_METHOD, update);
    return config;
  };

  /**
   * 更新子组件
   */
  const updateChildren = () => {
    children.forEach(async (child) => {
      if (child.instance) {
        if (isFunction(child._beforeUpdateFromParentMethod)) {
          const r = child._beforeUpdateFromParentMethod(child);
          if (isPromise(r)) {
            await r;
          }
        }

        if (isFunction(child.instance.changeFromParent)) {
          child.instance.changeFromParent();
        } else {
          warn('未实现 "changeFromParent" 方法');
        }
      } else {
        warn(`config “${config}” is not created`);
      }
    });
  };

  const config: AppCreateConfig<T, U> = {
    options,
    instance: null,
    children,
    addChild,
    beforeUpdateFromParent,
    updateChildren,
  };

  return config;
}
