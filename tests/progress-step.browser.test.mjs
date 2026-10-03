import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `
<script>
    import ProgressIndicator from '../src/lib/components/ProgressIndicator.svelte';
    import StepNavigation from '../src/lib/components/StepNavigation.svelte';
    import '../src/lib/global.css';
    let value = 60, min = 20, max = 100, active = true;
    let shape = 'circular', type = 'stacked', size = undefined;
    let label = '送信中', valueText = undefined, showPercentage = true;
    let intent = 'passive', announceInterval = 0.4;
    let currentId = 'two', disabled = false, cancel = false;
    let variant = 'full', orientation = 'horizontal', stepSize = 'normal', numberOnly = false;
    let visible = true;
    let events = [], submits = 0;
    let steps = [
        { id: 'one', label: '入力', description: '氏名を入力', status: 'completed', action: true },
        { id: 'two', label: '確認', status: 'editing', action: true },
        { id: 'link', label: '資料', href: '#destination' },
        { id: 'disabled', label: '無効', action: true, disabled: true },
        { id: 'disabled-link', label: '無効リンク', href: '#blocked', disabled: true },
        { id: 'future', label: '未到達' },
    ];
    export function snapshot() { return { value, currentId, events, submits }; }
    export function setState(patch) {
        if ('value' in patch) value = patch.value;
        if ('min' in patch) min = patch.min;
        if ('max' in patch) max = patch.max;
        if ('active' in patch) active = patch.active;
        if ('shape' in patch) shape = patch.shape;
        if ('type' in patch) type = patch.type;
        if ('size' in patch) size = patch.size;
        if ('label' in patch) label = patch.label;
        if ('valueText' in patch) valueText = patch.valueText;
        if ('showPercentage' in patch) showPercentage = patch.showPercentage;
        if ('intent' in patch) intent = patch.intent;
        if ('announceInterval' in patch) announceInterval = patch.announceInterval;
        if ('currentId' in patch) currentId = patch.currentId;
        if ('disabled' in patch) disabled = patch.disabled;
        if ('cancel' in patch) cancel = patch.cancel;
        if ('variant' in patch) variant = patch.variant;
        if ('orientation' in patch) orientation = patch.orientation;
        if ('stepSize' in patch) stepSize = patch.stepSize;
        if ('numberOnly' in patch) numberOnly = patch.numberOnly;
        if ('steps' in patch) steps = patch.steps;
        if ('visible' in patch) visible = patch.visible;
    }
</script>
{#if visible}
    <ProgressIndicator id="progress" {value} {min} {max} {active} {shape} {type} {size} {label} {valueText} {showPercentage}
        {intent} {announceInterval} announceStart="開始" announceEnd="完了" announceLong="待機中" announceLongWithValue={'進捗 {value}%'} />
{/if}
<form on:submit={(event) => { event.preventDefault(); submits += 1; }}>
    <StepNavigation id="steps" {steps} bind:currentId {disabled} {variant} {orientation} size={stepSize} {numberOnly}
        on:select={(event) => {
            events = [...events, { id: event.detail.id, index: event.detail.index, previousId: event.detail.previousId,
                cancelable: event.cancelable, native: event.detail.originalEvent instanceof MouseEvent }];
            if (cancel) event.preventDefault();
        }} />
</form>
<div id="destination">遷移先</div>
`;
const control = (id) =>
  `#steps [data-step-id="${id}"] .dads-step-navigation__header`;

