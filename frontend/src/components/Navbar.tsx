import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  InputBase,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  Badge,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Menu as MenuIcon,
  NotificationsNone as NotificationsIcon,

  Home as HomeIcon,
  Extension as PuzzleIcon,
  Tv as TvIcon,
  Star as StarIcon,
  TrendingUp as EloIcon,
  Close as CloseIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { styled, alpha } from '@mui/material/styles';
import { User } from 'firebase/auth';
import { onAuthStateChange, logOut } from '../firebase/auth';
import { UserProfile } from '../firebase/users';
import { onAdminAuthStateChange, adminSignOut, AdminProfile } from '../firebase/adminAuth';

// Custom styled components
const StyledAppBar = styled(AppBar)(() => ({
  background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #8D6E63 100%)',
  boxShadow: '0 8px 32px rgba(61, 39, 35, 0.3)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  '&.scrolled': {
    background: 'rgba(61, 39, 35, 0.95)',
    backdropFilter: 'blur(20px)',
  }
}));

const ChessIcon = styled('div')({
  width: '40px',
  height: '40px',
  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  color: '#3E2723',
  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' }
  }
});

const SearchContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '25px',
  backgroundColor: alpha('#FAFAFA', 0.15),
  border: '1px solid rgba(212, 175, 55, 0.3)',
  '&:hover': {
    backgroundColor: alpha('#FAFAFA', 0.25),
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  marginLeft: theme.spacing(2),
  marginRight: theme.spacing(2),
  width: '100%',
  maxWidth: '400px',
  transition: 'all 0.3s ease',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#D4AF37',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: '#FAFAFA',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    fontSize: '14px',
    '&::placeholder': {
      color: 'rgba(250, 250, 250, 0.7)',
    }
  },
}));

interface NavButtonProps {
  active?: boolean;
}

const NavButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'active',
})<NavButtonProps>(({ active = false }) => ({
  color: active ? '#FFD700' : '#FAFAFA',
  fontWeight: active ? 600 : 500,
  fontSize: '0.9rem',
  padding: '8px 16px',
  borderRadius: '20px',
  margin: '0 4px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  minWidth: 'auto',
  maxWidth: '180px',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: active ? '100%' : '0%',
    height: '2px',
    background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
    transition: 'width 0.3s ease',
  },
  '&:hover': {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    transform: 'translateY(-2px)',
    '&::before': {
      width: '100%',
    }
  },
  '&:hover .nav-icon': {
    transform: 'rotate(10deg) scale(1.1)',
  }
}));

const StyledIconButton = styled(IconButton)({
  color: '#FAFAFA',
  marginLeft: '8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    transform: 'scale(1.1)',
    color: '#FFD700',
  }
});

