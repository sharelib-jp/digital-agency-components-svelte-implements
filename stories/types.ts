import type { SvelteRenderer } from "@storybook/svelte-vite";
import type { Component } from "svelte";
import type {
  ComponentAnnotations,
  StoryAnnotations,
} from "storybook/internal/types";

type RemoveIndexSignature<T> = {
  [
    K in keyof T as string extends K
      ? never
      : number extends K
        ? never
        : symbol extends K
          ? never
          : K
  ]: T[K];
};

// $$restProps adds an index signature that breaks Storybook's default-args
// inference. Keep every declared prop, including its type and optionality.
export type ComponentArgs<C extends Component<never>> =
  C extends Component<infer Props> ? RemoveIndexSignature<Props> : never;

// Distribute over components so each render result keeps its own props shape.
type RenderResult<C extends Component<never>> = C extends unknown
  ? { Component: C } & ({} extends ComponentArgs<C>
      ? { props?: ComponentArgs<C> }
      : { props: ComponentArgs<C> })
  : never;

// Storybook's Svelte renderer ties render-result props to story args. Examples
// instead receive { args }, while controls/docs still describe the real component.
type StoryRenderer<
  C extends Component<never>,
  Rendered extends Component<never>,
> = Omit<
  SvelteRenderer<Rendered extends Component<infer _Props> ? Rendered : never>,
  "component" | "storyResult"
> & {
  component: C;
  storyResult: RenderResult<Rendered>;
};

export type Meta<
  C extends Component<never>,
  Rendered extends Component<never> = C,
> = ComponentAnnotations<StoryRenderer<C, Rendered>, ComponentArgs<C>>;

type MetaShape = {
  component: Component<never>;
  args?: object;
};

type RenderedComponent<M extends MetaShape> = M extends {
  render: (...args: never[]) => { Component: infer C extends Component<never> };
}
  ? C
  : M["component"];

type DefaultArgs<M> = M extends { args: infer Args } ? Args : {};

type WithDefaults<Args, Defaults> = Omit<Args, keyof Defaults> &
  Partial<Pick<Args, Extract<keyof Args, keyof Defaults>>>;

export type StoryObj<
  M extends MetaShape,
  Rendered extends Component<never> = RenderedComponent<M>,
> = StoryAnnotations<
  StoryRenderer<M["component"], Rendered>,
  ComponentArgs<M["component"]>,
  WithDefaults<ComponentArgs<M["component"]>, DefaultArgs<M>>
>;
