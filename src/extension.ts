import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';
import * as fs from 'fs';

// ── Config helpers ────────────────────────────────────────────────────────────

function cfg<T>(key: string): T | undefined {
    return vscode.workspace.getConfiguration('ultimateBasic').get<T>(key);
}

function compilerPath(): string  { return cfg<string>('compilerPath')   ?? 'ultimate-basic'; }
function vicePath(): string      { return cfg<string>('vicePath')       ?? 'x64sc'; }
function viceArgs(): string[]    { return cfg<string[]>('viceArgs')     ?? []; }
function d64AddFiles(): string[] { return cfg<string[]>('d64AddFiles')  ?? []; }

function outputPathFor(srcFile: string, ext: '.prg' | '.d64'): string {
    const outDir = cfg<string>('defaultOutputDir') ?? '';
    const base   = path.basename(srcFile, path.extname(srcFile)) + ext;
    return outDir ? path.join(outDir, base) : path.join(path.dirname(srcFile), base);
}

// ── Active file guard ─────────────────────────────────────────────────────────

function requireUbFile(): { doc: vscode.TextDocument; src: string } | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor — open a .ub file first.');
        return;
    }
    if (editor.document.languageId !== 'ultimate-basic') {
        vscode.window.showErrorMessage('Active file is not an Ultimate Basic (.ub) file.');
        return;
    }
    if (editor.document.isDirty) { editor.document.save(); }
    return { doc: editor.document, src: editor.document.fileName };
}

// ── Terminal helper ───────────────────────────────────────────────────────────

let _terminal: vscode.Terminal | undefined;

function getTerminal(): vscode.Terminal {
    if (!_terminal || _terminal.exitStatus !== undefined) {
        _terminal = vscode.window.createTerminal('Ultimate Basic');
    }
    return _terminal;
}

function runInTerminal(cmd: string) {
    const t = getTerminal();
    t.show(true);
    t.sendText(cmd);
}

function quote(s: string): string {
    return `"${s.replace(/"/g, '\\"')}"`;
}

/**
 * On Windows, PowerShell requires the '&' call operator before a quoted
 * executable path (e.g. '& "C:\tools\ub.exe"').  Without it, PowerShell
 * treats the quoted string as a string expression and raises a ParserError.
 * In CMD.exe the leading '& ' with an empty left-hand side is harmless.
 * On non-Windows platforms the path is returned unchanged.
 */
function invokeExe(quotedPath: string): string {
    return (process.platform === 'win32' && quotedPath.startsWith('"'))
        ? '& ' + quotedPath
        : quotedPath;
}

// ── Build command builder ─────────────────────────────────────────────────────

interface BuildOptions {
    verbose?: boolean;
    d64?: boolean;
    noStub?: boolean;
}

function buildCommand(src: string, prg: string, opts: BuildOptions, d64?: string): string {
    const parts = [invokeExe(quote(compilerPath())), 'build', quote(src), '-o', quote(prg)];
    if (opts.verbose) { parts.push('-v'); }
    if (opts.noStub)  { parts.push('--no-stub'); }
    if (opts.d64 && d64) {
        parts.push('--d64', quote(d64));
        for (const f of d64AddFiles()) { parts.push('--add', quote(f)); }
    }
    return parts.join(' ');
}

function viceCommand(prg: string): string {
    const extra = viceArgs().map(quote).join(' ');
    return [invokeExe(quote(vicePath())), '-autostart', quote(prg), extra].filter(Boolean).join(' ');
}

// ── Compile-then-run via child_process so we can detect success ───────────────

