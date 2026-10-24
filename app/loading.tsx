export default function AdminLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block w-64 border-r border-gray-200 bg-white" />
      <div className="flex-1 p-6">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-gray-200" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-28 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
