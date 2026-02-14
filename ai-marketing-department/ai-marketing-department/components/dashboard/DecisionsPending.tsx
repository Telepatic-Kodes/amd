'use client';

import Link from 'next/link';
import { AlertCircle, FileCheck, Bot, XCircle } from 'lucide-react';

interface DecisionsPendingProps {
  contentInReview: number;
  agentErrors: number;
  failedExecutions: number;
}

export function DecisionsPending({
  contentInReview,
  agentErrors,
  failedExecutions,
}: DecisionsPendingProps) {
  const total = contentInReview + agentErrors + failedExecutions;

  if (total === 0) {
    return (
      <div
        className="rounded-lg border-2 border-green-500 dark:border-green-500 p-4"
        style={{
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
            <FileCheck className="w-5 h-5 text-green-500" />
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
      className="rounded-lg border-2 border-amber-500 dark:border-amber-500 p-4"
      style={{
        backgroundColor: 'var(--card-bg)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
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
            backgroundColor: 'rgb(217, 119, 6)',
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
                  backgroundColor: 'rgba(217, 119, 6, 0.1)',
                }}
              >
                <FileCheck className="w-4 h-4 text-amber-600" />
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
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                }}
              >
                <Bot className="w-4 h-4 text-red-600" />
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
                  backgroundColor: 'rgba(234, 88, 12, 0.1)',
                }}
              >
                <XCircle className="w-4 h-4 text-orange-600" />
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
}
