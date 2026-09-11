import Loader from '@/components/ui/loader';

export default function MainDefaultLoading() {
  return (
    <main aria-label="Loading page" className="relative flex h-screen items-center justify-center overflow-hidden bg-background">
      <Loader />
    </main>
  );
}