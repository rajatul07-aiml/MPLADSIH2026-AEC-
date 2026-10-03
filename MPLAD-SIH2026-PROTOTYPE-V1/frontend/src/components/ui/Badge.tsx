import React from 'react';
import { RiskLevel } from '../../types/work';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'low' | 'medium' | 'high' | 'critical' | 'neutral' | 'info' | 'success';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  let variantClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'low' || variant === 'success') {
    variantClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (variant === 'medium') {
    variantClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (variant === 'high') {
    variantClasses = 'bg-rose-50 text-rose-800 border-rose-200 font-medium';
  } else if (variant === 'critical') {
    variantClasses = 'bg-red-100 text-red-900 border-red-300 font-semibold';
  } else if (variant === 'info') {
    variantClasses = 'bg-blue-50 text-blue-800 border-blue-200';
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-medium border rounded whitespace-nowrap tracking-wide uppercase ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: RiskLevel; score?: number; className?: string }> = ({
  level,
  score,
  className = '',
}) => {
  const variant =
    level === 'CRITICAL'
      ? 'critical'
      : level === 'HIGH'
      ? 'high'
      : level === 'MEDIUM'
      ? 'medium'
      : 'low';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {score !== undefined && (
        <span className="font-mono text-sm font-semibold text-slate-900">{score}</span>
      )}
      <Badge variant={variant} size="sm">
        {level}
      </Badge>
    </div>
  );
};
