import React from 'react';
import MillionairePage, {
  type MillionaireProps,
} from '@/features/Millionaire/page/MillionairePage';

export default function Millionaire(props: MillionaireProps) {
  return <MillionairePage {...props} />;
}

