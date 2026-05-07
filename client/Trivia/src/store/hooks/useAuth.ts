import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { StoredUser } from '@/api/userStore';
import type { AppDispatch, RootState } from '@/store';
import { clearAuthUser, setAuthUser } from '@/store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  const signIn = useCallback(
    (nextUser: StoredUser) => {
      dispatch(setAuthUser(nextUser));
    },
    [dispatch]
  );

  const signOut = useCallback(() => {
    dispatch(clearAuthUser());
  }, [dispatch]);

  return { user, signIn, signOut };
}
