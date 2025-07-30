// hooks/useEarthquakeStats.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { EarthquakeStats } from "@/types/types";

export const useEarthquakeStats = () => {
  return useQuery({
    queryKey: ["earthquake-stats"],
    queryFn: async (): Promise<EarthquakeStats> => {
      const { data, error } = await supabase
        .from("earthquake_stats")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) {
        throw new Error(`Deprem istatistikleri alınamadı: ${error.message}`);
      }

      if (!data) {
        throw new Error("Deprem istatistik verisi bulunamadı");
      }

      return data;
    },
  });
};
