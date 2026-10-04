<script context="module" lang="ts">
    export type DatePickerType = 'consolidated' | 'separated';
    export type DatePickerSize = 'sm' | 'md' | 'lg';
    export interface DatePickerChangeDetail {
        value: string;
        date: Date | null;
        valid: boolean;
        source: 'input' | 'calendar';
    }
    export interface DatePickerEvents {
        input: DatePickerChangeDetail;
        change: DatePickerChangeDetail;
        'date-selected': { value: string; date: Date | null };
        open: void;
        close: void;
        reset: void;
    }

    // Construct local civil dates, including years 1–99 (which Date's constructor
    // otherwise interprets as 1901–1999). Never parse an ISO string as UTC.
    function localDate(year: number, month: number, day: number): Date {
        const result = new Date(2000, 0, 1);
        result.setFullYear(year, month - 1, day);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    function iso(date: Date): string {
        return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function parseDate(text: string): Date | null {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
        const [year, month, day] = text.split('-').map(Number);
        if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
        const date = localDate(year, month, day);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
            ? date
            : null;
    }

    function fromFields(fields: string[]): Date | null {
        if (!/^\d{4}$/.test(fields[0]) || !/^\d{1,2}$/.test(fields[1]) || !/^\d{1,2}$/.test(fields[2]))
            return null;
        return parseDate(`${fields[0]}-${fields[1].padStart(2, '0')}-${fields[2].padStart(2, '0')}`);
    }

    function fieldsFor(text: string): string[] {
        return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text.split('-') : ['', '', ''];
    }

    function shiftMonth(date: Date, amount: number): Date {
        const first = localDate(date.getFullYear(), date.getMonth() + 1 + amount, 1);
        const last = localDate(first.getFullYear(), first.getMonth() + 2, 0);
        return localDate(
            first.getFullYear(),
            first.getMonth() + 1,
            Math.min(date.getDate(), last.getDate()),
        );
    }

    function dateRange(min: string, max: string) {
        const lower = min || '0001-01-01';
        const upper = max || '9999-12-31';
        return { lower, upper, valid: !!parseDate(lower) && !!parseDate(upper) && lower <= upper };
    }

    type Range = ReturnType<typeof dateRange>;
    function inRange(date: Date | null, range: Range): boolean {
        if (!date || !range.valid || date.getFullYear() < 1 || date.getFullYear() > 9999) return false;
        const text = iso(date);
        return text >= range.lower && text <= range.upper;
    }

    function clamp(date: Date, range: Range): string {
        if (date.getFullYear() < 1) return range.lower;
        if (date.getFullYear() > 9999) return range.upper;
        const text = iso(date);
        return text < range.lower ? range.lower : text > range.upper ? range.upper : text;
    }

    function weeksFor(date: Date): Date[][] {
        const first = localDate(date.getFullYear(), date.getMonth() + 1, 1);
        const last = localDate(date.getFullYear(), date.getMonth() + 2, 0);
        const count = Math.ceil((first.getDay() + last.getDate()) / 7);
        return Array.from({ length: count }, (_, week) =>
            Array.from({ length: 7 }, (_, day) =>
                localDate(date.getFullYear(), date.getMonth() + 1, 1 - first.getDay() + week * 7 + day),
            ),
        );
    }

    function japaneseYear(year: number): string {
        const parts = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', {
            era: 'long',
            year: 'numeric',
        }).formatToParts(localDate(year, 1, 1));
        return `${year}年(${parts.find((part) => part.type === 'era')?.value ?? ''}${parts.find((part) => part.type === 'year')?.value ?? ''}年)`;
    }

    const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });
</script>

