// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/server/auth'; // Adjust the import to your authOptions
import { checkRequireSetup } from '~/utils/requireSetup';
import Setup from './Setup';
import React from 'react';

export default async function SetupPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // User is not authenticated, redirect to home page
    redirect('/');
  }

  const needsSetup = await checkRequireSetup();

  if (!needsSetup) {
    // User needs to complete setup, redirect to setup page
    redirect('/');
  }

  return <Setup />;
}
