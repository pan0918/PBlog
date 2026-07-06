"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type VditorType from 'vditor';
import 'vditor/dist/index.css';

interface VditorEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  cacheId?: string;
  uploadUrl?: string;
  onReady?: () => void;
  onSaveShortcut?: () => void;
}

export interface VditorEditorHandle {
  getContent: () => string;
  renderPreview: () => void;
  clearCache: () => void;
  isUploading: () => boolean;
  insertMarkdown: (markdown: string) => void;
  focus: () => void;
}

const VditorEditor = forwardRef<VditorEditorHandle, VditorEditorProps>(
  function VditorEditor({
    value,
    onChange,
    placeholder = '请输入 Markdown 内容...',
    height,
    cacheId,
    uploadUrl,
    onReady,
    onSaveShortcut,
  }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<VditorType | null>(null);
    const onChangeRef = useRef(onChange);
    const onReadyRef = useRef(onReady);
    const onSaveShortcutRef = useRef(onSaveShortcut);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    onChangeRef.current = onChange;
    onReadyRef.current = onReady;
    onSaveShortcutRef.current = onSaveShortcut;

    const debouncedOnChange = useCallback((val: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChangeRef.current(val);
      }, 120);
    }, []);

    useImperativeHandle(ref, () => ({
      getContent: () => editorRef.current?.getValue() || '',
      renderPreview: () => {
        editorRef.current?.renderPreview();
      },
      clearCache: () => editorRef.current?.clearCache(),
      isUploading: () => Boolean(editorRef.current?.isUploading()),
      insertMarkdown: (markdown: string) => editorRef.current?.insertValue(markdown),
      focus: () => editorRef.current?.focus(),
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      let cancelled = false;

      import('vditor').then(({ default: Vditor }) => {
        if (cancelled || editorRef.current) return;

        const editor = new Vditor(containerRef.current!, {
          mode: 'ir',
          height: height || '100%',
          placeholder,
          value,
          toolbar: [
            'emoji', 'headings', 'bold', 'italic', 'strike', '|',
            'link', 'list', 'ordered-list', 'check', 'outdent', 'indent', '|',
            'line', 'quote', 'code', 'inline-code', 'table', 'upload', '|',
            'undo', 'redo', '|',
            'preview', 'both', 'fullscreen', 'edit-mode', '|',
            {
              name: 'more',
              toolbar: ['code-theme', 'content-theme', 'outline', 'export', 'info', 'help'],
            },
          ],
          toolbarConfig: {
            pin: true,
          },
          outline: {
            enable: true,
            position: 'right',
          },
          cache: {
            enable: Boolean(cacheId),
            id: cacheId,
          },
          counter: {
            enable: true,
            type: 'text',
          },
          tab: '    ',
          preview: {
            theme: { current: 'light' },
            markdown: {
              toc: true,
              footnotes: true,
            },
            hljs: {
              enable: true,
              style: 'github',
              lineNumber: true,
            },
            math: {
              engine: 'KaTeX',
            },
            render: {
              media: {
                enable: true,
              },
            },
          },
          hint: {
            emoji: {
              '+1': '👍',
              'heart': '❤️',
              'smile': '😊',
            },
          },
          upload: {
            url: uploadUrl || '',
            accept: 'image/*',
            fieldName: 'file[]',
            multiple: true,
            max: 8 * 1024 * 1024,
            filename: (name: string) => name.replace(/[^\w.\-\u4e00-\u9fa5]/g, '_'),
            format: (files: File[], responseText: string) => {
              try {
                const parsed = JSON.parse(responseText) as {
                  code?: number;
                  msg?: string;
                  data?: { succMap?: Record<string, string>; errFiles?: string[] };
                };
                return JSON.stringify({
                  msg: parsed.msg || '',
                  code: parsed.code ?? 0,
                  data: {
                    errFiles: parsed.data?.errFiles || [],
                    succMap: parsed.data?.succMap || Object.fromEntries(files.map((file) => [file.name, ''])),
                  },
                });
              } catch {
                return responseText;
              }
            },
          },
          input: (val: string) => {
            debouncedOnChange(val);
          },
          ctrlEnter: () => {
            onSaveShortcutRef.current?.();
          },
          after: () => {
            onReadyRef.current?.();
          },
        });

        editorRef.current = editor;
      });

      return () => {
        cancelled = true;
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (editorRef.current) {
          try { editorRef.current.destroy(); } catch {}
          editorRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, []);

    return (
      <div style={{
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius)',
        overflow: 'hidden',
        height: height ? `${height}px` : '720px',
      }}>
        <div ref={containerRef} style={{ height: '100%' }} />
      </div>
    );
  }
);

export default VditorEditor;
