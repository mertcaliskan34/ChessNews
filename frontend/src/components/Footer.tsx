import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const FooterContainer = styled(Box)({
  background: 'linear-gradient(135deg, #3E2723 0%, #5D4037 50%, #8D6E63 100%)',
  color: '#FAFAFA',
  position: 'relative',
  overflow: 'hidden',
  marginTop: 'auto',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)
    `,
    pointerEvents: 'none',
  }
});

const FooterSection = styled(Box)({
  position: 'relative',
  zIndex: 1,
});

const SectionTitle = styled(Typography)({
  fontFamily: 'Playfair Display, serif',
  fontWeight: 700,
  fontSize: '1.3rem',
  marginBottom: '1.5rem',
  color: '#FFD700',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '40px',
    height: '3px',
    background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
    borderRadius: '2px',
  }
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(250, 250, 250, 0.1)',
    borderRadius: '12px',
    '& fieldset': {
      borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(212, 175, 55, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#FFD700',
    },
    '& input': {
      color: '#FAFAFA',
      '&::placeholder': {
        color: 'rgba(250, 250, 250, 0.7)',
      }
    }
  },
  '& .MuiFormLabel-root': {
    color: 'rgba(250, 250, 250, 0.7)',
  },
  '& .MuiFormLabel-root.Mui-focused': {
    color: '#FFD700',
  }
});

const SubscribeButton = styled(Button)({
  background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
  color: '#3E2723',
  fontWeight: 600,
  borderRadius: '12px',
  padding: '12px 24px',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  '&:hover': {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(212, 175, 55, 0.4)',
  }
});

const SocialIconButton = styled(IconButton)({
  backgroundColor: 'rgba(250, 250, 250, 0.1)',
  color: '#FAFAFA',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  margin: '0 8px 8px 0',
  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  '&:hover': {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    color: '#FFD700',
    transform: 'translateY(-3px) scale(1.1)',
    borderColor: '#FFD700',
  }
});

const ContactItem = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '12px',
  color: 'rgba(250, 250, 250, 0.8)',
  '& .MuiSvgIcon-root': {
    marginRight: '12px',
    color: '#D4AF37',
    fontSize: '20px',
  }
});

const ChessQuote = styled(Typography)({
  fontFamily: 'Crimson Text, serif',
  fontStyle: 'italic',
  fontSize: '1.1rem',
  color: 'rgba(250, 250, 250, 0.9)',
  marginBottom: '1rem',
  position: 'relative',
  '&::before': {
    content: '"\\201C"',
    fontSize: '3rem',
    color: 'rgba(212, 175, 55, 0.3)',
    position: 'absolute',
    left: '-20px',
    top: '-10px',
    fontFamily: 'serif',
  }
});

const FooterLink = styled(Typography)({
  color: 'rgba(250, 250, 250, 0.8)',
  fontSize: '0.95rem',
  fontWeight: 400,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  padding: '4px 0',
  '&:hover': {
    color: '#FFD700',
    transform: 'translateX(8px)',
  }
});

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = () => {
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
    // Scroll to top when navigating to homepage
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <FooterContainer>
      <FooterSection>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {/* Logo and About Section */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 40%' }, mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.3s ease',
                }
              }}
              onClick={handleLogoClick}
              >
                <Box
                  sx={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    color: '#3E2723',
                    mr: 2,
                    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                  }}
                >
                  ♔
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'Playfair Display',
                    fontWeight: 800,
                    color: '#FAFAFA',
                  }}
                >
                  ChessNews
                </Typography>
              </Box>
              
              <ChessQuote>
                Satranç, zihnin savaş alanıdır. Her hamle bir strateji, her oyun bir hikayedir.
              </ChessQuote>
              
              <Typography sx={{ color: 'rgba(250, 250, 250, 0.8)', mb: 3, lineHeight: 1.7 }}>
                Satranç dünyasının en güncel haberleri, analizleri ve röportajları ile satranç 
                severlerin buluşma noktası. Grandmaster analizlerinden turnuva sonuçlarına, 
                taktik bulmacalarından açılış repertuvarlarına kadar her şey burada.
              </Typography>

              {/* Social Media */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: '#FFD700', fontWeight: 600 }}>
                  Sosyal Medya
                </Typography>
                <Box>
                  <SocialIconButton>
                    <FacebookIcon />
                  </SocialIconButton>
                  <SocialIconButton>
                    <TwitterIcon />
                  </SocialIconButton>
                  <SocialIconButton>
                    <InstagramIcon />
                  </SocialIconButton>
                  <SocialIconButton>
                    <YouTubeIcon />
                  </SocialIconButton>
                  <SocialIconButton>
                    <LinkedInIcon />
                  </SocialIconButton>
                </Box>
              </Box>
            </Box>

            {/* Quick Links */}
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 20%' } }}>
              <SectionTitle>Hızlı Bağlantılar</SectionTitle>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <FooterLink>→ Ana Sayfa</FooterLink>
                <FooterLink>→ Güncel Haberler</FooterLink>
                <FooterLink>→ Turnuvalar</FooterLink>
                <FooterLink>→ Grandmaster Röportajları</FooterLink>
                <FooterLink>→ Açılış Repertuvarları</FooterLink>
                <FooterLink>→ Hakkımızda</FooterLink>
              </Box>
            </Box>

            {/* Chess Resources */}
            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 20%' } }}>
              <SectionTitle>Satranç Kaynakları</SectionTitle>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <FooterLink>→ Günün Bulmacası</FooterLink>
                <FooterLink>→ Canlı TV</FooterLink>
                <FooterLink>→ Pro Oyunlar</FooterLink>
                <FooterLink>→ Elo/UKD Sıralaması</FooterLink>
                <FooterLink>→ Satranç Dersleri</FooterLink>
                <FooterLink>→ Analiz Araçları</FooterLink>
              </Box>
            </Box>

            {/* Contact & Newsletter */}
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 35%' } }}>
              {/* Contact Info */}
              <SectionTitle>İletişim</SectionTitle>
              <ContactItem>
                <EmailIcon />
                <Typography>info@chessnews.com</Typography>
              </ContactItem>
              <ContactItem>
                <PhoneIcon />
                <Typography>+90 (212) 555-0123</Typography>
              </ContactItem>
              <ContactItem>
                <LocationIcon />
                <Typography>İstanbul, Türkiye</Typography>
              </ContactItem>

              {/* Newsletter */}
              <Box sx={{ mt: 3 }}>
                <SectionTitle>Bülten Aboneliği</SectionTitle>
                <Typography sx={{ color: 'rgba(250, 250, 250, 0.8)', mb: 2, fontSize: '0.95rem' }}>
                  Satranç dünyasından son haberleri ve özel içerikleri kaçırmayın.
                </Typography>
                
                {subscribed ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'rgba(76, 175, 80, 0.2)', borderRadius: '12px' }}>
                    <Chip 
                      label="✓ Başarıyla abone oldunuz!" 
                      color="success" 
                      variant="outlined"
                      sx={{ color: '#4CAF50', borderColor: '#4CAF50' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <StyledTextField
                      fullWidth
                      size="small"
                      placeholder="E-posta adresiniz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <SubscribeButton
                              onClick={handleSubscribe}
                              sx={{ minWidth: 'auto', p: 1 }}
                            >
                              <SendIcon sx={{ fontSize: '18px' }} />
                            </SubscribeButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Bottom Section */}
          <Divider sx={{ my: 4, backgroundColor: 'rgba(212, 175, 55, 0.3)' }} />
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2
          }}>
            <Typography sx={{ color: 'rgba(250, 250, 250, 0.7)', fontSize: '0.9rem' }}>
              © 2024 ChessNews. Tüm hakları saklıdır. Made with ♟️ for chess lovers.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FooterLink sx={{ fontSize: '0.85rem' }}>
                Gizlilik Politikası
              </FooterLink>
              <FooterLink sx={{ fontSize: '0.85rem' }}>
                Kullanım Şartları
              </FooterLink>
              <FooterLink sx={{ fontSize: '0.85rem' }}>
                Çerez Politikası
              </FooterLink>
            </Box>
          </Box>
        </Container>
      </FooterSection>
    </FooterContainer>
  );
};

export default Footer; 