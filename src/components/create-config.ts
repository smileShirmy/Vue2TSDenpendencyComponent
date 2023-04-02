import {
  defineFreezeProperty,
  isArray,
  isFunction,
  isPromise,
  warn,
} from "./helper";
import { ComponentOptions } from "vue";
import { VueClass } from "vue-class-component/lib/declarations";
import { componentFactory } from "vue-class-component/lib/component";
import { Vue } from "vue-property-decorator";

export interface DependencyVue<C> extends Vue {
  readonly config: C;
  changeFromParent?: () => void;
}

type BeforeUpdateFromParentUpdate<T, U extends DependencyVue<unknown>> = (
  config: DependencyConfig<T, U>
) => void | Promise<unknown>;

export function DependencyComponent(
  options: ComponentOptions<Vue> | VueClass<Vue>
): any {
  const defaultOptions: ThisType<
    DependencyVue<DependencyConfig<unknown, DependencyVue<unknown>>>
  > = {
    created() {
      this.config.instance = this;
    },
    beforeDestroy() {
      this.config.instance = null;
    },
  };

  if (typeof options === "function") {
    return componentFactory(options, defaultOptions);
  }
  return function (Component: VueClass<Vue>) {
    return componentFactory(Component, Object.assign(defaultOptions, options));
  };
}

// private properties
const _BEFORE_UPDATE_FROM_PARENT_METHODS = "_beforeUpdateFromParentMethods";

export class DependencyConfig<T, U extends DependencyVue<unknown>> {
  options: T;

  instance: U | null = null;

  children: DependencyConfig<T, U>[] = [];

  parent: DependencyConfig<T, U> | null = null;

  private readonly [_BEFORE_UPDATE_FROM_PARENT_METHODS]: BeforeUpdateFromParentUpdate<
    T,
    U
  >[] = [];

  constructor(options: T) {
    this.options = options;

    // 冻结属性，避免被修改
    defineFreezeProperty(
      this,
      _BEFORE_UPDATE_FROM_PARENT_METHODS,
      this[_BEFORE_UPDATE_FROM_PARENT_METHODS]
    );
  }

  /**
   * 添加下级依赖
   *
   * @param config
   */
  addChild(config: DependencyConfig<T, U> | DependencyConfig<T, U>[]) {
    if (Array.isArray(config)) {
      config.forEach((c) => (c.parent = this));
      this.children.push(...config);
    } else {
      config.parent = this;
      this.children.push(config);
    }

    return this;
  }

  /**
   * 注册被父级依赖控制更新前执行的钩子函数，可以返回一个 Promise
   *
   * @param config
   * @param update
   */
  beforeUpdateFromParent(update: BeforeUpdateFromParentUpdate<T, U>) {
    this._beforeUpdateFromParentMethods.push(update);
    return this;
  }

  /**
   * 更新子组件
   */
  updateChildren() {
    this.children.forEach(async (child) => {
      if (!child.instance) {
        warn(`config “${this}” is not created`);
        return;
      }

      // 遍历执行钩子函数
      if (isArray(child._beforeUpdateFromParentMethods)) {
        const ps: Promise<unknown>[] = [];
        child._beforeUpdateFromParentMethods.forEach((method) => {
          const r = method(child);
          if (isPromise(r)) {
            ps.push(r);
          }
        });

        if (ps.length) {
          await Promise.all(ps);
        }
      }

      // 钩子函数执行完成后再调用 changeFromParent 方法
      if (isFunction(child.instance.changeFromParent)) {
        child.instance.changeFromParent();
      } else {
        warn('未实现 "changeFromParent" 方法');
      }
    });

    return this;
  }
}

export function createConfig<T, U extends DependencyVue<unknown>>(
  options: T
): DependencyConfig<T, U> {
  return new DependencyConfig<T, U>(options);
}
