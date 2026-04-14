import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';

type StatCardProps = {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  valueColor?: string;
};

export default function StatCard({ icon, value, label, valueColor }: StatCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'rgba(255,255,255,0.14)',
        bgcolor: 'rgba(255,255,255,0.07)',
        color: 'common.white',
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 2.5,
            mb: 1,
            bgcolor: 'rgba(255,255,255,0.08)',
            fontSize: 22,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: { xs: 25, md: 28 }, fontWeight: 900, color: valueColor, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography sx={{ fontWeight: 700, opacity: 0.82 }}>{label}</Typography>
      </CardContent>
    </Card>
  );
}

