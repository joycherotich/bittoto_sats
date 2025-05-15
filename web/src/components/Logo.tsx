import React from 'react';

const Logo = () => {
  return (
    <div className='flex items-center gap-2 font-bold text-xl'>
      <div className='relative w-8 h-8 flex items-center justify-center bg-gradient-to-r from-lightning to-satsjar-blue rounded-full overflow-hidden'>
        <span className='absolute text-white'>⚡</span>
      </div>
      <span className='gradient-text'>sats_jar</span>
    </div>
  );
};

export default Logo;
