import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Paper, 
  CssBaseline,
  createTheme,
  ThemeProvider,
  AppBar,
  Toolbar,
  Badge,
  IconButton,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { blue, teal } from '@mui/material/colors';
import FieldRenderer from './components/FieldRenderer';
import ShoppingCart from './components/ShoppingCart';
import ProductPickerGrid from './components/ProductPickerGrid';
import { useLogikConfigurator } from './logik/useLogikConfigurator';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: blue[700],
      light: blue[500],
      dark: blue[900],
    },
    secondary: {
      main: teal[500],
      light: teal[300],
      dark: teal[700],
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
          borderRadius: 12,
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.7)',
          overflow: 'hidden',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#818cf8',
      light: '#a5b4fc',
      dark: '#6366f1',
    },
    secondary: {
      main: '#f472b6',
      light: '#f9a8d4',
      dark: '#ec4899',
    },
    background: {
      default: '#0f0f1a',
      paper: '#1a1b3a',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          boxShadow: '0 0 15px rgba(129, 140, 248, 0.3)',
          '&:hover': {
            boxShadow: '0 0 25px rgba(129, 140, 248, 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1a1b3a, #12132b)',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(129,140,248,0.1)',
          border: '1px solid rgba(129, 140, 248, 0.15)',
          overflow: 'hidden',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: '#a5b4fc',
            '& + .MuiSwitch-track': {
              backgroundColor: '#6366f1',
              opacity: 0.9,
            },
            '& .MuiSwitch-thumb': {
              boxShadow: '0 0 10px rgba(129,140,248,0.9)',
            },
          },
          '& .MuiSwitch-track': {
            backgroundColor: 'rgba(129,140,248,0.25)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(129,140,248,0.06)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(129,140,248,0.25)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(129,140,248,0.5)',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(129,140,248,0.25)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#818cf8',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: 'rgba(129,140,248,0.5)',
          '&.Mui-checked': {
            color: '#818cf8',
            filter: 'drop-shadow(0 0 4px rgba(129,140,248,0.8))',
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: 'rgba(129,140,248,0.5)',
          '&.Mui-checked': {
            color: '#818cf8',
            filter: 'drop-shadow(0 0 4px rgba(129,140,248,0.8))',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #818cf8, #f472b6)',
          boxShadow: '0 0 8px rgba(129,140,248,0.6)',
        },
      },
    },
  },
});

