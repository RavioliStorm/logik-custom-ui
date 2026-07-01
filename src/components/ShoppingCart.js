import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  List,
  Grid,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import axios from 'axios';

const ShoppingCart = ({ open, onClose, fields, configUuid }) => {
  const [cartData, setCartData] = useState({ products: [] });
  const [error, setError] = useState(null);
  
  // Calculate subtotal from products
  const subtotal = cartData.products.reduce((sum, product) => {
    return sum + (product.price || 0) * (product.quantity || 0);
  }, 0);

  const fetchCartData = async () => {
    if (!configUuid) {
      console.error('No config UUID available for cart');
      setError('Configuration not loaded');
      return null;
    }

    try {
      const response = await axios.get(`/api/${configUuid}/bom/`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      setCartData(response.data || { products: [] });
      setError(null);
    } catch (err) {
      console.error('Error fetching cart data:', err);
      setError('Failed to load cart data');
      setCartData({ products: [] });
    }
  };

  useEffect(() => {
    if (open) {
      fetchCartData();
    }
  }, [open, fields]); // Re-fetch when fields change or sidebar is opened

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price || 0);
  };

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      p: 2,
      bgcolor: 'background.paper',
      borderLeft: '1px solid',
      borderColor: 'divider',
      overflowY: 'auto'
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Your Order</Typography>
      <Divider sx={{ mb: 2 }} />

      {error ? (
        <Typography color="error">{error}</Typography>
      ) : cartData?.products?.length > 0 ? (
        <List>
          {cartData.products.map((product, index) => (
            <Card
              key={product.id || index}
              sx={{
                mb: 2,
                background: (t) => t.palette.mode === 'dark' ? 'rgba(129,140,248,0.06)' : undefined,
                border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(129,140,248,0.18)' : '1px solid rgba(0,0,0,0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: (t) => t.palette.mode === 'dark'
                    ? '0 6px 20px rgba(99,102,241,0.25)'
                    : '0 6px 18px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    {product.imageUrl ? (
                      <CardMedia
                        component="img"
                        image={product.imageUrl}
                        alt={product.id}
                        sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
                      />
                    ) : (
                      <Box sx={{
                        width: '100%',
                        aspectRatio: '1 / 1',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: (t) => t.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(244,114,182,0.12))'
                          : 'rgba(0,0,0,0.04)',
                        border: (t) => t.palette.mode === 'dark' ? '1px solid rgba(129,140,248,0.2)' : '1px solid rgba(0,0,0,0.06)',
                      }}>
                        <Typography variant="h5" sx={{ opacity: 0.5 }}>
                          {String(product.id || '?').charAt(0).toUpperCase()}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="subtitle1" gutterBottom>
                      {product.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {product.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Qty: {product.quantity || 1}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: (t) => t.palette.mode === 'dark' ? '#a5b4fc' : 'text.primary' }}
                      >
                        {formatPrice(product.price)}
                      </Typography>
                    </Box>
                    {product.quantity > 1 && (
                      <Typography variant="body2" textAlign="right" color="text.secondary">
                        {formatPrice(product.price * product.quantity)} total
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </List>
      ) : (
        <Typography>Your cart is empty</Typography>
      )}

      <Box sx={{
        mt: 'auto',
        pt: 2,
        borderTop: '2px solid',
        borderImage: (t) => t.palette.mode === 'dark'
          ? 'linear-gradient(90deg, #818cf8, #f472b6) 1'
          : 'none',
        borderColor: 'divider',
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'background.paper',
        zIndex: 1
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 1,
          alignItems: 'baseline'
        }}>
          <Typography variant="subtitle1" color="text.secondary">Subtotal</Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: (t) => t.palette.mode === 'dark' ? '#a5b4fc' : 'text.primary',
              textShadow: (t) => t.palette.mode === 'dark' ? '0 0 16px rgba(129,140,248,0.5)' : 'none',
            }}
          >
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(subtotal)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ShoppingCart;