const Navbar: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 100;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user, profile) => {
      setUser(user);
      setUserProfile(profile || null);
    });

    return () => unsubscribe();
  }, []);

  // Listen to admin auth state changes
  useEffect(() => {
    const unsubscribe = onAdminAuthStateChange((_user, profile) => {
      if (profile) {
        setAdminProfile(profile);
      } else {
        setAdminProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const navigationItems = [
    { path: '/', label: 'Haberler', icon: HomeIcon },
    { path: '/puzzle', label: 'Bulmaca', icon: PuzzleIcon },
    { path: '/tv', label: 'TV', icon: TvIcon },
    { path: '/pro', label: 'PRO OYUNLAR', icon: StarIcon },
    { path: '/elo-tsf', label: 'ELO TSF', icon: EloIcon },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAdminLoginClick = () => {
    navigate('/admin/login');
  };

  const handleLogout = async () => {
    try {
      if (adminProfile) {
        await adminSignOut();
      } else {
        await logOut();
      }
      handleMenuClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
    // Scroll to top when navigating to homepage
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const drawer = (
    <Box sx={{ width: 280, height: '100%', background: 'linear-gradient(180deg, #3E2723 0%, #5D4037 100%)' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.05)',
              transition: 'transform 0.3s ease',
            }
          }}
            onClick={() => {
              handleLogoClick();
              handleDrawerToggle();
            }}
          >
            <ChessIcon>♔</ChessIcon>
            <Typography variant="h6" sx={{ fontFamily: 'Playfair Display', fontWeight: 700, color: '#FAFAFA' }}>
              ChessNews
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerToggle} sx={{ color: '#FAFAFA' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <SearchContainer>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Satranç haberlerini ara..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </SearchContainer>
      </Box>
      <List>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <ListItem
              key={item.path}
              onClick={() => {
                navigate(item.path);
                handleDrawerToggle();
              }}
              sx={{
                color: location.pathname === item.path ? '#FFD700' : '#FAFAFA',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  color: '#FFD700',
                }
              }}
            >
              <IconComponent sx={{ mr: 2, fontSize: '20px' }} />
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400
                }}
              />
            </ListItem>
          );
        })}

        {/* Mobile Login/Logout */}
        <Box sx={{ p: 2, borderTop: '1px solid rgba(212, 175, 55, 0.2)', mt: 2 }}>
          {adminProfile ? (
            <Box>
              <Typography variant="body2" sx={{ color: '#BCAAA4', mb: 1 }}>
                Admin: {adminProfile.displayName}
              </Typography>
              <Button
                fullWidth
                onClick={() => {
                  navigate('/admin/dashboard');
                  handleDrawerToggle();
                }}
                startIcon={<DashboardIcon />}
                sx={{
                  backgroundColor: '#D4AF37',
                  color: '#FAFAFA',
                  fontWeight: 600,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: '#B8941F',
                  }
                }}
                variant="contained"
              >
                Dashboard
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  handleLogout();
                  handleDrawerToggle();
                }}
                startIcon={<LogoutIcon />}
                sx={{
                  backgroundColor: '#D32F2F',
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#B71C1C',
                  }
                }}
                variant="contained"
              >
                Çıkış
              </Button>
            </Box>
          ) : user && userProfile ? (
            <Box>
              <Typography variant="body2" sx={{ color: '#BCAAA4', mb: 1 }}>
                Hoş geldin, {userProfile.firstName}!
              </Typography>
              <Button
                fullWidth
                onClick={() => {
                  handleLogout();
                  handleDrawerToggle();
                }}
                startIcon={<LogoutIcon />}
                sx={{
                  color: '#FAFAFA',
                  borderColor: '#5D4037',
                  '&:hover': {
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  }
                }}
                variant="outlined"
              >
                Çıkış Yap
              </Button>
            </Box>
          ) : (
            <Button
              fullWidth
              onClick={() => {
                handleAdminLoginClick();
                handleDrawerToggle();
              }}
              startIcon={<LoginIcon />}
              sx={{
                backgroundColor: '#D4AF37',
                color: '#2C1810',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#B8941F',
                }
              }}
              variant="contained"
            >
              Admin Girişi
            </Button>
          )}
        </Box>
      </List>
    </Box>
  );

  return (
    <>
      <StyledAppBar position="sticky" className={scrolled ? 'scrolled' : ''}>
        <Toolbar sx={{ minHeight: '70px', px: { xs: 2, md: 4 } }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: '#FAFAFA' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            flexGrow: isMobile ? 1 : 0,
            mr: 4,
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.05)',
              transition: 'transform 0.3s ease',
            }
          }}
            onClick={handleLogoClick}
          >
            <ChessIcon>♔</ChessIcon>
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                color: '#FAFAFA',
                display: { xs: isMobile ? 'block' : 'none', md: 'block' }
              }}
            >
              ChessNews
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavButton
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    active={location.pathname === item.path}
                    startIcon={<IconComponent className="nav-icon" sx={{ fontSize: '18px' }} />}
                  >
                    {item.label}
                  </NavButton>
                );
              })}
            </Box>
          )}

          {/* Search Bar (Desktop) */}
          {!isMobile && (
            <SearchContainer>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Satranç haberlerini ara..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </SearchContainer>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            {/* Show notifications only if user is logged in */}
            {/* {user && (
              <Tooltip title="Bildirimler">
                <StyledIconButton>
                  <Badge
                    badgeContent={5}
                    sx={{
                      '& .MuiBadge-badge': {
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        backgroundColor: '#FF4444',
                        color: 'white',
                        border: '2px solid #FAFAFA',
                        boxShadow: '0 2px 8px rgba(255, 68, 68, 0.5)',
                        right: -6,
                        top: -6,
                        transform: 'scale(1)',
                        zIndex: 1,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: 'inherit',
                          animation: 'ripple 2s infinite',
                        },
                        '@keyframes ripple': {
                          '0%': {
                            transform: 'scale(1)',
                            opacity: 1,
                          },
                          '100%': {
                            transform: 'scale(1.4)',
                            opacity: 0,
                          }
                        }
                      }
                    }}
                  >
                    <NotificationsIcon />
                  </Badge>
                </StyledIconButton>
              </Tooltip>
            )} */}

            {/* User Account, Admin Account or Login Button */}
            {adminProfile ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NavButton 
                  onClick={() => navigate('/admin/dashboard')} 
                  startIcon={<DashboardIcon className="nav-icon" sx={{ fontSize: '18px' }} />}
                  sx={{
                    backgroundColor: '#D4AF37',
                    color: '#FAFAFA',
                    '&:hover': {
                      backgroundColor: '#B8941F',
                    }
                  }}
                >
                  Dashboard
                </NavButton>
                <NavButton 
                  onClick={handleLogout} 
                  startIcon={<LogoutIcon className="nav-icon" sx={{ fontSize: '18px' }} />}
                  sx={{
                    backgroundColor: '#D32F2F',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#B71C1C',
                    }
                  }}
                >
                  Çıkış
                </NavButton>
              </Box>
            ) : user && userProfile ? (
              <Tooltip title={`${userProfile.firstName} ${userProfile.lastName}`}>
                <StyledIconButton onClick={handleMenuOpen}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#D4AF37',
                      color: '#2C1810',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  >
                    {userProfile.firstName.charAt(0)}{userProfile.lastName.charAt(0)}
                  </Avatar>
                </StyledIconButton>
              </Tooltip>
            ) : (
              <NavButton 
                onClick={handleAdminLoginClick} 
                startIcon={<LoginIcon className="nav-icon" sx={{ fontSize: '18px' }} />}
              >
                Yetkili Girişi
              </NavButton>
            )}
          </Box>

          {/* Account Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F5DC 100%)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(61, 39, 35, 0.2)',
                mt: 1,
              }
            }}
          >
            {userProfile && (
              <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <Typography variant="subtitle1" sx={{ color: '#5D4037', fontWeight: 600 }}>
                  {userProfile.firstName} {userProfile.lastName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8D6E63' }}>
                  @{userProfile.username}
                </Typography>
              </Box>
            )}
            <MenuItem onClick={handleMenuClose} sx={{ color: '#5D4037' }}>Profil</MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ color: '#5D4037' }}>Ayarlar</MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: '#D32F2F' }}>
              <LogoutIcon sx={{ mr: 1, fontSize: '18px' }} />
              Çıkış Yap
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;