function buildAndLaunchVice(src: string, prg: string, opts: BuildOptions, d64File?: string) {
    const t = getTerminal();
    t.show(true);

    // Show the build command so the user can see what's running
    const buildCmd = buildCommand(src, prg, opts, d64File);
    t.sendText(buildCmd);

    // Run the compiler in the background; on success launch VICE
    const child = child_process.spawn(compilerPath(), buildArgs(src, prg, opts, d64File), {
        cwd: path.dirname(src),
        shell: false,
    });

    let stderr = '';
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (code: number | null) => {
        if (code !== 0) {
            vscode.window.showErrorMessage(`Build failed (exit ${code}). Check the Terminal for details.`);
            return;
        }

        if (!fs.existsSync(prg)) {
            vscode.window.showErrorMessage(`Build succeeded but .prg not found: ${prg}`);
            return;
        }

        const targetFile = d64File && opts.d64 ? d64File : prg;
        vscode.window.showInformationMessage(`Build OK → launching VICE with ${path.basename(targetFile)}`);

        // Detach VICE so it doesn't block the terminal
        child_process.spawn(vicePath(), ['-autostart', targetFile, ...viceArgs()], {
            detached: true,
            stdio: 'ignore',
            cwd: path.dirname(src),
        }).unref();
    });
}

/** Build args as string[] for child_process.spawn */
function buildArgs(src: string, prg: string, opts: BuildOptions, d64?: string): string[] {
    const args = ['build', src, '-o', prg];
    if (opts.verbose) { args.push('-v'); }
    if (opts.noStub)  { args.push('--no-stub'); }
    if (opts.d64 && d64) {
        args.push('--d64', d64);
        for (const f of d64AddFiles()) { args.push('--add', f); }
    }
    return args;
}

// ── Command handlers ──────────────────────────────────────────────────────────

function cmdBuild(opts: BuildOptions = {}) {
    const f = requireUbFile(); if (!f) { return; }
    const prg = outputPathFor(f.src, '.prg');
    runInTerminal(buildCommand(f.src, prg, opts));
}

function cmdBuildD64(opts: BuildOptions = {}) {
    const f = requireUbFile(); if (!f) { return; }
    const prg = outputPathFor(f.src, '.prg');
    const d64 = outputPathFor(f.src, '.d64');
    runInTerminal(buildCommand(f.src, prg, { ...opts, d64: true }, d64));
}

function cmdBuildAndRun(opts: BuildOptions = {}) {
    const f = requireUbFile(); if (!f) { return; }
    const prg = outputPathFor(f.src, '.prg');
    buildAndLaunchVice(f.src, prg, opts);
}

function cmdBuildAndRunD64() {
    const f = requireUbFile(); if (!f) { return; }
    const prg = outputPathFor(f.src, '.prg');
    const d64 = outputPathFor(f.src, '.d64');
    buildAndLaunchVice(f.src, prg, { d64: true }, d64);
}

// ── Task provider ─────────────────────────────────────────────────────────────

function makeTask(
    name: string,
    scope: vscode.TaskScope | vscode.WorkspaceFolder,
    src: string,
    opts: BuildOptions & { runAfterBuild?: boolean }
): vscode.Task {
    const prg = outputPathFor(src, '.prg');
    const d64 = outputPathFor(src, '.d64');

    let shellCmd = buildCommand(src, prg, opts, opts.d64 ? d64 : undefined);
    if (opts.runAfterBuild) {
        const sep = process.platform === 'win32' ? ' && ' : ' && ';
        shellCmd += `${sep}${viceCommand(prg)}`;
    }

    const task = new vscode.Task(
        { type: 'ultimate-basic', file: src, ...opts },
        scope,
        name,
        'Ultimate Basic',
        new vscode.ShellExecution(shellCmd),
        '$ultimate-basic'
    );
    task.group = vscode.TaskGroup.Build;
    task.presentationOptions = { reveal: vscode.TaskRevealKind.Always };
    return task;
}

