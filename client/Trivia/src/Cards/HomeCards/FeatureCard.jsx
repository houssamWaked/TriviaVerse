import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import colors from '@/constants/colors';

export default function FeatureCard({ icon, title, desc, accent }) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 4,
        color: 'common.white',
        bgcolor: 'rgba(15,23,42,0.55)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 14px 32px rgba(2,6,23,0.22)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <CardContent sx={{ p: 2.75 }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 3,
            mb: 1.5,
            bgcolor: `${accent}1A`,
            color: accent,
            fontSize: 24,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography sx={{ lineHeight: 1.6, color: colors.neutral[200] }}>
          {desc}
        </Typography>
      </CardContent>
    </Card>
  );
}
