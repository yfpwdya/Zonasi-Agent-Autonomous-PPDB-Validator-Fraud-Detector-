"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createApplication,
  getApplication,
  getApplications,
  previewOcr,
  updateApplication,
  verifyLivePhoto,
} from "@/api/applications";

const KEY = ["applications"] as const;

export const useApplications = () => useQuery({ queryKey: KEY, queryFn: getApplications });

export const useApplication = (trackingId: string) =>
  useQuery({ queryKey: [...KEY, trackingId], queryFn: () => getApplication(trackingId), enabled: !!trackingId });

// Every write invalidates the whole "applications" cache so lists + detail views refetch.
function useAppMutation<TIn, TOut>(fn: (input: TIn) => Promise<TOut>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export const useCreateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (created) => {
      qc.setQueryData(
        KEY,
        (old?: { applications: typeof created[]; total: number; source?: string }) => {
          if (!old || !created) return old;
          const filtered = old.applications.filter(
            (a) => a.tracking_id.toUpperCase() !== created.tracking_id.toUpperCase(),
          );
          return {
            ...old,
            applications: [created, ...filtered],
            total: filtered.length + 1,
          };
        },
      );
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
};
export const useUpdateApplication = () => useAppMutation(updateApplication);
export const useVerifyLivePhoto = () => useAppMutation(verifyLivePhoto);
export const useOcrPreview = () => useMutation({ mutationFn: previewOcr });