class UbTaskProvider implements vscode.TaskProvider {
    provideTasks(): vscode.Task[] {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'ultimate-basic') { return []; }
        const src = editor.document.fileName;
        return [
            makeTask('build',             vscode.TaskScope.Workspace, src, {}),
            makeTask('build (verbose)',    vscode.TaskScope.Workspace, src, { verbose: true }),
            makeTask('build + d64',        vscode.TaskScope.Workspace, src, { d64: true }),
            makeTask('build & run',        vscode.TaskScope.Workspace, src, { runAfterBuild: true }),
        ];
    }

    resolveTask(task: vscode.Task): vscode.Task | undefined {
        const def = task.definition as {
            type: string; file: string; output?: string;
            verbose?: boolean; d64?: string; noStub?: boolean; runAfterBuild?: boolean;
        };
        if (def.type !== 'ultimate-basic') { return undefined; }
        return makeTask(task.name, task.scope ?? vscode.TaskScope.Workspace, def.file, {
            verbose: def.verbose,
            d64: !!def.d64,
            noStub: def.noStub,
            runAfterBuild: def.runAfterBuild,
        });
    }
}

// ── Document formatter ────────────────────────────────────────────────────────

/**
 * Strip a trailing line comment and trim trailing whitespace.
 * Handles # and ; starters, respecting double-quoted strings.
 * (Does not interpret # inside asm blocks, but block keywords never start
 *  with a 6502 mnemonic, so this is safe for indent detection.)
 */
function stripTrailingComment(raw: string): string {
    let inStr = false;
    for (let i = 0; i < raw.length; i++) {
        if (raw[i] === '"') { inStr = !inStr; continue; }
        if (!inStr && raw[i] === '#') {
            return raw.slice(0, i).trimEnd();
        }
    }
    return raw.trimEnd();
}

/**
 * Stack-based formatter with proper select/case handling.
 *
 * Block kinds:
 *  'generic'   – opened by if/for/while/loop/sub/sprdef/repeat/asm/else
 *  'select'    – opened by `select`; case arms live at this level
 *  'case_body' – opened by `case` / `else:` inside a select
 */
type BlockKind = 'generic' | 'select' | 'case_body';

class UbFormatter implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
    ): vscode.TextEdit[] {
        const edits: vscode.TextEdit[] = [];
        const unit  = options.insertSpaces ? ' '.repeat(options.tabSize) : '\t';
        let   level = 0;
        const stack: BlockKind[] = [];

        const top = () => stack[stack.length - 1] as BlockKind | undefined;

        for (let i = 0; i < document.lineCount; i++) {
            const line    = document.lineAt(i);
            const trimmed = line.text.trim();

            // Blank / whitespace-only: strip trailing spaces, keep the line
            if (trimmed === '') {
                if (line.text !== '') {
                    edits.push(vscode.TextEdit.replace(line.range, ''));
                }
                continue;
            }

            // Strip trailing comment for pattern matching only
            const code = stripTrailingComment(trimmed);
            const low  = code.toLowerCase();

            // Classify the line
            // `case N:` or bare `else:` (inside select) — both close previous case body and open a new one
            const isCase  = /^case\b/i.test(low) || /^else\s*:\s*$/.test(low);
            // plain `else` (without colon) — belongs to if/then
            const isElse  = /^else\b/i.test(low) && !isCase;
            const isEnd   = /^end\b/i.test(low);
            const isNext  = /^next\b/i.test(low);
            const isUntil = /^until\b/i.test(low);
            const isBrace = low === '}';

            // ── Decrease indent BEFORE printing ──────────────────────────────

            if (isCase) {
                // Close the previous case body (not the select frame itself)
                if (top() === 'case_body') { level = Math.max(0, level - 1); stack.pop(); }

            } else if (isElse) {
                // Close the if-body, print at the if-level
                level = Math.max(0, level - 1); stack.pop();

            } else if (isEnd) {
                // If the innermost block is a case body, close it first, then close its select/if/etc.
                if (top() === 'case_body') { level = Math.max(0, level - 1); stack.pop(); }
                level = Math.max(0, level - 1); stack.pop();

            } else if (isNext || isUntil || isBrace) {
                level = Math.max(0, level - 1); stack.pop();
            }

            // ── Print ─────────────────────────────────────────────────────────

            const newText = unit.repeat(level) + trimmed;
            if (newText !== line.text) {
                edits.push(vscode.TextEdit.replace(line.range, newText));
            }

            // ── Increase indent AFTER printing ───────────────────────────────

            if (isCase) {
                // Open the case body
                level++; stack.push('case_body');

            } else if (isElse) {
                // Re-open for the else body
                level++; stack.push('generic');

            } else if (/^select\b/i.test(low)) {
                level++; stack.push('select');

            } else if (/^(for|while|loop|times|sub|fn|sprdef|chardef|repeat)\b/i.test(low)) {
                level++; stack.push('generic');

            } else if (/^asm\s*\{/i.test(low)) {
                level++; stack.push('generic');

            } else if (/^if\b/i.test(low) && /\bthen\s*$/.test(code)) {
                // Block-form if: line ends with 'then' (nothing after it)
                level++; stack.push('generic');
            }
            // isEnd / isNext / isUntil / isBrace already closed above — no open action needed
        }

        return edits;
    }
}

