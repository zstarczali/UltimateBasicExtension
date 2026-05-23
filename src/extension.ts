import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';
import * as fs from 'fs';

// ── Config helpers ────────────────────────────────────────────────────────────

function cfg<T>(key: string): T | undefined {
    return vscode.workspace.getConfiguration('ultimateBasic').get<T>(key);
}

function compilerPath(): string { return cfg<string>('compilerPath') ?? 'ultimate-basic'; }
function vicePath(): string     { return cfg<string>('vicePath')     ?? 'x64sc'; }
function viceArgs(): string[]   { return cfg<string[]>('viceArgs')   ?? []; }

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

// ── Build command builder ─────────────────────────────────────────────────────

interface BuildOptions {
    verbose?: boolean;
    d64?: boolean;
    noStub?: boolean;
}

function buildCommand(src: string, prg: string, opts: BuildOptions, d64?: string): string {
    const parts = [quote(compilerPath()), 'build', quote(src), '-o', quote(prg)];
    if (opts.verbose) { parts.push('-v'); }
    if (opts.noStub)  { parts.push('--no-stub'); }
    if (opts.d64 && d64) { parts.push('--d64', quote(d64)); }
    return parts.join(' ');
}

function viceCommand(prg: string): string {
    const extra = viceArgs().map(quote).join(' ');
    return [quote(vicePath()), '-autostart', quote(prg), extra].filter(Boolean).join(' ');
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
    if (opts.d64 && d64) { args.push('--d64', d64); }
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

// ── Activation ────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('ultimate-basic.build',          () => cmdBuild()),
        vscode.commands.registerCommand('ultimate-basic.buildVerbose',   () => cmdBuild({ verbose: true })),
        vscode.commands.registerCommand('ultimate-basic.buildD64',       () => cmdBuildD64()),
        vscode.commands.registerCommand('ultimate-basic.buildAndRun',    () => cmdBuildAndRun()),
        vscode.commands.registerCommand('ultimate-basic.buildAndRunD64', () => cmdBuildAndRunD64()),
        vscode.tasks.registerTaskProvider('ultimate-basic', new UbTaskProvider()),
        vscode.window.onDidCloseTerminal(t => { if (t === _terminal) { _terminal = undefined; } })
    );
}

export function deactivate() {}
