"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type VditorType from 'vditor';
import 'vditor/dist/index.css';

interface VditorEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export interface VditorEditorHandle {
  getContent: () => string;
  renderPreview: () => void;
}

const VditorEditor = forwardRef<VditorEditorHandle, VditorEditorProps>(
  function VditorEditor({ value, onChange, placeholder = '请输入 Markdown 内容...', height }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<VditorType | null>(null);
    const onChangeRef = useRef(onChange);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    onChangeRef.current = onChange;

    // Debounced onChange - 3 second delay
    const debouncedOnChange = useCallback((val: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChangeRef.current(val);
      }, 3000);
    }, []);

    useImperativeHandle(ref, () => ({
      getContent: () => editorRef.current?.getValue() || '',
      renderPreview: () => {
        // In ir mode, content is always rendered - no-op
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      import('vditor').then(({ default: Vditor }) => {
        if (editorRef.current) return;

        const editor = new Vditor(containerRef.current!, {
          // ir = instant rendering, no split view, no video flickering
          mode: 'ir',
          height: height || '100%',
          placeholder,
          value,
          toolbar: [
            'emoji', 'headings', 'bold', 'italic', 'strike', '|',
            'line', 'quote', 'code', 'inline-code', 'table', '|',
            'undo', 'redo', '|',
          ],
          outline: {
            enable: true,
            position: 'right',
          },
          cache: {
            enable: false,
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
          },
          hint: {
            emoji: {
              '+1': '👍',
              'heart': '❤️',
              'smile': '😊',
            },
          },
          input: (val: string) => {
            debouncedOnChange(val);
          },
        });

        editorRef.current = editor;
      });

      return () => {
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
