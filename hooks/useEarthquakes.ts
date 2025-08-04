import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Earthquake } from "@/types/types";

export const useEarthquakes = () => {
  return useQuery({
    queryKey: ["earthquakes"],
    queryFn: async (): Promise<Earthquake[]> => {
      const { data, error } = await supabase
        .from("earthquakes")
        .select(
          "id, provider, title, date, mag, depth, longitude, latitude, region, faultline"
        )
        .order("date", { ascending: false });

      if (error) {
        throw new Error("Depremler alınamadı.");
      }

      return data || [];
    },
  });
};

export const useEarthquakeById = (id: string) => {
  return useQuery({
    queryKey: ["earthquakes", id],
    queryFn: async (): Promise<Earthquake> => {
      const { data, error } = await supabase
        .from("earthquakes")
        .select(
          "id, provider, title, date, mag, depth, longitude, latitude, region, faultline"
        )
        .eq("id", id)
        .single();

      if (error) {
        throw new Error("Deprem detayı alınamadı.");
      }

      if (!data) {
        throw new Error("Deprem bulunamadı");
      }

      return data;
    },
    enabled: !!id,
  });
};