browserTest(
  "ProgressIndicator / StepNavigation reactive browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "progress clamps reactive bounds, updates fills, ARIA and indeterminate state",
      async (page) => {
        await page.expect(
          "document.querySelector('#progress').getAttribute('aria-valuenow')",
          "60",
        );
        await page.expect(
          "parseFloat(getComputedStyle(document.querySelector('#progress .dads-progress-indicator__bar')).strokeDashoffset)",
          50,
        );
        await page.setState({ value: 150, shape: "linear" });
        await page.expect(
          "document.querySelector('#progress').getAttribute('aria-valuenow')",
          "100",
        );
        await page.expect(
          "parseFloat(getComputedStyle(document.querySelector('#progress .dads-progress-indicator__bar')).strokeDashoffset)",
          0,
        );
        assert.equal((await page.snapshot()).value, 150);
        await page.setState({
          min: 40,
          max: 80,
          value: 20,
          valueText: "処理待ち",
        });
        await page.expect(
          "document.querySelector('#progress').getAttribute('aria-valuenow')",
          "40",
        );
        await page.expect(
          "document.querySelector('#progress').getAttribute('aria-valuetext')",
          "処理待ち",
        );
        await page.expect(
          "parseFloat(getComputedStyle(document.querySelector('#progress .dads-progress-indicator__bar')).strokeDashoffset)",
          100,
        );
        await page.setState({ min: 80, max: 40, value: null });
        await page.expect(
          "document.querySelector('#progress').getAttribute('aria-valuemin')",
          "0",
        );
        await page.expect(
          "document.querySelector('#progress').getAttribute('aria-valuemax')",
          "100",
        );
        await page.expect(
          "document.querySelector('#progress').hasAttribute('aria-valuenow')",
          false,
        );
        await page.expect(
          "document.querySelector('#progress svg').hasAttribute('data-indeterminate')",
          true,
        );
        await page.expect(
          "document.querySelector('#progress').style.getPropertyValue('--value')",
          "",
        );
        await page.expect(
          "document.querySelector('#progress .dads-progress-indicator__percentage')",
          null,
        );
        await page.expect(
          "getComputedStyle(document.querySelector('#progress .dads-progress-indicator__bar')).animationDuration",
          "4s",
        );
        await page.setState({
          value: 25,
          type: "inlined",
          label: "読み込み",
          showPercentage: false,
        });
        await page.expect(
          "getComputedStyle(document.querySelector('#progress svg')).width",
          "80px",
        );
        await page.expect(
          "document.querySelector('#progress').getAttribute('aria-label')",
          "読み込み",
        );
        await page.expect(
          "document.querySelector('#progress .dads-progress-indicator__percentage')",
          null,
        );
        await page.setState({ active: false });
        await page.expect(
          "getComputedStyle(document.querySelector('#progress')).display",
          "none",
        );
        await page.setState({ active: true, shape: "static" });
        await page.expect(
          "document.querySelector('#progress svg').getAttribute('viewBox')",
          "0 0 24 24",
        );
        await page.expect(
          "getComputedStyle(document.querySelector('#progress svg')).animationName",
          "none",
        );
      },
    );

    await runCase(
      "source reduced-motion rules stop loops with visible static fills",
      async (page) => {
        await page.setState({ value: null });
        // Activate the actual reduced-motion rules through CSSOM, without relying on the host OS preference.
        const count = await page.evaluate(`
            let count = 0;
            for (const sheet of document.styleSheets) {
                for (const rule of sheet.cssRules) {
                    if (rule.type === CSSRule.MEDIA_RULE && rule.conditionText.includes('prefers-reduced-motion')) {
                        rule.media.mediaText = 'all'; count++;
                    }
                }
            }
            await window.settle(); return count;
        `);
        assert.ok(count > 0);
        await page.expect(
          "[...document.querySelectorAll('#progress svg, #progress svg *')].every(el => getComputedStyle(el).animationName === 'none')",
          true,
        );
        await page.expect(
          "parseFloat(getComputedStyle(document.querySelector('#progress .dads-progress-indicator__bar')).strokeDashoffset)",
          65,
        );
        await page.expect(
          "getComputedStyle(document.querySelector('#progress svg')).display !== 'none'",
          true,
        );
        await page.setState({ shape: "linear" });
        await page.expect(
          "getComputedStyle(document.querySelector('#progress .dads-progress-indicator__bar')).animationName",
          "none",
        );
        await page.setState({ value: 60 });
        await page.expect(
          "parseFloat(getComputedStyle(document.querySelector('#progress .dads-progress-indicator__bar')).strokeDashoffset)",
          50,
        );
      },
    );

    await runCase(
      "explicit announcements start, repeat with latest progress, stop and clean up",
      async (page) => {
        await page.setState({ active: false, intent: "explicit" });
        await page.expect(
          "document.querySelector('[role=status]').textContent",
          "",
        );
        await page.setState({ active: true });
        await page.expect(
          "document.querySelector('[role=status]').textContent",
          "開始",
        );
        await page.expect(
          "document.querySelector('[role=status]').textContent",
          "進捗 50%",
        );
        await page.setState({ value: null });
        await page.expect(
          "document.querySelector('[role=status]').textContent",
          "待機中",
        );
        await page.setState({ active: false });
        await page.expect(
          "document.querySelector('[role=status]').textContent",
          "完了",
        );
        await page.setState({ intent: "passive" });
        await page.expect(
          "document.querySelector('[role=status]').textContent",
          "",
        );
        await page.setState({ active: true, intent: "explicit" });
        await page.setState({ visible: false });
        await page.expect("document.querySelector('[role=status]')", null);
        await page.evaluate(
          "await new Promise(resolve => setTimeout(resolve, 600));",
        );
        await page.expect("document.querySelector('[role=status]')", null);
      },
    );

    await runCase(
      "step actions bind current ID, are cancelable and never submit forms",
      async (page) => {
        await page.click(control("one"));
        let state = await page.snapshot();
        assert.equal(state.currentId, "one");
        assert.equal(state.submits, 0);
        assert.deepEqual(state.events, [
          {
            id: "one",
            index: 0,
            previousId: "two",
            cancelable: true,
            native: true,
          },
        ]);
        await page.expect(
          "[...document.querySelectorAll('#steps [aria-current=step]')].map(el=>el.dataset.stepId)",
          ["one"],
        );
        await page.setState({ cancel: true });
        await page.click(control("two"));
        assert.equal((await page.snapshot()).currentId, "one");
        await page.setState({ cancel: false });
        await page.focus(control("two"));
        await page.key("\uE007");
        assert.equal((await page.snapshot()).currentId, "two");
        await page.focus(control("one"));
        await page.key(" ");
        assert.equal((await page.snapshot()).currentId, "one");
        assert.equal((await page.snapshot()).submits, 0);
        await page.key("\uE014");
        await page.expect(
          "document.activeElement.closest('[data-step-id]').dataset.stepId",
          "one",
        );
        await page.key("\uE004");
        await page.expect(
          "document.activeElement.closest('[data-step-id]').dataset.stepId",
          "two",
        );
      },
    );

    await runCase(
      "links retain current step, cancellation blocks navigation and modified clicks pass through",
      async (page) => {
        await page.setState({ cancel: true });
        const initialHash = await page.read("location.hash");
        await page.click(control("link"));
        assert.equal(await page.read("location.hash"), initialHash);
        assert.equal((await page.snapshot()).currentId, "two");
        const originalCount = (await page.snapshot()).events.length;
        for (const modifier of ["ctrlKey", "metaKey", "shiftKey", "altKey"]) {
          const allowed = await page.evaluate(`
                const link = document.querySelector(${JSON.stringify(control("link"))});
                const event = new MouseEvent('click', { bubbles: true, cancelable: true, ${modifier}: true });
                // Observe prevention before suppressing the test's actual browser navigation.
                let allowed;
                link.addEventListener('click', event => { allowed = !event.defaultPrevented; event.preventDefault(); }, { once: true });
                link.dispatchEvent(event); await window.settle(); return allowed;
            `);
          assert.equal(allowed, true);
        }
        assert.equal((await page.snapshot()).events.length, originalCount);
        await page.setState({ cancel: false });
        await page.click(control("link"));
        await page.expect("location.hash", "#destination");
        assert.equal((await page.snapshot()).currentId, "two");
      },
    );

    await runCase(
      "disabled steps cannot act; reactive layouts, single state and details stay consistent",
      async (page) => {
        await page.evaluate(
          `document.querySelector(${JSON.stringify(control("disabled"))}).click(); document.querySelector(${JSON.stringify(control("disabled-link"))}).click(); await window.settle();`,
        );
        assert.equal((await page.snapshot()).events.length, 0);
        await page.expect(
          `document.querySelector(${JSON.stringify(control("disabled-link"))}).hasAttribute('href')`,
          false,
        );
        await page.setState({ disabled: true });
        await page.evaluate(
          `document.querySelector(${JSON.stringify(control("one"))}).click(); await window.settle();`,
        );
        assert.equal((await page.snapshot()).events.length, 0);
        await page.expect(
          "[...document.querySelectorAll('#steps button')].every(el=>el.disabled)",
          true,
        );
        await page.setState({
          disabled: false,
          orientation: "vertical",
          stepSize: "small",
          currentId: "one",
        });
        await page.expect(
          "getComputedStyle(document.querySelector('#steps ol')).flexDirection",
          "column",
        );
        await page.expect(
          "getComputedStyle(document.querySelector('#steps .dads-step-navigation__number')).height",
          "32px",
        );
        await page.expect(
          "document.querySelector('#steps .dads-step-navigation__description').textContent",
          "氏名を入力",
        );
        await page.setState({
          variant: "single",
          currentId: "two",
          numberOnly: true,
        });
        await page.expect(
          "[...document.querySelectorAll('#steps li')].map(el=>el.dataset.stepId)",
          ["two"],
        );
        await page.expect(
          "document.querySelector('#steps .dads-step-navigation__title')",
          null,
        );
        await page.expect(
          "document.querySelector('#steps .dads-step-navigation__description')",
          null,
        );
        await page.setState({ steps: [] });
        await page.expect("document.querySelectorAll('#steps li').length", 0);
      },
    );
  },
);
