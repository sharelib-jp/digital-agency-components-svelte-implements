<script context="module" lang="ts">
    export interface FileUploadExistingFile {
        id: string;
        name: string;
        /** Bytes, not a formatted size string. */
        size: number;
    }

    export interface FileUploadFileError {
        file: File;
        index: number;
        errors: string[];
    }

    export interface FileUploadValidationDetail {
        valid: boolean;
        errors: string[];
        fileErrors: FileUploadFileError[];
        totalSize: number;
        count: number;
        nativeMessage: string;
    }

    export interface FileUploadChangeDetail extends FileUploadValidationDetail {
        files: File[];
        existingFiles: FileUploadExistingFile[];
        reason: 'select' | 'drop' | 'remove' | 'reset';
        originalEvent: Event;
    }

    export interface FileUploadRemoveDetail {
        file: File | FileUploadExistingFile;
        isExisting: boolean;
        index: number;
        originalEvent: MouseEvent;
    }

    export interface FileUploadMessages {
        maxFiles: string;
        maxTotalSize: string;
        invalidType: string;
        maxFileSize: string;
        hasFileErrors: string;
        invalidConstraint: string;
        synchronization: string;
        required: string;
        dropAvailable: string;
        dropUnavailable: string;
        selectedFiles: string;
        removed: string;
    }

    // Only the explicitly enabled instance receives window-wide drops.
    let expandedOwner: (() => void) | null = null;
</script>

