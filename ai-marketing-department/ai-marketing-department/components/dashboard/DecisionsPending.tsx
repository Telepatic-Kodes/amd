'use client';

import { memo } from 'react';
import Link from 'next/link';
import { AlertCircle, FileCheck, Bot, XCircle } from 'lucide-react';

interface DecisionsPendingProps {
  contentInReview: number;
  agentErrors: number;
  failedExecutions: number;
}

export const DecisionsPending = memo(function DecisionsPending({
  contentInReview,
  agentErrors,
  failedExecutions,
}: DecisionsPendingProps) {
  const total = contentInReview + agentErrors + failedExecutions;

  if (total === 0) {
    return (
      <div
        className="rounded-lg border-2 p-4"
        style={{
          borderColor: 'var(--success)',
          backgroundColor: 'var(--card-bg)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded-full p-2"
            style={{
              backgroundColor: 'var(--surface-1)',
            }}
          >
            <FileCheck className="w-5 h-5" style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              Todo en orden
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border-2 p-4"
      style={{
        borderColor: 'var(--warning)',
        backgroundColor: 'var(--card-bg)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
          <h3
            className="text-sm font-semibold"
            style={{
              color: 'var(--text-primary)',
            }}
          >
            Decisiones Pendientes
          </h3>
        </div>
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
          style={{
            backgroundColor: 'var(--warning)',
          }}
        >
          {total}
        </span>
      </div>

      <div className="space-y-2">
        {contentInReview > 0 && (
          <Link href="/content">
            <div
              className="flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-1)',
              }}
            >
              <div
                className="rounded-lg p-2 flex-shrink-0"
                style={{
                  backgroundColor: 'var(--badge-amber-bg)',
                }}
              >
                <FileCheck className="w-4 h-4" style={{ color: 'var(--badge-amber-text)' }} />
              </div>
              <div className="flex-1">
                <p
                  className="text-sm font-bold"
                  style={{
                    color: 'var(--text-primary)',
                  }}
                >
                  {contentInReview}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: 'var(--text-secondary)',
                  }}
                >
                  contenido por aprobar
                </p>
              </div>
            </div>
          </Link>
        )}

        {agentErrors > 0 && (
          <Link href="/">
            <div
              className="flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-1)',
              }}
            >
              <div
                className="rounded-lg p-2 flex-shrink-0"
                style={{
                  backgroundColor: 'var(--badge-red-bg)',
                }}
              >
                <Bot className="w-4 h-4" style={{ color: 'var(--badge-red-text)' }} />
              </div>
              <div className="flex-1">
                <p
                  className="text-sm font-bold"
                  style={{
                    color: 'var(--text-primary)',
                  }}
                >
                  {agentErrors}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: 'var(--text-secondary)',
                  }}
                >
                  agentes con error
                </p>
              </div>
            </div>
          </Link>
        )}

        {failedExecutions > 0 && (
          <Link href="/">
            <div
              className="flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
              style={{
                backgroundColor: 'var(--surface-1)',
              }}
            >
              <div
                className="rounded-lg p-2 flex-shrink-0"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                }}
              >
                <XCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1">
                <p
                  className="text-sm font-bold"
                  style={{
                    color: 'var(--text-primary)',
                  }}
                >
                  {failedExecutions}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: 'var(--text-secondary)',
                  }}
                >
                  ejecuciones fallidas (24h)
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
});
