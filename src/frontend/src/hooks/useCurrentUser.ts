import { useQuery } from '@tanstack/react-query';
import { useInternetIdentity } from './useInternetIdentity';
import { useActor } from './useActor';
import type { UserProfile } from '../backend';

export function useCurrentUser() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const profileQuery = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  const roleQuery = useQuery<string>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const role = await actor.getCallerUserRole();
      return role;
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    userProfile: profileQuery.data,
    userRole: roleQuery.data,
    isLoading: actorFetching || profileQuery.isLoading || roleQuery.isLoading,
    isFetched: !!actor && profileQuery.isFetched,
    isAdmin: roleQuery.data === 'admin',
  };
}