<script lang="ts">
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import FormControlLabel from './FormControlLabel.svelte';
    import Checkbox from './Checkbox.svelte';

    export let id: string;
    export let name: string | undefined = undefined;
    export let form: string | undefined = undefined;
    export let label: string = '参照する画像・ドキュメント';
    export let supportText: string | null = null;
    export let required: boolean = false;
    export let disabled: boolean = false;
    export let readonly: boolean = false;
    export let multiple: boolean = true;
    export let accept: string = '';
    export let files: File[] = [];
    export let existingFiles: FileUploadExistingFile[] = [];
    export let existingFilesName: string | undefined = undefined;
    export let maxFiles: number | undefined = undefined;
    export let maxFileSize: number | string | undefined = undefined;
    export let maxTotalSize: number | string | undefined = undefined;
    export let droppable: boolean = true;
    export let dropAreaExpandable: boolean = true;
    export let expandedDropArea: boolean = false;
    export let buttonLabel: string = 'ファイルを選択';
    export let dropText: string = 'または、このエリア内にドラッグ＆ドロップ';
    export let expandLabel: string = 'ドラッグ＆ドロップの範囲をこのブラウザウィンドウ全体に広げる';
    export let overlayText: string = 'このエリア内にファイルをドラッグ＆ドロップ';
    export let emptyText: string = 'ファイルが選択されていません';
    export let removeLabel: string = '解除';
    export let errorText: string | null = null;
    export let customValidity: string = '';
    export let messages: Partial<FileUploadMessages> = {};
    export let Class: string = '';

    const defaults: FileUploadMessages = {
        maxFiles: '選択できるファイル数が上限を超過しています。',
        maxTotalSize: '選択できるファイルサイズの合計が上限を超過しています。',
        invalidType: '許可されていないファイル形式です。',
        maxFileSize: 'ファイルサイズが上限を超過しています。',
        hasFileErrors: '選択したファイルにエラーがあります。該当ファイルをチェックしてください。',
        invalidConstraint: 'ファイルの制限値または既存ファイルの情報が不正です。',
        synchronization:
            'ファイルをフォーム入力に反映できません。このブラウザーではファイル選択を利用できません。',
        required: 'ファイルを選択してください。',
        dropAvailable: 'ここにドロップできます。',
        dropUnavailable: 'ドロップエリア外。',
        selectedFiles: '選択中：{count}個、{sizeFormatted}（{sizeBytes}バイト）',
        removed: '{name}の選択を解除しました。',
    };
    const dispatch = createEventDispatcher<{
        change: FileUploadChangeDetail;
        remove: FileUploadRemoveDetail;
        validation: FileUploadValidationDetail;
        reset: { originalEvent: Event };
    }>();

    let root: HTMLDivElement;
    let input: HTMLInputElement;
    let chooser: HTMLInputElement;
    let selectButton: HTMLButtonElement;
    let mounted = false;
    let dragover = false;
    let dragDepth = 0;
    let overlay = false;
    let syncError = false;
    let showRequired = false;
    let announcement = '';
    let alertText = '';
    let ownedValidity = '';
    let validationSignature = '';
    let initialExisting: FileUploadExistingFile[] = [];
    let attachedForm: HTMLFormElement | null = null;
    let overlayTimer: ReturnType<typeof setTimeout> | undefined;
    let announceVersion = 0;

    $: text = Object.fromEntries(
        Object.entries(defaults).map(([key, value]) => [
            key,
            messages[key as keyof FileUploadMessages] || value,
        ]),
    ) as unknown as FileUploadMessages;
    $: inputAttributes = Object.fromEntries(
        Object.entries($$restProps).filter(
            ([key]) => !['class', 'type', 'value', 'files', 'readonly'].includes(key),
        ),
    );
    $: supportTextId = supportText ? `${id}-support-text` : undefined;
    $: describedBy = [
        $$restProps['aria-describedby'],
        supportTextId,
        `${id}-selected-files`,
        `${id}-error-messages`,
    ]
        .filter(Boolean)
        .join(' ');
    $: existingName = existingFilesName ?? (name ? `${name}-existing` : undefined);
    $: result = validate(
        files,
        existingFiles,
        accept,
        multiple,
        maxFiles,
        maxFileSize,
        maxTotalSize,
        text,
    );
    $: summary = result.count
        ? interpolate(text.selectedFiles, {
              count: result.count,
              sizeFormatted: formatSize(result.totalSize),
              sizeBytes: bytes(result.totalSize),
          })
        : '';
    $: visibleErrors = [
        ...result.errors,
        ...(errorText ? [errorText] : []),
        ...(customValidity ? [customValidity] : []),
        ...(syncError ? [text.synchronization] : []),
        ...(showRequired && required && !files.length ? [text.required] : []),
    ];
    $: syncError = mounted
        ? synchronize(files, result, required, disabled, customValidity, errorText, text)
        : false;
    $: if (mounted) connectForm(input, form);
    $: if (mounted)
        updateExpanded(expandedDropArea, droppable && dropAreaExpandable && !disabled && !readonly);
    $: if (disabled || readonly || !droppable) clearDrag();
    $: if (mounted) publishValidation(result, visibleErrors, required, disabled, syncError);

    function bytes(size: number): string {
        return size.toLocaleString('ja-JP');
    }
    function formatSize(size: number): string {
        if (size <= 0) return '0B';
        const unit = Math.max(0, Math.min(3, Math.floor(Math.log(size) / Math.log(1024))));
        return `${Number((size / 1024 ** unit).toFixed(unit ? 1 : 0))}${['B', 'KB', 'MB', 'GB'][unit]}`;
    }
    function interpolate(template: string, values: Record<string, string | number>): string {
        return template.replace(/\{(\w+)\}/g, (match, key) => String(values[key] ?? match));
    }
    function parseSize(value: number | string | undefined): number | null {
        if (value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : NaN;
        const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);
        const size = match
            ? Number(match[1]) *
              1024 ** ['b', 'kb', 'mb', 'gb'].indexOf((match[2] || 'b').toLowerCase())
            : NaN;
        return Number.isFinite(size) ? size : NaN;
    }
    function validate(
        selected: File[],
        existing: FileUploadExistingFile[],
        allowed: string,
        multi: boolean,
        countLimit: number | undefined,
        fileLimit: number | string | undefined,
        totalLimit: number | string | undefined,
        labels: FileUploadMessages,
    ) {
        const errors: string[] = [];
        const count = selected.length + existing.length;
        const totalSize = [...selected, ...existing].reduce(
            (sum, file) => sum + (Number.isFinite(file.size) && file.size >= 0 ? file.size : 0),
            0,
        );
        const perFile = parseSize(fileLimit);
        const total = parseSize(totalLimit);
        const invalidCount =
            countLimit !== undefined && (!Number.isInteger(countLimit) || countLimit < 0);
        if (
            invalidCount ||
            Number.isNaN(perFile) ||
            Number.isNaN(total) ||
            existing.some((file) => !file.id || !Number.isFinite(file.size) || file.size < 0) ||
            new Set(existing.map((file) => file.id)).size !== existing.length
        ) {
            errors.push(labels.invalidConstraint);
        }
        const max = multi ? countLimit : Math.min(countLimit ?? 1, 1);
        if (max !== undefined && count > max)
            errors.push(interpolate(labels.maxFiles, { max, current: count }));
        if (total !== null && totalSize > total)
            errors.push(
                interpolate(labels.maxTotalSize, {
                    max: `${formatSize(total)} (${bytes(total)}B)`,
                    current: `${formatSize(totalSize)} (${bytes(totalSize)}B)`,
                }),
            );
        const tokens = allowed
            .toLowerCase()
            .split(',')
            .map((token) => token.trim())
            .filter(Boolean);
        const fileErrors: FileUploadFileError[] = selected.map((file, index) => {
            const errors: string[] = [];
            const extension = file.name.match(/\.[^.]+$/)?.[0].toLowerCase() ?? '';
            const mime = file.type.toLowerCase();
            if (
                tokens.length &&
                !tokens.some((token) =>
                    token.startsWith('.')
                        ? extension === token
                        : token.endsWith('/*')
                          ? mime.startsWith(token.slice(0, -1))
                          : mime === token,
                )
            )
                errors.push(labels.invalidType);
            if (perFile !== null && file.size > perFile)
                errors.push(
                    interpolate(labels.maxFileSize, {
                        max: `${formatSize(perFile)} (${bytes(perFile)}B)`,
                        current: `${formatSize(file.size)} (${bytes(file.size)}B)`,
                    }),
                );
            return { file, index, errors };
        });
        if (fileErrors.some((file) => file.errors.length)) errors.unshift(labels.hasFileErrors);
        return { errors, fileErrors, count, totalSize };
    }

    function synchronize(
        selected: File[],
        validation: typeof result,
        isRequired: boolean,
        isDisabled: boolean,
        custom: string,
        error: string | null,
        labels: FileUploadMessages,
    ) {
        input.required = isRequired;
        // validationMessage is empty on disabled controls; read it while enabled.
        input.disabled = false;
        let failed = false;
        try {
            const current = Array.from(input.files ?? []);
            if (
                current.length !== selected.length ||
                current.some((file, index) => file !== selected[index])
            ) {
                if (!selected.length) input.value = '';
                else {
                    const transfer = new DataTransfer();
                    selected.forEach((file) => transfer.items.add(file));
                    input.files = transfer.files;
                }
            }
        } catch {
            input.value = '';
            failed = true;
        }
        // Preserve a consumer's direct input.setCustomValidity() across state changes.
        const external =
            input.validity.customError &&
            (!input.willValidate || input.validationMessage !== ownedValidity);
        if (!external) {
            ownedValidity =
                custom || error || (failed ? labels.synchronization : validation.errors.join('\n'));
            input.setCustomValidity(ownedValidity);
        }
        input.disabled = isDisabled;
        if (selected.length) showRequired = false;
        return failed;
    }
    function detail(): FileUploadValidationDetail {
        return {
            valid:
                disabled ||
                (input
                    ? !input.willValidate || input.validity.valid
                    : !visibleErrors.length && (!required || files.length > 0)),
            errors: [...visibleErrors],
            fileErrors: result.fileErrors.map((entry) => ({ ...entry, errors: [...entry.errors] })),
            totalSize: result.totalSize,
            count: result.count,
            nativeMessage: input?.validationMessage ?? '',
        };
    }
    function publishValidation(
        _result: typeof result,
        _errors: string[],
        _required: boolean,
        _disabled: boolean,
        _sync: boolean,
    ) {
        const current = detail();
        const signature = JSON.stringify([
            current.valid,
            current.errors,
            current.fileErrors.map((entry) => entry.errors),
            current.count,
            current.totalSize,
            current.nativeMessage,
        ]);
        if (signature === validationSignature) return;
        validationSignature = signature;
        alertText = [
            ...current.errors,
            ...current.fileErrors.flatMap((entry) =>
                entry.errors.map((error) => `${entry.file.name}：${error}`),
            ),
        ].join(' ');
        dispatch('validation', current);
    }
    async function announce(message: string) {
        const version = ++announceVersion;
        announcement = '';
        await tick();
        if (mounted && version === announceVersion) announcement = message;
    }
    async function changed(reason: FileUploadChangeDetail['reason'], event: Event) {
        await tick();
        if (!mounted) return;
        dispatch('change', {
            ...detail(),
            files: [...files],
            existingFiles: existingFiles.map((file) => ({ ...file })),
            reason,
            originalEvent: event,
        });
        announce(summary || emptyText);
    }
    function select(event: Event) {
        const target = event.currentTarget as HTMLInputElement;
        const incoming = Array.from(target.files ?? []);
        if (target === chooser) target.value = '';
        if (disabled || readonly || !incoming.length) {
            if (mounted)
                syncError = synchronize(
                    files,
                    result,
                    required,
                    disabled,
                    customValidity,
                    errorText,
                    text,
                );
            return;
        }
        add(incoming, 'select', event);
        selectButton?.focus();
    }
    function add(incoming: File[], reason: 'select' | 'drop', event: Event) {
        if (!incoming.length) return;
        if (multiple) files = [...files, ...incoming];
        else {
            // Keep an oversized drop visible and invalid rather than silently discard files.
            files = incoming;
            existingFiles = [];
        }
        changed(reason, event);
    }
    function choose() {
        if (!disabled && !readonly) chooser.click();
    }
    function inputClick(event: MouseEvent) {
        if (readonly || mounted) event.preventDefault();
        if (mounted) choose();
    }
    function invalid(event: Event) {
        showRequired = input.validity.valueMissing;
        alertText = input.validity.valueMissing ? text.required : input.validationMessage;
        if (mounted && !disabled) {
            event.preventDefault();
            (readonly ? root : selectButton?.isConnected ? selectButton : input).focus();
        }
        dispatch('validation', detail());
    }
    async function remove(isExisting: boolean, index: number, event: MouseEvent) {
        if (disabled || readonly) return;
        const file = isExisting ? existingFiles[index] : files[index];
        if (
            !dispatch('remove', { file, isExisting, index, originalEvent: event }, { cancelable: true })
        )
            return;
        const position = isExisting ? index : existingFiles.length + index;
        if (isExisting) existingFiles = existingFiles.filter((_, i) => i !== index);
        else files = files.filter((_, i) => i !== index);
        await changed('remove', event);
        const buttons = root.querySelectorAll<HTMLButtonElement>('[data-js-remove-button]');
        (buttons[Math.min(position, buttons.length - 1)] ?? selectButton)?.focus();
        announce(interpolate(text.removed, { name: file.name }));
    }

    function isFileDrag(event: DragEvent): boolean {
        return Array.from(event.dataTransfer?.types ?? []).includes('Files');
    }
    function canDrop(event: DragEvent): boolean {
        return droppable && !disabled && !readonly && isFileDrag(event);
    }
    function enter(event: DragEvent) {
        if (!canDrop(event)) return;
        event.preventDefault();
        dragDepth += 1;
        dragover = true;
        announce(text.dropAvailable);
    }
    function over(event: DragEvent) {
        if (!canDrop(event)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        dragover = true;
    }
    function leave(event: DragEvent) {
        if (!canDrop(event)) return;
        dragDepth = Math.max(0, dragDepth - 1);
        if (!dragDepth) {
            dragover = false;
            announce(text.dropUnavailable);
        }
    }
    function drop(event: DragEvent) {
        if (!canDrop(event)) return;
        event.preventDefault();
        event.stopPropagation();
        clearDrag();
        add(Array.from(event.dataTransfer?.files ?? []), 'drop', event);
        selectButton?.focus();
    }
    function clearDrag() {
        dragover = false;
        dragDepth = 0;
        overlay = false;
        clearTimeout(overlayTimer);
    }
    function relinquishExpanded() {
        expandedDropArea = false;
        clearDrag();
    }
    function updateExpanded(expanded: boolean, enabled: boolean) {
        if (!expanded || !enabled) {
            if (expandedOwner === relinquishExpanded) expandedOwner = null;
            if (!enabled) expandedDropArea = false;
            clearDrag();
        } else if (expandedOwner !== relinquishExpanded) {
            expandedOwner?.();
            expandedOwner = relinquishExpanded;
        }
    }
    function windowOver(event: DragEvent) {
        if (expandedOwner !== relinquishExpanded || !canDrop(event)) return;
        event.preventDefault();
        if (!overlay) announce(text.dropAvailable);
        overlay = true;
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        clearTimeout(overlayTimer);
        overlayTimer = setTimeout(clearDrag, 300);
    }
    function windowDrop(event: DragEvent) {
        if (expandedOwner === relinquishExpanded) drop(event);
    }
    function windowLeave(event: DragEvent) {
        if (!event.relatedTarget) clearDrag();
    }
    function escape(event: KeyboardEvent) {
        if (event.key === 'Escape') clearDrag();
    }
    function reset(event: Event) {
        if (!dispatch('reset', { originalEvent: event }, { cancelable: true })) event.preventDefault();
        queueMicrotask(() => {
            if (!mounted || event.defaultPrevented) return;
            files = [];
            existingFiles = initialExisting.map((file) => ({ ...file }));
            showRequired = false;
            clearDrag();
            changed('reset', event);
        });
    }
    async function connectForm(element: HTMLInputElement, _form: string | undefined) {
        // Reactive statements run before the DOM's form attribute is updated.
        await tick();
        if (!mounted || attachedForm === element.form) return;
        attachedForm?.removeEventListener('reset', reset);
        attachedForm = element.form;
        attachedForm?.addEventListener('reset', reset);
    }
    onMount(() => {
        initialExisting = existingFiles.map((file) => ({ ...file }));
        mounted = true;
        document.addEventListener('dragover', windowOver);
        document.addEventListener('drop', windowDrop);
        document.addEventListener('dragleave', windowLeave);
        document.addEventListener('dragend', clearDrag);
        document.addEventListener('keydown', escape);
        return () => {
            mounted = false;
            announceVersion += 1;
            attachedForm?.removeEventListener('reset', reset);
            document.removeEventListener('dragover', windowOver);
            document.removeEventListener('drop', windowDrop);
            document.removeEventListener('dragleave', windowLeave);
            document.removeEventListener('dragend', clearDrag);
            document.removeEventListener('keydown', escape);
            if (expandedOwner === relinquishExpanded) expandedOwner = null;
            clearDrag();
        };
    });
</script>

<div class={`dads-form-control-label dads-file-upload-field ${Class}`} data-size="md" tabindex="-1" bind:this={root}>
    {#if label}
        <FormControlLabel For={id} {label} {required} {supportText} {supportTextId} />
    {:else if supportText}
        <p id={supportTextId} class="dads-form-control-label__support-text">{supportText}</p>
    {/if}
    <div class="dads-file-upload" data-multiple={String(multiple)} data-has-error={visibleErrors.length ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined} data-readonly={readonly ? 'true' : undefined}>
        <input {...inputAttributes} {id} {name} {form} type="file" class="dads-file-upload__input"
            data-enhanced={mounted || readonly ? 'true' : undefined} data-js-input bind:this={input}
            {multiple} {accept} {required} {disabled} tabindex={mounted || readonly ? -1 : undefined}
            aria-label={$$restProps['aria-label'] ?? (label || buttonLabel)} aria-readonly={readonly ? 'true' : undefined}
            aria-invalid={visibleErrors.length ? 'true' : $$restProps['aria-invalid']} aria-describedby={describedBy}
            on:change={select} on:click={inputClick} on:invalid={invalid} on:focus on:blur />
        <input type="file" hidden bind:this={chooser} {multiple} {accept} disabled={disabled || readonly}
            aria-label={buttonLabel} on:change={select} />
        <div class="dads-u-visually-hidden" aria-live="polite" aria-atomic="true">{announcement}</div>
        <div class="dads-u-visually-hidden" aria-live="assertive" aria-atomic="true">{alertText}</div>
        <div class="dads-file-upload__inner">
            <!-- Drag events supplement the keyboard-accessible native chooser button. -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class:dads-file-upload__drop-area={droppable && !readonly} data-dragover={dragover ? 'true' : undefined}
                on:dragenter={enter} on:dragover={over} on:dragleave={leave} on:drop={drop}>
                {#if !readonly}
                    <div class="dads-file-upload__button-area">
                        <button id={`${id}-button`} class="dads-button" data-type="outline" data-size="md" type="button"
                            bind:this={selectButton} disabled={disabled || !mounted}
                            aria-labelledby={$$restProps['aria-labelledby'] ? `${$$restProps['aria-labelledby']} ${id}-button` : undefined}
                            aria-label={$$restProps['aria-labelledby'] ? undefined : `${$$restProps['aria-label'] ?? label} ${buttonLabel}`.trim()}
                            aria-describedby={describedBy} on:click={choose}>
                            {buttonLabel}
                        </button>
                        {#if droppable}<p>{dropText}</p>{/if}
                    </div>
                {/if}
                <p id={`${id}-selected-files`} class="dads-file-upload__select-summary">{summary}</p>
                <ul id={`${id}-error-messages`} class="dads-file-upload__error-messages" role="list">
                    {#each visibleErrors as error}<li>＊{error}</li>{/each}
                </ul>
                {#if droppable && dropAreaExpandable && !readonly}
                    <div class="dads-file-upload__expand-drop-area">
                        <Checkbox id={`${id}-expand`} label={expandLabel} size="md" bind:checked={expandedDropArea} {disabled} />
                    </div>
                {/if}
            </div>
            {#if !result.count}<p class="dads-file-upload__empty-message">{emptyText}</p>{/if}
            <ul class="dads-file-upload__file-list" role="list" hidden={!result.count}>
                {#each [...existingFiles.map((file, index) => ({ file, index, isExisting: true, errors: [] as string[] })),
                    ...result.fileErrors.map((entry) => ({ ...entry, isExisting: false }))] as entry, position}
                    <li class="dads-file-upload__file-item" data-error={entry.errors.length ? 'true' : undefined} data-existing={entry.isExisting ? 'true' : undefined}>
                        {#if entry.isExisting && existingName}
                            <input type="hidden" name={existingName} value={(entry.file as FileUploadExistingFile).id} {form} {disabled} />
                        {/if}
                        <div class="dads-file-upload__file-marker" aria-hidden="true"></div>
                        <div class="dads-file-upload__file-info">
                            <p><span id={`${id}-file-${position}-name`} class="dads-file-upload__file-name">{entry.file.name}</span>
                                <span class="dads-file-upload__file-meta">{formatSize(entry.file.size)}（{bytes(entry.file.size)}バイト）</span></p>
                            {#each entry.errors as error}<p>＊{error}</p>{/each}
                        </div>
                        {#if !readonly}
                            <button id={`${id}-file-${position}-remove`} class="dads-file-upload__remove-button dads-button"
                                data-type="text" data-size="xs" type="button" data-js-remove-button {disabled}
                                aria-labelledby={`${id}-file-${position}-remove ${id}-file-${position}-name`}
                                on:click={(event) => remove(entry.isExisting, entry.index, event)}>{removeLabel}</button>
                        {/if}
                    </li>
                {/each}
            </ul>
        </div>
        {#if overlay && !disabled && !readonly}
            <div class="dads-file-upload__viewport-overlay" aria-hidden="true">
                <div class="dads-file-upload__viewport-overlay-message">{overlayText}</div>
            </div>
        {/if}
    </div>
</div>

<style>
    .dads-form-control-label {
        display: flex;
        flex-direction: column;
        gap: calc(8 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }
    .dads-file-upload-field :global(.dads-form-control-label__label) {
        align-self: start;
        padding: 0;
        font-weight: bold;
        font-size: calc(17 / 16 * 1rem);
    }
    .dads-file-upload-field :global(.dads-form-control-label__requirement) {
        margin-left: calc(4 / 16 * 1rem);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
    }
    .dads-file-upload-field :global(.dads-form-control-label__requirement[data-required='true']) {
        color: var(--color-semantic-error-1);
    }
    .dads-file-upload-field :global(.dads-form-control-label__support-text) {
        margin: 0;
        color: var(--color-neutral-solid-gray-600);
    }
    .dads-file-upload {
        display: block;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
        overflow-wrap: anywhere;
    }
    .dads-u-visually-hidden,
    .dads-file-upload__input[data-enhanced='true'] {
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
    .dads-file-upload-field:focus,
    .dads-file-upload__input:focus-visible,
    .dads-button:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }
    .dads-file-upload__drop-area {
        box-sizing: border-box;
        border: 1px solid var(--color-neutral-solid-gray-536);
        border-radius: calc(8 / 16 * 1rem);
        background-color: var(--color-neutral-solid-gray-50);
        padding: calc(32 / 16 * 1rem);
    }
    .dads-file-upload[data-has-error='true'] .dads-file-upload__drop-area {
        border-color: var(--color-semantic-error-1);
    }
    .dads-file-upload__drop-area[data-dragover='true'] {
        outline: calc(4 / 16 * 1rem) solid var(--color-semantic-success-1);
        outline-offset: calc(-4 / 16 * 1rem);
        background-color: var(--color-primitive-green-50);
    }
    .dads-file-upload__button-area {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: calc(8 / 16 * 1rem) calc(16 / 16 * 1rem);
    }
    .dads-file-upload__button-area .dads-button {
        flex-shrink: 0;
    }
    .dads-file-upload__drop-area[data-dragover='true'] .dads-button {
        background-color: var(--button-outline-active-bg-color);
        color: var(--button-active-color);
        text-decoration: underline;
    }
    .dads-file-upload[data-has-error='true'] .dads-button[data-type='outline'] {
        border-color: var(--color-semantic-error-1);
    }
    .dads-file-upload__button-area p {
        margin: 0;
        width: 0;
        flex-grow: 1;
        min-width: 12em;
    }
    .dads-file-upload__select-summary {
        margin: calc(8 / 16 * 1rem) 0 0;
    }
    .dads-file-upload__select-summary:empty,
    .dads-file-upload__error-messages:empty {
        margin-top: 0;
    }
    .dads-file-upload__error-messages {
        margin: calc(8 / 16 * 1rem) 0 0;
        padding: 0;
        list-style-type: none;
    }
    .dads-file-upload__error-messages > li {
        color: var(--color-semantic-error-1);
    }
    .dads-file-upload__drop-area .dads-file-upload__error-messages > li {
        color: var(--color-semantic-error-2);
    }
    .dads-file-upload__expand-drop-area {
        margin: calc(48 / 16 * 1rem) 0 calc(-16 / 16 * 1rem) calc(-4 / 16 * 1rem);
    }
    .dads-file-upload__empty-message {
        margin: calc(16 / 16 * 1rem) 0 0;
    }
    .dads-file-upload__file-list {
        margin: calc(16 / 16 * 1rem) 0 0;
        padding: 0;
        list-style-type: none;
        counter-reset: file-item;
    }
    .dads-file-upload__file-list[hidden] {
        display: none;
    }
    .dads-file-upload__file-item {
        display: flex;
        align-items: baseline;
        counter-increment: file-item;
    }
    .dads-file-upload__remove-button {
        order: -1;
    }
    .dads-file-upload__file-item + .dads-file-upload__file-item {
        margin-top: calc(4 / 16 * 1rem);
    }
    .dads-file-upload__remove-button.dads-button[data-size='xs'] {
        flex-shrink: 0;
        min-width: calc(48 / 16 * 1rem);
        min-height: calc(30 / 16 * 1rem);
        font-size: calc(16 / 16 * 1rem);
    }
    .dads-file-upload[data-multiple='false'] .dads-file-upload__file-marker {
        display: flex;
        flex-shrink: 0;
        align-self: start;
        justify-content: center;
        align-items: center;
        width: calc(24 / 16 * 1rem);
        height: calc(30 / 16 * 1rem);
    }
    .dads-file-upload[data-multiple='false'] .dads-file-upload__file-marker::before {
        width: calc(6 / 16 * 1rem);
        height: calc(6 / 16 * 1rem);
        border-radius: 50%;
        background-color: currentcolor;
        content: '';
    }
    .dads-file-upload[data-multiple='true'] .dads-file-upload__file-marker {
        width: calc(32 / 16 * 1rem);
        flex-shrink: 0;
    }
    .dads-file-upload[data-multiple='true'] .dads-file-upload__file-marker::before {
        content: counter(file-item) '.';
    }
    .dads-file-upload__file-info {
        flex: 1;
        min-width: 0;
    }
    .dads-file-upload__file-item[data-error='true'] .dads-file-upload__file-info {
        border-left: 4px solid var(--color-semantic-error-1);
        padding-left: calc(8 / 16 * 1rem);
        color: var(--color-semantic-error-1);
    }
    .dads-file-upload__file-info > p {
        margin: 0;
    }
    .dads-file-upload__file-name {
        margin-right: calc(16 / 16 * 1rem);
        font-weight: bold;
    }
    .dads-file-upload__file-meta {
        color: var(--color-neutral-solid-gray-600);
    }
    .dads-file-upload__file-item[data-error='true'] .dads-file-upload__file-meta {
        color: inherit;
    }
    .dads-file-upload__viewport-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        box-sizing: border-box;
        border: 4px solid var(--color-semantic-success-1);
        background-color: var(--color-primitive-green-50);
    }
    .dads-file-upload__viewport-overlay-message {
        display: flex;
        place-content: center;
        align-items: center;
        flex-wrap: wrap;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: calc(32 / 16 * 1rem - 4px);
        font-size: clamp(calc(18 / 16 * 1rem), 0.75rem + 1.875vw, calc(48 / 16 * 1rem));
        font-weight: bold;
        pointer-events: none;
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
    .dads-button[data-type='outline'] {
        border: 1px solid currentcolor;
        background-color: var(--color-neutral-white);
        color: var(--button-color);
    }
    .dads-button[data-type='text'] {
        border: 0;
        background-color: transparent;
        color: var(--button-color);
        text-decoration: underline;
        text-decoration-thickness: calc(1 / 16 * 1rem);
    }
    .dads-button[data-size='md'] {
        min-width: calc(96 / 16 * 1rem);
        min-height: calc(48 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        padding: calc(8 / 16 * 1rem) calc(16 / 16 * 1rem);
    }
    .dads-button[data-size='xs'] {
        position: relative;
        min-width: calc(72 / 16 * 1rem);
        min-height: calc(28 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        padding: calc(2 / 16 * 1rem) calc(8 / 16 * 1rem);
        font-size: calc(14 / 16 * 1rem);
    }
    .dads-button[data-size='xs']::after {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        height: calc(44 / 16 * 1rem);
    }
    .dads-button[data-type='outline']:active {
        background-color: var(--button-outline-active-bg-color);
        color: var(--button-active-color);
        text-decoration: underline;
    }
    .dads-button[data-type='text']:active {
        background-color: var(--color-key-100);
        color: var(--button-active-color);
    }
    .dads-button[data-type='text']:focus-visible {
        background-color: var(--color-primitive-yellow-300);
    }
    .dads-button:disabled {
        cursor: default;
        color: var(--color-neutral-solid-gray-300);
        text-decoration: none;
    }
    .dads-button[data-type='outline']:disabled {
        background-color: var(--color-neutral-white);
    }
    @media (hover: hover) {
        .dads-button[data-type='outline']:not(:disabled):hover {
            background-color: var(--button-outline-hover-bg-color);
            color: var(--button-hover-color);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
        }
        .dads-button[data-type='text']:not(:disabled):hover {
            background-color: var(--color-key-50);
            color: var(--button-hover-color);
            text-decoration-thickness: calc(3 / 16 * 1rem);
        }
    }
    @media (forced-colors: active) {
        .dads-file-upload[data-multiple='false'] .dads-file-upload__file-marker::before {
            background-color: CanvasText;
        }
        .dads-button:disabled {
            border-color: GrayText;
            color: GrayText;
        }
        .dads-file-upload__drop-area[data-dragover='true'],
        .dads-file-upload__viewport-overlay {
            outline-color: Highlight;
            border-color: Highlight;
        }
    }
</style>