<script lang="ts">
    import { createEventDispatcher, onMount, tick } from 'svelte';

    /** 必須のfieldsetのID。空・空白のみは不可。SSRでも一致する一意の値を指定し、内部要素のID生成にも使います。 */
    export let id: string;
    /** 日付を送るhidden inputのname属性。年・月・日の入力は個別に送信しません。既定値: undefined。 */
    export let name: string | undefined = undefined;
    /** 関連付ける外部フォームのID（form属性）。未指定時は祖先フォームを使います。既定値: undefined。 */
    export let form: string | undefined = undefined;
    /** 年月日の入力を統合型または分割型で表示します。既定値: 'consolidated'。 */
    export let type: DatePickerType = 'consolidated';
    /** 入力欄とカレンダー開閉ボタンのサイズ。既定値: 'md'。 */
    export let size: DatePickerSize = 'md';
    /** 入力日付（YYYY-MM-DDまたは空文字列）。`bind:value`対応。不正・未完成・範囲外の入力は空文字列になります。既定値: ''。 */
    export let value: string = '';
    /** カレンダーの開閉状態。`bind:open`対応。無効・読み取り専用・カレンダーなしでは閉じます。既定値: false。 */
    export let open: boolean = false;
    /** カレンダーを利用するか。falseでは年月日の入力だけを表示します。既定値: true。 */
    export let calendar: boolean = true;
    /** 入力・選択できる最小日（当日を含むYYYY-MM-DD）。未指定時の下限は0001-01-01です。既定値: ''。 */
    export let minDate: string = '';
    /** 入力・選択できる最大日（当日を含むYYYY-MM-DD）。未指定時の上限は9999-12-31です。既定値: ''。 */
    export let maxDate: string = '';
    /** legendに表示するグループラベル。入力目的が分かる空でない値を指定します。既定値: '日付'。 */
    export let label: string = '日付';
    /** 年・月・日の全入力を必須にし、ラベルに必須表示を付けます。既定値: false。 */
    export let required: boolean = false;
    /** 編集とカレンダー操作を禁止し、編集不可と表示します。値は送信対象に残ります。既定値: false。 */
    export let readonly: boolean = false;
    /** 入力とカレンダー操作を無効にし、値をフォーム送信の対象から外します。既定値: false。 */
    export let disabled: boolean = false;
    /** ラベルの下に表示する補助文。各入力のaria-describedbyに関連付けます。既定値: null。 */
    export let supportText: string | null = null;
    /** 内部検証文より優先する外部エラー文。表示・ARIA用で、このprop自体はネイティブ検証を変更しません。既定値: null。 */
    export let errorText: string | null = null;
    /** ルートのfieldsetのclass属性に追加するCSSクラス。大文字のCで指定します。既定値: ''。 */
    export let Class: string = '';

    const dispatch = createEventDispatcher<DatePickerEvents>();
    const initialValue = value;
    const fieldNames = ['year', 'month', 'day'];
    const fieldLabels = ['年', '月', '日'];
    let fields = fieldsFor(value);
    let syncedValue = value;

    let submission: HTMLInputElement;
    let inputs: HTMLInputElement[] = [];
    let opener: HTMLButtonElement;
    let popover: HTMLDivElement;
    let mounted = false;
    let shown = false;
    let today = '';
    let focusedISO = iso(
        parseDate(value) ?? parseDate(minDate) ?? parseDate(maxDate) ?? localDate(2000, 1, 1),
    );
    let ownerForm: HTMLFormElement | null = null;

    $: if (!id || !id.trim()) throw new Error('DatePicker requires a stable, non-empty id.');
    $: range = dateRange(minDate, maxDate);
    $: if (value !== syncedValue) syncValue(value);
    $: candidate = fromFields(fields);
    $: hasInput = fields.some(Boolean) || !!value;
    $: valid = hasInput ? inRange(candidate, range) : !required && range.valid;
    $: validationMessage = !range.valid
        ? '日付の範囲設定を確認してください。'
        : hasInput && !valid
          ? '正しい範囲内の日付を入力してください。'
          : required && !hasInput
            ? '日付を入力してください。'
            : '';
    $: submittedValue = inRange(candidate, range) ? iso(candidate!) : '';
    $: displayedError = errorText || (hasInput && !valid ? validationMessage : null);
    $: supportId = supportText ? `${id}-support-text` : undefined;
    $: errorId = displayedError ? `${id}-error-text` : undefined;
    $: describedBy = [supportId, errorId].filter(Boolean).join(' ') || undefined;
    $: actualOpen = open && calendar && !disabled && !readonly;
    $: if (mounted) reconcileOpen(actualOpen);
    $: if (mounted && open && (disabled || readonly || !calendar)) open = false;
    $: if (focusedISO && range.valid && !inRange(parseDate(focusedISO), range)) {
        const restoreFocus =
            mounted &&
            actualOpen &&
            popover?.contains(document.activeElement) &&
            document.activeElement?.hasAttribute('data-js-date-button');
        focusedISO = clamp(parseDate(focusedISO)!, range);
        if (restoreFocus) void focusDate();
    }
    $: displayDate = parseDate(focusedISO) ?? localDate(2000, 1, 1);
    $: displayYear = displayDate.getFullYear();
    $: displayMonth = displayDate.getMonth();
    $: heading = `${displayYear}年${displayMonth + 1}月`;
    $: weeks = weeksFor(displayDate);
    $: previousAvailable = range.valid && focusedISO.slice(0, 7) > range.lower.slice(0, 7);
    $: nextAvailable = range.valid && focusedISO.slice(0, 7) < range.upper.slice(0, 7);
    $: years = yearOptions(displayYear, range);
    $: if (mounted) applyValidity(validationMessage, inputs);
    $: if (mounted) attachForm(form, submission);

    function yearOptions(year: number, bounds: Range): number[] {
        if (!bounds.valid) return [year];
        const first = Number(bounds.lower.slice(0, 4));
        const last = Number(bounds.upper.slice(0, 4));
        // Keep an unbounded picker usable without thousands of option elements.
        const start = last - first <= 500 ? first : Math.max(first, year - 100);
        const end = last - first <= 500 ? last : Math.min(last, year + 100);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }

    function syncValue(next: string) {
        syncedValue = next;
        fields = fieldsFor(next);
        if (mounted && actualOpen && range.valid) {
            const date = parseDate(next);
            if (date)
                navigate(
                    date,
                    popover?.contains(document.activeElement) &&
                        document.activeElement?.hasAttribute('data-js-date-button'),
                );
        }
    }

    function detail(source: 'input' | 'calendar'): DatePickerChangeDetail {
        const date = fromFields(fields);
        const validDate = inRange(date, range);
        return {
            value,
            date: validDate ? date : null,
            valid: validDate || (!fields.some(Boolean) && !required && range.valid),
            source,
        };
    }

    function handleInput(event: Event, index: number) {
        if (disabled || readonly) return;
        fields = fields.map((field, position) =>
            position === index ? (event.currentTarget as HTMLInputElement).value : field,
        );
        const date = fromFields(fields);
        value = inRange(date, range) ? iso(date!) : '';
        syncedValue = value;
        applyValidity(
            fields.some(Boolean) && !inRange(date, range)
                ? '正しい範囲内の日付を入力してください。'
                : required && !fields.some(Boolean)
                  ? '日付を入力してください。'
                  : '',
            inputs,
        );
        dispatch('input', detail('input'));
    }

    function applyValidity(message: string, elements: HTMLInputElement[]) {
        for (const input of elements) input?.setCustomValidity(message);
    }

    function inputKeydown(event: KeyboardEvent, index: number) {
        if (event.key === 'ArrowDown' && calendar && !readonly && !disabled) {
            event.preventDefault();
            open = true;
            return;
        }
        if (type !== 'consolidated') return;
        const input = event.currentTarget as HTMLInputElement;
        if (input.selectionStart !== input.selectionEnd) return;
        const direction =
            event.key === 'ArrowLeft' && input.selectionStart === 0
                ? -1
                : event.key === 'ArrowRight' && input.selectionStart === input.value.length
                  ? 1
                  : 0;
        if (direction && inputs[index + direction]) {
            event.preventDefault();
            inputs[index + direction].focus();
        }
    }

    function prepareCalendar() {
        if (!range.valid) return;
        const date = fromFields(fields);
        const partial =
            /^\d{4}$/.test(fields[0]) && /^\d{1,2}$/.test(fields[1])
                ? parseDate(`${fields[0]}-${fields[1].padStart(2, '0')}-01`)
                : null;
        focusedISO = clamp(date ?? partial ?? parseDate(today) ?? displayDate, range);
    }

    async function focusDate() {
        await tick();
        if (mounted && actualOpen) {
            const target =
                popover?.querySelector<HTMLElement>('[data-js-date-button][tabindex="0"]') ??
                popover?.querySelector<HTMLElement>('select:not(:disabled), button:not(:disabled)');
            target?.focus();
        }
    }

    function reconcileOpen(next: boolean) {
        if (next === shown) return;
        shown = next;
        if (next) {
            prepareCalendar();
            void focusDate();
            dispatch('open');
        } else {
            void tick().then(() => {
                if (mounted && !actualOpen && !disabled) opener?.focus();
            });
            dispatch('close');
        }
    }

    function closeCalendar() {
        open = false;
    }

    function navigate(date: Date, focus = false) {
        if (!range.valid) return;
        focusedISO = clamp(date, range);
        if (focus) void focusDate();
    }

    function navigateMonth(direction: number) {
        if (direction < 0 ? !previousAvailable : !nextAvailable) return;
        navigate(shiftMonth(displayDate, direction));
    }

    function selectDate(date: Date | null) {
        if (disabled || readonly || (date && !inRange(date, range))) return;
        value = date ? iso(date) : '';
        syncedValue = value;
        fields = fieldsFor(value);
        dispatch('input', detail('calendar'));
        dispatch('change', detail('calendar'));
        dispatch('date-selected', { value, date });
        closeCalendar();
    }

    function dateKeydown(event: KeyboardEvent, date: Date) {
        let target: Date;
        const offsets: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -7,
            ArrowDown: 7,
        };
        if (event.key in offsets)
            target = localDate(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate() + offsets[event.key],
            );
        else if (event.key === 'Home')
            target = localDate(date.getFullYear(), date.getMonth() + 1, date.getDate() - date.getDay());
        else if (event.key === 'End')
            target = localDate(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate() + 6 - date.getDay(),
            );
        else if (event.key === 'PageUp' || event.key === 'PageDown')
            target = shiftMonth(date, (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1));
        else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectDate(date);
            return;
        } else return;
        event.preventDefault();
        // At a range boundary arrow movement is ignored; week/month jumps clamp.
        if (event.key in offsets && !inRange(target, range)) return;
        navigate(target, true);
    }

    function popoverKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            closeCalendar();
        } else if (event.key === 'Tab') {
            const elements = [
                ...popover.querySelectorAll<HTMLElement>(
                    'button:not(:disabled), select:not(:disabled)',
                ),
            ].filter((element) => element.tabIndex >= 0);
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        }
    }

    function handleOutside(event: MouseEvent) {
        if (
            !actualOpen ||
            popover?.contains(event.target as Node) ||
            opener?.contains(event.target as Node)
        )
            return;
        closeCalendar();
    }

    function handleReset(event: Event) {
        queueMicrotask(() => {
            if (!mounted || event.defaultPrevented) return;
            value = initialValue;
            syncValue(initialValue);
            fields = fieldsFor(initialValue);
            closeCalendar();
            dispatch('reset');
        });
    }

    async function attachForm(_form: string | undefined, element: HTMLInputElement) {
        // Legacy reactive statements run before the form attribute is patched.
        await tick();
        if (!mounted) return;
        const next = element?.form ?? null;
        if (next === ownerForm) return;
        ownerForm?.removeEventListener('reset', handleReset);
        ownerForm = next;
        ownerForm?.addEventListener('reset', handleReset);
    }

    onMount(() => {
        today = iso(new Date());
        mounted = true;
        document.addEventListener('click', handleOutside, true);
        return () => {
            mounted = false;
            document.removeEventListener('click', handleOutside, true);
            ownerForm?.removeEventListener('reset', handleReset);
        };
    });
