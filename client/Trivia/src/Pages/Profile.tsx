import React from 'react';
import ProfilePage from '@/features/Profile/page/ProfilePage';
import type { ProfileProps } from '@/features/Profile/types';

export default function Profile(props: ProfileProps) {
  return <ProfilePage {...props} />;
}
