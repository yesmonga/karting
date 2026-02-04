import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

const DEFAULT_TEAM_NAME = 'Mon Équipe';
const DRIVER_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

// Anonymous user ID for non-authenticated mode
const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000000';

// Get or create default team (works without authentication)
async function getDefaultTeamId(): Promise<string> {
  // Try to get current user, fallback to anonymous ID
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || ANONYMOUS_USER_ID;

  // Check if team already exists
  const { data: existingTeams } = await supabase
    .from('teams')
    .select('id')
    .eq('user_id', userId)
    .eq('name', DEFAULT_TEAM_NAME)
    .limit(1);

  if (existingTeams && existingTeams.length > 0) {
    return existingTeams[0].id;
  }

  // Create a new team
  const { data: newTeam, error } = await supabase
    .from('teams')
    .insert({
      name: DEFAULT_TEAM_NAME,
      user_id: userId
    })
    .select('id')
    .single();

  if (error) throw error;
  return newTeam.id;
}

export function useDrivers() {
  const queryClient = useQueryClient();

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as DBDriver[];
    },
  });

  const createDriver = useMutation({
    mutationFn: async (input: DriverInput) => {
      const teamId = await getDefaultTeamId();
      const existingDrivers = driversQuery.data || [];

      const { data, error } = await supabase
        .from('drivers')
        .insert({
          name: input.name.toUpperCase(),
          code: input.code || input.name.slice(0, 3).toUpperCase(),
          color: input.color || DRIVER_COLORS[existingDrivers.length % DRIVER_COLORS.length],
          weight_kg: input.weight_kg,
          full_name: input.full_name || null,
          team_id: teamId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as DBDriver;
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
      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name.toUpperCase();
      if (input.code) updateData.code = input.code.toUpperCase();
      if (input.color) updateData.color = input.color;
      if (input.weight_kg !== undefined) updateData.weight_kg = input.weight_kg;
      if (input.full_name !== undefined) updateData.full_name = input.full_name;

      const { data, error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as DBDriver;
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
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
