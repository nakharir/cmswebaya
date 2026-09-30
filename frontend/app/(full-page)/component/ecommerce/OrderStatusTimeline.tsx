'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  CircleCheck,
  XCircle,
} from 'lucide-react';
import { OrderStatus } from '@/types/ecommerce';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
}

const TIMELINE_STEPS: {
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { status: 'pending', label: 'Menunggu', icon: Clock },
  { status: 'confirmed', label: 'Dikonfirmasi', icon: CheckCircle2 },
  { status: 'processing', label: 'Diproses', icon: Package },
  { status: 'shipped', label: 'Dikirim', icon: Truck },
  { status: 'completed', label: 'Selesai', icon: CircleCheck },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  completed: 4,
};

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  currentStatus,
}) => {
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">
              Pesanan Dibatalkan
            </p>
            <p className="text-xs text-red-500">
              Pesanan ini telah dibatalkan dan tidak dapat dilanjutkan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[currentStatus] ?? 0;

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
      {/* Desktop horizontal timeline */}
      <div className="hidden sm:block">
        <div className="flex items-start justify-between relative">
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.status}
                className="flex flex-col items-center relative"
                style={{ flex: 1 }}
              >
                {/* Connector line (before this step) */}
                {index > 0 && (
                  <div
                    className="absolute top-4 right-1/2 h-0.5"
                    style={{ width: '100%', zIndex: 0 }}
                  >
                    <div
                      className={`h-full w-full ${
                        isCompleted || isCurrent
                          ? 'bg-pink-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}

                {/* Icon circle */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCurrent
                      ? 'bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-200'
                      : isCompleted
                        ? 'bg-pink-100 border-pink-400 text-pink-600'
                        : 'bg-white border-gray-200 text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Label */}
                <span
                  className={`mt-2 text-[11px] font-medium text-center leading-tight ${
                    isCurrent
                      ? 'text-pink-700 font-bold'
                      : isCompleted
                        ? 'text-pink-500'
                        : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical timeline */}
      <div className="block sm:hidden space-y-0">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="flex items-start gap-3">
              {/* Left column: icon + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    isCurrent
                      ? 'bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-200'
                      : isCompleted
                        ? 'bg-pink-100 border-pink-400 text-pink-600'
                        : 'bg-white border-gray-200 text-gray-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                </div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-5 ${
                      isCompleted ? 'bg-pink-400' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Right column: label */}
              <span
                className={`text-xs pt-1 ${
                  isCurrent
                    ? 'text-pink-700 font-bold'
                    : isCompleted
                      ? 'text-pink-500 font-medium'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