// ── Format command ────────────────────────────────────────────────────────────

async function cmdFormat() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor — open a .ub file first.');
        return;
    }
    if (editor.document.languageId !== 'ultimate-basic') {
        vscode.window.showErrorMessage('Active file is not an Ultimate Basic (.ub) file.');
        return;
    }
    try {
        // editor.options.tabSize can be the string "tabSize" instead of a number
        // when auto-detection is active — fall back to workspace config in that case.
        const editorCfg  = vscode.workspace.getConfiguration('editor', editor.document.uri);
        const rawTabSize = editor.options.tabSize;
        const rawSpaces  = editor.options.insertSpaces;
        const opts: vscode.FormattingOptions = {
            tabSize:      typeof rawTabSize === 'number'  ? rawTabSize : (editorCfg.get<number>('tabSize')        ?? 4),
            insertSpaces: typeof rawSpaces  === 'boolean' ? rawSpaces  : (editorCfg.get<boolean>('insertSpaces')  ?? true),
        };

        const formatter = new UbFormatter();
        const edits = formatter.provideDocumentFormattingEdits(editor.document, opts);

        if (edits.length === 0) {
            vscode.window.showInformationMessage('Already formatted — no changes needed.');
            return;
        }

        // editor.edit() is more reliable than WorkspaceEdit for direct text changes
        const success = await editor.edit(builder => {
            for (const e of edits) { builder.replace(e.range, e.newText); }
        });

        if (success) {
            vscode.window.showInformationMessage(
                `Formatting applied (${edits.length} change${edits.length === 1 ? '' : 's'}).`
            );
        } else {
            vscode.window.showErrorMessage('Formatting failed — file may be read-only.');
        }
    } catch (e: any) {
        vscode.window.showErrorMessage(`Formatter error: ${e?.message ?? String(e)}`);
    }
}

// ── Activation ────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('ultimate-basic.build',          () => cmdBuild()),
        vscode.commands.registerCommand('ultimate-basic.buildVerbose',   () => cmdBuild({ verbose: true })),
        vscode.commands.registerCommand('ultimate-basic.buildD64',       () => cmdBuildD64()),
        vscode.commands.registerCommand('ultimate-basic.buildAndRun',    () => cmdBuildAndRun()),
        vscode.commands.registerCommand('ultimate-basic.buildAndRunD64', () => cmdBuildAndRunD64()),
        vscode.commands.registerCommand('ultimate-basic.format',         () => cmdFormat()),
        vscode.languages.registerDocumentFormattingEditProvider(
            { language: 'ultimate-basic' },
            new UbFormatter()
        ),
        vscode.tasks.registerTaskProvider('ultimate-basic', new UbTaskProvider()),
        vscode.window.onDidCloseTerminal(t => { if (t === _terminal) { _terminal = undefined; } })
    );
}

export function deactivate() {}
