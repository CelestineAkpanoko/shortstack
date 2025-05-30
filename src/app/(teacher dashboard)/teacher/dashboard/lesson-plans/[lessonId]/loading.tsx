export default function Loading() {
    return (
      <main className="container mx-auto p-4">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded w-full"></div>
              <div className="h-[400px] bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }