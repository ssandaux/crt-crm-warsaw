export default function PageHeader({ title, subtitle, count, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{title}</h1>
          {count !== undefined && (
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[12px] font-semibold tabular-nums">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1.5 text-[13px] text-gray-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
