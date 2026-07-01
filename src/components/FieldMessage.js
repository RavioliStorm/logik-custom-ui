import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

const FieldMessage = ({ message, type = 'info', icon, color }) => {
  console.log('Rendering FieldMessage:', { message, type, icon, color });
  
  const getIcon = () => {
    // If a custom icon is provided, use it
    if (icon) {
      return React.cloneElement(icon, { 
        style: { 
          width: 20, 
          height: 20,
          color: color || 'inherit'
        } 
      });
    }
    
    // Otherwise use the default icons based on type
    const iconProps = { 
      style: { color: color || 'inherit' },
      sx: { color: color || 'inherit' }
    };
    
    switch (type.toLowerCase()) {
      case 'error':
        return <ErrorOutlineOutlinedIcon color={color ? undefined : "error"} {...iconProps} />;
      case 'warning':
        return <WarningAmberOutlinedIcon color={color ? undefined : "warning"} {...iconProps} />;
      case 'info':
      case 'custom':
      default:
        return <InfoOutlinedIcon color={color ? undefined : "info"} {...iconProps} />;
    }
  };

  if (!message) {
    console.warn('FieldMessage rendered without a message');
    return null;
  }

  return (
    <Tooltip title={message} arrow>
      <IconButton 
        size="small" 
        sx={{ 
          p: 0.25, 
          ml: 0.5, 
          verticalAlign: 'middle',
          '&:hover': {
            cursor: 'help',
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          },
          color: color || 'inherit'
        }}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default FieldMessage;