</script>

<fieldset {id} class={`dads-form-control-label ${Class}`} data-size={size} aria-describedby={describedBy}>
    <legend class="dads-form-control-label__label">
        {label}
        {#if readonly}
            <span class="dads-form-control-label__status">編集不可</span>
        {:else}
            <span class="dads-form-control-label__requirement" data-required={required}>{required ? '※必須' : '※任意'}</span>
        {/if}
    </legend>
    {#if supportText}<p id={supportId} class="dads-form-control-label__support-text">{supportText}</p>{/if}
    <div class="dads-date-picker" data-type={type}>
        <input bind:this={submission} type="hidden" {name} {form} value={submittedValue} {disabled} />
        <div class="dads-date-picker__controls" data-size={size}>
            <div class={type === 'consolidated' ? 'dads-date-picker__inputs' : 'dads-date-picker__separated-inputs'} data-error={displayedError ? '' : undefined} data-disabled={disabled ? '' : undefined} data-readonly={readonly ? '' : undefined}>
                {#each fieldNames as field, index}
                    <label class={`dads-date-picker__${type === 'separated' ? 'separated-' : ''}${field}`}>
                        <span class={type === 'consolidated' ? 'dads-date-picker__label' : 'dads-date-picker__separated-label'}>{fieldLabels[index]}</span>
                        <input bind:this={inputs[index]} id={`${id}-${field}`} class={type === 'consolidated' ? 'dads-date-picker__input' : 'dads-date-picker__separated-input'}
                            type="text" inputmode="numeric" pattern={index === 0 ? '[0-9]{4}' : '[0-9]{1,2}'} maxlength={index === 0 ? 4 : 2}
                            value={fields[index]} {required} {readonly} {disabled} {form}
                            data-js-year-input={index === 0 ? '' : undefined} data-js-month-input={index === 1 ? '' : undefined} data-js-day-input={index === 2 ? '' : undefined}
                            aria-invalid={displayedError ? 'true' : undefined} aria-describedby={describedBy}
                            on:input={event => handleInput(event, index)} on:change={() => dispatch('change', detail('input'))} on:keydown={event => inputKeydown(event, index)} />
                    </label>
                {/each}
            </div>
            {#if calendar}
                <button bind:this={opener} class="dads-date-picker__calendar-button" type="button" disabled={disabled || readonly}
                    aria-label="カレンダー" aria-haspopup="dialog" aria-expanded={actualOpen} aria-controls={`${id}-calendar`} data-js-calendar-button on:click={() => open = !open}>
                    <svg class="dads-date-picker__calendar-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="5" y="10" width="14" height="10" fill="Canvas" />
                        <path d="M9 16.5C7.62 16.5 6.5 15.38 6.5 14C6.5 12.62 7.62 11.5 9 11.5C10.38 11.5 11.5 12.62 11.5 14C11.5 15.38 10.38 16.5 9 16.5ZM5 22C3.9 22 3 21.09 3 20V6C3 4.91 3.91 4 5 4H6V2H8V4H16V2H18V4H19C20.09 4 21 4.91 21 6V20C21 21.09 20.09 22 19 22H5ZM5 20H19V10H5V20Z" fill="currentcolor" />
                    </svg>
                    <svg class="dads-date-picker__calendar-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.1L3 8L4 7L12 15L20 7L21 8L12 17.1Z" fill="currentcolor" /></svg>
                </button>
                {#if actualOpen}
                    <div bind:this={popover} id={`${id}-calendar`} class="dads-date-picker__calendar-popover" role="dialog" aria-label={`${label}のカレンダー`} aria-modal="true" tabindex="-1" data-js-calendar-popover on:keydown={popoverKeydown}>
                        <div class="dads-calendar" role="application" aria-label={heading} data-js-calendar>
                            <div class="dads-u-visually-hidden"><h2 data-js-calendar-heading aria-live="polite" aria-atomic="true">{heading}</h2></div>
                            <div class="dads-calendar__controls">
                                <span class="dads-select"><span class="dads-select__control">
                                    <select class="dads-select__select" data-size="sm" aria-label="年" data-js-year-select value={displayYear} disabled={!range.valid} on:change={event => navigate(localDate(Number(event.currentTarget.value), displayMonth + 1, Math.min(displayDate.getDate(), localDate(Number(event.currentTarget.value), displayMonth + 2, 0).getDate())))}>
                                        {#each years as year}<option value={year}>{japaneseYear(year)}</option>{/each}
                                    </select>
                                    <svg class="dads-select__chevron" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17L3 8L4 7L12 15L20 7L21 8L12 17Z" fill="currentcolor" /></svg>
                                </span></span>
                                <div class="dads-calendar__navigation">
                                    <button class="dads-button dads-calendar__nav-button" type="button" data-size="sm" data-type="outline" aria-label="前の月" aria-disabled={!previousAvailable} data-js-prev-month-button on:click={() => navigateMonth(-1)}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m5.27 8 5.33-5.33-.93-.94L3.4 8l6.27 6.27.93-.94L5.27 8Z" fill="currentcolor" /></svg>
                                    </button>
                                    <p class="dads-calendar__current-month" data-js-current-month>{displayMonth + 1}月</p>
                                    <button class="dads-button dads-calendar__nav-button" type="button" data-size="sm" data-type="outline" aria-label="次の月" aria-disabled={!nextAvailable} data-js-next-month-button on:click={() => navigateMonth(1)}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 1.73-.93.94L10.4 8l-5.33 5.33.93.94L12.27 8 6 1.73Z" fill="currentcolor" /></svg>
                                    </button>
                                </div>
                            </div>
                            <table class="dads-calendar__table" role="grid" aria-label={heading} data-js-calendar-table>
                                <thead><tr>{#each ['日', '月', '火', '水', '木', '金', '土'] as weekday}<th class="dads-calendar__header-cell" scope="col">{weekday}</th>{/each}</tr></thead>
                                <tbody data-js-calendar-tbody>
                                    {#each weeks as week}
                                        <tr>{#each week as date}
                                            {@const text = iso(date)}
                                            {@const unavailable = date.getMonth() !== displayMonth || !inRange(date, range)}
                                            {@const selected = !unavailable && text === submittedValue}
                                            <td class="dads-calendar__data-cell" role="gridcell" aria-disabled={unavailable ? 'true' : undefined} aria-selected={selected}>
                                                <button class="dads-calendar__date" type="button" data-js-date-button data-iso={text} data-year={date.getFullYear()} data-month={date.getMonth()} data-date={date.getDate()}
                                                    disabled={unavailable} data-selected={selected ? 'true' : undefined} tabindex={!unavailable && text === focusedISO ? 0 : -1} aria-current={text === today ? 'date' : undefined}
                                                    aria-label={`${selected ? '選択中 ' : ''}${dateFormatter.format(date)}`} on:focus={() => focusedISO = text} on:keydown={event => dateKeydown(event, date)} on:click={() => selectDate(date)}>{date.getDate()}</button>
                                            </td>
                                        {/each}</tr>
                                    {/each}
                                </tbody>
                            </table>
                            <div class="dads-calendar__footer">
                                <button class="dads-button" type="button" data-size="sm" data-type="text" data-js-delete-button on:click={() => selectDate(null)}>削除</button>
                                <button class="dads-button" type="button" data-size="sm" data-type="outline" data-js-today-button disabled={!inRange(parseDate(today), range)} on:click={() => selectDate(parseDate(today))}>今日</button>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}
        </div>
        {#if displayedError}<p id={errorId} class="dads-date-picker__error-text" aria-live="polite">{displayedError}</p>{/if}
    </div>
</fieldset>

<style>
    .dads-date-picker {
        display: inline-block;
        vertical-align: middle;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-date-picker__controls {
        position: relative;
        display: flex;
        align-items: end;
        column-gap: calc(16 / 16 * 1rem);
    }

    .dads-date-picker__inputs {
        --_background-color: var(--color-neutral-white);

        display: inline-flex;
        box-sizing: border-box;
        border-radius: calc(8 / 16 * 1rem);
        border: 1px solid var(--color-neutral-solid-gray-600);
        background-color: var(--_background-color);
        padding: calc(2 / 16 * 1rem) 0 calc(2 / 16 * 1rem) calc(2 / 16 * 1rem);
    }

    .dads-date-picker__controls[data-size='sm'] .dads-date-picker__inputs {
        height: calc(40 / 16 * 1rem);
    }

    .dads-date-picker__controls[data-size='md'] .dads-date-picker__inputs {
        height: calc(48 / 16 * 1rem);
    }

    .dads-date-picker__controls[data-size='lg'] .dads-date-picker__inputs {
        height: calc(56 / 16 * 1rem);
    }

    .dads-date-picker__inputs:focus-within {
        border-color: var(--color-neutral-black);
    }

    @media (hover: hover) {
        .dads-date-picker__inputs:hover {
            border-color: var(--color-neutral-solid-gray-900);
        }
    }

    .dads-date-picker__inputs[data-error] {
        border-color: var(--color-semantic-error-1);
    }

    .dads-date-picker__inputs[data-error]:focus-within {
        border-color: var(--color-primitive-red-1000);
    }

    .dads-date-picker__inputs[data-disabled] {
        --_background-color: var(--color-neutral-solid-gray-50);
        border-color: var(--color-neutral-solid-gray-300);
        color: var(--color-neutral-solid-gray-420);
    }

    .dads-date-picker__inputs[data-readonly] {
        border-style: dashed;
        border-color: var(--color-neutral-solid-gray-600);
    }

    @media (forced-colors: active) {
        .dads-date-picker__inputs:focus-within {
            border-color: Highlight;
        }

        @media (hover: hover) {
            .dads-date-picker__inputs:hover {
                border-color: Highlight;
            }
        }

        .dads-date-picker__inputs[data-disabled] {
            --_background-color: ButtonFace;
            border-color: GrayText;
            color: GrayText;
        }

        .dads-date-picker__inputs[data-readonly] {
            border-color: currentcolor;
        }
    }

    .dads-date-picker__year,
    .dads-date-picker__month,
    .dads-date-picker__day {
        position: relative;
        z-index: 0;
        display: inline-flex;
        flex-direction: row-reverse;
    }

    :is(.dads-date-picker__month, .dads-date-picker__day):not(:first-child) {
        margin-left: calc(-4 / 16 * 1rem);
    }

    :is(.dads-date-picker__month, .dads-date-picker__day):last-child {
        padding-right: calc(16 / 16 * 1rem);
    }

    .dads-date-picker__label {
        position: relative;
        z-index: 1;
        align-self: center;
        background-color: var(--_background-color);
        padding: calc(4 / 16 * 1rem);
        line-height: 1;
    }

    .dads-date-picker__input {
        margin-right: calc(-4 / 16 * 1rem);
        box-sizing: border-box;
        width: calc(64 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        border: 1px solid transparent;
        background-color: transparent;
        padding-right: calc(12 / 16 * 1rem);
        color: inherit;
        text-align: right;
        font: inherit;
        letter-spacing: inherit;
    }

    .dads-date-picker__input:focus {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        border: 1px solid var(--color-neutral-solid-gray-600);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    :is(.dads-date-picker__month, .dads-date-picker__day) .dads-date-picker__input {
        width: calc(44 / 16 * 1rem);
    }

    .dads-date-picker__separated-inputs {
        display: inline-flex;
        column-gap: calc(16 / 16 * 1rem);
        box-sizing: content-box;
        padding-top: calc(12 / 16 * 1rem);
    }

    .dads-date-picker__controls[data-size='sm'] .dads-date-picker__separated-inputs {
        height: calc(40 / 16 * 1rem);
    }

    .dads-date-picker__controls[data-size='md'] .dads-date-picker__separated-inputs {
        height: calc(48 / 16 * 1rem);
    }

    .dads-date-picker__controls[data-size='lg'] .dads-date-picker__separated-inputs {
        height: calc(56 / 16 * 1rem);
    }

    .dads-date-picker__separated-year,
    .dads-date-picker__separated-month,
    .dads-date-picker__separated-day {
        position: relative;
    }

    .dads-date-picker__separated-label {
        position: absolute;
        top: calc(-12 / 16 * 1rem);
        right: 0;
        left: 0;
        margin: 0 auto;
        box-sizing: border-box;
        width: calc(24 / 16 * 1rem);
        background-color: var(--color-neutral-white);
        padding: calc(4 / 16 * 1rem);
        line-height: 1;
    }

    .dads-date-picker__separated-label:has(+ :disabled) {
        color: var(--color-neutral-solid-gray-420);
    }

    @media (forced-colors: active) {
        .dads-date-picker__separated-label:has(+ :disabled) {
            color: GrayText;
        }
    }

    .dads-date-picker__separated-input {
        box-sizing: border-box;
        width: calc(72 / 16 * 1rem);
        height: 100%;
        border-radius: calc(8 / 16 * 1rem);
        border: 1px solid var(--color-neutral-solid-gray-600);
        background-color: var(--color-neutral-white);
        color: inherit;
        text-align: center;
        font: inherit;
        letter-spacing: inherit;
    }

    .dads-date-picker__separated-input:read-only:not(:disabled) {
        border-style: dashed;
    }

    .dads-date-picker__separated-input[aria-invalid='true'] {
        border-color: var(--color-semantic-error-1);
    }

    @media (hover: hover) {
        .dads-date-picker__separated-input:not(:read-only):hover {
            border-color: var(--color-neutral-solid-gray-900);
        }

        .dads-date-picker__separated-input[aria-invalid='true']:hover {
            border-color: var(--color-primitive-red-1000);
        }
    }

    .dads-date-picker__separated-input:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-date-picker__separated-input:disabled {
        border-color: var(--color-neutral-solid-gray-600);
        background-color: var(--color-neutral-solid-gray-50);
        color: var(--color-neutral-solid-gray-420);
    }

    :is(.dads-date-picker__separated-month, .dads-date-picker__separated-day)
        .dads-date-picker__separated-input {
        width: calc(56 / 16 * 1rem);
    }

    @media (forced-colors: active) {
        .dads-date-picker__separated-input:disabled {
            border-color: GrayText;
            color: GrayText;
        }
    }

    .dads-date-picker__calendar-button {
        display: flex;
        align-items: center;
        justify-content: center;
        column-gap: calc(4 / 16 * 1rem);
        border-radius: calc(6 / 16 * 1rem);
        border: 1px solid;
        background-color: var(--color-neutral-white);
        padding-right: calc(12 / 16 * 1rem);
        padding-left: calc(12 / 16 * 1rem);
        color: var(--color-key-900);
    }

    .dads-date-picker__controls[data-size='sm'] .dads-date-picker__calendar-button {
        height: calc(40 / 16 * 1rem);
    }

    .dads-date-picker__controls[data-size='md'] .dads-date-picker__calendar-button {
        height: calc(48 / 16 * 1rem);
    }

    .dads-date-picker__controls[data-size='lg'] .dads-date-picker__calendar-button {
        height: calc(56 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-date-picker__calendar-button:enabled:hover {
            border-width: calc(3 / 16 * 1rem);
            background-color: var(--color-key-200);
            padding-right: calc(10 / 16 * 1rem);
            padding-left: calc(10 / 16 * 1rem);
        }
    }

    .dads-date-picker__calendar-button:enabled:active {
        background-color: var(--color-key-300);
    }

    .dads-date-picker__calendar-button:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-date-picker__calendar-button:disabled {
        cursor: default;
        background-color: var(--color-neutral-white);
        color: var(--color-neutral-solid-gray-300);
        text-decoration: none;
    }

    @media (forced-colors: active) {
        .dads-date-picker__calendar-button:disabled {
            border-color: GrayText;
            color: GrayText;
        }
    }

    .dads-date-picker__calendar-icon {
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
    }

    .dads-date-picker__calendar-chevron {
        width: calc(16 / 16 * 1rem);
        height: calc(16 / 16 * 1rem);
    }

    .dads-date-picker__calendar-button[aria-expanded='true'] .dads-date-picker__calendar-chevron {
        rotate: 180deg;
    }

    .dads-date-picker__calendar-popover {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1;
        border-radius: calc(8 / 16 * 1rem);
        border: 1px solid var(--color-neutral-solid-gray-420);
        background-color: var(--color-neutral-white);
        box-shadow: var(--elevation-1);
    }

    .dads-date-picker__error-text {
        margin: calc(8 / 16 * 1rem) 0 0 0;
        color: var(--color-semantic-error-1);
        line-height: 1.7;
    }
    .dads-calendar {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: max-content;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-calendar__controls {
        display: flex;
        column-gap: calc(8 / 16 * 1rem);
        padding: calc(16 / 16 * 1rem);
    }

    .dads-calendar__navigation {
        display: flex;
    }

    .dads-calendar__nav-button.dads-button[data-size='sm'] {
        width: calc(44 / 16 * 1rem);
        min-width: 0;
        padding: 0;
    }

    @media (hover: hover) {
        .dads-calendar__nav-button.dads-button[data-size='sm']:hover {
            border-width: calc(3 / 16 * 1rem);
        }
    }

    .dads-calendar__current-month {
        margin: 0;
        align-self: center;
        width: calc(56 / 16 * 1rem);
        text-align: center;
    }

    .dads-calendar__table {
        margin-right: calc(12 / 16 * 1rem);
        margin-bottom: calc(8 / 16 * 1rem);
        margin-left: calc(12 / 16 * 1rem);
        width: auto;
        border-collapse: collapse;
    }

    .dads-calendar__header-cell {
        width: calc(48 / 16 * 1rem);
        height: calc(48 / 16 * 1rem);
        padding: 0;
        color: var(--color-neutral-solid-gray-700);
        font-weight: bold;
        text-align: center;
        vertical-align: middle;
    }

    .dads-calendar__data-cell {
        padding: 0;
    }

    .dads-calendar__date {
        margin: calc(4 / 16 * 1rem);
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: calc(40 / 16 * 1rem);
        height: calc(40 / 16 * 1rem);
        border-radius: 50%;
        border: 0;
        background-color: transparent;
        color: inherit;
        font: inherit;
        letter-spacing: inherit;
        text-underline-offset: calc(3 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-calendar__date:not([data-selected]):hover {
            border: 1px solid var(--color-neutral-black);
            background-color: var(--color-neutral-solid-gray-50);
            text-decoration: underline;
        }
    }

    .dads-calendar__date:not([data-selected]):active {
        background-color: var(--color-neutral-solid-gray-100);
    }

    .dads-calendar__date:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        background-color: var(--color-primitive-yellow-300);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-calendar__date[data-selected] {
        border: 1px solid transparent;
        background-color: var(--color-key-900);
        color: var(--color-neutral-white);
    }

    .dads-calendar__date:disabled {
        visibility: hidden;
    }

    .dads-calendar__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        column-gap: calc(16 / 16 * 1rem);
        box-sizing: border-box;
        width: 100%;
        padding: calc(16 / 16 * 1rem);
    }
    .dads-form-control-label {
        margin: 0;
        display: flex;
        flex-direction: column;
        border: 0;
        padding: 0;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-form-control-label[data-size='sm'] {
        gap: calc(4 / 16 * 1rem);
    }

    .dads-form-control-label[data-size='md'] {
        gap: calc(8 / 16 * 1rem);
    }

    .dads-form-control-label[data-size='lg'] {
        gap: calc(8 / 16 * 1rem);
    }

    .dads-form-control-label__label {
        align-self: start;
        padding: 0;
        font-weight: bold;
    }

    .dads-form-control-label[data-size='sm'] .dads-form-control-label__label {
        font-size: calc(16 / 16 * 1rem);
    }

    .dads-form-control-label[data-size='md'] .dads-form-control-label__label {
        font-size: calc(17 / 16 * 1rem);
    }

    .dads-form-control-label[data-size='lg'] .dads-form-control-label__label {
        font-size: calc(18 / 16 * 1rem);
    }

    legend.dads-form-control-label__label {
        margin-bottom: calc(8 / 16 * 1rem);
        float: none;
    }

    .dads-form-control-label__requirement {
        margin-left: calc(4 / 16 * 1rem);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
    }

    .dads-form-control-label__requirement[data-required='true'] {
        color: var(--color-semantic-error-1);
    }

    .dads-form-control-label__requirement::before {
        content: ' ';
    }

    .dads-form-control-label__status {
        margin-left: calc(4 / 16 * 1rem);
        display: inline-block;
        outline: 1px solid transparent;
        border-radius: calc(8 / 16 * 1rem);
        background-color: var(--color-neutral-solid-gray-536);
        padding: calc(8 / 16 * 1rem);
        color: var(--color-neutral-white);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        letter-spacing: 0.02em;
    }

    .dads-form-control-label__support-text {
        margin-top: 0;
        margin-bottom: 0;
        color: var(--color-neutral-solid-gray-600);
    }

    .dads-select {
        display: block;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-select__control {
        position: relative;
        display: block;
        width: fit-content;
    }

    .dads-select__select {
        vertical-align: middle;
        box-sizing: border-box;
        border-radius: calc(8 / 16 * 1rem);
        border: 1px solid var(--color-neutral-solid-gray-600);
        background-color: var(--color-neutral-white);
        padding-right: calc(40 / 16 * 1rem);
        padding-left: calc(16 / 16 * 1rem);
        color: inherit;
        font: inherit;
        line-height: 1;
        letter-spacing: inherit;
        appearance: none;
    }

    .dads-select__select[data-size='sm'] {
        height: calc(40 / 16 * 1rem);
    }

    .dads-select__select[data-size='md'] {
        height: calc(48 / 16 * 1rem);
    }

    .dads-select__select[data-size='lg'] {
        height: calc(56 / 16 * 1rem);
    }

    .dads-select__select:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    @media (hover: hover) {
        .dads-select__select:hover {
            border-color: var(--color-neutral-black);
        }
    }

    .dads-select__select:disabled,
    .dads-select__select:disabled:hover {
        border: 1px solid var(--color-neutral-solid-gray-300);
        background-color: var(--color-neutral-solid-gray-50);
        color: var(--color-neutral-solid-gray-420);
    }

    @media (forced-colors: active) {
        .dads-select__select {
            color: ButtonText;
            border-color: ButtonText;
        }

        .dads-select__select:disabled,
        .dads-select__select:disabled:hover {
            border-color: GrayText;
            color: GrayText;
        }
    }

    .dads-select__chevron {
        pointer-events: none;
        position: absolute;
        top: 0;
        right: calc(16 / 16 * 1rem);
        bottom: 0;
        margin-top: auto;
        margin-bottom: auto;
        width: calc(16 / 16 * 1rem);
        height: calc(16 / 16 * 1rem);
    }

    .dads-select__select:disabled + .dads-select__chevron {
        color: var(--color-neutral-solid-gray-420);
    }

    @media (forced-colors: active) {
        .dads-select__chevron {
            color: ButtonText;
        }

        .dads-select__select:disabled + .dads-select__chevron {
            color: GrayText;
        }
    }

    .dads-button {
        --button-color: var(--color-key-900);
        --button-hover-color: var(--color-key-1000);
        --button-active-color: var(--color-key-1200);
        --button-outline-hover-bg-color: var(--color-key-200);
        --button-outline-active-bg-color: var(--color-key-300);
        display: flex;
        align-items: center;
        justify-content: center;
        column-gap: calc(4 / 16 * 1rem);
        box-sizing: border-box;
        width: fit-content;
        max-width: 100%;
        font-weight: bold;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
        text-decoration: none;
        text-underline-offset: calc(3 / 16 * 1rem);
    }

    .dads-button:disabled,
    .dads-button[aria-disabled='true'] {
        cursor: default;
    }

    .dads-button[data-type='outline'] {
        border: 1px solid currentcolor;
        background-color: var(--color-neutral-white);
        color: var(--button-color);
    }

    @media (hover: hover) {
        .dads-button[data-type='outline']:hover {
            background-color: var(--button-outline-hover-bg-color);
            color: var(--button-hover-color);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
        }
    }

    .dads-button[data-type='outline']:active {
        background-color: var(--button-outline-active-bg-color);
        color: var(--button-active-color);
        text-decoration: underline;
    }

    .dads-button[data-type='outline']:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-button[data-type='outline']:disabled,
    .dads-button[data-type='outline'][aria-disabled='true'] {
        background-color: var(--color-neutral-white);
        color: var(--color-neutral-solid-gray-300);
        text-decoration: none;
    }

    @media (forced-colors: active) {
        .dads-button[data-type='outline']:disabled,
        .dads-button[data-type='outline'][aria-disabled='true'] {
            border-color: GrayText;
            color: GrayText;
        }
    }

    .dads-button[data-type='text'] {
        border: 0;
        background-color: transparent;
        color: var(--button-color);
        text-decoration: underline;
        text-decoration-thickness: calc(1 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-button[data-type='text']:hover {
            background-color: var(--color-key-50);
            color: var(--button-hover-color);
            text-decoration-thickness: calc(3 / 16 * 1rem);
        }
    }

    .dads-button[data-type='text']:active {
        background-color: var(--color-key-100);
        color: var(--button-active-color);
    }

    .dads-button[data-type='text']:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        background-color: var(--color-primitive-yellow-300);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-button[data-type='text']:disabled {
        background-color: transparent;
        color: var(--color-neutral-solid-gray-300);
        text-decoration-thickness: revert;
    }

    @media (forced-colors: active) {
        .dads-button[data-type='text']:disabled {
            color: GrayText;
        }
    }

    .dads-button[data-size='sm'] {
        position: relative;
        min-width: calc(80 / 16 * 1rem);
        min-height: calc(36 / 16 * 1rem);
        border-radius: calc(6 / 16 * 1rem);
        padding: calc(2 / 16 * 1rem) calc(12 / 16 * 1rem);
    }

    .dads-button[data-size='sm']::after {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        height: calc(44 / 16 * 1rem);
    }

    .dads-date-picker__calendar-button {
        box-sizing: border-box;
        font: inherit;
        letter-spacing: inherit;
    }
    .dads-u-visually-hidden {
        position: absolute;
        width: calc(1 / 16 * 1rem);
        height: calc(1 / 16 * 1rem);
        padding: 0;
        margin: calc(-1 / 16 * 1rem);
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
        border: 0;
    }
    .dads-date-picker__separated-input:is(:user-invalid, [aria-invalid='true']) {
        border-color: var(--color-semantic-error-1);
    }
    .dads-date-picker__inputs:has(:user-invalid) {
        border-color: var(--color-semantic-error-1);
    }
    @media (forced-colors: active) {
        .dads-calendar__date[data-selected] {
            background-color: Highlight;
            color: HighlightText;
        }
    }
</style>
