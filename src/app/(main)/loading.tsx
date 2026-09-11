import Loader from '@/components/ui/loader';

export default function MainDefaultLoading() {
  return (
    <main aria-label="Loading homepage" className="relative flex h-screen items-center justify-center bg-background overflow-hidden">
      <Loader />
    </main>
  );
}