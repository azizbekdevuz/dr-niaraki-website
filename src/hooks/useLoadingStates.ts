import { useRealLoadingState } from "./useRealLoadingState";
import { useFirstVisitDetection } from "./useFirstVisitDetection";

export function useLoadingStates(isMobile: boolean) {
  const { isLoading, progress } = useRealLoadingState(isMobile ? 2000 : 2500);
  const isFirstVisit = useFirstVisitDetection();

  return {
    isContentLoaded: !isFirstVisit ? true : !isLoading,
    loadingProgress: progress,
    isFirstVisit,
  };
}
