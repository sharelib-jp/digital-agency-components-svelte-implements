<script lang="ts">
    /** a要素のhref属性（リンク先URL）。有効な遷移先を明示してください。既定値: ''。 */
    export let href: string = "";
    /** リンクの表示テキスト。リンク先が分かる内容を指定します。既定値: ''。 */
    export let label: string = "";
    /** targetを'_blank'にし、新規タブ用アイコンを表示します。rel属性は自動設定しません。既定値: false。 */
    export let blank: boolean = false;
</script>

<style>
    .dads-link:any-link {
      color: var(--color-primitive-blue-1000);
      text-decoration: underline;
      text-decoration-thickness: calc(1 / 16 * 1rem);
      text-underline-offset: calc(3 / 16 * 1rem);
    }

    .dads-link:visited {
      color: var(--color-primitive-magenta-900);
    }

    @media (hover: hover) {
      .dads-link:hover {
        color: var(--color-primitive-blue-900);
        text-decoration-thickness: calc(3 / 16 * 1rem);
      }
    }

    .dads-link:active {
      color: var(--color-primitive-orange-800);
      text-decoration-thickness: calc(1 / 16 * 1rem);
    }

    .dads-link:focus-visible {
      outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
      outline-offset: calc(2 / 16 * 1rem);
      border-radius: calc(4 / 16 * 1rem);
      background-color: var(--color-primitive-yellow-300);
      box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-link__icon {
      display: inline-block;
      width: calc(16 / 16 * 1rem);
      height: calc(16 / 16 * 1rem);
      vertical-align: -0.15em;
    }
</style>

<a class="dads-link" href="{href}" target="{blank ? '_blank' : ''}">
    {label}
    {#if blank}
        <svg class="dads-link__icon" width="16" height="16" viewBox="0 0 48 48" role="img" aria-label="新規タブで開きます">
          <path d="M22 6V9H9V39H39V26H42V42H6V6H22ZM42 6V20H39V11.2L21 29L19 27L36.8 9H28V6H42Z" fill="currentcolor"></path>
        </svg>
    {/if}
</a>
