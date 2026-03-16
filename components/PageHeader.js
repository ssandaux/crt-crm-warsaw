export default function PageHeader({ title, subtitle, count, action, children }) {
  const actionContent = action ?? children;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[20px] sm:text-[22px] font-bold text-gray-900 tracking-tight leading-none">{title}</h1>
          {count !== undefined && (
            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[12px] font-semibold tabular-nums">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1.5 text-[13px] text-gray-400">{subtitle}</p>}
      </div>
      {actionContent && <div className="flex items-center gap-2 shrink-0">{actionContent}</div>}
    </div>
  );
}