// API calls go through the dev proxy (see src/setupProxy.js), which injects
// the auth token server-side so it never reaches the browser.

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [themeMode, setThemeMode] = useState('dark');
  const [activeTab, setActiveTab] = useState(0);
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  // Which configurable product to load. Source of truth, in order: ?product= URL
  // param → REACT_APP_LOGIK_PRODUCT env → built-in demo default. Switching it
  // re-inits the SDK live (no restart); `productDraft` is the in-progress input.
  const [product, setProduct] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('product');
    return fromUrl || process.env.REACT_APP_LOGIK_PRODUCT || 'configurableProduct5';
  });
  const [productDraft, setProductDraft] = useState(product);

  const applyProduct = () => {
    const next = productDraft.trim();
    if (!next || next === product) return;
    // Reflect the choice in the URL so it's bookmarkable/shareable.
    const url = new URL(window.location.href);
    url.searchParams.set('product', next);
    window.history.replaceState({}, '', url);
    setProduct(next);
  };

  // All configurator state + protocol live in the headless SDK hook.
  const {
    loading, error, layout, model, tree, uuid,
    setField, setCell, refreshBom,
  } = useLogikConfigurator({ baseUrl: '/api', configuredProductId: product });

  // Flat variableName -> value view for the debug panel.
  const formValues = model
    ? Object.fromEntries(Object.entries(model.byVar).map(([k, f]) => [k, f.value]))
    : {};

  // Refresh the cart (server-derived BOM) whenever it's open and config changes.
  useEffect(() => {
    let alive = true;
    if (cartOpen && uuid) {
      refreshBom().then(d => { if (alive) setCartItems(d?.products || []); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [cartOpen, uuid, model, refreshBom]);

  const handleCartClick = () => setCartOpen(o => !o);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ background: theme.palette.background.default }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" style={{ marginTop: '2rem' }}>
        <Paper elevation={3} style={{ padding: '2rem', textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  if (!layout || !tree) return null;

  // Render one resolved element node. The SDK's `tree` has already pruned hidden
  // fields/containers and attached live value/options/messages, so this is a
  // straight switch on node.kind — no field lookups or visibility checks.
  // kbridge & other 3rd-party integration widgets are out of scope for this UI.
  const renderElement = (node) => {
    if (node.kind === 'set' || node.kind === 'productpicker') {
      return (
        <Box key={`grid-${node.variableName}`} sx={{ width: '100%', flex: '1 1 100%' }}>
          <ProductPickerGrid
            gridElement={node.raw}
            layoutFields={layout.fields}
            fieldsByUnique={model.byUnique}
            onCellChange={setCell}
          />
        </Box>
      );
    }
    if (node.kind === 'field') {
      // Merge the layout def with live state so FieldRenderer sees options/value.
      const mergedField = { ...(node.def || {}), ...(node.field || {}) };
      return (
        <div key={`field-${node.variableName}`} style={{ minWidth: '220px', flex: '1 1 auto' }}>
          <FieldRenderer
            field={mergedField}
            value={node.value ?? ''}
            onChange={(value) => setField(node.variableName, value)}
            allFields={model.byVar}
            messages={node.messages}
          />
        </div>
      );
    }
    if (node.kind === 'custom' && node.type === 'text') {
      return (
        <Box key={`text-${node.variableName}`} sx={{ width: '100%' }}>
          <Typography variant="body2" color="text.secondary">{node.props?.value}</Typography>
        </Box>
      );
    }
    return null; // kbridge / unknown integration widget — skipped
  };

  const renderColumnSet = (columnSet, colIndex) => (
    <Paper
      key={columnSet.variableName || `row-${colIndex}`}
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        display: 'flex',
        gap: 3,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        background: themeMode === 'dark' ? 'rgba(26,27,58,0.9)' : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        border: themeMode === 'dark' ? '1px solid rgba(129,140,248,0.12)' : '1px solid rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: themeMode === 'dark'
            ? '0 8px 30px rgba(99,102,241,0.25), 0 0 0 1px rgba(129,140,248,0.35)'
            : '0 8px 25px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
          ...(themeMode === 'dark' && { border: '1px solid rgba(129,140,248,0.35)' })
        }
      }}
    >
      {columnSet.elements.map(renderElement)}
    </Paper>
  );

  // A tier holds either nested tiers or columnSets (mutually recursive walk).
  const renderTierBody = (tier) =>
    (tier.tiers && tier.tiers.length)
      ? tier.tiers.map((t, i) => renderTier(t, i))
      : (tier.columnSets || []).map((cs, ci) => renderColumnSet(cs, ci));

  const renderTier = (tier, i) => {
    if (tier.representation === 'ExpandableSection') {
      return (
        <Accordion key={tier.variableName || i} defaultExpanded={i === 0}
          sx={themeMode === 'dark' ? { background: 'rgba(26,27,58,0.9)', border: '1px solid rgba(129,140,248,0.12)', mb: 1 } : { mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={500}>{tier.label || `Section ${i + 1}`}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 1 }}>{renderTierBody(tier)}</AccordionDetails>
        </Accordion>
      );
    }
    // BasicContainer / default: a labeled block
    return (
      <Box key={tier.variableName || i} sx={{ mb: 2 }}>
        {tier.label && (
          <Typography
            variant="subtitle1"
            sx={{
              mb: 1.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              color: themeMode === 'dark' ? '#a5b4fc' : 'inherit',
              '&:before': {
                content: '""',
                display: 'inline-block',
                width: 4,
                height: 18,
                marginRight: 10,
                borderRadius: 2,
                background: themeMode === 'dark'
                  ? 'linear-gradient(180deg, #818cf8, #f472b6)'
                  : theme.palette.primary.main,
                boxShadow: themeMode === 'dark' ? '0 0 8px rgba(129,140,248,0.6)' : 'none',
              },
            }}
          >
            {tier.label}
          </Typography>
        )}
        {renderTierBody(tier)}
      </Box>
    );
  };

  // Top-level tiers usually render as tabs; each tab's body is its nested
  // tiers/columnSets. `tree.main` is already pruned, so empty tabs never appear.
  const renderMain = () => {
    const tiers = tree.main;
    if (!tiers.length) return null;
    const useTabs = tiers.length > 1 && tiers.some((t) => t.representation === 'Tab');
    if (!useTabs) return tiers.map((t, i) => renderTier(t, i));
    const idx = Math.min(activeTab, tiers.length - 1);
    return (
      <>
        <Tabs
          value={idx}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tiers.map((t, i) => (
            <Tab key={t.variableName || i} label={t.label || `Section ${i + 1}`} />
          ))}
        </Tabs>
        <Box>{renderTierBody(tiers[idx])}</Box>
      </>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar
        position="static"
        color="default"
        elevation={themeMode === 'dark' ? 0 : 1}
        sx={themeMode === 'dark' ? {
          background: 'linear-gradient(90deg, #0f0f1a 0%, #1a1b3a 100%)',
          borderBottom: '1px solid rgba(129,140,248,0.2)',
          boxShadow: '0 2px 20px rgba(129,140,248,0.15)'
        } : {}}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: themeMode === 'dark' ? 700 : 400 }}>
            Product Configurator
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <TextField
              size="small"
              label="Product"
              value={productDraft}
              onChange={(e) => setProductDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyProduct(); }}
              sx={{ minWidth: 200, '& .MuiInputBase-root': { bgcolor: 'background.paper' } }}
            />
            <Button
              onClick={applyProduct}
              variant="outlined"
              size="small"
              color="inherit"
              disabled={!productDraft.trim() || productDraft.trim() === product}
            >
              Load
            </Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              Your Order
            </Typography>
            <IconButton onClick={handleCartClick} color="inherit" size="small" sx={{ mr: 1 }}>
              <Badge badgeContent={cartItems.length} color="primary">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={() => setThemeMode(m => m === 'dark' ? 'light' : 'dark')} color="inherit" size="small">
              {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', background: theme.palette.background.default }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
      
      {error && (
        <Box sx={{ 
          backgroundColor: 'error.light', 
          color: 'white',
          p: 2,
          textAlign: 'center'
        }}>
          {error}
        </Box>
      )}
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ 
          p: 4,
          background: themeMode === 'dark'
            ? 'linear-gradient(145deg, #1a1b3a, #12132b)'
            : 'linear-gradient(145deg, #ffffff, #f8f9fa)',
          position: 'relative',
          boxShadow: themeMode === 'dark' ? '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(129,140,248,0.15)' : undefined,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: themeMode === 'dark' ? 3 : 4,
            background: themeMode === 'dark'
              ? 'linear-gradient(90deg, #6366f1, #ec4899, #6366f1)'
              : 'linear-gradient(90deg, ' + theme.palette.primary.main + ', ' + theme.palette.secondary.main + ')'
          }
        }}>
          <Box sx={{ 
            mb: 4,
            pb: 2,
            borderBottom: themeMode === 'dark' ? '1px solid rgba(129,140,248,0.15)' : '1px solid rgba(0,0,0,0.05)'
          }}>
            <Typography variant="h5" component="h2" sx={{ 
              fontWeight: themeMode === 'dark' ? 700 : 600,
              color: themeMode === 'dark' ? '#a5b4fc' : theme.palette.primary.dark,
              textShadow: themeMode === 'dark' ? '0 0 20px rgba(129,140,248,0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              '&:before': {
                content: '""',
                display: 'inline-block',
                width: themeMode === 'dark' ? 4 : 8,
                height: 24,
                background: themeMode === 'dark'
                  ? 'linear-gradient(180deg, #818cf8, #f472b6)'
                  : theme.palette.primary.main,
                marginRight: 12,
                borderRadius: 2,
                boxShadow: themeMode === 'dark' ? '0 0 10px rgba(129,140,248,0.6)' : 'none'
              }
            }}>
              Configuration Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Customize your product configuration below
            </Typography>
          </Box>
        
        {renderMain()}
        

        
          <Accordion
            defaultExpanded={false}
            disableGutters
            elevation={0}
            sx={{
              mt: 6,
              background: 'transparent',
              border: themeMode === 'dark' ? '1px solid rgba(129,140,248,0.1)' : '1px solid rgba(0,0,0,0.05)',
              borderRadius: 2,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
                Developer: current configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{
                p: 2,
                bgcolor: themeMode === 'dark' ? '#080810' : 'white',
                borderRadius: 1,
                maxHeight: 240,
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap',
                border: themeMode === 'dark' ? '1px solid rgba(129,140,248,0.15)' : '1px solid rgba(0,0,0,0.1)',
                color: themeMode === 'dark' ? '#818cf8' : 'inherit'
              }}>
                {JSON.stringify(formValues, null, 2)}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Container>
        </Box>
        {tree.sidebar && tree.sidebar.tiers.length > 0 && (
          <Box sx={{ width: '360px', borderLeft: themeMode === 'dark' ? '1px solid rgba(129,140,248,0.2)' : '1px solid', borderColor: themeMode === 'dark' ? 'transparent' : 'divider', overflowY: 'auto', p: 2, background: themeMode === 'dark' ? '#12132b' : 'transparent' }}>
            {tree.sidebar.tiers.map((t, i) => renderTier(t, i))}
          </Box>
        )}
        {cartOpen && (
          <Box sx={{ width: '400px', borderLeft: themeMode === 'dark' ? '1px solid rgba(129,140,248,0.2)' : '1px solid', borderColor: themeMode === 'dark' ? 'transparent' : 'divider', overflowY: 'auto', background: themeMode === 'dark' ? '#12132b' : 'transparent' }}>
            <ShoppingCart
              open={cartOpen}
              onClose={() => setCartOpen(false)}
              fields={model}
              configUuid={uuid}
            />
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;