import React from 'react';

const withUpload = (WrappedComponent) => {
  return ({ canUpload, showModal, ...props }) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* The button has been moved to the WrappedComponent */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <WrappedComponent canUpload={canUpload} showModal={showModal} {...props} />
        </div>
      </div>
    );
  };
};

export default withUpload;
