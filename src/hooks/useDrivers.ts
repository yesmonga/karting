import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { drivers as driversApi } from '@/lib/api';
import { toast } from 'sonner';

export interface DBDriver {
  id: string;
  name: string;
  code: string;
  color: string;
  weight_kg: number | null;
  full_name: string | null;
  team_id: string;
  created_at: string;
}

export interface DriverInput {
  name: string;
  code?: string;
  color?: string;
  weight_kg: number;
  full_name?: string;
}

const DRIVER_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export function useDrivers() {
  const queryClient = useQueryClient();

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      return await driversApi.getAll() as DBDriver[];
    },
  });

  const createDriver = useMutation({
    mutationFn: async (input: DriverInput) => {
      const existingDrivers = driversQuery.data || [];

      return await driversApi.create({
        name: input.name.toUpperCase(),
        code: input.code || input.name.slice(0, 3).toUpperCase(),
        color: input.color || DRIVER_COLORS[existingDrivers.length % DRIVER_COLORS.length],
        weight_kg: input.weight_kg,
        full_name: input.full_name || undefined,
      }) as DBDriver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Pilote créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du pilote');
      console.error(error);
    },
  });

  const updateDriver = useMutation({
    mutationFn: async ({ id, ...input }: Partial<DriverInput> & { id: string }) => {
      return await driversApi.update(id, {
        name: input.name?.toUpperCase(),
        code: input.code?.toUpperCase(),
        color: input.color,
        weight_kg: input.weight_kg,
        full_name: input.full_name,
      }) as DBDriver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Pilote mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });

  const deleteDriver = useMutation({
    mutationFn: async (id: string) => {
      await driversApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Pilote supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    },
  });

  return {
    drivers: driversQuery.data || [],
    isLoading: driversQuery.isLoading,
    error: driversQuery.error,
    createDriver,
    updateDriver,
    deleteDriver,
    refetch: driversQuery.refetch,
  };
}
