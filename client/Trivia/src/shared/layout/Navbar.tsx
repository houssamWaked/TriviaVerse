import React from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';

type UserLike = {
  username?: string | null;
};

type NavButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  fullWidth?: boolean;
};

function NavButton({ icon, label, onClick, fullWidth = false }: NavButtonProps) {
  return (
    <Button
      onClick={onClick}
      color="inherit"
      fullWidth={fullWidth}
      sx={{
        justifyContent: fullWidth ? 'flex-start' : 'center',
        borderRadius: fullWidth ? 3 : 999,
        px: 1.75,
        py: fullWidth ? 1.25 : 1,
        color: 'text.secondary',
        fontWeight: 700,
      }}
      startIcon={<span>{icon}</span>}
    >
      {label}
    </Button>
  );
}

export default function Navbar({
  user,
  duelNotifCount = 0,
  onJoin,
  onLogout,
  onCreateQuiz,
  onDiscoverQuizzes,
  onFriends,
  onProfile,
  showAdmin = false,
  onAdmin,
  onLeaderboard,
  onHome,
}: {
  user?: UserLike | null;
  duelNotifCount?: number;
  onJoin?: () => void;
  onLogout?: () => void;
  onCreateQuiz?: () => void;
  onDiscoverQuizzes?: () => void;
  onFriends?: () => void;
  onProfile?: () => void;
  showAdmin?: boolean;
  onAdmin?: () => void;
  onLeaderboard?: () => void;
  onHome?: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  const navItems = [
    { key: 'quizzes', icon: ICONS.common.search, label: STRINGS.NAV.quizzes, onClick: onDiscoverQuizzes },
    ...(user
      ? [{ key: 'friends', icon: ICONS.common.handshake, label: STRINGS.NAV.friends, onClick: onFriends }]
      : []),
    ...(showAdmin
      ? [{ key: 'admin', icon: ICONS.common.wrench, label: STRINGS.NAV.admin, onClick: onAdmin }]
      : []),
    { key: 'leaderboard', icon: ICONS.common.trophy, label: STRINGS.NAV.leaderboard, onClick: onLeaderboard },
    { key: 'create', icon: ICONS.brand.sparkles, label: STRINGS.NAV.createQuiz, onClick: onCreateQuiz },
  ];

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(16px)',
          bgcolor: 'rgba(255,255,255,0.82)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 72, gap: 2, justifyContent: 'space-between' }}>
            <Button
              onClick={onHome}
              color="inherit"
              sx={{
                minWidth: 0,
                px: 0,
                gap: 1.5,
                color: 'text.primary',
                '&:hover': { bgcolor: 'transparent' },
              }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  width: 42,
                  height: 42,
                  fontSize: 20,
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                }}
              >
                {ICONS.brand.sparkles}
              </Avatar>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {STRINGS.COMMON.appName}
              </Typography>
            </Button>

            {!isMobile && (
              <Stack direction="row" spacing={0.5} sx={{ flex: 1, justifyContent: 'center' }}>
                {navItems.map((item) => (
                  <NavButton key={item.key} {...item} />
                ))}
              </Stack>
            )}

            <Stack direction="row" spacing={1.25} alignItems="center">
              {user ? (
                <>
                  <Button
                    onClick={onProfile}
                    color="inherit"
                    sx={{
                      borderRadius: 999,
                      px: 1.75,
                      py: 1,
                      bgcolor: 'grey.100',
                      color: 'text.primary',
                    }}
                    startIcon={<span>{ICONS.common.wave}</span>}
                  >
                    <Badge
                      color="error"
                      badgeContent={Number(duelNotifCount) > 9 ? '9+' : duelNotifCount || 0}
                      invisible={!Number(duelNotifCount)}
                    >
                      <Box component="span" sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.username || STRINGS.COMMON.playerFallback}
                      </Box>
                    </Badge>
                  </Button>
                  {!isMobile && (
                    <Button variant="outlined" color="inherit" onClick={onLogout}>
                      {STRINGS.COMMON.logout}
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="contained" onClick={onJoin} endIcon={<span>{ICONS.common.rocket}</span>}>
                  {STRINGS.COMMON.joinNow}
                </Button>
              )}

              {isMobile && (
                <IconButton
                  onClick={() => setMenuOpen((v) => !v)}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <span>{menuOpen ? ICONS.common.close : ICONS.common.menu}</span>
                </IconButton>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Box sx={{ width: 280, p: 2.5 }}>
          <Stack spacing={1}>
            {navItems.map((item) => (
              <NavButton
                key={item.key}
                {...item}
                fullWidth
                onClick={() => {
                  setMenuOpen(false);
                  item.onClick?.();
                }}
              />
            ))}
            {user && (
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout?.();
                }}
                sx={{ borderRadius: 3, mt: 1 }}
              >
                {STRINGS.COMMON.logout}
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}

