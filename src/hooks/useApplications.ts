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

export const useCreateApplication = () => useAppMutation(createApplication);
export const useUpdateApplication = () => useAppMutation(updateApplication);
export const useVerifyLivePhoto = () => useAppMutation(verifyLivePhoto);
export const useOcrPreview = () => useMutation({ mutationFn: previewOcr });
